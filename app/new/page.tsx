'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

export default function NewPost() {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [files, setFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [topic, setTopic] = useState('')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [atmosphere, setAtmosphere] = useState('')
  const [step, setStep] = useState<'form' | 'uploading' | 'generating'>('form')
  const [error, setError] = useState('')

  function handleFiles(newFiles: FileList | null) {
    if (!newFiles) return
    const arr = Array.from(newFiles)
    setFiles(prev => [...prev, ...arr])
    arr.forEach(f => {
      const reader = new FileReader()
      reader.onload = e => setPreviews(prev => [...prev, e.target?.result as string])
      reader.readAsDataURL(f)
    })
  }

  function removeFile(i: number) {
    setFiles(prev => prev.filter((_, idx) => idx !== i))
    setPreviews(prev => prev.filter((_, idx) => idx !== i))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!topic || !date) return setError('강의 주제와 날짜를 입력해주세요')
    if (files.length === 0) return setError('사진이나 영상을 하나 이상 업로드해주세요')

    setError('')
    setStep('uploading')

    // 1. Create lecture record
    const createRes = await fetch('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic, lecture_date: date, atmosphere }),
    })
    const createData = await createRes.json()
    if (!createRes.ok) { setError(createData.error); setStep('form'); return }
    const lectureId = createData.post.id

    // 2. Upload files
    const form = new FormData()
    form.append('lectureId', lectureId)
    files.forEach(f => form.append('files', f))
    const uploadRes = await fetch('/api/upload', { method: 'POST', body: form })
    const uploadData = await uploadRes.json()
    if (!uploadRes.ok) { setError(uploadData.error); setStep('form'); return }

    // 3. Generate content
    setStep('generating')
    const genRes = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lectureId }),
    })
    const genData = await genRes.json()
    if (!genRes.ok) { setError(genData.error); setStep('form'); return }

    router.push(`/posts/${lectureId}`)
  }

  const isDragging = useRef(false)

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-xl font-bold text-gray-800 mb-6">새 강의 등록</h1>

      {step === 'uploading' && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 text-center shadow-xl">
            <div className="text-4xl mb-3 animate-bounce">☁️</div>
            <p className="font-semibold text-gray-700">파일 업로드 중...</p>
          </div>
        </div>
      )}

      {step === 'generating' && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 text-center shadow-xl max-w-xs">
            <div className="text-4xl mb-3">🤖</div>
            <p className="font-semibold text-gray-700 mb-1">AI 콘텐츠 생성 중</p>
            <p className="text-sm text-gray-500">블로그, 인스타그램, 페이스북, 유튜브 숏츠 글을 만들고 있어요</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* File upload area */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">강의 현장 사진·영상 <span className="text-red-500">*</span></label>
          <div
            className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer hover:border-indigo-400 transition-colors"
            onClick={() => fileRef.current?.click()}
            onDragOver={e => { e.preventDefault() }}
            onDrop={e => { e.preventDefault(); handleFiles(e.dataTransfer.files) }}
          >
            <input
              ref={fileRef}
              type="file"
              accept="image/*,video/*"
              multiple
              className="hidden"
              onChange={e => handleFiles(e.target.files)}
            />
            {files.length === 0
              ? <>
                  <div className="text-3xl mb-2">📎</div>
                  <p className="text-gray-500 text-sm">클릭하거나 파일을 여기에 드래그하세요</p>
                  <p className="text-gray-400 text-xs mt-1">사진 여러 장 + 영상 파일 모두 가능</p>
                </>
              : <p className="text-indigo-600 text-sm font-medium">+ 파일 추가</p>
            }
          </div>
          {previews.length > 0 && (
            <div className="flex gap-2 flex-wrap mt-3">
              {previews.map((src, i) => (
                <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                  {files[i]?.type.startsWith('video/')
                    ? <div className="w-full h-full flex items-center justify-center text-2xl">🎬</div>
                    : <img src={src} alt="" className="w-full h-full object-cover" />
                  }
                  <button
                    type="button"
                    onClick={() => removeFile(i)}
                    className="absolute top-0.5 right-0.5 bg-black/60 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center"
                  >✕</button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Topic */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">강의 주제 <span className="text-red-500">*</span></label>
          <input
            type="text"
            value={topic}
            onChange={e => setTopic(e.target.value)}
            placeholder="예: 소상공인을 위한 SNS 마케팅 전략"
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>

        {/* Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">강의 날짜 <span className="text-red-500">*</span></label>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>

        {/* Atmosphere */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">강의 현장 분위기</label>
          <textarea
            value={atmosphere}
            onChange={e => setAtmosphere(e.target.value)}
            placeholder="예: 소상공인 50명 참석, 열정적인 분위기, Q&A가 활발히 진행됨, 실습 위주 교육"
            rows={3}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
          />
        </div>

        {error && <p className="text-red-500 text-sm bg-red-50 rounded-lg px-3 py-2">{error}</p>}

        <button
          type="submit"
          disabled={step !== 'form'}
          className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          AI 콘텐츠 생성하기 →
        </button>
      </form>
    </div>
  )
}
