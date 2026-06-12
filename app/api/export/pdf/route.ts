import { NextResponse } from "next/server";
import { buildBriefingPdf } from "@/lib/export/pdf";
import type { AnalysisResult } from "@/lib/types/disaster";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const analysis = (await request.json()) as AnalysisResult;
  const pdf = await buildBriefingPdf(analysis);
  return new NextResponse(pdf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": "attachment; filename=Civil-Protection-Authority-Copilot-Briefing.pdf"
    }
  });
}
