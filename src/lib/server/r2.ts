import "server-only";
import { DeleteObjectsCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { requireEnv } from "./env";

let client: S3Client | undefined;
function r2(): S3Client {
  client ??= new S3Client({
    region: "auto",
    endpoint: `https://${requireEnv("R2_ACCOUNT_ID")}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: requireEnv("R2_ACCESS_KEY_ID"),
      secretAccessKey: requireEnv("R2_SECRET_ACCESS_KEY"),
    },
    // SDK mặc định tự thêm checksum mà một số kho tương thích S3 không nhận.
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
  });
  return client;
}

export function publicUrl(key: string): string {
  return `${requireEnv("NEXT_PUBLIC_R2_PUBLIC_URL").replace(/\/$/, "")}/${key}`;
}

export async function putWebp(key: string, body: Uint8Array): Promise<void> {
  await r2().send(
    new PutObjectCommand({
      Bucket: requireEnv("R2_BUCKET"),
      Key: key,
      Body: body,
      ContentType: "image/webp",
      CacheControl: "public, max-age=31536000, immutable",
    }),
  );
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
