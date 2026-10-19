import { NextResponse } from "next/server";
import { getCurrentUser, hashPassword, logAudit } from "@/lib/auth";
import { db } from "@/lib/db";
import crypto from "node:crypto";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { csvText, default_tahun_ajaran = "2026/2027" } = await req.json();
  if (!csvText) {
    return NextResponse.json({ error: "File / isi CSV wajib dikirim" }, { status: 400 });
  }

  const lines = csvText.trim().split(/\r?\n/);
  const results = [];
  let successCount = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || (i === 0 && line.toLowerCase().includes("nim"))) continue; // skip header

    const parts = line.split(",").map((p: string) => p.trim().replace(/^["']|["']$/g, ""));
    const [nim, nama, namaKelas] = parts;

    if (!nim || !nama) continue;

    // Find or create kelas
    let kelasId = null;
    if (namaKelas) {
      let kelas = db.prepare("SELECT id FROM kelas WHERE LOWER(nama) = LOWER(?)").get(namaKelas) as any;
      if (!kelas) {
        kelasId = crypto.randomUUID();
        db.prepare("INSERT INTO kelas (id, nama, tahun_ajaran) VALUES (?, ?, ?)").run(
          kelasId,
          namaKelas,
          default_tahun_ajaran
        );
      } else {
        kelasId = kelas.id;
      }
    }

    const tempPassword = `pwd${Math.floor(100000 + Math.random() * 900000)}`;
    const passwordHash = hashPassword(tempPassword);

    const existing = db.prepare("SELECT id FROM users WHERE nim = ?").get(nim) as any;
    if (existing) {
      // update info
      db.prepare("UPDATE users SET nama = ?, kelas_id = COALESCE(?, kelas_id) WHERE id = ?").run(
        nama,
        kelasId,
        existing.id
      );
      results.push({ nim, nama, status: "updated", temp_password: "-" });
    } else {
      const id = crypto.randomUUID();
      db.prepare(`
        INSERT INTO users (id, nim, nama, role, kelas_id, password_hash, must_change_password, aktif)
        VALUES (?, ?, ?, 'mahasiswa', ?, ?, 1, 1)
      `).run(id, nim, nama, kelasId, passwordHash);

      // Auto enroll to kelas groups
      if (kelasId) {
        const groups = db.prepare("SELECT id FROM grup_tabungan WHERE kelas_id = ?").all(kelasId) as any[];
        for (const g of groups) {
          try {
            db.prepare("INSERT OR IGNORE INTO keanggotaan (id, grup_id, user_id) VALUES (?, ?, ?)").run(
              crypto.randomUUID(),
              g.id,
              id
            );
          } catch {}
        }
      }

      successCount++;
      results.push({ nim, nama, status: "created", temp_password: tempPassword });
    }
  }

  logAudit(user.id, "IMPORT_CSV_MAHASISWA", "users", `Berhasil memproses ${results.length} baris CSV`);

  return NextResponse.json({
    success: true,
    total: results.length,
    created: successCount,
    details: results,
  });
}
