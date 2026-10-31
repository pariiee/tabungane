"use client";

import { useEffect, useState } from "react";
import { formatRupiah, formatDateTime } from "@/lib/format";
import {
  Banknote,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  Search,
  RefreshCw,
  AlertCircle,
  ShieldCheck,
  Building,
  User,
  CreditCard
} from "lucide-react";

export default function PenarikanPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");

  // Modal approve/reject
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [actionType, setActionType] = useState<"setujui" | "tolak">("setujui");
  const [catatanAdmin, setCatatanAdmin] = useState("");
  const [buktiTransferUrl, setBuktiTransferUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadData = () => {
    setLoading(true);
    fetch(`/api/admin/penarikan?status=${statusFilter}`)
      .then((res) => res.json())
      .then((d) => {
        setData(d.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const handleAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;
    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/admin/penarikan", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedItem.id,
          tindakan: actionType,
          catatan_admin: catatanAdmin,
          bukti_transfer_url: buktiTransferUrl || null,
        }),
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "Gagal memproses penarikan");

      setSuccess(resData.message || "Berhasil memproses permintaan");
      setSelectedItem(null);
      setCatatanAdmin("");
      setBuktiTransferUrl("");
      loadData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredData = data.filter((item) => {
    const q = search.toLowerCase();
    return (
      item.nama_mahasiswa?.toLowerCase().includes(q) ||
      item.nomor_id?.toLowerCase().includes(q) ||
      item.nomor_tujuan?.toLowerCase().includes(q) ||
      item.metode?.toLowerCase().includes(q) ||
      item.nama_penerima?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-zinc-100 flex items-center gap-2">
            <Banknote className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            Persetujuan Penarikan Saldo
          </h1>
          <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">
            Validasi & eksekusi pencairan saldo dari dompet mahasiswa ke rekening bank / e-wallet.
          </p>
        </div>
        <button
          onClick={loadData}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3 py-1.5 border border-gray-200 dark:border-zinc-800 rounded-lg text-xs font-medium hover:bg-gray-50 dark:hover:bg-zinc-900 transition-colors cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Segarkan
        </button>
      </div>

      {success && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          {success}
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-zinc-900 p-3 rounded-xl border border-gray-200 dark:border-zinc-800">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari mahasiswa, NIM, rekening..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 pl-9 pr-3 rounded-lg border border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-950 text-xs focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: "all", label: "Semua" },
            { id: "pending", label: "Menunggu Approval" },
            { id: "disetujui", label: "Disetujui" },
            { id: "ditolak", label: "Ditolak" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                statusFilter === tab.id
                  ? "bg-black text-white dark:bg-white dark:text-black"
                  : "text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 dark:bg-zinc-950 border-b border-gray-200 dark:border-zinc-800 text-[11px] font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Waktu</th>
                <th className="py-3 px-4">Mahasiswa</th>
                <th className="py-3 px-4">Rekening Tujuan</th>
                <th className="py-3 px-4">Nominal</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-zinc-800/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2" />
                    Memuat permohonan penarikan...
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400">
                    Tidak ada permohonan penarikan saldo.
                  </td>
                </tr>
              ) : (
                filteredData.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                    <td className="py-3.5 px-4 text-gray-500 whitespace-nowrap">
                      {formatDateTime(item.created_at)}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-gray-900 dark:text-zinc-100">
                        {item.nama_mahasiswa}
                      </div>
                      <div className="text-[11px] text-gray-400 font-mono">
                        {item.nomor_id} &bull; {item.nama_kelas || "-"}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-gray-800 dark:text-zinc-200 flex items-center gap-1.5 uppercase">
                        <CreditCard className="w-3.5 h-3.5 text-gray-400" />
                        {item.metode} - <span className="font-mono">{item.nomor_tujuan}</span>
                      </div>
                      <div className="text-[11px] text-gray-500">
                        a.n {item.nama_penerima}
                        {item.catatan && <span className="italic text-gray-400"> &bull; "{item.catatan}"</span>}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-gray-900 dark:text-zinc-100 whitespace-nowrap">
                      {formatRupiah(item.jumlah)}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {item.status === "pending" && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                          <Clock className="w-3 h-3" /> Menunggu
                        </span>
                      )}
                      {item.status === "disetujui" && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                          <CheckCircle2 className="w-3 h-3" /> Disetujui
                        </span>
                      )}
                      {item.status === "ditolak" && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
                          <XCircle className="w-3 h-3" /> Ditolak
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      {item.status === "pending" ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedItem(item);
                              setActionType("setujui");
                              setCatatanAdmin("Telah ditransfer ke rekening mahasiswa");
                              setError("");
                            }}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg text-xs cursor-pointer transition-colors"
                          >
                            Setujui
                          </button>
                          <button
                            onClick={() => {
                              setSelectedItem(item);
                              setActionType("tolak");
                              setCatatanAdmin("Data rekening tidak valid");
                              setError("");
                            }}
                            className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white font-medium rounded-lg text-xs cursor-pointer transition-colors"
                          >
                            Tolak
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-gray-400">
                          Oleh {item.diproses_oleh || "Sistem"}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Approve / Reject */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-xl animate-in fade-in zoom-in-95">
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-zinc-100 flex items-center gap-2">
                {actionType === "setujui" ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    Setujui & Transfer Penarikan
                  </>
                ) : (
                  <>
                    <XCircle className="w-5 h-5 text-rose-600" />
                    Tolak Pengajuan Penarikan
                  </>
                )}
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                {actionType === "setujui"
                  ? "Pastikan Anda sudah mentransfer dana ke rekening yang bersangkutan."
                  : "Dana yang sebelumnya ditahan akan otomatis dikembalikan ke saldo dompet mahasiswa."}
              </p>
            </div>

            <div className="p-3 bg-gray-50 dark:bg-zinc-950 rounded-xl space-y-1.5 text-xs border border-gray-100 dark:border-zinc-800">
              <div className="flex justify-between">
                <span className="text-gray-400">Mahasiswa:</span>
                <span className="font-semibold text-gray-800 dark:text-zinc-200">{selectedItem.nama_mahasiswa} ({selectedItem.nomor_id})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Jumlah:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatRupiah(selectedItem.jumlah)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Metode / Bank:</span>
                <span className="font-semibold text-gray-800 dark:text-zinc-200 uppercase">{selectedItem.metode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">No. Rekening / E-Wallet:</span>
                <span className="font-mono font-bold text-gray-900 dark:text-zinc-100">{selectedItem.nomor_tujuan}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Nama Penerima:</span>
                <span className="text-gray-700 dark:text-zinc-300 font-medium">{selectedItem.nama_penerima}</span>
              </div>
              {selectedItem.catatan && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Keperluan:</span>
                  <span className="text-gray-700 dark:text-zinc-300 italic">{selectedItem.catatan}</span>
                </div>
              )}
            </div>

            {error && (
              <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-600 text-xs rounded-lg flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={handleAction} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
                  Catatan {actionType === "setujui" ? "Penyelesaian" : "Penolakan"}
                </label>
                <input
                  type="text"
                  required
                  value={catatanAdmin}
                  onChange={(e) => setCatatanAdmin(e.target.value)}
                  placeholder="Contoh: Telah ditransfer via BCA..."
                  className="w-full h-9 px-3 rounded-lg border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
                />
              </div>

              {actionType === "setujui" && (
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
                    Link Bukti Transfer (Opsional)
                  </label>
                  <input
                    type="url"
                    value={buktiTransferUrl}
                    onChange={(e) => setBuktiTransferUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full h-9 px-3 rounded-lg border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedItem(null)}
                  disabled={submitting}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-zinc-800 text-xs font-medium hover:bg-gray-50 dark:hover:bg-zinc-800 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={`px-4 py-1.5 rounded-lg text-white font-semibold text-xs cursor-pointer transition-colors ${
                    actionType === "setujui"
                      ? "bg-emerald-600 hover:bg-emerald-700"
                      : "bg-rose-600 hover:bg-rose-700"
                  }`}
                >
                  {submitting ? "Memproses..." : actionType === "setujui" ? "Konfirmasi Selesai" : "Tolak & Refund Saldo"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
