import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { getReportContentType, isSupportedReportMetadata, SUPPORTED_REPORT_FORMATS } from "@/lib/files/parse";
import { getSupabaseAdmin, SUPABASE_BUCKET } from "@/lib/supabase/server";
import { DIRECT_UPLOAD_LIMIT_BYTES, MAX_FILES, formatUploadSize } from "@/lib/uploads/limits";

export const runtime = "nodejs";

type UploadRequestFile = {
  name: string;
  type: string;
  size: number;
};

export async function POST(request: Request) {
  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json(
        { error: "Supabase is required for uploads larger than 4 MB. Configure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY." },
        { status: 500 }
      );
    }

    const body = (await request.json()) as { files?: UploadRequestFile[] };
    const files = body.files ?? [];

    if (files.length < 1 || files.length > MAX_FILES) {
      return NextResponse.json({ error: `Upload between 1 and ${MAX_FILES} report files (${SUPPORTED_REPORT_FORMATS}).` }, { status: 400 });
    }

    const totalBytes = files.reduce((sum, file) => sum + file.size, 0);
    if (totalBytes > DIRECT_UPLOAD_LIMIT_BYTES) {
      return NextResponse.json(
        { error: `Uploads must be under ${formatUploadSize(DIRECT_UPLOAD_LIMIT_BYTES)} total. Selected files are ${formatUploadSize(totalBytes)}.` },
        { status: 413 }
      );
    }

    const uploads = [];
    for (const file of files) {
      if (!isSupportedReportMetadata(file)) {
        return NextResponse.json({ error: `${file.name} is not supported. Upload a PDF or XLSX file.` }, { status: 400 });
      }

      const path = `uploads/${randomUUID()}-${sanitizeFilename(file.name)}`;
      const { data, error } = await supabase.storage.from(SUPABASE_BUCKET).createSignedUploadUrl(path, { upsert: false });
      if (error) throw error;

      uploads.push({
        name: file.name,
        path: data.path,
        signedUrl: data.signedUrl,
        token: data.token,
        contentType: getReportContentType(file)
      });
    }

    return NextResponse.json({ uploads });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to prepare uploads." },
      { status: 500 }
    );
  }
}

function sanitizeFilename(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "") || "report";
}
