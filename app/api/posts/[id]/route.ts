import type { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const { data, error } = await supabaseAdmin
    .from('lectures')
    .select(`
      *,
      media:lecture_media(*),
      content:generated_content(*)
    `)
    .eq('id', id)
    .single()

  if (error) return Response.json({ error: error.message }, { status: 404 })
  return Response.json({ post: data })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()

  // Update generated content for a platform
  if (body.platform && body.content) {
    const { error } = await supabaseAdmin
      .from('generated_content')
      .update({ content: body.content })
      .eq('lecture_id', id)
      .eq('platform', body.platform)

    if (error) return Response.json({ error: error.message }, { status: 500 })
    return Response.json({ ok: true })
  }

  return Response.json({ error: '잘못된 요청입니다' }, { status: 400 })
}
