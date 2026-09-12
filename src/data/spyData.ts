import spyJson from './spy.json'

export interface SpyLink {
  label: string
  url: string
}

export interface SpyProfile {
  name: string
  handle?: string
  url: string
  followers?: string
  note?: string
}

export interface SpyNiche {
  id: string
  group: 'nichos' | 'brolls' | 'formatos' | 'noticias' | string
  title: string
  badge?: string | null
  shape?: 'full' | 'news' | 'simple' | string
  sourceNicheId?: string
  ads_links?: SpyLink[]
  tiktok_links?: SpyLink[]
  instagram_links?: SpyLink[]
  pinterest_links?: SpyLink[]
  facebook_links?: SpyLink[]
  ads_keywords?: string[]
  tiktok_keywords?: string[]
  instagram_keywords?: string[]
  pinterest_keywords?: string[]
  facebook_keywords?: string[]
  tiktok_profiles?: SpyProfile[]
  instagram_profiles?: SpyProfile[]
  pinterest_profiles?: SpyProfile[]
  facebook_profiles?: SpyProfile[]
  reels?: { label: string; url: string; profile?: string }[]
  notes?: string[]
  brolls_list?: { category: string; items: string[] }[]
}

export interface SpyGroup {
  id: string
  label: string
}

export interface SpyData {
  meta: {
    title: string
    subtitle: string
    instrucao: string
  }
  how_to: string[]
  groups: SpyGroup[]
  niches: SpyNiche[]
}

export const spyData = spyJson as SpyData

export const NICHE_TOPIC: Record<string, string> = {
  n1: 'Alzheimer',
  n2: 'weight loss',
  n3: 'diabetes',
  n4: 'erectile dysfunction',
  n5: 'neuropathy',
}

export const NICHE_COLORS: Record<string, string> = {
  n1: '#7C3AED',
  n2: '#F59E0B',
  n3: '#EF4444',
  n4: '#EC4899',
  n5: '#2DD4BF',
  b1: '#3B82F6',
  b2: '#F97316',
  b3: '#D946EF',
  b4: '#22D3EE',
  b5: '#A3E635',
  b6: '#14B8A6',
  b7: '#FB7185',
  f1: '#8B5CF6',
  nt1: '#7C3AED',
  nt2: '#F59E0B',
  nt3: '#EF4444',
  nt4: '#EC4899',
  nt5: '#2DD4BF',
}

export const NICHE_IMAGES: Record<string, string> = {
  n1: '/spy_assets/nichos/alzheimer.jpg',
  n2: '/spy_assets/nichos/emagrecimento.jpg',
  n3: '/spy_assets/nichos/diabetes.jpg',
  n4: '/spy_assets/nichos/ed18.jpg',
  n5: '/spy_assets/nichos/neuropathy.jpg',
  nt1: '/spy_assets/nichos/alzheimer.jpg',
  nt2: '/spy_assets/nichos/emagrecimento.jpg',
  nt3: '/spy_assets/nichos/diabetes.jpg',
  nt4: '/spy_assets/nichos/ed18.jpg',
  nt5: '/spy_assets/nichos/neuropathy.jpg',
}

export function adsUrl(keyword: string): string {
  return `https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=US&q=${encodeURIComponent(
    keyword
  )}&search_type=keyword_unordered`
}

export function tiktokUrl(keyword: string): string {
  return `https://www.tiktok.com/search?q=${encodeURIComponent(keyword)}`
}

export function instagramExploreUrl(keyword: string): string {
  return `https://www.instagram.com/explore/search/keyword/?q=${encodeURIComponent(keyword)}`
}

export function pinterestUrl(keyword: string): string {
  return `https://www.pinterest.com/search/pins/?q=${encodeURIComponent(keyword)}`
}

export function facebookSearchUrl(keyword: string): string {
  return `https://www.facebook.com/search/top?q=${encodeURIComponent(keyword)}`
}

export function siteSearchUrl(domain: string, query: string): string {
  return `https://www.google.com/search?q=${encodeURIComponent(`site:${domain} ${query}`)}&tbs=qdr:m`
}

