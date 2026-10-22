import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import fs from "node:fs/promises";
import path from "node:path";

const MAX_SIZE = 50 * 1024; // 50 KB (Sesuai kebijakan keamanan aplikasi)
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

function detectImageExtension(buffer: Buffer): "jpg" | "png" | "webp" | null {
  if (buffer.length < 12) return null;

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return "png";
  }

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "jpg";
  }

  // WEBP: RIFF....WEBP (52 49 46 46 .... 57 45 42 50)
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return "webp";
  }

  return null;
}

function hasDangerousPayload(buffer: Buffer): boolean {
  // Inspeksi string biner untuk mencegah polyglot exploit / embedded script
  const sample = buffer.subarray(0, Math.min(buffer.length, 4096)).toString("latin1").toLowerCase();
  const dangerous = [
    "<?php",
    "<?=",
    "<script",
    "<html",
    "<body",
    "eval(",
    "base64_decode(",
    "system(",
    "shell_exec(",
    "passthru("
  ];
  return dangerous.some((d) => sample.includes(d));
}

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
        { error: "Ukuran foto melebihi batas maksimal 50 KB" },
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

    // Deep validation: validasi magic bytes asli file, bukan sekadar MIME header dari client
    const verifiedExt = detectImageExtension(buffer);
    if (!verifiedExt) {
      return NextResponse.json(
        { error: "File yang diunggah rusak atau bukan file gambar JPG/PNG/WEBP yang valid" },
        { status: 400 }
      );
    }

    // Security check: cegah webshell & embedded script payload
    if (hasDangerousPayload(buffer)) {
      return NextResponse.json(
        { error: "File ditolak karena mengandung pola data yang tidak aman" },
        { status: 400 }
      );
    }

    const uploadDir = path.join(process.cwd(), "public", "uploads", "avatars");
    await fs.mkdir(uploadDir, { recursive: true });

    // Sanitasi nama file: gunakan UUID user yang bersih + ekstensi tervalidasi dari magic bytes
    const cleanUserId = user.id.replace(/[^a-zA-Z0-9_-]/g, "");
    const fileName = `${cleanUserId}.${verifiedExt}`;
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
