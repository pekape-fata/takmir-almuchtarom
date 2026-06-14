import { NextResponse } from 'next/server'

const KATEGORI_CONTEXT: Record<string, string> = {
  agama: 'masalah keagamaan (fiqih, akidah, ibadah) menurut perspektif Islam Ahlusunnah wal Jamaah',
  keluarga: 'masalah rumah tangga, pernikahan, dan parenting dengan landasan nilai keislaman',
  pendidikan: 'masalah pendidikan anak, sekolah, dan pengembangan diri',
  ekonomi: 'masalah ekonomi, keuangan keluarga, dan muamalah sesuai syariat',
  sosial: 'masalah hubungan sosial dan kemasyarakatan dengan landasan akhlak Islam',
}

export async function POST(req: Request) {
  try {
    const { pertanyaan, kategori } = await req.json()

    if (!pertanyaan || !kategori) {
      return NextResponse.json({ error: 'pertanyaan dan kategori wajib diisi' }, { status: 400 })
    }

    const context = KATEGORI_CONTEXT[kategori] ?? 'masalah umum'

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 800,
        messages: [
          {
            role: 'user',
            content: `Kamu membantu menyusun DRAFT jawaban untuk ustadz/narasumber Takmir Langgar Waqaf Al Muchtarom. Draft ini WAJIB direview dan diverifikasi sebelum dipublikasikan, jadi tulis dengan hati-hati, santun, dan rujuk dalil/sumber secara umum jika relevan, tanpa klaim berlebihan.

Kategori: ${kategori} (${context})
Pertanyaan jamaah: "${pertanyaan}"

Tulis draft jawaban dalam Bahasa Indonesia, singkat (maks 200 kata), nada santun dan menenangkan, dan akhiri dengan catatan bahwa jawaban ini masih draft yang akan diverifikasi ustadz.`,
          },
        ],
      }),
    })

    if (!response.ok) {
      const errText = await response.text()
      return NextResponse.json({ error: 'AI service error', detail: errText }, { status: 502 })
    }

    const data = await response.json()
    const draft = data.content?.find((c: any) => c.type === 'text')?.text ?? ''

    return NextResponse.json({ draft })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
