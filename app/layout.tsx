import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import Link from 'next/link'
import './globals.css'

const geist = Geist({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '강의 콘텐츠 OS',
  description: '강의 현장을 블로그·인스타그램·페이스북·유튜브 숏츠로 자동 변환',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={geist.className}>
      <body className="bg-gray-50 min-h-screen">
        <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
            <Link href="/" className="font-bold text-lg text-indigo-600">강의 콘텐츠 OS</Link>
            <nav className="flex items-center gap-4 text-sm">
              <Link href="/" className="text-gray-600 hover:text-gray-900">대시보드</Link>
              <Link href="/settings" className="text-gray-600 hover:text-gray-900">설정</Link>
              <Link href="/new" className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 font-medium">+ 새 강의</Link>
            </nav>
          </div>
        </header>
        <main className="max-w-5xl mx-auto px-4 py-8">{children}</main>
      </body>
    </html>
  )
}
