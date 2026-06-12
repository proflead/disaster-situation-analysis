import pptxgen from "pptxgenjs";
import type { AnalysisResult } from "@/lib/types/disaster";

export async function buildExecutivePptx(analysis: AnalysisResult) {
  const pptx = new pptxgen();
  pptx.layout = "LAYOUT_WIDE";
  pptx.author = "Civil Protection Authority Copilot";
  pptx.subject = "Disaster response briefing";
  pptx.title = "Civil Protection Authority Copilot Executive Briefing";
  pptx.company = "Civil Protection Authority";
  pptx.theme = {
    headFontFace: "Arial",
    bodyFontFace: "Arial"
  };

  slide(pptx, "Situation Overview", [
    analysis.executiveSummary.executiveSummary,
    "Municipalities: " + analysis.extraction.municipalities.join(", "),
    "Confidence: " + Math.round(analysis.extraction.confidenceScore * 100) + "%"
  ]);
  slide(pptx, "Impact Summary", [
    "Population affected: " + analysis.extraction.affectedPopulation,
    "Shelters: " + analysis.extraction.shelters.map((item) => item.name + " " + item.occupancy + "/" + item.capacity).join("; "),
    "Water: " + analysis.extraction.waterSupplyStatus
  ]);
  slide(pptx, "Risk Assessment", Object.entries(analysis.executiveSummary.riskAssessment).map(([key, value]) => labelize(key) + ": " + value));
  slide(pptx, "Action Plan", analysis.actionPlan.combinedPlan.priorityActions.slice(0, 5).map((item) => item.priority + ": " + item.action));
  slide(pptx, "Resource Requirements", analysis.resourceGapAnalysis.gaps.map((gap) => gap.status + ": " + gap.label + " - " + gap.deficit));

  return Buffer.from(await pptx.write({ outputType: "arraybuffer" }) as ArrayBuffer);
}

function slide(pptx: pptxgen, title: string, bullets: string[]) {
  const page = pptx.addSlide();
  page.background = { color: "F8FAFC" };
  page.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 13.333, h: 0.22, fill: { color: "087C8A" }, line: { color: "087C8A" } });
  page.addText(title, { x: 0.55, y: 0.5, w: 12, h: 0.45, fontFace: "Arial", fontSize: 26, bold: true, color: "0F172A", margin: 0 });
  page.addText(bullets.map((item) => ({ text: item, options: { bullet: { type: "bullet" }, breakLine: true } })), {
    x: 0.75,
    y: 1.35,
    w: 11.8,
    h: 5,
    fontSize: 18,
    color: "334155",
    breakLine: false,
    fit: "shrink"
  });
  page.addText("Civil Protection Authority Copilot | Timor-Leste Civil Protection Authority", { x: 0.55, y: 7.0, w: 8, h: 0.2, fontSize: 9, color: "64748B" });
}

function labelize(value: string) {
  return value.replace(/([A-Z])/g, " $1").replace(/^./, (letter) => letter.toUpperCase());
}
