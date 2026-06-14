# Panduan Perbaikan: Dark Mode & Print

## 1. Perbaikan Dark Mode

### Masalah
Dark/light mode tidak berfungsi karena:
- `ThemeProvider` mungkin tidak pakai `attribute="class"` → next-themes tidak menambahkan class `dark` ke `<html>`
- `<html>` tidak punya `suppressHydrationWarning` → terjadi hydration mismatch
- `ThemeToggle` pakai `theme` bukan `resolvedTheme` → saat mode "system", `theme` bisa `undefined`

### Langkah Perbaikan

#### A. Ganti `components/ThemeProvider.tsx`
Salin isi file `components/ThemeProvider.tsx` dari folder ini.
- Pastikan ada `attribute="class"` dan `enableSystem`

#### B. Ganti `components/ThemeToggle.tsx`
Salin isi file `components/ThemeToggle.tsx` dari folder ini.
- Gunakan `resolvedTheme` (bukan `theme`) untuk deteksi mode aktif

#### C. Perbarui `app/layout.tsx`
Pastikan tag `<html>` punya `suppressHydrationWarning`:
```tsx
<html lang="id" suppressHydrationWarning>
```

#### D. Pastikan Tailwind CSS support dark mode
Cek `tailwind.config.ts` (atau `tailwind.config.js`):
```js
module.exports = {
  darkMode: 'class',   // ← WAJIB ada ini
  // ...
}
```

---

## 2. Perbaikan Cetak (Print)

### Masalah
Tombol "Cetak" dan "Tambah Pengurus" ikut tercetak saat mencetak halaman.

### Langkah Perbaikan

#### A. Tambahkan CSS print ke `app/globals.css`
Salin isi bagian `@media print` dari file `app/globals-additions.css` ke dalam `app/globals.css` Anda.

#### B. Tambahkan class `no-print` pada tombol aksi di halaman pengurus
Di file `app/dashboard/pengurus/page.tsx`, cari bagian yang menampilkan tombol Cetak dan Tambah Pengurus, lalu tambahkan `no-print`:

```tsx
{/* SEBELUM */}
<div className="flex items-center gap-3">
  <button onClick={() => window.print()}>Cetak</button>
  <button onClick={handleTambah}>Tambah Pengurus</button>
</div>

{/* SESUDAH */}
<div className="flex items-center gap-3 no-print">
  <button onClick={() => window.print()}>Cetak</button>
  <button onClick={handleTambah}>Tambah Pengurus</button>
</div>
```

Hanya perlu tambah `no-print` pada wrapper div — kedua tombol akan tersembunyi saat dicetak.

---

## Checklist

- [ ] `tailwind.config.ts` memiliki `darkMode: 'class'`
- [ ] `components/ThemeProvider.tsx` diperbarui (gunakan file dari folder ini)
- [ ] `components/ThemeToggle.tsx` diperbarui (gunakan file dari folder ini)
- [ ] `app/layout.tsx` punya `suppressHydrationWarning` di tag `<html>`
- [ ] CSS print ditambahkan ke `app/globals.css`
- [ ] Tombol Cetak & Tambah Pengurus punya class `no-print`
