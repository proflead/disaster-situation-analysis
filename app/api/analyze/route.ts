import { NextResponse } from "next/server";
import { analyzeDisasterReports } from "@/lib/ai/analyze";
import { parsePdfFile } from "@/lib/pdf/parse";
import { storeAndRetrieveContext, type SourceDocument } from "@/lib/rag/pipeline";
import { getSupabaseAdmin, SUPABASE_BUCKET } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 300;

const MAX_FILES = 20;
const MAX_FILE_BYTES = 8 * 1024 * 1024;
const MAX_TOTAL_BYTES = 32 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const files = formData.getAll("files").filter((item): item is File => item instanceof File);

    if (files.length < 1 || files.length > MAX_FILES) {
      return NextResponse.json({ error: `Upload between 1 and ${MAX_FILES} PDF files.` }, { status: 400 });
    }

    const totalBytes = files.reduce((sum, file) => sum + file.size, 0);
    if (totalBytes > MAX_TOTAL_BYTES) {
      return NextResponse.json(
        { error: "The uploaded PDFs are too large to analyze in one request. Upload a smaller batch under 32 MB total." },
        { status: 413 }
      );
    }

    const supabase = getSupabaseAdmin();
    const parsedDocuments: SourceDocument[] = [];

    for (const file of files) {
      if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
        return NextResponse.json({ error: `${file.name} is not a PDF.` }, { status: 400 });
      }

      if (file.size > MAX_FILE_BYTES) {
        return NextResponse.json(
          { error: `${file.name} is too large. Upload PDFs under 8 MB each or split the report into smaller files.` },
          { status: 413 }
        );
      }

      if (supabase) {
        const path = `${Date.now()}-${file.name}`;
        await supabase.storage.from(SUPABASE_BUCKET).upload(path, file, {
          upsert: true,
          contentType: "application/pdf"
        });
      }

      const text = await parsePdfFile(file);
      parsedDocuments.push({
        source: file.name,
        kind: classifyDocument(file.name, text),
        text: text || `${file.name}: no extractable text found.`
      });
    }

    const ragContext = await storeAndRetrieveContext({
      documents: parsedDocuments,
      query: "CPA disaster response SOP municipal shelter road hospital water logistics action plan"
    });

    const analysis = await analyzeDisasterReports({
      reports: parsedDocuments.map((document) => ({ filename: document.source, text: document.text })),
      ragContext
    });

    if (supabase) {
      await supabase.from("analyses").insert({
        id: analysis.id,
        uploaded_files: analysis.uploadedFiles,
        analysis
      });
    }

    return NextResponse.json(analysis);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Analysis failed." },
      { status: 500 }
    );
  }
}

function classifyDocument(filename: string, text: string): SourceDocument["kind"] {
  const haystack = `${filename} ${text.slice(0, 500)}`.toLowerCase();
  if (haystack.includes("sop")) return "sop";
  if (haystack.includes("guideline")) return "guideline";
  if (haystack.includes("historical")) return "historical";
  return "report";
}
