import { NextResponse } from "next/server";
import { getCurrentUser, hashPassword, logAudit } from "@/lib/auth";
import { db } from "@/lib/db";
import { canAccessKelas, canAccessMahasiswa, getProdiScope } from "@/lib/scope";
import crypto from "node:crypto";

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const kelas_id = searchParams.get("kelas_id");
  const prodi_id = searchParams.get("prodi_id");
  const prodiScope = getProdiScope(user);

  let query = `
    SELECT DISTINCT u.id, COALESCE(u.nomor_id, u.nim) as nomor_id, u.nim, u.nama, u.role, u.kelas_id, u.prodi_id, u.fakultas, u.custom_permissions, u.must_change_password, u.aktif, u.created_at,
           k.nama as nama_kelas, k.tahun_ajaran, p.nama as nama_prodi, p.kode as kode_prodi, p.fakultas_id, f.nama as nama_fakultas,
           COALESCE((
             SELECT SUM(t.jumlah)
             FROM transaksi t
             WHERE t.user_id = u.id AND t.keanggotaan_id IS NULL AND t.status = 'berhasil'
           ), 0) as saldo_dompet
    FROM users u
    LEFT JOIN kelas k ON u.kelas_id = k.id
    LEFT JOIN prodi p ON (k.prodi_id = p.id OR u.prodi_id = p.id)
    LEFT JOIN fakultas f ON (p.fakultas_id = f.id OR u.fakultas = f.id OR u.fakultas = f.nama)
    WHERE u.role IN ('mahasiswa', 'admin_kelas')
  `;
  const params: any[] = [];

  // Scoping Admin Prodi
  if (prodiScope) {
    query += " AND k.prodi_id = ?";
    params.push(prodiScope);
  } else if (prodi_id) {
    query += " AND k.prodi_id = ?";
    params.push(prodi_id);
  }

  if (kelas_id) {
    query += " AND u.kelas_id = ?";
    params.push(kelas_id);
  }

  query += " ORDER BY u.nim ASC";

  const data = db.prepare(query).all(...params);
  return NextResponse.json({ data });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { nim, nama, kelas_id } = await req.json();
  if (!nim || !nama || !kelas_id) {
    return NextResponse.json({ error: "NIM, nama, dan kelas wajib diisi" }, { status: 400 });
  }

  if (!canAccessKelas(user, kelas_id)) {
    return NextResponse.json({ error: "Anda tidak berhak mendaftarkan mahasiswa ke kelas di luar Prodi Anda" }, { status: 403 });
  }

  const existing = db.prepare("SELECT id FROM users WHERE nim = ?").get(nim);
  if (existing) {
    return NextResponse.json({ error: `NIM ${nim} sudah terdaftar` }, { status: 400 });
  }

  // Generate temporary password (e.g. 8 chars)
  const tempPassword = `pwd${Math.floor(100000 + Math.random() * 900000)}`;
  const passwordHash = hashPassword(tempPassword);
  const id = crypto.randomUUID();

  const { runTransaction } = require("@/lib/db");
  runTransaction(() => {
    db.prepare(`
      INSERT INTO users (id, nim, nama, role, kelas_id, password_hash, must_change_password, aktif)
      VALUES (?, ?, ?, 'mahasiswa', ?, ?, 1, 1)
    `).run(id, nim, nama, kelas_id, passwordHash);

    // Auto enroll in active groups of this class or open to all classes (idempotent)
    const groups = db.prepare("SELECT id FROM grup_tabungan WHERE (kelas_id = ? OR kelas_id IS NULL) AND status = 'aktif'").all(kelas_id) as any[];
    for (const g of groups) {
      try {
        db.prepare("INSERT OR IGNORE INTO keanggotaan (id, grup_id, user_id) VALUES (?, ?, ?)").run(
          crypto.randomUUID(),
          g.id,
          id
        );
      } catch {}
    }
  });

  logAudit(user.id, "TAMBAH_MAHASISWA", id, `NIM: ${nim}, Nama: ${nama}`);

  return NextResponse.json({
    success: true,
    temp_password: tempPassword,
    nim,
    nama,
  });
}

