"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Layers, Plus, Calendar, Target, Users, Wallet, ArrowRight, AlertCircle, CheckCircle2 } from "lucide-react";

export default function AdminGrupPage() {
  const [groups, setGroups] = useState<any[]>([]);
  const [kelasList, setKelasList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form Buat Grup
  const [showModal, setShowModal] = useState(false);
  const [namaGrup, setNamaGrup] = useState("");
  const [kelasId, setKelasId] = useState("");
  const [targetPerMhs, setTargetPerMhs] = useState("100000");
  const [deadline, setDeadline] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadData = () => {
    fetch("/api/admin/grup")
      .then((res) => res.json())
      .then((d) => setGroups(d.data || []));

    fetch("/api/admin/kelas")
      .then((res) => res.json())
      .then((d) => {
        const k = d.data || [];
        setKelasList(k);
        if (k.length > 0 && !kelasId) setKelasId(k[0].id);
      });

    setLoading(false);
  };

  useEffect(() => {
    loadData();
    // Default deadline 30 days ahead
    const d = new Date();
    d.setDate(d.getDate() + 30);
    setDeadline(d.toISOString().split("T")[0]);
  }, []);

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/admin/grup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kelas_id: kelasId,
          nama: namaGrup,
          target_per_mahasiswa: parseInt(targetPerMhs, 10),
          deadline,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal membuat grup");

      setSuccess(`Grup "${namaGrup}" berhasil dibuat! Otomatis mendaftarkan ${data.total_enrolled} mahasiswa kelas.`);
      setShowModal(false);
      setNamaGrup("");
      loadData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Layers className="w-6 h-6 text-purple-600" />
            Kelola Grup Tabungan
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Grup tabungan kas per kelas dengan target nominal dan tenggat waktu (deadline).
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Buat Grup Baru
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-3 bg-emerald-50 text-emerald-700 text-xs rounded-xl border border-emerald-200 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Grid Grup */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {groups.map((g) => (
          <div
            key={g.id}
            className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-4 hover:border-purple-200 transition-all"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full">
                  Kelas {g.nama_kelas}
                </span>
                <span className="text-xs text-gray-400">Deadline: {g.deadline}</span>
              </div>
              <h3 className="font-bold text-gray-900 text-base mt-2">{g.nama}</h3>
            </div>

            <div className="space-y-2 pt-2 border-t border-gray-100 text-xs">
              <div className="flex justify-between text-gray-600">
                <span>Target per Mahasiswa:</span>
                <span className="font-bold text-gray-900">
                  Rp{g.target_per_mahasiswa?.toLocaleString("id-ID")}
                </span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Total Dana Terkumpul:</span>
                <span className="font-bold text-emerald-600">
                  Rp{g.total_terkumpul?.toLocaleString("id-ID")}
                </span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Anggota Kelas:</span>
                <span className="font-bold text-gray-900">{g.total_anggota} Mahasiswa</span>
              </div>
            </div>

            <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
              <Link
                href={`/grup/${g.id}`}
                className="text-xs font-semibold text-purple-600 hover:text-purple-700 flex items-center gap-1"
              >
                Lihat Leaderboard
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                href={`/admin/laporan?grup_id=${g.id}`}
                className="text-xs text-gray-500 hover:text-gray-800 underline"
              >
                Laporan CSV
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Buat Grup */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="font-bold text-gray-900 text-base">Buat Grup Tabungan Baru</h3>
            <form onSubmit={handleCreateGroup} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Kelas</label>
                <select
                  required
                  value={kelasId}
                  onChange={(e) => setKelasId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                >
                  {kelasList.map((k) => (
                    <option key={k.id} value={k.id}>
                      Kelas {k.nama} ({k.tahun_ajaran})
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  Seluruh mahasiswa aktif di kelas ini akan otomatis dimasukkan ke grup tabungan.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Nama Acara / Grup</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Kas Wisuda & Buku Kenangan"
                  value={namaGrup}
                  onChange={(e) => setNamaGrup(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Target Nominal per Mahasiswa (Rp)
                </label>
                <input
                  type="number"
                  min={1000}
                  step={1000}
                  required
                  value={targetPerMhs}
                  onChange={(e) => setTargetPerMhs(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Tenggat Waktu (Deadline)</label>
                <input
                  type="date"
                  required
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold"
                >
                  {submitting ? "Membuat..." : "Simpan Grup"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
