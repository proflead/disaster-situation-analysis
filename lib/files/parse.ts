import readXlsxFile from "read-excel-file/node";
import { parsePdfFile } from "@/lib/pdf/parse";

const XLSX_MIME_TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
const MAX_EXCEL_ROWS_PER_SHEET = 500;
const MAX_EXCEL_TEXT_CHARS = 80000;

export const SUPPORTED_REPORT_FORMATS = "PDF or XLSX";

export function isSupportedReportFile(file: File) {
  return isPdfFile(file) || isXlsxFile(file);
}

export function getReportContentType(file: File) {
  if (isPdfFile(file)) return file.type || "application/pdf";
  if (isXlsxFile(file)) return file.type || XLSX_MIME_TYPE;
  return file.type || "application/octet-stream";
}

export async function parseReportFile(file: File) {
  if (isPdfFile(file)) return parsePdfFile(file);
  if (isXlsxFile(file)) return parseXlsxFile(file);
  throw new Error(`${file.name} is not a supported report file. Upload a PDF or XLSX file.`);
}

function isPdfFile(file: File) {
  return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
}

function isXlsxFile(file: File) {
  return file.type === XLSX_MIME_TYPE || file.name.toLowerCase().endsWith(".xlsx");
}

async function parseXlsxFile(file: File) {
  const buffer = Buffer.from(await file.arrayBuffer());
  const sheets = await readXlsxFile(buffer);
  const sections: string[] = [];
  let remainingChars = MAX_EXCEL_TEXT_CHARS;

  for (const sheet of sheets) {
    if (remainingChars <= 0) break;

    const lines: string[] = [];

    for (const [index, row] of sheet.data.entries()) {
      if (lines.length >= MAX_EXCEL_ROWS_PER_SHEET || remainingChars <= 0) break;

      const values = row.map(formatCellValue).map((value) => value.trim()).filter(Boolean);
      if (!values.length) continue;

      const line = `Row ${index + 1}: ${values.join(" | ")}`;
      lines.push(line.slice(0, Math.max(0, remainingChars)));
      remainingChars -= line.length;
    }

    if (lines.length) {
      const section = `SHEET: ${sheet.sheet}\n${lines.join("\n")}`;
      sections.push(section);
      remainingChars -= sheet.sheet.length + 8;
    }
  }

  return sections.join("\n\n---\n\n").trim();
}

function formatCellValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value);
}
