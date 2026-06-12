import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { DIRECT_UPLOAD_LIMIT_BYTES } from "@/lib/uploads/limits";

const ALLOWED_CONTENT_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
];

const BLOB_CONFIGURATION_ERROR =
  "Vercel Blob is not configured. Add BLOB_READ_WRITE_TOKEN to this environment, then redeploy or restart the development server.";

export async function POST(request: Request) {
  try {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return NextResponse.json({ error: BLOB_CONFIGURATION_ERROR }, { status: 503 });
    }

    const body = (await request.json()) as HandleUploadBody;
    const response = await handleUpload({
      request,
      body,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: ALLOWED_CONTENT_TYPES,
        maximumSizeInBytes: DIRECT_UPLOAD_LIMIT_BYTES,
        addRandomSuffix: true,
        allowOverwrite: false,
      }),
      onUploadCompleted: async () => {},
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to prepare Blob upload." },
      { status: 500 }
    );
  }
}
