"use client";

import { useEffect, useState } from "react";
import {
  ArrowRightLeft,
  RotateCcw,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  HelpCircle,
  X
} from "lucide-react";

export default function AdminTransaksiPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [kelasList, setKelasList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterStatus, setFilterStatus] = useState("");
  const [filterGrup, setFilterGrup] = useState("");
  const [filterKelas, setFilterKelas] = useState("");

  // Modal Koreksi (M10 Reversal)
  const [selectedTrx, setSelectedTrx] = useState<any>(null);
  const [alasanKoreksi, setAlasanKoreksi] = useState("");
  const [submittingKoreksi, setSubmittingKoreksi] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadData = () => {
    let url = "/api/admin/transaksi?limit=100";
    if (filterStatus) url += `&status=${filterStatus}`;
    if (filterGrup) url += `&grup_id=${filterGrup}`;
    if (filterKelas) url += `&kelas_id=${filterKelas}`;

    fetch(url)
      .then((res) => res.json())
      .then((d) => setTransactions(d.data || []));

    fetch("/api/admin/grup")
      .then((res) => res.json())
      .then((d) => setGroups(d.data || []));

    fetch("/api/admin/kelas")
      .then((res) => res.json())
      .then((d) => setKelasList(d.data || []));

    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [filterStatus, filterGrup, filterKelas]);

  const handleKoreksi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTrx) return;
    setError("");
    setSuccess("");
    setSubmittingKoreksi(true);

    try {
      const res = await fetch("/api/admin/transaksi/reversal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transaksi_id: selectedTrx.id,
          alasan: alasanKoreksi,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal melakukan koreksi");

      setSuccess(`Koreksi berhasil dibuat. Transaksi pembalik bernilai negatif telah dicatat.`);
      setSelectedTrx(null);
      setAlasanKoreksi("");
      loadData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmittingKoreksi(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <ArrowRightLeft className="w-6 h-6 text-purple-600" />
          Kelola Transaksi & Ledger
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Daftar seluruh mutasi tabungan QRIS, setoran tunai admin, dan transaksi pembalik (koreksi).
        </p>
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

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-wrap items-center gap-3 text-xs">
        <div className="flex items-center gap-1.5 font-semibold text-gray-600">
          <Filter className="w-4 h-4" />
          Filter:
        </div>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-2.5 py-1.5 border border-gray-300 rounded-lg outline-none"
        >
          <option value="">Semua Status</option>
          <option value="berhasil">Berhasil</option>
          <option value="pending">Pending</option>
          <option value="expired">Expired</option>
          <option value="canceled">Canceled</option>
        </select>

        <select
          value={filterGrup}
          onChange={(e) => setFilterGrup(e.target.value)}
          className="px-2.5 py-1.5 border border-gray-300 rounded-lg outline-none"
        >
          <option value="">Semua Grup</option>
          {groups.map((g) => (
            <option key={g.id} value={g.id}>
              {g.nama}
            </option>
          ))}
        </select>

        <select
          value={filterKelas}
          onChange={(e) => setFilterKelas(e.target.value)}
          className="px-2.5 py-1.5 border border-gray-300 rounded-lg outline-none"
        >
          <option value="">Semua Kelas</option>
          {kelasList.map((k) => (
            <option key={k.id} value={k.id}>
              Kelas {k.nama}
            </option>
          ))}
        </select>

        <span className="text-gray-400 ml-auto">{transactions.length} transaksi ditampilkan</span>
      </div>

      {/* Transaction Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-600 text-xs uppercase font-semibold border-b border-gray-100">
              <tr>
                <th className="py-3 px-4">Waktu</th>
                <th className="py-3 px-4">Mahasiswa</th>
                <th className="py-3 px-4">Grup / Kelas</th>
                <th className="py-3 px-4">Tipe & Catatan</th>
                <th className="py-3 px-4">Nominal</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {transactions.map((t) => {
                const isPositive = t.jumlah > 0;
                const canReverse = t.status === "berhasil" && t.tipe !== "reversal";

                return (
                  <tr key={t.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4 text-xs text-gray-500 whitespace-nowrap">
                      {new Date(t.created_at).toLocaleString("id-ID")}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-gray-900">{t.nama_mahasiswa}</div>
                      <div className="text-xs text-gray-400 font-mono">{t.nim}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-xs font-semibold text-gray-800">{t.nama_grup}</div>
                      <div className="text-[11px] text-gray-400">Kelas {t.nama_kelas}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                        {t.tipe === "topup_qris"
                          ? "QRIS"
                          : t.tipe === "manual_add"
                          ? "Manual Tunai"
                          : "Koreksi Pembalik"}
                      </span>
                      {t.catatan && (
                        <div className="text-xs text-gray-500 italic mt-0.5">{t.catatan}</div>
                      )}
                    </td>
                    <td
                      className={`py-3 px-4 font-bold text-sm whitespace-nowrap ${
                        isPositive ? "text-emerald-600" : "text-red-600"
                      }`}
                    >
                      {isPositive ? "+" : ""}Rp{t.jumlah.toLocaleString("id-ID")}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                          t.status === "berhasil"
                            ? "bg-emerald-50 text-emerald-700"
                            : t.status === "pending"
                            ? "bg-amber-50 text-amber-700"
                            : "bg-red-50 text-red-700"
                        }`}
                      >
                        {t.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {canReverse ? (
                        <button
                          onClick={() => {
                            setSelectedTrx(t);
                            setAlasanKoreksi("");
                          }}
                          className="px-2.5 py-1 text-xs border border-red-200 hover:bg-red-50 text-red-600 font-semibold rounded-lg transition-colors inline-flex items-center gap-1"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          Koreksi
                        </button>
                      ) : (
                        <span className="text-xs text-gray-300">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Koreksi Saldo (M10 Reversal) */}
      {selectedTrx && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-red-600" />
                Koreksi Saldo (Transaksi Pembalik)
              </h3>
              <button
                onClick={() => setSelectedTrx(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 space-y-1">
              <div>
                Mahasiswa: <span className="font-bold">{selectedTrx.nama_mahasiswa}</span> (
                {selectedTrx.nim})
              </div>
              <div>
                Nominal transaksi asal:{" "}
                <span className="font-bold">Rp{selectedTrx.jumlah.toLocaleString("id-ID")}</span>
              </div>
              <p className="pt-1 text-[11px] text-red-600">
                Sistem akan membuat transaksi baru bernilai negatif (-Rp
                {selectedTrx.jumlah.toLocaleString("id-ID")}) tanpa menghapus catatan asal.
              </p>
            </div>

            <form onSubmit={handleKoreksi} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Alasan Koreksi (Wajib Diisi)
                </label>
                <textarea
                  required
                  rows={3}
                  value={alasanKoreksi}
                  onChange={(e) => setAlasanKoreksi(e.target.value)}
                  placeholder="Contoh: Salah input nominal setoran tunai / pembatalan setoran"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedTrx(null)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingKoreksi}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold transition-all disabled:opacity-50"
                >
                  {submittingKoreksi ? "Menyimpan..." : "Buat Transaksi Pembalik"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
