import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db, runTransaction } from "@/lib/db";
import { getProdiScope } from "@/lib/scope";

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role === "mahasiswa") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") || "all";

  let query = `
    SELECT p.*, u.nama as nama_mahasiswa, COALESCE(u.nomor_id, u.nim) as nomor_id, k.nama as nama_kelas, pr.nama as nama_prodi
    FROM pengajuan_penarikan p
    JOIN users u ON p.user_id = u.id
    LEFT JOIN kelas k ON u.kelas_id = k.id
    LEFT JOIN prodi pr ON k.prodi_id = pr.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (status !== "all") {
    query += " AND p.status = ?";
    params.push(status);
  }

  // Scoping
  if (user.role === "admin_kelas") {
    const managed: string[] = user.managed_kelas_ids ? JSON.parse(user.managed_kelas_ids) : (user.kelas_id ? [user.kelas_id] : []);
    if (managed.length > 0) {
      query += ` AND u.kelas_id IN (${managed.map(() => "?").join(",")})`;
      params.push(...managed);
    } else {
      return NextResponse.json({ data: [] });
    }
  } else {
    const pScope = getProdiScope(user);
    if (pScope) {
      query += " AND k.prodi_id = ?";
      params.push(pScope);
    }
  }

  query += " ORDER BY p.created_at DESC";
  const data = db.prepare(query).all(...params);

  return NextResponse.json({ data });
}

export async function PATCH(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role === "mahasiswa") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, tindakan, catatan_admin, bukti_transfer_url } = await req.json();
  if (!id || (tindakan !== "setujui" && tindakan !== "tolak")) {
    return NextResponse.json({ error: "ID dan tindakan valid ('setujui' | 'tolak') wajib diisi" }, { status: 400 });
  }

  const p = db.prepare("SELECT * FROM pengajuan_penarikan WHERE id = ?").get(id) as any;
  if (!p) {
    return NextResponse.json({ error: "Pengajuan tidak ditemukan" }, { status: 404 });
  }

  if (p.status !== "pending") {
    return NextResponse.json({ error: `Pengajuan sudah diproses sebelumnya (${p.status})` }, { status: 400 });
  }

  runTransaction(() => {
    if (tindakan === "setujui") {
      db.prepare(`
        UPDATE pengajuan_penarikan 
        SET status = 'disetujui', catatan_admin = ?, bukti_transfer_url = ?, diproses_oleh = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(catatan_admin || "Telah ditransfer", bukti_transfer_url || null, user.nama, id);

      // Selesaikan transaksi pending debit
      db.prepare(`
        UPDATE transaksi 
        SET status = 'berhasil', catatan = catatan || ' [Disetujui]'
        WHERE id = (
          SELECT id FROM transaksi 
          WHERE user_id = ? AND status = 'pending' AND tipe = 'debit' AND (jumlah = ? OR jumlah = ?)
          ORDER BY created_at DESC LIMIT 1
        )
      `).run(p.user_id, -p.jumlah, p.jumlah);
    } else {
      db.prepare(`
        UPDATE pengajuan_penarikan 
        SET status = 'ditolak', catatan_admin = ?, diproses_oleh = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(catatan_admin || "Pengajuan ditolak oleh admin", user.nama, id);

      // Batalkan transaksi pending debit agar saldo kembali utuh
      db.prepare(`
        UPDATE transaksi 
        SET status = 'canceled', catatan = catatan || ' [Ditolak - Refund]'
        WHERE id = (
          SELECT id FROM transaksi 
          WHERE user_id = ? AND status = 'pending' AND tipe = 'debit' AND (jumlah = ? OR jumlah = ?)
          ORDER BY created_at DESC LIMIT 1
        )
      `).run(p.user_id, -p.jumlah, p.jumlah);
    }
  });

  return NextResponse.json({
    success: true,
    message: tindakan === "setujui" ? "Pengajuan berhasil disetujui & diselesaikan" : "Pengajuan berhasil ditolak dan dana dikembalikan ke dompet mahasiswa",
  });
}
