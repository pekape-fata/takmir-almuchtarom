'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { PrayerTimesWidget } from '@/components/PrayerTimesWidget'

const WAKTU = [
  { label: 'Subuh', key: 'Fajr' },
  { label: 'Terbit', key: 'Sunrise' },
  { label: 'Dzuhur', key: 'Dhuhr' },
  { label: 'Ashar', key: 'Asr' },
  { label: 'Maghrib', key: 'Maghrib' },
  { label: 'Isya', key: 'Isha' },
]

export default function JadwalSholatPage() {
  const [monthly, setMonthly] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!navigator.geolocation) {
      setLoading(false)
      return
    }
    navigator.geolocation.getCurrentPosition(async (pos) => {
      try {
        const { latitude, longitude } = pos.coords
        const now = new Date()
        const res = await fetch(
          `https://api.aladhan.com/v1/calendar?latitude=${latitude}&longitude=${longitude}&method=20&month=${now.getMonth() + 1}&year=${now.getFullYear()}`
        )
        const json = await res.json()
        setMonthly(json.data)
      } catch {
        /* abaikan */
      } finally {
        setLoading(false)
      }
    }, () => setLoading(false))
  }, [])

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Jadwal Waktu Sholat</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Dihitung otomatis berdasarkan lokasi perangkat Anda (sumber: Aladhan API)
        </p>
      </div>

      <PrayerTimesWidget />

      <div>
        <h2 className="text-lg font-semibold mb-3">Jadwal Bulan Ini</h2>
        {loading ? (
          <p className="text-gray-500 text-sm">Memuat jadwal bulanan...</p>
        ) : monthly.length === 0 ? (
          <p className="text-gray-500 text-sm">Aktifkan izin lokasi untuk melihat jadwal bulanan.</p>
        ) : (
          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800 text-left text-gray-500">
                  <th className="px-3 py-2">Tanggal</th>
                  {WAKTU.map((w) => <th key={w.key} className="px-3 py-2">{w.label}</th>)}
                </tr>
              </thead>
              <tbody>
                {monthly.map((day, i) => (
                  <motion.tr
                    key={i}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.01 }}
                    className="border-b border-gray-100 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/40"
                  >
                    <td className="px-3 py-2 font-medium">{day.date.gregorian.day}/{day.date.gregorian.month.number}</td>
                    {WAKTU.map((w) => (
                      <td key={w.key} className="px-3 py-2 text-gray-500">{day.timings[w.key]?.split(' ')[0]}</td>
                    ))}
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
