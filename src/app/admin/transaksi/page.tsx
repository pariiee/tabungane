"use client";

import { useEffect, useState } from "react";
import { formatTrxType, formatTrxStatus } from "@/lib/format";
import CustomSelect from "@/components/CustomSelect";
import {
  ArrowRightLeft,
  RotateCcw,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  RefreshCw,
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-zinc-100 flex items-center gap-2">
            <ArrowRightLeft className="w-5 h-5 text-gray-700 dark:text-zinc-300" />
            <span>Kelola Transaksi & Ledger</span>
          </h1>
          <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5">
            Daftar seluruh mutasi dompet, QRIS, setoran tunai, dan transaksi pembalik koreksi.
          </p>
        </div>

        <div>
          <button
            onClick={loadData}
            className="h-9 px-3.5 rounded-lg border border-gray-200 dark:border-zinc-800 text-xs font-medium text-gray-600 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-900 transition-colors inline-flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs rounded-xl border border-rose-200/50 dark:border-rose-800/30 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-xs rounded-xl border border-emerald-200/50 dark:border-emerald-800/30 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white dark:bg-[#111113] p-4 rounded-xl border border-gray-100 dark:border-zinc-800/80 shadow-xs flex flex-wrap items-center gap-3 text-xs">
        <div className="flex items-center gap-1.5 font-medium text-gray-500 dark:text-zinc-400">
          <Filter className="w-3.5 h-3.5" />
          <span>Filter:</span>
        </div>

        <div className="w-36">
          <CustomSelect
            value={filterStatus}
            onChange={setFilterStatus}
            placeholder="Semua Status"
            options={[
              { value: "", label: "Semua Status" },
              { value: "berhasil", label: "Berhasil" },
              { value: "pending", label: "Pending" },
              { value: "expired", label: "Expired" },
              { value: "canceled", label: "Canceled" },
            ]}
          />
        </div>

        <div className="w-44">
          <CustomSelect
            value={filterGrup}
            onChange={setFilterGrup}
            placeholder="Semua Event"
            options={[
              { value: "", label: "Semua Event" },
              ...groups.map((g) => ({
                value: g.id,
                label: g.nama,
              })),
            ]}
          />
        </div>

        <div className="w-40">
          <CustomSelect
            value={filterKelas}
            onChange={setFilterKelas}
            placeholder="Semua Kelas"
            options={[
              { value: "", label: "Semua Kelas" },
              ...kelasList.map((k) => ({
                value: k.id,
                label: `Kelas ${k.nama}`,
              })),
            ]}
          />
        </div>

        <span className="text-gray-400 dark:text-zinc-500 ml-auto">{transactions.length} transaksi ditampilkan</span>
      </div>

      {/* Transaction Table */}
      <div className="bg-white dark:bg-[#111113] border border-gray-100 dark:border-zinc-800/80 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50/70 dark:bg-zinc-900/40 text-[11px] font-medium text-gray-400 dark:text-zinc-500 uppercase tracking-wider border-b border-gray-100 dark:border-zinc-800/60">
              <tr>
                <th className="py-3 px-4">Waktu</th>
                <th className="py-3 px-4">Mahasiswa</th>
                <th className="py-3 px-4">Grup / Alokasi</th>
                <th className="py-3 px-4">Tipe & Catatan</th>
                <th className="py-3 px-4">Nominal</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-zinc-800/50">
              {transactions.map((t) => {
                const isPositive = t.jumlah > 0;
                const canReverse = t.status === "berhasil" && t.tipe !== "reversal";

                return (
                  <tr key={t.id} className="hover:bg-gray-50/50 dark:hover:bg-zinc-900/30 transition-colors">
                    <td className="py-3.5 px-4 text-[11px] text-gray-500 dark:text-zinc-400 whitespace-nowrap">
                      {new Date(t.created_at).toLocaleString("id-ID")}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-gray-900 dark:text-zinc-100">{t.nama_mahasiswa}</div>
                      <div className="text-[11px] text-gray-400 dark:text-zinc-500 font-mono">{t.nim}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-xs font-medium text-gray-800 dark:text-zinc-200">{t.nama_grup || "Dompet Utama"}</div>
                      {t.nama_kelas && <div className="text-[10px] text-gray-400 dark:text-zinc-500">Kelas {t.nama_kelas}</div>}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300">
                        {formatTrxType(t.tipe)}
                      </span>
                      {t.catatan && (
                        <div className="text-[11px] text-gray-400 dark:text-zinc-500 italic mt-0.5 truncate max-w-xs">{t.catatan}</div>
                      )}
                    </td>
                    <td
                      className={`py-3.5 px-4 font-bold text-xs whitespace-nowrap ${
                        isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                      }`}
                    >
                      {isPositive ? "+" : ""}Rp {Math.abs(t.jumlah).toLocaleString("id-ID")}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${
                          t.status === "berhasil"
                            ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200/50 dark:border-emerald-800/30"
                            : t.status === "pending"
                            ? "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-200/50 dark:border-amber-800/30"
                            : "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-200/50 dark:border-rose-800/30"
                        }`}
                      >
                        {formatTrxStatus(t.status)}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {canReverse ? (
                        <button
                          onClick={() => {
                            setSelectedTrx(t);
                            setAlasanKoreksi("");
                          }}
                          className="px-2 py-1 text-[11px] border border-rose-200 dark:border-rose-900/50 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-medium rounded-lg transition-colors inline-flex items-center gap-1"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Koreksi</span>
                        </button>
                      ) : (
                        <span className="text-xs text-gray-300 dark:text-zinc-600">-</span>
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#111113] border border-gray-200 dark:border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-900 dark:text-zinc-100 text-sm flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                <span>Koreksi Saldo (Transaksi Pembalik)</span>
              </h3>
              <button
                onClick={() => setSelectedTrx(null)}
                className="text-gray-400 hover:text-black dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200/50 dark:border-rose-900/40 rounded-xl text-xs text-rose-800 dark:text-rose-300 space-y-1">
              <div>
                Mahasiswa: <span className="font-bold">{selectedTrx.nama_mahasiswa}</span> ({selectedTrx.nim})
              </div>
              <div>
                Nominal transaksi asal: <span className="font-bold">Rp {selectedTrx.jumlah.toLocaleString("id-ID")}</span>
              </div>
              <p className="pt-1 text-[11px] text-rose-600 dark:text-rose-400">
                Sistem akan membuat transaksi baru bernilai negatif (-Rp {selectedTrx.jumlah.toLocaleString("id-ID")}) tanpa menghapus catatan asal.
              </p>
            </div>

            <form onSubmit={handleKoreksi} className="space-y-3">
              <div>
                <label className="block text-[11px] font-medium text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-1">
                  Alasan Koreksi (Wajib Diisi)
                </label>
                <textarea
                  required
                  rows={3}
                  value={alasanKoreksi}
                  onChange={(e) => setAlasanKoreksi(e.target.value)}
                  placeholder="Contoh: Salah input nominal setoran tunai / pembatalan setoran"
                  className="w-full p-3 border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-lg text-xs text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedTrx(null)}
                  className="h-9 px-3.5 border border-gray-200 dark:border-zinc-800 rounded-lg text-xs font-medium text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-900"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingKoreksi}
                  className="h-9 px-4 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-medium shadow-xs transition-colors disabled:opacity-50"
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
