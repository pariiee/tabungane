import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import fs from "node:fs/promises";
import path from "node:path";

const MAX_SIZE = 500 * 1024; // 500 KB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("avatar") as File | null;

    if (!file) {
      return NextResponse.json({ error: "File foto tidak ditemukan" }, { status: 400 });
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "Ukuran foto melebihi batas maksimal 500 KB" },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Format file tidak didukung (harus JPG, PNG, atau WEBP)" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Extension from mime
    let ext = "jpg";
    if (file.type === "image/png") ext = "png";
    else if (file.type === "image/webp") ext = "webp";
    else if (file.type === "image/gif") ext = "gif";

    const uploadDir = path.join(process.cwd(), "public", "uploads", "avatars");
    await fs.mkdir(uploadDir, { recursive: true });

    // Consistent filename per user with cache-busting timestamp
    const fileName = `${user.id}.${ext}`;
    const filePath = path.join(uploadDir, fileName);
    await fs.writeFile(filePath, buffer);

    const fotoUrl = `/uploads/avatars/${fileName}?t=${Date.now()}`;
    db.prepare("UPDATE users SET foto_url = ? WHERE id = ?").run(fotoUrl, user.id);

    return NextResponse.json({
      success: true,
      foto_url: fotoUrl,
    });
  } catch (error: any) {
    console.error("Avatar upload error:", error);
    return NextResponse.json(
      { error: "Gagal mengunggah foto profil" },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const row = db.prepare("SELECT foto_url FROM users WHERE id = ?").get(user.id) as any;
    if (row?.foto_url) {
      const cleanPath = row.foto_url.split("?")[0];
      const filePath = path.join(process.cwd(), "public", cleanPath);
      try {
        await fs.unlink(filePath);
      } catch {}
    }

    db.prepare("UPDATE users SET foto_url = NULL WHERE id = ?").run(user.id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Avatar delete error:", error);
    return NextResponse.json(
      { error: "Gagal menghapus foto profil" },
      { status: 500 }
    );
  }
}
