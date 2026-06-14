// Contoh penerapan di app/dashboard/pengurus/page.tsx
// Tambahkan className="no-print" pada tombol-tombol yang tidak perlu ikut tercetak

// SEBELUM:
// <div className="flex items-center gap-3">
//   <button onClick={handlePrint} className="...">
//     <Printer size={16} /> Cetak
//   </button>
//   <button onClick={handleTambah} className="...">
//     Tambah Pengurus
//   </button>
// </div>

// SESUDAH (tambahkan no-print pada wrapper div atau masing-masing tombol):
//
// <div className="flex items-center gap-3 no-print">
//   <button onClick={handlePrint} className="...">
//     <Printer size={16} /> Cetak
//   </button>
//   <button onClick={handleTambah} className="text-gray-400 ...">
//     Tambah Pengurus
//   </button>
// </div>
//
// Cukup tambahkan `no-print` pada div pembungkus kedua tombol itu.
// CSS di globals-additions.css akan menyembunyikannya otomatis saat print.

// Fungsi cetak yang disarankan:
export function handlePrint() {
  window.print()
}

// Atau jika mau lebih kontrol, gunakan:
// import { useRef } from 'react'
// const printRef = useRef<HTMLDivElement>(null)
// const handlePrint = () => {
//   window.print()
// }
