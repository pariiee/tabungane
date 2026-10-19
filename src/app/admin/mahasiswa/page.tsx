"use client";

import { useEffect, useState } from "react";
import {
  Users,
  UserPlus,
  Upload,
  KeyRound,
  PlusCircle,
  AlertCircle,
  CheckCircle2,
  FileSpreadsheet,
  Wallet
} from "lucide-react";

export default function AdminMahasiswaPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [kelasList, setKelasList] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter
  const [filterKelas, setFilterKelas] = useState("");

  // Modal / Form Tambah Mahasiswa
  const [showAddModal, setShowAddModal] = useState(false);
  const [newNim, setNewNim] = useState("");
  const [newNama, setNewNama] = useState("");
  const [newKelasId, setNewKelasId] = useState("");

  // Modal Import CSV
  const [showCsvModal, setShowCsvModal] = useState(false);
  const [csvText, setCsvText] = useState("");

  // Modal Tambah Saldo Manual (M4 PRD)
  const [showSaldoModal, setShowSaldoModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [targetGrupId, setTargetGrupId] = useState("");
  const [nominalManual, setNominalManual] = useState("");
  const [catatanManual, setCatatanManual] = useState("");

  // Success / Temp Password Alert
  const [alertInfo, setAlertInfo] = useState<any>(null);
  const [error, setError] = useState("");

  const loadData = () => {
    fetch(`/api/admin/mahasiswa${filterKelas ? `?kelas_id=${filterKelas}` : ""}`)
      .then((res) => res.json())
      .then((d) => setStudents(d.data || []));

    fetch("/api/admin/kelas")
      .then((res) => res.json())
      .then((d) => setKelasList(d.data || []));

    fetch("/api/admin/grup")
      .then((res) => res.json())
      .then((d) => setGroups(d.data || []));

    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [filterKelas]);

  // Tambah Mahasiswa Manual
  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const res = await fetch("/api/admin/mahasiswa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nim: newNim, nama: newNama, kelas_id: newKelasId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menambah mahasiswa");

      setAlertInfo({
        title: "Mahasiswa Berhasil Ditambahkan",
        message: `NIM: ${data.nim} | Nama: ${data.nama}`,
        tempPassword: data.temp_password,
      });

      setShowAddModal(false);
      setNewNim("");
      setNewNama("");
      loadData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Import CSV
  const handleImportCsv = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const res = await fetch("/api/admin/mahasiswa/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csvText }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal impor CSV");

      setAlertInfo({
        title: "Impor CSV Selesai",
        message: `Berhasil memproses ${data.total} baris. (${data.created} akun baru dibuat). Password sementara bawaan: pwd123456`,
      });

      setShowCsvModal(false);
      setCsvText("");
      loadData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Reset Password
  const handleResetPassword = async (student: any) => {
    if (!confirm(`Reset password untuk ${student.nama} (${student.nim})?`)) return;
    try {
      const res = await fetch("/api/admin/mahasiswa/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: student.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal reset password");

      setAlertInfo({
        title: "Password Berhasil Direset",
        message: `Password sementara untuk NIM ${data.nim} (${data.nama}):`,
        tempPassword: data.temp_password,
      });
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Tambah Saldo Manual (M4)
  const handleManualSaldo = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const res = await fetch("/api/admin/transaksi/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: selectedStudent.id,
          grup_id: targetGrupId,
          jumlah: parseInt(nominalManual, 10),
          catatan: catatanManual,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menambah saldo manual");

      setAlertInfo({
        title: "Setoran Saldo Berhasil Dicatat",
        message: `Nominal Rp${parseInt(nominalManual, 10).toLocaleString("id-ID")} berhasil ditambahkan ke ${selectedStudent.nama}`,
      });

      setShowSaldoModal(false);
      setNominalManual("");
      setCatatanManual("");
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-purple-600" />
            Kelola Mahasiswa
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Data mahasiswa per kelas, reset password, dan input setoran tunai manual.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold shadow-sm"
          >
            <UserPlus className="w-4 h-4" />
            Tambah Mahasiswa
          </button>
          <button
            onClick={() => setShowCsvModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 rounded-xl text-xs font-semibold shadow-sm"
          >
            <Upload className="w-4 h-4" />
            Impor CSV
          </button>
        </div>
      </div>

      {/* Info Alert (Password Sementara) */}
      {alertInfo && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-sm font-bold text-emerald-900">{alertInfo.title}</h4>
            <p className="text-xs text-emerald-700 mt-0.5">{alertInfo.message}</p>
            {alertInfo.tempPassword && (
              <div className="mt-2 p-2 bg-white rounded-lg border border-emerald-300 inline-block font-mono font-bold text-sm text-emerald-800">
                Password Sementara: {alertInfo.tempPassword}
              </div>
            )}
          </div>
          <button
            onClick={() => setAlertInfo(null)}
            className="text-xs text-emerald-700 hover:text-emerald-900 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-3">
        <label className="text-xs font-semibold text-gray-600">Filter Kelas:</label>
        <select
          value={filterKelas}
          onChange={(e) => setFilterKelas(e.target.value)}
          className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-purple-500 outline-none"
        >
          <option value="">Semua Kelas</option>
          {kelasList.map((k) => (
            <option key={k.id} value={k.id}>
              {k.nama} ({k.tahun_ajaran})
            </option>
          ))}
        </select>
        <span className="text-xs text-gray-400 ml-auto">{students.length} Mahasiswa ditemukan</span>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-600 text-xs uppercase font-semibold border-b border-gray-100">
              <tr>
                <th className="py-3 px-4">NIM</th>
                <th className="py-3 px-4">Nama Lengkap</th>
                <th className="py-3 px-4">Kelas</th>
                <th className="py-3 px-4">Status Password</th>
                <th className="py-3 px-4 text-right">Aksi Cepat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {students.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="py-3 px-4 font-mono font-bold text-gray-900">{s.nim}</td>
                  <td className="py-3 px-4 font-semibold text-gray-900">{s.nama}</td>
                  <td className="py-3 px-4 text-xs">
                    <span className="bg-gray-100 text-gray-700 font-medium px-2 py-0.5 rounded-full">
                      {s.nama_kelas || "Tanpa Kelas"}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-xs">
                    {s.must_change_password ? (
                      <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-medium">
                        Wajib Ganti Password
                      </span>
                    ) : (
                      <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-medium">
                        Aktif
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right space-x-1.5">
                    {/* Tambah Saldo Manual Button */}
                    <button
                      onClick={() => {
                        setSelectedStudent(s);
                        if (groups.length > 0) setTargetGrupId(groups[0].id);
                        setShowSaldoModal(true);
                      }}
                      className="px-2.5 py-1 text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold rounded-lg transition-colors inline-flex items-center gap-1"
                      title="Setor Saldo Tunai"
                    >
                      <Wallet className="w-3.5 h-3.5" />
                      Setor Tunai
                    </button>
                    {/* Reset Password Button */}
                    <button
                      onClick={() => handleResetPassword(s)}
                      className="px-2.5 py-1 text-xs border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold rounded-lg transition-colors inline-flex items-center gap-1"
                      title="Reset Password"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      Reset
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Tambah Mahasiswa */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="font-bold text-gray-900 text-base">Tambah Mahasiswa Baru</h3>
            <form onSubmit={handleAddStudent} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">NIM</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: 240102"
                  value={newNim}
                  onChange={(e) => setNewNim(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Nama Mahasiswa</label>
                <input
                  type="text"
                  required
                  placeholder="Nama Lengkap"
                  value={newNama}
                  onChange={(e) => setNewNama(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Pilih Kelas</label>
                <select
                  required
                  value={newKelasId}
                  onChange={(e) => setNewKelasId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                >
                  <option value="">-- Pilih Kelas --</option>
                  {kelasList.map((k) => (
                    <option key={k.id} value={k.id}>
                      {k.nama} ({k.tahun_ajaran})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold"
                >
                  Simpan Mahasiswa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Import CSV */}
      {showCsvModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4">
            <div>
              <h3 className="font-bold text-gray-900 text-base">Impor Data Mahasiswa via CSV</h3>
              <p className="text-xs text-gray-500 mt-1">
                Format kolom per baris: <code className="bg-gray-100 px-1 py-0.5 rounded font-mono">NIM,Nama Mahasiswa,Nama Kelas</code>
              </p>
            </div>

            <form onSubmit={handleImportCsv} className="space-y-3">
              <div>
                <textarea
                  rows={8}
                  required
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                  placeholder={`nim,nama,kelas\n240103,Ahmad Fauzi,3A\n240104,Siti Nurhaliza,3A\n240105,Rian Pratama,3B`}
                  className="w-full p-3 font-mono text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCsvModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold"
                >
                  Mulai Impor CSV
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Tambah Saldo Manual (M4) */}
      {showSaldoModal && selectedStudent && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div>
              <h3 className="font-bold text-gray-900 text-base">Tambah Saldo Manual (Setoran Tunai)</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Untuk mahasiswa: <span className="font-semibold text-gray-800">{selectedStudent.nama}</span> ({selectedStudent.nim})
              </p>
            </div>

            <form onSubmit={handleManualSaldo} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Grup Tabungan</label>
                <select
                  required
                  value={targetGrupId}
                  onChange={(e) => setTargetGrupId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.nama} ({g.nama_kelas})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Nominal (Rp)</label>
                <input
                  type="number"
                  min={1000}
                  step={1000}
                  required
                  placeholder="Contoh: 50000"
                  value={nominalManual}
                  onChange={(e) => setNominalManual(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Catatan Wajib (PRD M4: misalnya "setor tunai ke bendahara, 19 Okt")
                </label>
                <input
                  type="text"
                  required
                  placeholder="Setor tunai ke bendahara kelas"
                  value={catatanManual}
                  onChange={(e) => setCatatanManual(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSaldoModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold"
                >
                  Simpan Setoran Tunai
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
