/**
 * Shared formatter for human-friendly transaction types, statuses, and audit actions.
 * Prevents leaking raw internal DB keys (e.g. "manual_add", "topup_qris", "reversal") to the UI.
 */

export function formatTrxType(type?: string): string {
  if (!type) return "-";
  const map: Record<string, string> = {
    topup_qris: "Top Up QRIS",
    manual_add: "Setor Tunai",
    setoran_tunai: "Setor Tunai",
    transfer_masuk: "Transfer Masuk",
    transfer_keluar: "Transfer Keluar",
    alokasi_masuk: "Dana Masuk",
    alokasi_keluar: "Alokasi Event",
    reversal: "Koreksi Pembalik",
  };
  if (map[type]) return map[type];
  return type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function formatTrxStatus(status?: string): string {
  if (!status) return "-";
  const s = status.toLowerCase();
  const map: Record<string, string> = {
    berhasil: "Berhasil",
    paid: "Berhasil",
    pending: "Menunggu Pembayaran",
    expired: "Kedaluwarsa",
    canceled: "Dibatalkan",
    cancelled: "Dibatalkan",
    failed: "Gagal",
  };
  if (map[s]) return map[s];
  return status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function formatAuditAction(action?: string): string {
  if (!action) return "-";
  const map: Record<string, string> = {
    credit_payment_rejected: "Pembayaran Ditolak",
    nominal_mismatch: "Nominal Beda",
    webhook_missing_trxid: "Webhook Invalid",
    KOREKSI_SALDO: "Koreksi Saldo",
    MANUAL_ADD_SALDO: "Setor Tunai Manual",
    TAMBAH_MAHASISWA: "Tambah Mahasiswa",
    TAMBAH_KELAS: "Tambah Kelas",
    HAPUS_KELAS: "Hapus Kelas",
    BUAT_EVENT: "Buat Event",
    RESET_PASSWORD: "Reset Password",
    IMPORT_CSV_MAHASISWA: "Impor CSV",
  };
  if (map[action]) return map[action];
  return action.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDateTime(isoString?: string): string {
  if (!isoString) return "-";
  try {
    const d = new Date(isoString);
    return new Intl.DateTimeFormat("id-ID", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(d);
  } catch {
    return isoString;
  }
}
