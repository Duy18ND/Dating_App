import "server-only";
import { DeleteObjectsCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { requireEnv } from "./env";

/** Tạo S3Client mỗi request để tránh tái sử dụng I/O giữa các request trên Cloudflare Workers. */
function r2(): S3Client {
  const customEndpoint = process.env.R2_ENDPOINT?.trim();
  const endpoint =
    customEndpoint || `https://${requireEnv("R2_ACCOUNT_ID")}.r2.cloudflarestorage.com`;
  return new S3Client({
    region: process.env.R2_REGION?.trim() || "auto",
    endpoint,
    // Supabase Storage S3 yêu cầu path-style URL (/bucket/key).
    forcePathStyle: Boolean(customEndpoint),
    credentials: {
      accessKeyId: requireEnv("R2_ACCESS_KEY_ID"),
      secretAccessKey: requireEnv("R2_SECRET_ACCESS_KEY"),
    },
    // SDK mặc định tự thêm checksum mà một số kho tương thích S3 không nhận.
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
  });
}

export function publicUrl(key: string): string {
  return `${requireEnv("NEXT_PUBLIC_R2_PUBLIC_URL").replace(/\/$/, "")}/${key}`;
}

export async function putObject(key: string, body: Uint8Array, contentType: string): Promise<void> {
  await r2().send(
    new PutObjectCommand({
      Bucket: requireEnv("R2_BUCKET"),
      Key: key,
      Body: body,
      ContentType: contentType,
      CacheControl: "public, max-age=31536000, immutable",
    }),
  );
}

export async function putWebp(key: string, body: Uint8Array): Promise<void> {
  await putObject(key, body, "image/webp");
}

/** R2 nhận tối đa 1000 key mỗi lần. Ném lỗi nếu có key không xóa được. */
export async function deleteObjects(keys: string[]): Promise<void> {
  if (keys.length === 0) return;
  const result = await r2().send(
    new DeleteObjectsCommand({
      Bucket: requireEnv("R2_BUCKET"),
      Delete: { Objects: keys.map((Key) => ({ Key })), Quiet: true },
    }),
  );
  if (result.Errors?.length) throw new Error(`R2: không xóa được ${result.Errors.length} file`);
}
