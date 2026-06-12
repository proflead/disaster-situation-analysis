import { NextResponse } from "next/server";
import { buildExecutivePptx } from "@/lib/export/ppt";
import type { AnalysisResult } from "@/lib/types/disaster";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const analysis = (await request.json()) as AnalysisResult;
  const pptx = await buildExecutivePptx(analysis);
  return new NextResponse(pptx, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "Content-Disposition": "attachment; filename=Civil-Protection-Authority-Copilot-Executive-Briefing.pptx"
    }
  });
}
