# Daydream Money 💸✨

Aplikasi pencatat keuangan pribadi offline-first dengan antarmuka **Soft Glass Daydream**.

---

## Prasyarat

Pastikan perangkat sudah terpasang:
- **Node.js**: versi 18+ (disarankan Node 20+)
- **npm** atau **bun**
- **Expo Go** atau **Expo Dev Client** pada perangkat fisik (Android / iOS) atau emulator.

---

## Langkah Menjalankan

### 1. Install Dependensi

```bash
npm install
```

### 2. Jalankan Server Pengembangan

```bash
npx expo start
```

Pilihan shortcut di terminal:
- Tekan `a` untuk membuka di Emulator Android.
- Tekan `i` untuk membuka di Simulator iOS (khusus macOS).
- Tekan `w` untuk membuka di Web browser.
- Pindai QR code menggunakan aplikasi **Expo Go** pada Android atau kamera bawaan iOS.

---

## Menjalankan Pengujian (Unit Tests)

Uji unit untuk parser nominal (`35rb`, `1,5jt`, dll.) dan kalkulasi tanggal keuangan:

```bash
npm test
```

Pemeriksaan tipe TypeScript:

```bash
npx tsc --noEmit
```

Pemeriksaan kesehatan dependensi Expo:

```bash
npx expo-doctor
```

---

## Struktur Folder

```text
src/
├── app/                  # Expo Router (Layar, modal, navigasi)
│   ├── (onboarding)/     # Layar perkenalan pengguna baru
│   ├── (tabs)/           # 4 Tab utama (Beranda, Riwayat, Anggaran, Laporan)
│   ├── add-transaction   # Modal input transaksi + custom keypad
│   ├── transaction/[id]  # Detail & hapus transaksi
│   ├── wallets/          # Manajemen dompet & koreksi saldo
│   ├── categories/       # Manajemen kategori pengeluaran & pemasukan
│   ├── settings/         # Pengaturan, ekspor CSV, tanggal gajian
│   └── lock              # Layar PIN 6-digit & biometrik
├── components/
│   ├── glass/            # Komponen soft glass (Card, Button, Chip, Row, TopBar)
│   ├── forms/            # Keypad numerik, horizontal selector
│   └── charts/           # Visualisasi arus kas & segmen kategori
├── db/                   # SQLite schema, seed data, repositories
├── lib/                  # Parser nominal, format uang, ekspor CSV
├── store/                # Zustand state (wallet, tx, budget, settings)
└── theme/                # Design tokens, tipografi, warna, ikon
```

---

## Fitur Utama

- **Cepat**: Input nominal cerdas (`35rb` → Rp 35.000, `1,5jt` → Rp 1.500.000), ≤ 4 ketukan.
- **100% Offline**: Data tersimpan aman di SQLite lokal perangkat.
- **Visual Tenang**: Desain tembus pandang soft glass, angka tipis elegan, bayangan periwinkle.
- **Aman**: Kunci PIN 6-digit dan biometrik (Face ID / Fingerprint).
- **Ekspor Data**: Unduh riwayat transaksi ke format CSV kapan saja.
