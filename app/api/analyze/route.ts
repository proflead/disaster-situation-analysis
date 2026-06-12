import { get } from "@vercel/blob";
import { NextResponse } from "next/server";
import { analyzeDisasterReports } from "@/lib/ai/analyze";
import { getReportContentType, isSupportedReportFile, parseReportFile, SUPPORTED_REPORT_FORMATS } from "@/lib/files/parse";
import { storeAndRetrieveContext, type SourceDocument } from "@/lib/rag/pipeline";
import { getSupabaseAdmin, SUPABASE_BUCKET } from "@/lib/supabase/server";
import { MAX_FILES, VERCEL_UPLOAD_LIMIT_BYTES, formatUploadSize } from "@/lib/uploads/limits";

export const runtime = "nodejs";
export const maxDuration = 300;

type StoredUpload = {
  name: string;
  path?: string;
  url?: string;
  contentType?: string;
};

export async function POST(request: Request) {
  try {
    const supabase = getSupabaseAdmin();
    const { files, shouldStoreUploads } = await loadRequestFiles(request, supabase);

    if (files.length < 1 || files.length > MAX_FILES) {
      return NextResponse.json({ error: `Upload between 1 and ${MAX_FILES} report files (${SUPPORTED_REPORT_FORMATS}).` }, { status: 400 });
    }

    const parsedDocuments: SourceDocument[] = [];

    for (const file of files) {
      if (!isSupportedReportFile(file)) {
        return NextResponse.json({ error: `${file.name} is not supported. Upload a PDF or XLSX file.` }, { status: 400 });
      }

      if (supabase && shouldStoreUploads) {
        const path = `${Date.now()}-${file.name}`;
        await supabase.storage.from(SUPABASE_BUCKET).upload(path, file, {
          upsert: true,
          contentType: getReportContentType(file)
        });
      }

      const text = await parseReportFile(file);
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

async function loadRequestFiles(request: Request, supabase: ReturnType<typeof getSupabaseAdmin>) {
  const contentType = request.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    const body = (await request.json()) as { uploads?: StoredUpload[] };
    const uploads = body.uploads ?? [];
    const files = await Promise.all(uploads.map((upload) => downloadStoredUpload(upload, supabase)));
    return { files, shouldStoreUploads: false };
  }

  const formData = await request.formData();
  const files = formData.getAll("files").filter((item): item is File => item instanceof File);
  const totalBytes = files.reduce((sum, file) => sum + file.size, 0);
  if (totalBytes > VERCEL_UPLOAD_LIMIT_BYTES) {
    throw new Error(`Uploads sent directly to Vercel must be under ${formatUploadSize(VERCEL_UPLOAD_LIMIT_BYTES)} total. Use direct upload for larger files.`);
  }
  return { files, shouldStoreUploads: true };
}

async function downloadStoredUpload(upload: StoredUpload, supabase: ReturnType<typeof getSupabaseAdmin>) {
  if (upload.url) return downloadBlobUpload(upload);
  if (!upload.path) throw new Error("Uploaded file reference is missing a Blob URL or storage path.");
  if (!supabase) throw new Error("Supabase is required to analyze Supabase storage files.");

  const { data, error } = await supabase.storage.from(SUPABASE_BUCKET).download(upload.path);
  if (error) throw error;
  return new File([await data.arrayBuffer()], upload.name, {
    type: upload.contentType || "application/octet-stream"
  });
}

async function downloadBlobUpload(upload: StoredUpload) {
  const result = await get(upload.url as string, { access: "private" });
  if (!result || result.statusCode !== 200 || !result.stream) {
    throw new Error("Could not download uploaded file from Vercel Blob.");
  }

  const blob = await new Response(result.stream).blob();
  return new File([await blob.arrayBuffer()], upload.name, {
    type: upload.contentType || result.blob.contentType || "application/octet-stream"
  });
}

function classifyDocument(filename: string, text: string): SourceDocument["kind"] {
  const haystack = `${filename} ${text.slice(0, 500)}`.toLowerCase();
  if (haystack.includes("sop")) return "sop";
  if (haystack.includes("guideline")) return "guideline";
  if (haystack.includes("historical")) return "historical";
  return "report";
}
