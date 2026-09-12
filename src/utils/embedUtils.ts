export interface MediaEmbedInfo {
  platform: 'tiktok' | 'youtube' | 'instagram' | 'drive' | 'meta' | 'direct'
  embedUrl: string
  originalUrl: string
  videoId?: string
}

export function parseMediaUrl(url: string): MediaEmbedInfo {
  if (!url) {
    return { platform: 'direct', embedUrl: '', originalUrl: '' }
  }

  const cleanUrl = url.trim()

  // 1. Direct Video Stream CDN URLs (check FIRST before domain checks)
  if (
    cleanUrl.includes('mime_type=video_mp4') ||
    cleanUrl.includes('v16-webapp') ||
    cleanUrl.includes('/video/tos/') ||
    cleanUrl.includes('tiktokcdn.com') ||
    cleanUrl.includes('fbcdn.net') ||
    cleanUrl.includes('video.twimg.com') ||
    cleanUrl.endsWith('.mp4') ||
    cleanUrl.endsWith('.webm') ||
    cleanUrl.includes('.mp4?')
  ) {
    return {
      platform: 'direct',
      embedUrl: cleanUrl,
      originalUrl: cleanUrl
    }
  }

  // 2. TikTok Video Pages
  // Formats: https://www.tiktok.com/@user/video/1234567890 or https://vm.tiktok.com/XYZ
  if (cleanUrl.includes('tiktok.com')) {
    const videoIdMatch = cleanUrl.match(/\/video\/(\d+)/) || cleanUrl.match(/v=(\d+)/) || cleanUrl.match(/\/(\d{15,25})/)
    if (videoIdMatch && videoIdMatch[1]) {
      const videoId = videoIdMatch[1]
      return {
        platform: 'tiktok',
        embedUrl: `https://www.tiktok.com/embed/v2/${videoId}`,
        originalUrl: cleanUrl,
        videoId
      }
    }
    return {
      platform: 'tiktok',
      embedUrl: cleanUrl,
      originalUrl: cleanUrl
    }
  }

  // 3. YouTube / YouTube Shorts
  if (cleanUrl.includes('youtube.com') || cleanUrl.includes('youtu.be')) {
    let videoId = ''
    if (cleanUrl.includes('shorts/')) {
      const match = cleanUrl.match(/shorts\/([a-zA-Z0-9_-]+)/)
      if (match) videoId = match[1]
    } else if (cleanUrl.includes('youtu.be/')) {
      const match = cleanUrl.match(/youtu\.be\/([a-zA-Z0-9_-]+)/)
      if (match) videoId = match[1]
    } else {
      const match = cleanUrl.match(/[?&]v=([a-zA-Z0-9_-]+)/)
      if (match) videoId = match[1]
    }

    if (videoId) {
      return {
        platform: 'youtube',
        embedUrl: `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`,
        originalUrl: cleanUrl,
        videoId
      }
    }
  }

  // 4. Instagram
  if (cleanUrl.includes('instagram.com')) {
    const match = cleanUrl.match(/\/(reel|p)\/([a-zA-Z0-9_-]+)/)
    if (match && match[2]) {
      const code = match[2]
      return {
        platform: 'instagram',
        embedUrl: `https://www.instagram.com/reel/${code}/embed`,
        originalUrl: cleanUrl,
        videoId: code
      }
    }
  }

  // 5. Google Drive
  if (cleanUrl.includes('drive.google.com')) {
    const match = cleanUrl.match(/\/d\/([a-zA-Z0-9_-]+)/) || cleanUrl.match(/[?&]id=([a-zA-Z0-9_-]+)/) || cleanUrl.match(/id=([a-zA-Z0-9_-]+)/)
    if (match && match[1]) {
      const fileId = match[1]
      return {
        platform: 'drive',
        embedUrl: `https://drive.google.com/file/d/${fileId}/preview`,
        originalUrl: cleanUrl,
        videoId: fileId
      }
    }
  }

  // 6. Meta Ads Library
  if (cleanUrl.includes('facebook.com/ads/library')) {
    return {
      platform: 'meta',
      embedUrl: cleanUrl,
      originalUrl: cleanUrl
    }
  }

  return {
    platform: 'direct',
    embedUrl: cleanUrl,
    originalUrl: cleanUrl
  }
}
