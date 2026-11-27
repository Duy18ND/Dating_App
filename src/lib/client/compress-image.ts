export const MAX_EDGE = 1200;
export const TARGET_BYTES = 200 * 1024;
const QUALITIES = [0.85, 0.75, 0.65, 0.55];

export function fitWithin(width: number, height: number, maxEdge: number) {
  const scale = Math.min(1, maxEdge / Math.max(width, height));
  return { width: Math.round(width * scale), height: Math.round(height * scale) };
}

async function encodeWebp(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  const native = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/webp", quality),
  );
  // Safari không mã hóa được WebP và lặng lẽ trả PNG, khi đó dùng bộ mã hóa WASM.
  if (native?.type === "image/webp") return native;
  const { default: encode } = await import("@jsquash/webp/encode");
  const pixels = canvas.getContext("2d")!.getImageData(0, 0, canvas.width, canvas.height);
  return new Blob([await encode(pixels, { quality: Math.round(quality * 100) })], {
    type: "image/webp",
  });
}

/** Thu về cạnh dài <= 1200px và nén WebP <= 200KB. */
export async function compressToWebp(
  file: Blob,
): Promise<{ blob: Blob; width: number; height: number }> {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" }).catch(() => {
    throw new Error("Không đọc được ảnh này. Hãy chọn ảnh JPG, PNG hoặc WebP.");
  });
  try {
    for (let edge = MAX_EDGE; edge >= 480; edge = Math.round(edge * 0.8)) {
      const size = fitWithin(bitmap.width, bitmap.height, edge);
      const canvas = document.createElement("canvas");
      canvas.width = size.width;
      canvas.height = size.height;
      canvas.getContext("2d")!.drawImage(bitmap, 0, 0, size.width, size.height);
      for (const quality of QUALITIES) {
        const blob = await encodeWebp(canvas, quality);
        if (blob.size <= TARGET_BYTES) return { blob, ...size };
      }
    }
    throw new Error("Ảnh quá chi tiết, không nén được xuống 200KB. Hãy chọn ảnh khác.");
  } finally {
    bitmap.close();
  }
}
