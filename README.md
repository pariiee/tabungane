# SAKUNE SISFOR

> Ekosistem Finansial & Kas Mahasiswa Kampus — Fakultas Ilmu Komputer, Prodi Sistem Informasi.

Platform web dompet digital mahasiswa, sub-wallet serbaguna (*Kantong Sakune*), tabungan bersama per kelas, transfer antar-mahasiswa, dan automasi mutasi QRIS real-time yang transparan, aman, dan tanpa celah kebocoran data.

---

## 🏛️ Arsitektur & Fitur Utama

### 1. 4-Tier Hierarchical RBAC & Granular Permissions
- **Super Admin:** Akses penuh universitas, audit log, konfigurasi gateway, dan manajemen admin.
- **Dekan (Fakultas):** Memantau seluruh prodi, kelas, dan event di bawah fakultasnya.
- **Kaprodi (Program Studi):** Mengelola struktur kelas, event prodi, dan agregat tabungan mahasiswa prodi.
- **Admin Kelas (Bendahara):** Mengawasi mutasi tunai dan setoran mahasiswa khusus kelasnya sendiri.
- **Granular Custom Permissions:** Toggle izin per-user tersimpan dalam JSON (`users.custom_permissions`) dengan historical changelog audit logging.

### 2. Immutable Ledger & Finansial Safety
- **Append-Only Ledger:** Saldo dihitung dari akumulasi riwayat transaksi (`ledger.ts`), data transaksi tidak pernah di-update atau di-delete.
- **Koreksi Pembalik (Reversal):** Kesalahan input diselesaikan lewat transaksi pembalik bertanda minus yang menautkan `reversal_of_id`.
- **Zero Data Leakage:** Leaderboard dan rekap publik hanya menyajikan persentase capaian; nominal saldo mahasiswa lain disensor total dari payload API.

### 3. Kantong Sakune (Sub-Wallets) & P2P Transfer
- **Sub-Kantong Mahasiswa:** Alokasi saldo fleksibel (Dana Kas, Event Kampus, Tabungan Pribadi, Kebutuhan Praktikum).
- **Transfer P2P Internal:** Kirim saldo antar-mahasiswa dengan live search instan berbasis Nomor ID/NIM/Nama.
- **Pengajuan Penarikan (Disbursement Queue):** Validasi pencairan dana mahasiswa ke rekening bank/e-wallet dengan persetujuan bertingkat.

### 4. Gateway Pembayaran QRIS (QRISku API)
- **Invoice QRIS Dinamis:** Generasi kode QR per transaksi, hitung mundur kedaluwarsa 5 menit, dan webhook idempotensi anti-duplikasi.
- **Brutalist Invoice View:** Layout 2-kolom responsif, countdown timer waktu tersisa, tombol cek status instan, dan tautan bagikan via WhatsApp.
- **Paid State & Auto-Redirect:** Tampilan bukti transaksi sukses minimalis dengan timer redirect otomatis 5 detik kembali ke Dashboard.
- **Safe Polling (15s):** Polling berkala 15 detik untuk mencegah rate limit dan pemblokiran gateway.

### 5. Desain Brutalist Monokrom & Swiss Scroll Choreography
- **Editorial Bento Grid Landing Page:** Visual minimalis monokrom (#0e0f12), barcode identitas, hologram virtual card, dan animasi scroll Swiss (`.tick`, `data-draw-rule`, `data-reveal`).
- **Sharp Brutalist Login:** Kartu sign-in 0px border radius, corner ticks teknikal, input nomor identitas & sandi dengan icon Lucide (tanpa emoji, tanpa dependensi pihak ketiga).
- **Universal Error Overlay:** Halaman status HTTP (404, 500, dynamic error) tampil *full-page standalone* menutupi seluruh shell aplikasi.
- **Dynamic Open Graph & Favicon:** Preview tautan media sosial 1200x630 via `next/og` (`/opengraph-image`) dan favicon kanonikal `icon.svg`.

---

## 💻 Akun Demo Siap Pakai

| Role | Username / Nomor ID | Password | Cakupan Akses |
|---|---|---|---|
| **Super Admin** | `admin` | `admin123` | Seluruh Sistem |
| **Admin Kelas** | `admin_if1` | `password123` | Khusus Kelas Terkait |
| **Mahasiswa** | `240101` | `password123` | Dompet Mahasiswa |

*(Akun mahasiswa baru diwajibkan memperbarui kata sandi saat pertama kali masuk)*

---

## 🛠️ Menjalankan Proyek

```bash
# Clone repository
git clone https://github.com/pariiee/tabungane.git
cd tabungane

# Install dependencies
npm install

# Setup database & seed
npm run build

# Menjalankan development server
npm run dev
```

Aplikasi dapat diakses melalui browser di `http://localhost:3000`.

---

## 🧪 Validasi & Pengujian

Verifikasi integritas ledger, enkripsi password, dan idempotensi webhook:
```bash
node test_ledger.js
```
