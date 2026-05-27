import type { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('lectures')
    .select(`
      *,
      media:lecture_media(*),
      content:generated_content(*)
    `)
    .order('created_at', { ascending: false })

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ posts: data })
}

export async function POST(request: NextRequest) {
  const { topic, lecture_date, atmosphere } = await request.json()

  if (!topic || !lecture_date) {
    return Response.json({ error: '강의 주제와 날짜는 필수입니다' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('lectures')
    .insert({ topic, lecture_date, atmosphere })
    .select()
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ post: data }, { status: 201 })
}
