'use client'

import { useEffect, useState, use } from 'react'
import type { LectureWithContent, Platform, BlogContent, InstagramContent, FacebookContent, YoutubeContent } from '@/types'

const PLATFORMS: { key: Platform; label: string; icon: string; color: string }[] = [
  { key: 'blog',      label: '블로그',      icon: '📝', color: 'indigo' },
  { key: 'instagram', label: '인스타그램',  icon: '📸', color: 'pink' },
  { key: 'facebook',  label: '페이스북',    icon: '👥', color: 'blue' },
  { key: 'youtube',   label: '유튜브 숏츠', icon: '▶️',  color: 'red' },
]

const COLOR_CLASSES: Record<string, { tab: string; btn: string }> = {
  indigo: { tab: 'border-indigo-500 text-indigo-600', btn: 'bg-indigo-600 hover:bg-indigo-700' },
  pink:   { tab: 'border-pink-500 text-pink-600',     btn: 'bg-pink-600 hover:bg-pink-700' },
  blue:   { tab: 'border-blue-500 text-blue-600',     btn: 'bg-blue-600 hover:bg-blue-700' },
  red:    { tab: 'border-red-500 text-red-600',       btn: 'bg-red-600 hover:bg-red-700' },
}

export default function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [post, setPost] = useState<LectureWithContent | null>(null)
  const [activeTab, setActiveTab] = useState<Platform>('blog')
  const [publishing, setPublishing] = useState<Platform | null>(null)
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)
  const [editing, setEditing] = useState<Platform | null>(null)
  const [editDraft, setEditDraft] = useState<string>('')

  useEffect(() => {
    fetch(`/api/posts/${id}`)
      .then(r => r.json())
      .then(d => setPost(d.post))
  }, [id])

  function showToast(msg: string, ok: boolean) {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 4000)
  }

  async function publish(platform: Platform) {
    setPublishing(platform)
    const res = await fetch(`/api/publish/${platform}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lectureId: id }),
    })
    const data = await res.json()
    setPublishing(null)
    if (res.ok) {
      showToast(`${PLATFORMS.find(p => p.key === platform)?.label} 게시 완료!`, true)
      const refreshed = await fetch(`/api/posts/${id}`).then(r => r.json())
      setPost(refreshed.post)
    } else {
      showToast(data.error || '게시 실패', false)
    }
  }

  async function saveEdit(platform: Platform) {
    try {
      const parsed = JSON.parse(editDraft)
      await fetch(`/api/posts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform, content: parsed }),
      })
      const refreshed = await fetch(`/api/posts/${id}`).then(r => r.json())
      setPost(refreshed.post)
      setEditing(null)
      showToast('저장되었습니다', true)
    } catch {
      showToast('JSON 형식이 올바르지 않습니다', false)
    }
  }

  if (!post) return <div className="flex items-center justify-center h-64 text-gray-400">불러오는 중...</div>

  const images = post.media?.filter(m => m.file_type === 'image') || []
  const video = post.media?.find(m => m.file_type === 'video')
  const currentPlatform = PLATFORMS.find(p => p.key === activeTab)!
  const contentRecord = post.content?.find(c => c.platform === activeTab)
  const isPublished = contentRecord?.status === 'published'
  const isFailed = contentRecord?.status === 'failed'

  function renderContent() {
    if (!contentRecord) return <p className="text-gray-400 text-sm">콘텐츠를 생성해주세요</p>

    if (editing === activeTab) {
      return (
        <div className="space-y-3">
          <textarea
            value={editDraft}
            onChange={e => setEditDraft(e.target.value)}
            rows={14}
            className="w-full font-mono text-xs border border-gray-200 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
          />
          <div className="flex gap-2">
            <button onClick={() => saveEdit(activeTab)} className="bg-gray-800 text-white text-sm px-4 py-1.5 rounded-lg hover:bg-gray-900">저장</button>
            <button onClick={() => setEditing(null)} className="text-sm text-gray-500 hover:text-gray-700">취소</button>
          </div>
        </div>
      )
    }

    if (activeTab === 'blog') {
      const c = contentRecord.content as BlogContent
      return (
        <div className="space-y-3">
          <h3 className="font-bold text-lg text-gray-800">{c.title}</h3>
          <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{c.content}</div>
        </div>
      )
    }
    if (activeTab === 'instagram') {
      const c = contentRecord.content as InstagramContent
      return (
        <div className="space-y-3">
          <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">{c.caption}</p>
          <div className="flex flex-wrap gap-1.5 pt-2">
            {c.hashtags.map((h, i) => (
              <span key={i} className="text-pink-600 text-sm">#{h.replace(/^#/, '')}</span>
            ))}
          </div>
        </div>
      )
    }
    if (activeTab === 'facebook') {
      const c = contentRecord.content as FacebookContent
      return <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">{c.content}</p>
    }
    if (activeTab === 'youtube') {
      const c = contentRecord.content as YoutubeContent
      return (
        <div className="space-y-3">
          <div>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">제목</p>
            <p className="font-semibold text-gray-800">{c.title}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">설명</p>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{c.description}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">태그</p>
            <div className="flex flex-wrap gap-1.5">
              {c.tags.map((t, i) => (
                <span key={i} className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">{t}</span>
              ))}
            </div>
          </div>
          {video && (
            <div className="mt-2 p-3 bg-gray-50 rounded-lg flex items-center gap-2 text-sm text-gray-600">
              <span>🎬</span>
              <span>{video.original_name}</span>
            </div>
          )}
        </div>
      )
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium ${toast.ok ? 'bg-green-500' : 'bg-red-500'} text-white`}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <p className="text-sm text-gray-500 mb-1">
          {new Date(post.lecture_date).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
        <h1 className="text-xl font-bold text-gray-800">{post.topic}</h1>
        {post.atmosphere && <p className="text-sm text-gray-500 mt-1">{post.atmosphere}</p>}
      </div>

      {/* Images preview */}
      {images.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
          {images.map(img => (
            <img key={img.id} src={img.public_url!} alt="" className="h-24 w-24 rounded-lg object-cover flex-shrink-0" />
          ))}
        </div>
      )}

      {/* Platform tabs */}
      <div className="flex border-b border-gray-200 mb-6 overflow-x-auto">
        {PLATFORMS.map(p => {
          const c = post.content?.find(x => x.platform === p.key)
          const isActive = activeTab === p.key
          return (
            <button
              key={p.key}
              onClick={() => setActiveTab(p.key)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                isActive
                  ? COLOR_CLASSES[p.color].tab + ' border-b-2'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <span>{p.icon}</span>
              <span>{p.label}</span>
              {c?.status === 'published' && <span className="w-1.5 h-1.5 rounded-full bg-green-500 ml-0.5" />}
              {c?.status === 'failed' && <span className="w-1.5 h-1.5 rounded-full bg-red-500 ml-0.5" />}
            </button>
          )
        })}
      </div>

      {/* Content area */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-700 flex items-center gap-1.5">
            {currentPlatform.icon} {currentPlatform.label} 콘텐츠
          </h2>
          {contentRecord && editing !== activeTab && (
            <button
              onClick={() => { setEditing(activeTab); setEditDraft(JSON.stringify(contentRecord.content, null, 2)) }}
              className="text-xs text-gray-500 hover:text-gray-700 border border-gray-200 rounded px-2 py-1"
            >
              수정
            </button>
          )}
        </div>
        {renderContent()}

        {isFailed && contentRecord.error_message && (
          <div className="mt-3 p-2 bg-red-50 rounded text-xs text-red-600">{contentRecord.error_message}</div>
        )}
      </div>

      {/* Publish button */}
      {contentRecord && activeTab !== 'blog' && (
        <div className="flex items-center gap-3">
          {isPublished ? (
            <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
              <span>✓</span>
              <span>게시 완료 · {new Date(contentRecord.published_at!).toLocaleString('ko-KR')}</span>
              {contentRecord.platform_post_id && activeTab === 'youtube' && (
                <a
                  href={`https://youtube.com/shorts/${contentRecord.platform_post_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-red-600 underline"
                >
                  보러 가기
                </a>
              )}
            </div>
          ) : (
            <button
              onClick={() => publish(activeTab)}
              disabled={publishing === activeTab}
              className={`${COLOR_CLASSES[currentPlatform.color].btn} text-white px-5 py-2.5 rounded-lg font-medium text-sm disabled:opacity-60 transition-colors`}
            >
              {publishing === activeTab ? '게시 중...' : `${currentPlatform.label}에 자동 업로드`}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
