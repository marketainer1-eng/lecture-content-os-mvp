'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { LectureWithContent } from '@/types'

const PLATFORM_LABELS: Record<string, string> = {
  blog: '블로그',
  instagram: '인스타',
  facebook: '페이스북',
  youtube: '유튜브',
}

const STATUS_STYLES: Record<string, string> = {
  published: 'bg-green-100 text-green-700',
  draft: 'bg-gray-100 text-gray-500',
  failed: 'bg-red-100 text-red-600',
}

const STATUS_LABELS: Record<string, string> = {
  published: '게시됨',
  draft: '초안',
  failed: '실패',
}

export default function Dashboard() {
  const [posts, setPosts] = useState<LectureWithContent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/posts')
      .then(r => r.json())
      .then(d => setPosts(d.posts || []))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        불러오는 중...
      </div>
    )
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-24">
        <div className="text-5xl mb-4">📸</div>
        <h2 className="text-xl font-semibold text-gray-700 mb-2">아직 강의가 없습니다</h2>
        <p className="text-gray-500 mb-6">강의 사진과 정보를 올리면 AI가 콘텐츠를 자동 생성합니다</p>
        <Link href="/new" className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg hover:bg-indigo-700 font-medium">
          첫 강의 등록하기
        </Link>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-800">강의 목록</h1>
        <Link href="/new" className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 text-sm font-medium">
          + 새 강의
        </Link>
      </div>

      <div className="grid gap-4">
        {posts.map(post => {
          const thumb = post.media?.find(m => m.file_type === 'image')
          const platforms = ['blog', 'instagram', 'facebook', 'youtube']
          return (
            <Link key={post.id} href={`/posts/${post.id}`} className="bg-white rounded-xl border border-gray-200 hover:border-indigo-300 hover:shadow-sm transition-all p-4 flex gap-4">
              <div className="w-20 h-20 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden">
                {thumb?.public_url
                  ? <img src={thumb.public_url} alt="" className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center text-2xl">📷</div>
                }
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-800 truncate">{post.topic}</h3>
                <p className="text-sm text-gray-500 mt-0.5">
                  {new Date(post.lecture_date).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
                <div className="flex gap-2 mt-2 flex-wrap">
                  {platforms.map(p => {
                    const c = post.content?.find(x => x.platform === p)
                    const status = c?.status || 'none'
                    if (status === 'none') return null
                    return (
                      <span key={p} className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[status] || 'bg-gray-100 text-gray-400'}`}>
                        {PLATFORM_LABELS[p]} {STATUS_LABELS[status] || ''}
                      </span>
                    )
                  })}
                  {(!post.content || post.content.length === 0) && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 font-medium">콘텐츠 미생성</span>
                  )}
                </div>
              </div>
              <div className="text-gray-300 self-center">›</div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