export function newsSourcesFor(niche: SpyNiche): SpyLink[] {
  const tId = niche.sourceNicheId || niche.id
  const topic = NICHE_TOPIC[tId] || niche.title
  const scienceDaily =
    tId === 'n1'
      ? { label: 'ScienceDaily — Dementia', url: 'https://www.sciencedaily.com/news/mind_brain/dementia/' }
      : tId === 'n3'
      ? { label: 'ScienceDaily — Chronic Illness', url: 'https://www.sciencedaily.com/news/health_medicine/chronic_illness/' }
      : tId === 'n5'
      ? { label: 'ScienceDaily — Neuropathy', url: 'https://www.sciencedaily.com/news/health_medicine/neuropathy/' }
      : { label: 'ScienceDaily — Saúde', url: 'https://www.sciencedaily.com/news/top/health/' }
  const medicalNewsToday =
    tId === 'n1'
      ? { label: 'Medical News Today — Alzheimer', url: 'https://www.medicalnewstoday.com/categories/alzheimers' }
      : { label: 'Medical News Today', url: 'https://www.medicalnewstoday.com/news' }
  return [
    scienceDaily,
    medicalNewsToday,
    { label: 'MedPage Today', url: siteSearchUrl('medpagetoday.com', topic) },
    { label: 'Healio', url: siteSearchUrl('healio.com', topic) },
    { label: 'News-Medical', url: siteSearchUrl('news-medical.net', topic) },
    { label: 'WebMD', url: siteSearchUrl('webmd.com', topic) },
    { label: 'Healthline', url: siteSearchUrl('healthline.com', topic) },
    { label: "Men's Health", url: siteSearchUrl('menshealth.com', topic) },
    { label: 'Harvard Health Blog', url: siteSearchUrl('health.harvard.edu', topic) },
  ]
}

export function trendsSourcesFor(niche: SpyNiche): SpyLink[] {
  const tId = niche.sourceNicheId || niche.id
  const topic = NICHE_TOPIC[tId] || niche.title
  return [
    { label: 'Google Trends', url: `https://trends.google.com/trends/explore?q=${encodeURIComponent(topic)}&geo=US` },
    { label: 'TikTok Creative Center', url: 'https://ads.tiktok.com/business/creativecenter/trends/pc/en' },
    { label: 'YouTube — busca recente', url: `https://www.youtube.com/results?search_query=${encodeURIComponent(topic)}` },
    { label: 'X / Twitter — busca', url: `https://twitter.com/search?q=${encodeURIComponent(topic)}&src=typed_query&f=live` },
    { label: 'Meta Ad Library', url: adsUrl(topic) },
  ]
}

export function programsList(): SpyLink[] {
  const yt = (q: string) => `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`
  return [
    { label: '60 Minutes', url: 'https://www.youtube.com/@60Minutes' },
    { label: 'TODAY Show', url: 'https://www.youtube.com/@TODAY' },
    { label: 'Good Morning America (GMA)', url: 'https://www.youtube.com/@GoodMorningAmerica' },
    { label: 'CNN', url: 'https://www.youtube.com/@CNN' },
    { label: 'CBS News', url: 'https://www.youtube.com/@CBSNews' },
    { label: 'Subway Takes', url: yt('Subway Takes Kareem Rahma') },
    { label: 'Jubilee / Surrounded', url: 'https://www.youtube.com/@Jubilee' },
    { label: 'Hot Ones', url: 'https://www.youtube.com/@FirstWeFeast' },
    { label: 'Chicken Shop Date', url: yt('Chicken Shop Date Amelia Dimoldenberg') },
    { label: "What's Poppin' with Davis", url: yt("What's Poppin with Davis") },
    { label: 'Billy on the Street', url: yt('Billy on the Street') },
    { label: 'Nightline', url: yt('Nightline ABC') },
    { label: 'The Daily Show', url: yt('The Daily Show') },
    { label: 'Last Week Tonight', url: yt('Last Week Tonight John Oliver') },
    { label: '48 Hours', url: yt('48 Hours CBS') },
    { label: 'CBS Sunday Morning', url: yt('CBS Sunday Morning') },
    { label: 'Face the Nation', url: yt('Face the Nation') },
    { label: 'Recess Therapy', url: yt('Recess Therapy') },
    { label: 'Street Interview / Man-on-the-street', url: yt('street interview format') },
    { label: 'Outside Tonight (mesa na rua)', url: yt('outside tonight street desk interview') },
  ]
}
