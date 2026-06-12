export const MAX_FILES = 20;
export const VERCEL_UPLOAD_LIMIT_BYTES = 4 * 1024 * 1024;
export const DIRECT_UPLOAD_LIMIT_BYTES = 25 * 1024 * 1024;

export function formatUploadSize(bytes: number) {
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}
