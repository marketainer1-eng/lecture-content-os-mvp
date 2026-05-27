import { google } from 'googleapis'
import { supabaseAdmin, MEDIA_BUCKET } from './supabase'

function getOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.YOUTUBE_CLIENT_ID,
    process.env.YOUTUBE_CLIENT_SECRET,
    process.env.YOUTUBE_REDIRECT_URI
  )
}

export function getYouTubeAuthUrl(): string {
  const oauth2 = getOAuth2Client()
  return oauth2.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/youtube.upload'],
    prompt: 'consent',
  })
}

export async function exchangeCodeForTokens(code: string) {
  const oauth2 = getOAuth2Client()
  const { tokens } = await oauth2.getToken(code)
  return tokens
}

export async function uploadYouTubeShorts(
  videoStoragePath: string,
  title: string,
  description: string,
  tags: string[],
  refreshToken: string
): Promise<string> {
  const oauth2 = getOAuth2Client()
  oauth2.setCredentials({ refresh_token: refreshToken })

  const youtube = google.youtube({ version: 'v3', auth: oauth2 })

  // Download video from Supabase Storage
  const { data, error } = await supabaseAdmin.storage
    .from(MEDIA_BUCKET)
    .download(videoStoragePath)
  if (error) throw new Error(`동영상 다운로드 실패: ${error.message}`)

  const shortsTitle = title.length <= 50 ? title : title.slice(0, 47) + '...'
  const shortsDescription = `${description}\n\n#Shorts`

  const res = await youtube.videos.insert({
    part: ['snippet', 'status'],
    requestBody: {
      snippet: {
        title: shortsTitle,
        description: shortsDescription,
        tags: [...tags, 'Shorts'],
        categoryId: '27', // Education
        defaultLanguage: 'ko',
      },
      status: { privacyStatus: 'public' },
    },
    media: {
      mimeType: 'video/mp4',
      body: data.stream(),
    },
  })

  const videoId = res.data.id
  if (!videoId) throw new Error('YouTube 업로드 실패: 비디오 ID 없음')
  return videoId
}
