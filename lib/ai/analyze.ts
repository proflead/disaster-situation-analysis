import { randomUUID } from "crypto";
import { OPENAI_ANALYSIS_MODEL, getOpenAIClient } from "./client";
import { buildAnalysisPrompt } from "./prompts";
import { disasterAnalysisJsonSchema } from "./schemas";
import type { AnalysisResult } from "@/lib/types/disaster";
import { normalizeAnalysisMapFeatures } from "@/lib/map/normalize";

type ReportInput = {
  filename: string;
  text: string;
};

type AnalysisPayload = Omit<AnalysisResult, "id" | "createdAt" | "uploadedFiles">;

const OPENAI_RESPONSE_TIMEOUT_MS = 280000;

export async function analyzeDisasterReports({
  reports,
  ragContext
}: {
  reports: ReportInput[];
  ragContext: string;
}): Promise<AnalysisResult> {
  const openai = getOpenAIClient();

  if (!openai) {
    throw new Error(
      "OPENAI_API_KEY is required to analyze uploaded reports. In Vercel, add OPENAI_API_KEY in Project Settings > Environment Variables for Production/Preview and redeploy. For local development, add it to .env.local and restart the app."
    );
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
  } as never, { timeout: OPENAI_RESPONSE_TIMEOUT_MS });

  const outputText =
    (response as unknown as { output_text?: string }).output_text ??
    extractOutputText(response as unknown as { output?: unknown[] });

  const parsed = parseAnalysisOutput(outputText);

  const analysis = {
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    uploadedFiles: reports.map((report) => report.filename),
    ...parsed
  };

  return {
    ...analysis,
    mapFeatures: normalizeAnalysisMapFeatures(analysis)
  };
}

function parseAnalysisOutput(outputText: string): AnalysisPayload {
  try {
    return JSON.parse(outputText) as AnalysisPayload;
  } catch {
    const excerpt = outputText.replace(/\s+/g, " ").trim().slice(0, 300) || "empty response";
    throw new Error(
      `OpenAI returned a non-JSON analysis response. Try again, or check OPENAI_ANALYSIS_MODEL in the deployment environment. Response excerpt: ${excerpt}`
    );
  }
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
