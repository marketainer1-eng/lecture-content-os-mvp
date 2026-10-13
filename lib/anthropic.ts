import Anthropic from '@anthropic-ai/sdk'
import type { BlogContent, InstagramContent, FacebookContent, YoutubeContent } from '@/types'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export interface GenerateContentInput {
  topic: string
  lectureDate: string
  atmosphere: string
  imageUrls: string[]
}

export interface AllPlatformContent {
  blog: BlogContent
  instagram: InstagramContent
  facebook: FacebookContent
  youtube: YoutubeContent
}

export async function generateLectureContent(input: GenerateContentInput): Promise<AllPlatformContent> {
  const { topic, lectureDate, atmosphere, imageUrls } = input

  const imageBlocks: Anthropic.MessageParam['content'] = imageUrls.slice(0, 5).map(url => ({
    type: 'image' as const,
    source: { type: 'url' as const, url },
  }))

  const prompt = `강의 정보:
- 주제: ${topic}
- 날짜: ${lectureDate}
- 현장 분위기: ${atmosphere || '별도 설명 없음'}

위 정보와 강의 현장 사진을 바탕으로 4개 플랫폼용 한국어 콘텐츠를 생성해주세요.

반드시 아래 JSON 형식으로만 응답하세요 (다른 텍스트 없이):
{
  "blog": {
    "title": "블로그 포스트 제목",
    "content": "마크다운 형식의 블로그 글 (600~900자, 강의 내용과 배운 점, 강사/수강생 모습 묘사 포함)"
  },
  "instagram": {
    "caption": "인스타그램 캡션 (150자 이내, 감성적이고 임팩트 있게)",
    "hashtags": ["해시태그1", "해시태그2", "...15개까지"]
  },
  "facebook": {
    "content": "페이스북 포스트 (250~350자, 친근하고 정보가 풍부하게, 참여 유도 질문 포함)"
  },
  "youtube": {
    "title": "유튜브 숏츠 제목 (50자 이내, 클릭하고 싶게)",
    "description": "유튜브 설명 (200자 이내, 주요 내용 + 강의 문의 유도)",
    "tags": ["태그1", "태그2", "...10개까지"]
  }
}`

  const response = await client.messages.create({
    model: 'claude-opus-4-8',
    max_tokens: 2000,
    system: [
      {
        type: 'text',
        text: '당신은 강의 콘텐츠 전문 마케터입니다. 강의 사진과 정보를 바탕으로 각 플랫폼에 최적화된 한국어 콘텐츠를 생성합니다. 반드시 요청한 JSON 형식만 반환하세요.',
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: [
      {
        role: 'user',
        content: [
          ...imageBlocks,
          { type: 'text', text: prompt },
        ],
      },
    ],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('AI 응답에서 JSON을 찾을 수 없습니다')

  return JSON.parse(jsonMatch[0]) as AllPlatformContent
}
