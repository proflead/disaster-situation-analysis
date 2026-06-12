import { getOpenAIClient, OPENAI_EMBEDDING_MODEL } from "@/lib/ai/client";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { chunkText, localRetrieve } from "./chunk";

const MAX_RAG_CHUNKS = 48;

export type SourceDocument = {
  source: string;
  kind: "report" | "sop" | "guideline" | "historical";
  text: string;
};

export async function storeAndRetrieveContext({
  documents,
  query
}: {
  documents: SourceDocument[];
  query: string;
}) {
  const openai = getOpenAIClient();
  const supabase = getSupabaseAdmin();
  const chunks = documents
    .flatMap((document) =>
      chunkText(document.text, 1400).map((text, index) => ({
        source: document.source,
        kind: document.kind,
        section: `${document.kind.toUpperCase()} chunk ${index + 1}`,
        text
      }))
    )
    .slice(0, MAX_RAG_CHUNKS);

  if (openai && supabase) {
    try {
      const embeddings = await openai.embeddings.create({
        model: OPENAI_EMBEDDING_MODEL,
        input: chunks.map((chunk) => chunk.text)
      });

      const rows = chunks.map((chunk, index) => ({
        source: chunk.source,
        document_type: chunk.kind,
        section: chunk.section,
        content: chunk.text,
        embedding: embeddings.data[index].embedding
      }));

      await supabase.from("documents").insert(rows);

      const queryEmbedding = await openai.embeddings.create({
        model: OPENAI_EMBEDDING_MODEL,
        input: query
      });

      const { data } = await supabase.rpc("match_documents", {
        query_embedding: queryEmbedding.data[0].embedding,
        match_count: 6
      });

      if (data?.length) {
        return data
          .map((item: { source: string; section: string; content: string }) => `[${item.source} - ${item.section}]\n${item.content}`)
          .join("\n\n");
      }
    } catch (error) {
      console.warn("RAG storage/retrieval failed; falling back to local retrieval.", error);
    }
  }

  return localRetrieve(query, chunks, 6)
    .map((item) => `[${item.source} - ${item.section}]\n${item.text}`)
    .join("\n\n");
}
