import type { NextRequest } from 'next/server'
import { supabaseAdmin, MEDIA_BUCKET } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const lectureId = formData.get('lectureId') as string
  const files = formData.getAll('files') as File[]

  if (!lectureId || files.length === 0) {
    return Response.json({ error: '강의 ID와 파일이 필요합니다' }, { status: 400 })
  }

  const uploaded: { storage_path: string; public_url: string; file_type: string; original_name: string }[] = []

  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    const ext = file.name.split('.').pop() || 'bin'
    const storagePath = `${lectureId}/${Date.now()}_${i}.${ext}`
    const fileType = file.type.startsWith('video/') ? 'video' : 'image'

    const bytes = await file.arrayBuffer()
    const { error } = await supabaseAdmin.storage
      .from(MEDIA_BUCKET)
      .upload(storagePath, bytes, { contentType: file.type, upsert: false })

    if (error) return Response.json({ error: `파일 업로드 실패: ${error.message}` }, { status: 500 })

    const { data: urlData } = supabaseAdmin.storage.from(MEDIA_BUCKET).getPublicUrl(storagePath)

    const { error: dbError } = await supabaseAdmin.from('lecture_media').insert({
      lecture_id: lectureId,
      storage_path: storagePath,
      public_url: urlData.publicUrl,
      file_type: fileType,
      original_name: file.name,
      order_num: i,
    })
    if (dbError) return Response.json({ error: `DB 저장 실패: ${dbError.message}` }, { status: 500 })

    uploaded.push({ storage_path: storagePath, public_url: urlData.publicUrl, file_type: fileType, original_name: file.name })
  }

  return Response.json({ uploaded })
}