export async function PATCH(req: Request) {
  const user = await getCurrentUser();
  if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, nama, nomor_id, kelas_id, prodi_id, fakultas, aktif, role, custom_permissions } = await req.json();
  if (!id) {
    return NextResponse.json({ error: "ID mahasiswa wajib disertakan" }, { status: 400 });
  }

  if (!canAccessMahasiswa(user, id)) {
    return NextResponse.json({ error: "Anda tidak berhak mengubah mahasiswa di luar Program Studi Anda" }, { status: 403 });
  }

  if (kelas_id && !canAccessKelas(user, kelas_id)) {
    return NextResponse.json({ error: "Anda tidak berhak memindahkan mahasiswa ke kelas di luar Program Studi Anda" }, { status: 403 });
  }

  const student = db.prepare("SELECT * FROM users WHERE id = ? AND role IN ('mahasiswa', 'admin_kelas')").get(id) as any;
  if (!student) {
    return NextResponse.json({ error: "Mahasiswa tidak ditemukan" }, { status: 404 });
  }

  const updates: string[] = [];
  const params: any[] = [];

  if (nama !== undefined && nama.trim()) {
    updates.push("nama = ?");
    params.push(nama.trim());
  }

  if (nomor_id !== undefined && nomor_id.trim()) {
    const cleanNomor = nomor_id.trim();
    // Cek duplikasi ID
    const dup = db.prepare("SELECT id FROM users WHERE (nomor_id = ? OR nim = ?) AND id != ?").get(cleanNomor, cleanNomor, id);
    if (dup) return NextResponse.json({ error: `ID ${cleanNomor} sudah digunakan akun lain` }, { status: 400 });
    updates.push("nomor_id = ?, nim = ?");
    params.push(cleanNomor, cleanNomor);
  }

  if (prodi_id !== undefined) {
    updates.push("prodi_id = ?");
    params.push(prodi_id || null);
  }

  if (fakultas !== undefined) {
    updates.push("fakultas = ?");
    params.push(fakultas || null);
  }

  if (aktif !== undefined) {
    updates.push("aktif = ?");
    params.push(aktif ? 1 : 0);
  }

  if (role !== undefined && (role === "admin_kelas" || role === "mahasiswa")) {
    updates.push("role = ?");
    params.push(role);
    if (role === "admin_kelas") {
      updates.push("managed_kelas_ids = ?");
      params.push(JSON.stringify([student.kelas_id]));
    } else {
      updates.push("managed_kelas_ids = NULL");
    }
  }

  const kelasChanged = kelas_id !== undefined && kelas_id !== student.kelas_id;
  if (kelas_id !== undefined) {
    updates.push("kelas_id = ?");
    params.push(kelas_id || null);
  }

  if (custom_permissions !== undefined) {
    const oldPerms = student.custom_permissions || "[]";
    const newPerms = custom_permissions ? (typeof custom_permissions === "string" ? custom_permissions : JSON.stringify(custom_permissions)) : "[]";
    if (oldPerms !== newPerms) {
      logAudit(
        user.id,
        "UPDATE_PERMISSIONS",
        id,
        `Ubah izin ${student.nama} (${student.nomor_id || student.nim}): ${oldPerms} -> ${newPerms}`
      );
    }
    updates.push("custom_permissions = ?");
    params.push(custom_permissions ? (typeof custom_permissions === "string" ? custom_permissions : JSON.stringify(custom_permissions)) : null);
  }

  if (updates.length > 0) {
    params.push(id);
    db.prepare(`UPDATE users SET ${updates.join(", ")} WHERE id = ?`).run(...params);
  }

  // If class changed, auto-enroll into active groups of new class
  if (kelasChanged && kelas_id) {
    const groups = db.prepare("SELECT id FROM grup_tabungan WHERE (kelas_id = ? OR kelas_id IS NULL) AND status = 'aktif'").all(kelas_id) as any[];
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

  logAudit(
    user.id,
    "UPDATE_MAHASISWA",
    id,
    `NIM: ${student.nim}${kelasChanged ? ` (Pindah ke kelas: ${kelas_id})` : ""}`
  );

  return NextResponse.json({ success: true });
}

export async function DELETE(req: Request) {
  const user = await getCurrentUser();
  if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "ID mahasiswa wajib disertakan" }, { status: 400 });
  }

  if (!canAccessMahasiswa(user, id)) {
    return NextResponse.json({ error: "Anda tidak berhak menghapus mahasiswa di luar Program Studi Anda" }, { status: 403 });
  }

  const student = db.prepare("SELECT * FROM users WHERE id = ? AND role = 'mahasiswa'").get(id) as any;
  if (!student) {
    return NextResponse.json({ error: "Mahasiswa tidak ditemukan" }, { status: 404 });
  }

  // Check if student has transactions
  const trxCount = db.prepare(`
    SELECT COUNT(t.id) as total
    FROM transaksi t
    LEFT JOIN keanggotaan kg ON t.keanggotaan_id = kg.id
    WHERE t.user_id = ? OR kg.user_id = ?
  `).get(id, id) as any;

  if (trxCount?.total > 0) {
    // Soft-delete / nonaktifkan agar ledger append-only tidak rusak
    db.prepare("UPDATE users SET aktif = 0 WHERE id = ?").run(id);
    logAudit(user.id, "NONAKTIFKAN_MAHASISWA", id, `NIM: ${student.nim} dinonaktifkan (ada ${trxCount.total} transaksi)`);
    return NextResponse.json({
      success: true,
      action: "deactivated",
      message: `Mahasiswa memiliki ${trxCount.total} riwayat transaksi. Akun berhasil dinonaktifkan untuk menjaga integritas ledger.`,
    });
  }

  // If no transactions, hard delete
  const { runTransaction } = require("@/lib/db");
  runTransaction(() => {
    db.prepare("DELETE FROM keanggotaan WHERE user_id = ?").run(id);
    db.prepare("DELETE FROM users WHERE id = ?").run(id);
  });

  logAudit(user.id, "HAPUS_MAHASISWA", id, `NIM: ${student.nim}, Nama: ${student.nama}`);

  return NextResponse.json({
    success: true,
    action: "deleted",
    message: "Mahasiswa berhasil dihapus dari sistem.",
  });
}
