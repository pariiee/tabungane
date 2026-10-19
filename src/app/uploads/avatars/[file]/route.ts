import fs from "node:fs/promises";
import path from "node:path";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ file: string }> }
) {
  const { file } = await params;
  const safeFileName = path.basename(file);

  // Search locations: public/uploads/avatars or data/avatars
  const locations = [
    path.join(process.cwd(), "public", "uploads", "avatars", safeFileName),
    path.join(process.cwd(), "data", "avatars", safeFileName),
  ];

  for (const filePath of locations) {
    try {
      const buffer = await fs.readFile(filePath);
      const ext = path.extname(safeFileName).toLowerCase();
      const mime =
        ext === ".png"
          ? "image/png"
          : ext === ".webp"
          ? "image/webp"
          : ext === ".gif"
          ? "image/gif"
          : "image/jpeg";

      return new Response(buffer, {
        headers: {
          "Content-Type": mime,
          "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
        },
      });
    } catch {}
  }

  return new Response("Image not found", { status: 404 });
}
