import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import type { AnalysisResult } from "@/lib/types/disaster";

const pageWidth = 595.28;
const pageHeight = 841.89;
const margin = 48;
const textWidth = pageWidth - margin * 2;

export async function buildBriefingPdf(analysis: AnalysisResult) {
  const pdf = await PDFDocument.create();
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  let page = pdf.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;

  const drawLine = (text: string, size = 10, isBold = false, color = rgb(0.2, 0.25, 0.33)) => {
    const font = isBold ? bold : regular;
    const lines = wrapText(text, font, size, textWidth);
    for (const line of lines) {
      if (y < margin + 24) {
        page = pdf.addPage([pageWidth, pageHeight]);
        y = pageHeight - margin;
      }
      page.drawText(line, { x: margin, y, size, font, color });
      y -= size + 5;
    }
  };

  const gap = (amount = 10) => { y -= amount; };
  const section = (title: string, body: string) => {
    drawLine(title, 13, true, rgb(0.06, 0.09, 0.16));
    gap(2);
    drawLine(body, 10, false);
    gap(10);
  };

  drawLine("Civil Protection Authority Copilot Disaster Briefing Package", 20, true, rgb(0.03, 0.49, 0.54));
  drawLine("Generated " + new Date(analysis.createdAt).toLocaleString("en-US"), 9, false, rgb(0.39, 0.45, 0.55));
  gap(12);

  section("Executive Summary", analysis.executiveSummary.executiveSummary);
  section("Situation Overview", analysis.executiveSummary.situationOverview);
  section("Municipalities Affected", analysis.executiveSummary.municipalitiesAffected);
  section("Impact Assessment", analysis.executiveSummary.impactAssessment);

  drawLine("Risk Assessment", 13, true, rgb(0.06, 0.09, 0.16));
  Object.entries(analysis.executiveSummary.riskAssessment).forEach(([key, value]) => drawLine(labelize(key) + ": " + value, 10));
  gap(10);

  drawLine("Top Recommended Actions", 13, true, rgb(0.06, 0.09, 0.16));
  analysis.situationBrief.recommendedActions.forEach((item) => drawLine("- " + item, 10));
  gap(10);

  drawLine("Information Gaps", 13, true, rgb(0.06, 0.09, 0.16));
  analysis.executiveSummary.informationGaps.forEach((gapItem) => drawLine("- " + gapItem.severity + ": " + gapItem.item + " - " + gapItem.reason, 10));
  gap(10);

  drawLine("Contradictions", 13, true, rgb(0.06, 0.09, 0.16));
  analysis.executiveSummary.contradictions.forEach((item) => drawLine("- " + item.field + ": " + item.reportA + " says " + item.valueA + "; " + item.reportB + " says " + item.valueB, 10));
  gap(14);

  drawLine("Action Plan", 16, true, rgb(0.03, 0.49, 0.54));
  analysis.actionPlan.combinedPlan.priorityActions.forEach((item) => {
    drawLine(item.priority + ": " + item.action, 11, true, rgb(0.06, 0.09, 0.16));
    drawLine("Agency: " + item.responsibleAgency + " | Timeline: " + item.timeline, 10);
    drawLine("Resources: " + item.resourcesRequired.join(", "), 10);
    if (item.citations.length) drawLine("Citation: " + item.citations[0].source + ", " + item.citations[0].section, 9, false, rgb(0.03, 0.49, 0.54));
    gap(8);
  });

  drawLine("Resource Gap Analysis", 16, true, rgb(0.03, 0.49, 0.54));
  analysis.resourceGapAnalysis.gaps.forEach((gapItem) => {
    drawLine(gapItem.status + ": " + gapItem.label, 11, true, rgb(0.06, 0.09, 0.16));
    drawLine("Required: " + gapItem.required + " | Available: " + gapItem.available + " | Deficit: " + gapItem.deficit, 10);
    drawLine(gapItem.recommendation, 10);
    gap(8);
  });

  return Buffer.from(await pdf.save());
}

function wrapText(text: string, font: { widthOfTextAtSize: (text: string, size: number) => number }, size: number, maxWidth: number) {
  const words = text.replace(/\s+/g, " ").trim().split(" ");
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const next = line ? line + " " + word : word;
    if (font.widthOfTextAtSize(next, size) <= maxWidth || !line) {
      line = next;
    } else {
      lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function labelize(value: string) {
  return value.replace(/([A-Z])/g, " $1").replace(/^./, (letter) => letter.toUpperCase());
}
