import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

// Directory on the server's own disk where uploaded photos are saved.
// Make sure this path is persisted (not wiped on redeploy) if not using a volume.
const UPLOAD_SUBPATH = process.env.UPLOAD_SUBPATH ?? "uploads/photos";
const UPLOAD_DIR = process.env.UPLOAD_DIR ?? path.join(process.cwd(), UPLOAD_SUBPATH);

// Public base URL this server is reachable at, e.g. "https://events.snowy.page"
// The "/uploads/photos" part is appended automatically below — it must match
// UPLOAD_SUBPATH exactly, since that's what serveStatic actually serves on disk.
const publicOrigin = process.env.UPLOAD_PUBLIC_ORIGIN!;

if (!publicOrigin) {
  throw new Error("UPLOAD_PUBLIC_ORIGIN Error, Please check env config or UPLOAD_PUBLIC_ORIGIN isn't found");
}

const publicUrlBase = `${publicOrigin}/${UPLOAD_SUBPATH}`;

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png"];
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB, original resolution for print

export class InvalidUploadError extends Error {}

export async function uploadPhoto(file: File, lineUserId: string): Promise<string> {
  // Checking mime type before touching disk
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    throw new InvalidUploadError(`Unsupported file type: ${file.type}`);
  }

  // Checking file size, reject oversized uploads early
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new InvalidUploadError(
      `File too large: ${file.size} bytes, max is ${MAX_FILE_SIZE_BYTES} bytes`,
    );
  }

  const ext = file.type === "image/png" ? "png" : "jpg";
  const fileName = `${randomUUID()}.${ext}`;
  const userDir = path.join(UPLOAD_DIR, lineUserId);

  // Making sure the per-user folder exists before writing
  await mkdir(userDir, { recursive: true });

  const filePath = path.join(userDir, fileName);
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(filePath, buffer);

  return `${publicUrlBase}/${lineUserId}/${fileName}`;
}