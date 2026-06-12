import { randomUUID } from "crypto";
import { OPENAI_ANALYSIS_MODEL, getOpenAIClient } from "./client";
import { buildAnalysisPrompt } from "./prompts";
import { disasterAnalysisJsonSchema } from "./schemas";
import type { AnalysisResult } from "@/lib/types/disaster";
import { normalizeMapFeatures } from "@/lib/map/normalize";

type ReportInput = {
  filename: string;
  text: string;
};

export async function analyzeDisasterReports({
  reports,
  ragContext
}: {
  reports: ReportInput[];
  ragContext: string;
}): Promise<AnalysisResult> {
  const openai = getOpenAIClient();

  if (!openai) {
    throw new Error("OPENAI_API_KEY is required to analyze uploaded reports. Add it to .env.local and restart the app.");
  }

  const response = await openai.responses.create({
    model: OPENAI_ANALYSIS_MODEL,
    instructions:
      "You are an emergency-management AI assistant. Return only valid JSON that matches the requested schema. Cite SOP and guideline context in recommendations.",
    input: buildAnalysisPrompt({ reports, ragContext }),
    text: {
      format: {
        type: "json_schema",
        ...disasterAnalysisJsonSchema
      }
    },
    max_output_tokens: 12000
  } as never);

  const outputText =
    (response as unknown as { output_text?: string }).output_text ??
    extractOutputText(response as unknown as { output?: unknown[] });

  const parsed = JSON.parse(outputText) as Omit<AnalysisResult, "id" | "createdAt" | "uploadedFiles">;

  return {
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    uploadedFiles: reports.map((report) => report.filename),
    ...parsed,
    mapFeatures: normalizeMapFeatures(parsed.mapFeatures)
  };
}

function extractOutputText(response: { output?: unknown[] }) {
  const output = response.output ?? [];
  const chunks: string[] = [];
  for (const item of output) {
    const content = (item as { content?: unknown[] }).content ?? [];
    for (const contentItem of content) {
      const text = (contentItem as { text?: string }).text;
      if (text) chunks.push(text);
    }
  }
  return chunks.join("\n");
}
