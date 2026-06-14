import { Wallet, CalendarDays, Users, MessageCircleQuestion } from 'lucide-react'
import { PrayerTimesWidget } from '@/components/PrayerTimesWidget'
import { StatCard } from '@/components/StatCard'
import { createServerSupabase } from '@/lib/supabase-server'
import Link from 'next/link'

export default async function HomePage() {
  const supabase = await createServerSupabase()

  const { data: keuangan } = await supabase.from('keuangan').select('jenis, jumlah')
  const saldo =
    (keuangan ?? []).reduce(
      (acc, k) => acc + (k.jenis === 'masuk' ? Number(k.jumlah) : -Number(k.jumlah)),
      0
    ) ?? 0

  const { count: jumlahKegiatan } = await supabase
    .from('kegiatan')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'akan datang')

  const { count: jumlahPengurus } = await supabase
    .from('pengurus')
    .select('*', { count: 'exact', head: true })

  const { count: jumlahKonsultasi } = await supabase
    .from('konsultasi')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'verified')

  const { data: kegiatanTerbaru } = await supabase
    .from('kegiatan')
    .select('*')
    .order('tanggal', { ascending: true })
    .limit(3)

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Hero */}
      <section className="text-center space-y-2 py-6">
        <h1 className="text-3xl sm:text-4xl font-bold text-emerald-700 dark:text-emerald-400">
          Assalamu&apos;alaikum Warahmatullahi Wabarakatuh
        </h1>
        <p className="text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
          Selamat datang di Dashboard Takmir Langgar Waqaf Al Muchtarom — informasi pengurus,
          keuangan, kegiatan, jadwal sholat, dan layanan konsultasi.
        </p>
      </section>

      {/* Jadwal Sholat */}
      <PrayerTimesWidget />

      {/* Statistik */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={<Wallet size={20} />}
          label="Saldo Kas"
          value={`Rp ${saldo.toLocaleString('id-ID')}`}
          color="emerald"
          delay={0}
        />
        <StatCard
          icon={<CalendarDays size={20} />}
          label="Kegiatan Mendatang"
          value={String(jumlahKegiatan ?? 0)}
          color="blue"
          delay={0.1}
        />
        <StatCard
          icon={<Users size={20} />}
          label="Pengurus Aktif"
          value={String(jumlahPengurus ?? 0)}
          color="purple"
          delay={0.2}
        />
        <StatCard
          icon={<MessageCircleQuestion size={20} />}
          label="Konsultasi Terjawab"
          value={String(jumlahKonsultasi ?? 0)}
          color="amber"
          delay={0.3}
        />
      </section>

      {/* Kegiatan Terbaru */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Kegiatan Terbaru</h2>
          <Link href="/dashboard/kegiatan" className="text-sm text-emerald-600 hover:underline">
            Lihat semua →
          </Link>
        </div>

        {kegiatanTerbaru && kegiatanTerbaru.length > 0 ? (
          <div className="grid md:grid-cols-3 gap-4">
            {kegiatanTerbaru.map((k) => (
              <div
                key={k.id}
                className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-sm hover:shadow-md transition-shadow"
              >
                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mb-1">
                  {new Date(k.tanggal).toLocaleDateString('id-ID', { dateStyle: 'full' })}
                </p>
                <h3 className="font-semibold text-lg">{k.judul}</h3>
                {k.deskripsi && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 line-clamp-2">{k.deskripsi}</p>
                )}
                {k.lokasi && <p className="text-xs text-gray-400 mt-2">📍 {k.lokasi}</p>}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">Belum ada kegiatan terjadwal.</p>
        )}
      </section>

      {/* CTA Menu */}
      <section className="grid sm:grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { href: '/dashboard/pengurus', label: 'Ketakmiran', icon: Users },
          { href: '/dashboard/keuangan', label: 'Keuangan', icon: Wallet },
          { href: '/dashboard/kegiatan', label: 'Kegiatan', icon: CalendarDays },
          { href: '/dashboard/jadwal-sholat', label: 'Jadwal Sholat', icon: CalendarDays },
          { href: '/dashboard/konsultasi', label: 'Konsultasi', icon: MessageCircleQuestion },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex flex-col items-center gap-2 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 text-center hover:border-emerald-400 hover:shadow-md transition-all"
          >
            <item.icon className="text-emerald-600 dark:text-emerald-400" size={24} />
            <span className="text-sm font-medium">{item.label}</span>
          </Link>
        ))}
      </section>
    </div>
  )
}
