import type { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { generateLectureContent } from '@/lib/anthropic'

export async function POST(request: NextRequest) {
  const { lectureId } = await request.json()
  if (!lectureId) return Response.json({ error: 'lectureId 필요' }, { status: 400 })

  // Fetch lecture + media
  const { data: lecture, error: lectureErr } = await supabaseAdmin
    .from('lectures')
    .select('*, media:lecture_media(*)')
    .eq('id', lectureId)
    .single()

  if (lectureErr) return Response.json({ error: lectureErr.message }, { status: 404 })

  const imageUrls: string[] = (lecture.media as { file_type: string; public_url: string }[])
    .filter(m => m.file_type === 'image' && m.public_url)
    .map(m => m.public_url)

  const generated = await generateLectureContent({
    topic: lecture.topic,
    lectureDate: lecture.lecture_date,
    atmosphere: lecture.atmosphere || '',
    imageUrls,
  })

  const platforms = ['blog', 'instagram', 'facebook', 'youtube'] as const
  const inserts = platforms.map(platform => ({
    lecture_id: lectureId,
    platform,
    content: generated[platform],
    status: 'draft',
  }))

  const { error: insertErr } = await supabaseAdmin
    .from('generated_content')
    .upsert(inserts, { onConflict: 'lecture_id,platform' })

  if (insertErr) return Response.json({ error: insertErr.message }, { status: 500 })

  return Response.json({ generated })
}
