import type { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { uploadYouTubeShorts } from '@/lib/youtube'
import type { YoutubeContent } from '@/types'

export async function POST(request: NextRequest) {
  const { lectureId } = await request.json()
  if (!lectureId) return Response.json({ error: 'lectureId 필요' }, { status: 400 })

  const { data: lecture, error: lectureErr } = await supabaseAdmin
    .from('lectures')
    .select('*, media:lecture_media(*), content:generated_content(*)')
    .eq('id', lectureId)
    .single()

  if (lectureErr) return Response.json({ error: lectureErr.message }, { status: 404 })

  const ytContent = (lecture.content as { platform: string; content: YoutubeContent }[])
    .find(c => c.platform === 'youtube')?.content

  if (!ytContent) return Response.json({ error: '유튜브 콘텐츠가 없습니다. 먼저 생성해주세요.' }, { status: 400 })

  const video = (lecture.media as { file_type: string; storage_path: string }[])
    .find(m => m.file_type === 'video')

  if (!video) return Response.json({ error: '유튜브 업로드에는 동영상 파일이 필요합니다' }, { status: 400 })

  // Get refresh token from DB
  const { data: creds } = await supabaseAdmin
    .from('social_credentials')
    .select('credentials')
    .eq('platform', 'youtube')
    .single()

  const refreshToken = creds?.credentials?.refresh_token as string | undefined
  if (!refreshToken) {
    return Response.json({ error: 'YouTube 계정이 연결되지 않았습니다. 설정에서 연결해주세요.' }, { status: 400 })
  }

  try {
    const videoId = await uploadYouTubeShorts(
      video.storage_path,
      ytContent.title,
      ytContent.description,
      ytContent.tags,
      refreshToken
    )

    await supabaseAdmin
      .from('generated_content')
      .update({
        status: 'published',
        published_at: new Date().toISOString(),
        platform_post_id: videoId,
      })
      .eq('lecture_id', lectureId)
      .eq('platform', 'youtube')

    return Response.json({ ok: true, videoId, url: `https://youtube.com/shorts/${videoId}` })
  } catch (err) {
    const message = err instanceof Error ? err.message : '알 수 없는 오류'
    await supabaseAdmin
      .from('generated_content')
      .update({ status: 'failed', error_message: message })
      .eq('lecture_id', lectureId)
      .eq('platform', 'youtube')
    return Response.json({ error: message }, { status: 500 })
  }
}
