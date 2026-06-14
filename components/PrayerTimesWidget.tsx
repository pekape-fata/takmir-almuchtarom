'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

const WAKTU = [
  { label: 'Subuh', key: 'Fajr' },
  { label: 'Dzuhur', key: 'Dhuhr' },
  { label: 'Ashar', key: 'Asr' },
  { label: 'Maghrib', key: 'Maghrib' },
  { label: 'Isya', key: 'Isha' },
]

export function PrayerTimesWidget() {
  const [timings, setTimings] = useState<Record<string, string> | null>(null)
  const [city, setCity] = useState<string>('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolokasi tidak didukung browser ini')
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords
          const res = await fetch(
            `https://api.aladhan.com/v1/timings?latitude=${latitude}&longitude=${longitude}&method=20`
          )
          const data = await res.json()
          setTimings(data.data.timings)

          // ambil nama kota dari reverse geocoding (opsional, best-effort)
          try {
            const geo = await fetch(
              `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=id`
            )
            const geoData = await geo.json()
            setCity(geoData.city || geoData.locality || '')
          } catch {
            /* abaikan jika gagal */
          }
        } catch {
          setError('Gagal memuat jadwal sholat')
        }
      },
      () => setError('Aktifkan izin lokasi untuk menampilkan jadwal sholat')
    )
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-800 text-white p-6 shadow-lg"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-lg">Jadwal Sholat {city && `· ${city}`}</h3>
        <span className="text-xs text-emerald-200">
          {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </span>
      </div>

      {error && <p className="text-sm text-emerald-100">{error}</p>}

      {!timings && !error && (
        <div className="grid grid-cols-5 gap-2">
          {WAKTU.map((w) => (
            <div key={w.key} className="bg-white/10 rounded-xl p-3 text-center animate-pulse">
              <div className="h-3 w-10 mx-auto bg-white/20 rounded mb-2" />
              <div className="h-4 w-12 mx-auto bg-white/20 rounded" />
            </div>
          ))}
        </div>
      )}

      {timings && (
        <div className="grid grid-cols-5 gap-2">
          {WAKTU.map((w, i) => (
            <motion.div
              key={w.key}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.06 }}
              className="bg-white/10 rounded-xl p-3 text-center"
            >
              <p className="text-xs text-emerald-100">{w.label}</p>
              <p className="text-lg font-bold mt-1">{timings[w.key]}</p>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  )
}
