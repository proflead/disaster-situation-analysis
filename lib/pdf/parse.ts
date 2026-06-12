import pdfParse from "pdf-parse";

export async function parsePdfFile(file: File) {
  const buffer = Buffer.from(await file.arrayBuffer());
  const parsed = await pdfParse(buffer);
  return parsed.text.trim();
}
