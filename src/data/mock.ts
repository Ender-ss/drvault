import { extractedMediaItems } from './extracted_media'
import { extractedMediaItems2 } from './extracted_media_2'

export interface Copy {
  id: string
  title: string
  status: "Validado" | "Draft" | "Review"
  niche: string
  platform: string
  funnel: string
  authors: string[]
  hooksCount: number
  date: string
}

export interface MediaItem {
  id: string
  title: string
  thumbUrl: string
  driveLink: string
  tags: string[]
  niche: string
  category: string  // "broll" | "reference" | "avatar" etc
  brollType?: string
  isFavorite?: boolean
}

export const mockCopies: Copy[] = [
  {
    id: "1",
    title: "AD 1 - Neuropatia (Sal Rosa / Dr. Oz)",
    status: "Validado",
    niche: "Neuropatia",
    platform: "Facebook Ads",
    funnel: "F273",
    authors: ["Equipe Copy", "Equipe Edição"],
    hooksCount: 6,
    date: "2026-02-23T09:13:00Z"
  },
  {
    id: "2",
    title: "Variações de Avatar - Copy Validada F220",
    status: "Validado",
    niche: "Diabetes",
    platform: "Facebook Ads",
    funnel: "F220",
    authors: ["Ruan Titto", "Gustavo Costa"],
    hooksCount: 2,
    date: "2026-02-20T10:00:00Z"
  },
  {
    id: "3",
    title: "AD 3 - Novos Hooks (Neuropatia)",
    status: "Validado",
    niche: "Neuropatia",
    platform: "Facebook Ads",
    funnel: "F273",
    authors: ["Equipe Copy", "Equipe Edição"],
    hooksCount: 6,
    date: "2026-02-24T14:30:00Z"
  }
]

const brollNames = [
  "Honey pouring", "Honeycomb close-up", "Bee on flower", "Jar of honey",
  "Golden liquid", "Honey dripping", "Natural remedy", "Kitchen scene",
  "Spoon with honey", "Honey texture", "Raw honeycomb", "Tea with honey",
  "Honey harvest", "Glass jar"
]

export const initialMediaItems: MediaItem[] = [
  ...extractedMediaItems,
  ...extractedMediaItems2,
  ...Array.from({ length: 14 }).map((_, i) => ({
    id: `m${i}`,
    title: brollNames[i] || `B-roll ${i + 1}`,
  thumbUrl: `https://picsum.photos/seed/${i + 100}/300/400`,
  driveLink: `https://drive.google.com/file/d/broll_${i + 1}/sharing`,
  tags: ["Validado", i % 3 === 0 ? "Premium" : "Standard"],
  niche: i % 2 === 0 ? "Diabetes" : "Neuropatia",
  category: "broll"
}))
]
