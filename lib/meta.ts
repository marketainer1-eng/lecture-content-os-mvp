const GRAPH_API = 'https://graph.facebook.com/v18.0'

export async function publishToInstagram(imageUrls: string[], caption: string): Promise<string> {
  const userId = process.env.INSTAGRAM_USER_ID!
  const token = process.env.INSTAGRAM_ACCESS_TOKEN!

  if (imageUrls.length === 0) throw new Error('이미지가 없습니다')

  let mediaContainerId: string

  if (imageUrls.length === 1) {
    const res = await fetch(`${GRAPH_API}/${userId}/media`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image_url: imageUrls[0],
        caption,
        access_token: token,
      }),
    })
    const data = await res.json()
    if (data.error) throw new Error(`Instagram 미디어 생성 실패: ${data.error.message}`)
    mediaContainerId = data.id
  } else {
    // Carousel post
    const childIds = await Promise.all(
      imageUrls.slice(0, 10).map(async (url) => {
        const res = await fetch(`${GRAPH_API}/${userId}/media`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image_url: url, is_carousel_item: true, access_token: token }),
        })
        const data = await res.json()
        if (data.error) throw new Error(`캐러셀 항목 생성 실패: ${data.error.message}`)
        return data.id as string
      })
    )

    const res = await fetch(`${GRAPH_API}/${userId}/media`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        media_type: 'CAROUSEL',
        caption,
        children: childIds.join(','),
        access_token: token,
      }),
    })
    const data = await res.json()
    if (data.error) throw new Error(`캐러셀 컨테이너 생성 실패: ${data.error.message}`)
    mediaContainerId = data.id
  }

  // Wait for container processing
  await new Promise(r => setTimeout(r, 3000))

  const publishRes = await fetch(`${GRAPH_API}/${userId}/media_publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ creation_id: mediaContainerId, access_token: token }),
  })
  const publishData = await publishRes.json()
  if (publishData.error) throw new Error(`Instagram 게시 실패: ${publishData.error.message}`)

  return publishData.id as string
}

export async function publishToFacebook(imageUrls: string[], message: string): Promise<string> {
  const pageId = process.env.FACEBOOK_PAGE_ID!
  const token = process.env.FACEBOOK_PAGE_ACCESS_TOKEN!

  if (imageUrls.length === 0) {
    // Text-only post
    const res = await fetch(`${GRAPH_API}/${pageId}/feed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, access_token: token }),
    })
    const data = await res.json()
    if (data.error) throw new Error(`Facebook 게시 실패: ${data.error.message}`)
    return data.id as string
  }

  if (imageUrls.length === 1) {
    const res = await fetch(`${GRAPH_API}/${pageId}/photos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: imageUrls[0], caption: message, access_token: token }),
    })
    const data = await res.json()
    if (data.error) throw new Error(`Facebook 사진 게시 실패: ${data.error.message}`)
    return data.id as string
  }

  // Multiple photos — attach unpublished then post together
  const photoIds = await Promise.all(
    imageUrls.slice(0, 10).map(async (url) => {
      const res = await fetch(`${GRAPH_API}/${pageId}/photos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, published: false, access_token: token }),
      })
      const data = await res.json()
      if (data.error) throw new Error(`Facebook 사진 업로드 실패: ${data.error.message}`)
      return { media_fbid: data.id as string }
    })
  )

  const res = await fetch(`${GRAPH_API}/${pageId}/feed`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, attached_media: photoIds, access_token: token }),
  })
  const data = await res.json()
  if (data.error) throw new Error(`Facebook 멀티 사진 게시 실패: ${data.error.message}`)
  return data.id as string
}
