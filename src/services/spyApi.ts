export interface LiveAdItem {
  id: string
  ad_id: string
  title: string
  brand_name: string
  platform: 'tiktok' | 'meta' | 'youtube' | 'instagram' | 'other'
  niche: string
  video_url: string
  thumb_url?: string
  scale_score?: number
  ctr_rating?: string
  cvr_rating?: string
  likes?: number
  shares?: number
  comments?: number
  days_active?: number
  duration_sec?: number
  landing_page_url?: string
  snapshot_url?: string
  copy_transcript?: string
  source: string
  start_date?: string
}

export interface SpyApiResponse {
  success: boolean
  total?: number
  has_more?: boolean
  source?: string
  library_url?: string
  data: LiveAdItem[]
  error?: string
}

// In production on VPS, /api/spy/ is proxied by Nginx to :8001
const API_BASE = '/api/spy'

export async function searchMetaAds(
  query: string,
  country: string = 'BR',
  status: string = 'ACTIVE',
  token?: string
): Promise<SpyApiResponse> {
  const params = new URLSearchParams({
    q: query,
    country,
    status
  })
  if (token) {
    params.append('token', token)
  }

  const res = await fetch(`${API_BASE}/meta/search?${params.toString()}`)
  if (!res.ok) {
    throw new Error(`Erro ao buscar no Meta Ads: ${res.statusText}`)
  }
  return res.json()
}

export async function fetchTikTokTopAds(
  country: string = 'BR',
  industry: string = 'all',
  period: number = 30,
  page: number = 1
): Promise<SpyApiResponse> {
  const params = new URLSearchParams({
    country,
    industry,
    period: period.toString(),
    page: page.toString(),
    limit: '20'
  })

  const res = await fetch(`${API_BASE}/tiktok/top-ads?${params.toString()}`)
  if (!res.ok) {
    throw new Error(`Erro ao buscar no TikTok Creative Center: ${res.statusText}`)
  }
  return res.json()
}

export async function getSpyEngineStatus(): Promise<{ status: string; version: string; capabilities: string[] }> {
  const res = await fetch(`${API_BASE}/status`)
  return res.json()
}
