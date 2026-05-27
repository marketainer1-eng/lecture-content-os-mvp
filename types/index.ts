export type Platform = 'blog' | 'instagram' | 'facebook' | 'youtube'
export type ContentStatus = 'draft' | 'published' | 'failed'
export type MediaType = 'image' | 'video'

export interface Lecture {
  id: string
  topic: string
  lecture_date: string
  atmosphere: string | null
  created_at: string
}

export interface LectureMedia {
  id: string
  lecture_id: string
  storage_path: string
  public_url: string | null
  file_type: MediaType
  original_name: string | null
  order_num: number
  created_at: string
}

export interface BlogContent {
  title: string
  content: string
}

export interface InstagramContent {
  caption: string
  hashtags: string[]
}

export interface FacebookContent {
  content: string
}

export interface YoutubeContent {
  title: string
  description: string
  tags: string[]
}

export type PlatformContent = BlogContent | InstagramContent | FacebookContent | YoutubeContent

export interface GeneratedContent {
  id: string
  lecture_id: string
  platform: Platform
  content: BlogContent | InstagramContent | FacebookContent | YoutubeContent
  status: ContentStatus
  published_at: string | null
  platform_post_id: string | null
  error_message: string | null
  created_at: string
}

export interface LectureWithContent extends Lecture {
  media: LectureMedia[]
  content: GeneratedContent[]
}
