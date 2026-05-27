import type { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { publishToInstagram } from '@/lib/meta'
import type { InstagramContent } from '@/types'

export async function POST(request: NextRequest) {
  const { lectureId } = await request.json()
  if (!lectureId) return Response.json({ error: 'lectureId 필요' }, { status: 400 })

  const { data: lecture, error: lectureErr } = await supabaseAdmin
    .from('lectures')
    .select('*, media:lecture_media(*), content:generated_content(*)')
    .eq('id', lectureId)
    .single()

  if (lectureErr) return Response.json({ error: lectureErr.message }, { status: 404 })

  const igContent = (lecture.content as { platform: string; content: InstagramContent }[])
    .find(c => c.platform === 'instagram')?.content

  if (!igContent) return Response.json({ error: '인스타그램 콘텐츠가 없습니다. 먼저 생성해주세요.' }, { status: 400 })

  const imageUrls: string[] = (lecture.media as { file_type: string; public_url: string }[])
    .filter(m => m.file_type === 'image' && m.public_url)
    .map(m => m.public_url)

  if (imageUrls.length === 0) return Response.json({ error: '인스타그램 게시에는 이미지가 필요합니다' }, { status: 400 })

  const fullCaption = `${igContent.caption}\n\n${igContent.hashtags.map(h => `#${h.replace(/^#/, '')}`).join(' ')}`

  try {
    const postId = await publishToInstagram(imageUrls, fullCaption)

    await supabaseAdmin
      .from('generated_content')
      .update({ status: 'published', published_at: new Date().toISOString(), platform_post_id: postId })
      .eq('lecture_id', lectureId)
      .eq('platform', 'instagram')

    return Response.json({ ok: true, postId })
  } catch (err) {
    const message = err instanceof Error ? err.message : '알 수 없는 오류'
    await supabaseAdmin
      .from('generated_content')
      .update({ status: 'failed', error_message: message })
      .eq('lecture_id', lectureId)
      .eq('platform', 'instagram')
    return Response.json({ error: message }, { status: 500 })
  }
}
