import { useState, useEffect, useMemo, useRef } from 'react'
import { Search, X, ExternalLink, Copy, Check, Sparkles } from 'lucide-react'
import { spyData, adsUrl, tiktokUrl, instagramExploreUrl } from '../../data/spyData'

interface SpySearchModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectNiche: (nicheId: string, subtabKey?: string) => void
}

interface SearchResultItem {
  id: string
  title: string
  nicheTitle: string
  nicheId: string
  type: 'keyword' | 'link' | 'profile' | 'reel' | 'broll'
  platform: 'Ads Library' | 'TikTok' | 'Instagram' | 'Pinterest' | 'Facebook' | 'Geral'
  url?: string
}

export function SpySearchModal({ isOpen, onClose, onSelectNiche }: SpySearchModalProps) {
  const [query, setQuery] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50)
    } else {
      setQuery('')
    }
  }, [isOpen])

  // Build searchable items
  const allItems = useMemo(() => {
    const list: SearchResultItem[] = []

    for (const n of spyData.niches) {
      // Ads keywords
      n.ads_keywords?.forEach((kw, idx) => {
        list.push({
          id: `${n.id}-ads-kw-${idx}`,
          title: kw,
          nicheTitle: n.title,
          nicheId: n.id,
          type: 'keyword',
          platform: 'Ads Library',
          url: adsUrl(kw)
        })
      })

      // Ads links
      n.ads_links?.forEach((link, idx) => {
        list.push({
          id: `${n.id}-ads-link-${idx}`,
          title: link.label,
          nicheTitle: n.title,
          nicheId: n.id,
          type: 'link',
          platform: 'Ads Library',
          url: link.url
        })
      })

      // TikTok keywords
      n.tiktok_keywords?.forEach((kw, idx) => {
        list.push({
          id: `${n.id}-tt-kw-${idx}`,
          title: kw,
          nicheTitle: n.title,
          nicheId: n.id,
          type: 'keyword',
          platform: 'TikTok',
          url: tiktokUrl(kw)
        })
      })

      // Instagram keywords
      n.instagram_keywords?.forEach((kw, idx) => {
        list.push({
          id: `${n.id}-ig-kw-${idx}`,
          title: kw,
          nicheTitle: n.title,
          nicheId: n.id,
          type: 'keyword',
          platform: 'Instagram',
          url: instagramExploreUrl(kw)
        })
      })

      // Profiles
      n.tiktok_profiles?.forEach((p, idx) => {
        list.push({
          id: `${n.id}-tt-prof-${idx}`,
          title: `${p.name} ${p.handle || ''}`,
          nicheTitle: n.title,
          nicheId: n.id,
          type: 'profile',
          platform: 'TikTok',
          url: p.url
        })
      })

      n.instagram_profiles?.forEach((p, idx) => {
        list.push({
          id: `${n.id}-ig-prof-${idx}`,
          title: `${p.name} ${p.handle || ''}`,
          nicheTitle: n.title,
          nicheId: n.id,
          type: 'profile',
          platform: 'Instagram',
          url: p.url
        })
      })
    }

    return list
  }, [])

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []
    return allItems
      .filter(item => item.title.toLowerCase().includes(q) || item.nicheTitle.toLowerCase().includes(q))
      .slice(0, 40)
  }, [query, allItems])

  const handleCopy = (text: string, id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 1500)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-[#1a1d24] border border-[var(--color-border)] rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[75vh]">
        {/* Search header */}
        <div className="relative flex items-center px-4 py-3.5 border-b border-[var(--color-border)] bg-[#21252d]">
          <Search className="w-5 h-5 text-[var(--color-brand)] mr-3 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            className="flex-1 bg-transparent text-white placeholder-[var(--color-text-muted)] focus:outline-none text-base"
            placeholder="Pesquisar termo, keyword, perfil ou nicho em todo o Martins Spy..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') onClose()
            }}
          />
          {query && (
            <button onClick={() => setQuery('')} className="p-1 text-[var(--color-text-muted)] hover:text-white mr-2">
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-block px-2 py-0.5 text-xs text-[var(--color-text-muted)] bg-black/40 border border-white/10 rounded">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1 divide-y divide-white/5">
          {query && results.length === 0 && (
            <div className="text-center py-12 text-[var(--color-text-muted)]">
              <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p>Nenhum resultado encontrado para "{query}"</p>
            </div>
          )}

          {!query && (
            <div className="text-center py-10 text-[var(--color-text-muted)] text-sm">
              <p>Digite para buscar em mais de <strong className="text-white">7.000+</strong> palavras-chave e links de espionagem.</p>
            </div>
          )}

          {results.map((item) => (
            <div
              key={item.id}
              onClick={() => {
                onSelectNiche(item.nicheId)
                onClose()
              }}
              className="flex items-center justify-between p-2.5 rounded-lg hover:bg-white/5 transition-colors cursor-pointer group"
            >
              <div className="flex-1 min-w-0 pr-3">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-semibold text-[var(--color-brand)] px-1.5 py-0.5 rounded bg-[var(--color-brand)]/10">
                    {item.nicheTitle}
                  </span>
                  <span className="text-[10px] text-gray-400 font-medium px-1.5 py-0.5 rounded bg-white/5 uppercase">
                    {item.platform}
                  </span>
                </div>
                <p className="text-sm text-white font-medium truncate">{item.title}</p>
              </div>

              <div className="flex items-center gap-1.5 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={(e) => handleCopy(item.title, item.id, e)}
                  className="p-1.5 rounded-md bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
                  title="Copiar termo"
                >
                  {copiedId === item.id ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
                {item.url && (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 rounded-md bg-[var(--color-brand)]/20 hover:bg-[var(--color-brand)]/40 text-[var(--color-brand)] transition-colors flex items-center gap-1 text-xs"
                    title="Abrir no navegador"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
