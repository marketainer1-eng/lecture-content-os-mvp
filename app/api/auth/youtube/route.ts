import type { NextRequest } from 'next/server'
import { getYouTubeAuthUrl, exchangeCodeForTokens } from '@/lib/youtube'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  const url = request.nextUrl
  const code = url.searchParams.get('code')

  // Initiate OAuth if no code
  if (!code) {
    const authUrl = getYouTubeAuthUrl()
    return Response.redirect(authUrl)
  }

  // Exchange code for tokens
  try {
    const tokens = await exchangeCodeForTokens(code)

    await supabaseAdmin
      .from('social_credentials')
      .upsert(
        { platform: 'youtube', credentials: tokens, updated_at: new Date().toISOString() },
        { onConflict: 'platform' }
      )

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    return Response.redirect(`${appUrl}/settings?youtube=connected`)
  } catch (err) {
    const message = err instanceof Error ? err.message : '인증 실패'
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    return Response.redirect(`${appUrl}/settings?youtube=error&message=${encodeURIComponent(message)}`)
  }
}
