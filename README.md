# TABUNGANE SISFOR

Platform Web Tabungan Bersama Mahasiswa & Kas Kelas berbasis QRIS (qriskuu) dan Transparansi Leaderboard Progres.

## 🚀 Fitur MVP Selesai (PRD v0.1)

- **M1 - Autentikasi & Keamanan:** Login NIM + Password, wajib ganti password di login pertama, hash password via `node:crypto` scrypt + timing-safe equal.
- **M2 - Kelola Kelas & Mahasiswa:** CRUD Kelas, Tambah Mahasiswa, Impor data mahasiswa via CSV (`nim,nama,kelas`), Reset password mahasiswa dengan password sementara acak.
- **M3 - Grup Tabungan:** Buat grup tabungan per kelas (target nominal + deadline), otomatis mendaftarkan seluruh mahasiswa aktif di kelas tersebut.
- **M4 - Tambah Saldo Manual (Setoran Tunai):** Input setoran tunai mahasiswa oleh Admin dengan catatan wajib.
- **M5 - Top Up QRIS (qriskuu API):** Nominal Rp1.000 - Rp1.000.000, hitung mundur 5 menit, live polling status per 3 detik ke server lokal, dev mode simulator.
- **M6 - Dashboard Mahasiswa:** Ringkasan saldo per grup, bar progres, total dana kelas terkumpul, sisa waktu deadline.
- **M7 - Leaderboard Grup:** Ranking berdasarkan persentase target. **Perlindungan privasi:** Nominal saldo mahasiswa lain disembunyikan di server dan klien, hanya persen yang terlihat publik.
- **M8 - Riwayat Transaksi:** Riwayat mutasi mahasiswa & tabel lengkap transaksi admin dengan filter kelas/grup/status.
- **M9 - Dashboard Super Admin:** KPI cards (Total Terkumpul, Top Up Hari Ini, Pending, Total Mahasiswa), grafik aktivitas 14 hari (native SVG chart), transaksi terbaru.
- **M10 - Koreksi Saldo (Append-Only Ledger):** Transaksi pembalik (reversal) bernilai negatif menaut ke transaksi asal dengan alasan wajib. Data asal tidak pernah diubah.
- **M11 - Audit Log:** Jejak rekaman aksi admin (waktu, admin, aksi, target, detail).
- **M12 - Ekspor Laporan:** Download rekapitulasi data tabungan mahasiswa format CSV per grup.

---

## 💻 Akun Demo Siap Pakai

1. **Super Admin:**
   - **NIM / Username:** `admin`
   - **Password:** `admin123`
2. **Mahasiswa Sampel:**
   - **NIM:** `240101`
   - **Password:** `password123` (akan diminta ganti password di login pertama sesuai aturan PRD)

---

## 🛠️ Cara Menjalankan

```bash
# Masuk ke direktori
cd "C:\Users\gabut\Documents\BELAJAR CODING\tabungane SIsfor"

# Jalankan mode development
npm run dev
```

Buka browser di: `http://localhost:3000`

---

## 🧪 Self-Check Unit Test

```bash
node test_ledger.js
```
