'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function SettingsContent() {
  const searchParams = useSearchParams()
  const youtubeStatus = searchParams.get('youtube')

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-xl font-bold text-gray-800">설정</h1>

      {/* YouTube */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xl">▶️</span>
          <h2 className="font-semibold text-gray-800">유튜브 계정 연결</h2>
        </div>
        {youtubeStatus === 'connected' && (
          <div className="mb-3 text-green-600 text-sm font-medium bg-green-50 px-3 py-2 rounded-lg">유튜브 계정이 연결되었습니다!</div>
        )}
        {youtubeStatus === 'error' && (
          <div className="mb-3 text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">
            연결 실패: {searchParams.get('message') || '알 수 없는 오류'}
          </div>
        )}
        <p className="text-sm text-gray-500 mb-4">
          유튜브 숏츠 자동 업로드를 위해 Google 계정으로 인증이 필요합니다.<br />
          아래 버튼을 클릭하면 Google 로그인 창이 열립니다.
        </p>
        <a
          href="/api/auth/youtube"
          className="inline-flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700"
        >
          <span>▶️</span>
          YouTube 계정 연결하기
        </a>
      </div>

      {/* Instagram / Facebook */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xl">📸</span>
          <h2 className="font-semibold text-gray-800">인스타그램 / 페이스북 설정</h2>
        </div>
        <p className="text-sm text-gray-500 mb-3">
          인스타그램·페이스북 자동 업로드는 환경 변수로 설정합니다. <code className="bg-gray-100 px-1 rounded">.env.local</code> 파일에 아래 값을 입력하세요.
        </p>
        <div className="bg-gray-50 rounded-lg p-3 font-mono text-xs text-gray-700 space-y-1">
          <p>INSTAGRAM_USER_ID=<span className="text-gray-400">인스타그램 비즈니스 계정 ID</span></p>
          <p>INSTAGRAM_ACCESS_TOKEN=<span className="text-gray-400">장기 액세스 토큰</span></p>
          <p>FACEBOOK_PAGE_ID=<span className="text-gray-400">페이지 ID</span></p>
          <p>FACEBOOK_PAGE_ACCESS_TOKEN=<span className="text-gray-400">페이지 액세스 토큰</span></p>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          Meta for Developers → 앱 생성 → Instagram Graph API에서 발급 가능합니다
        </p>
      </div>

      {/* Anthropic */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xl">🤖</span>
          <h2 className="font-semibold text-gray-800">AI (Claude) 설정</h2>
        </div>
        <p className="text-sm text-gray-500 mb-3">
          콘텐츠 자동 생성에 Anthropic Claude API를 사용합니다.
        </p>
        <div className="bg-gray-50 rounded-lg p-3 font-mono text-xs text-gray-700">
          <p>ANTHROPIC_API_KEY=<span className="text-gray-400">Anthropic 콘솔에서 발급</span></p>
        </div>
      </div>
    </div>
  )
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="text-gray-400">불러오는 중...</div>}>
      <SettingsContent />
    </Suspense>
  )
}
