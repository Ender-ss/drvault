import { useState, useEffect, useMemo } from 'react'
import { 
  Search, 
  ExternalLink, 
  Copy, 
  Check, 
  Sparkles, 
  Info, 
  Flame, 
  Radio, 
  Film, 
  Tv, 
  Newspaper, 
  TrendingUp, 
  Share2, 
  BookOpen, 
  Layers
} from 'lucide-react'
import { 
  spyData, 
  NICHE_COLORS, 
  NICHE_IMAGES, 
  adsUrl, 
  tiktokUrl, 
  instagramExploreUrl, 
  pinterestUrl, 
  newsSourcesFor,
  trendsSourcesFor,
  programsList
} from '../data/spyData'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { SpySearchModal } from '../components/spy/SpySearchModal'

export default function MartinsSpy() {
  const [activeGroup, setActiveGroup] = useState<string>('nichos')
  const [activeNicheId, setActiveNicheId] = useState<string>('n1')
  const [activeSubtab, setActiveSubtab] = useState<string>('ads_kw')
  const [showSearchModal, setShowSearchModal] = useState<boolean>(false)
  const [showHowTo, setShowHowTo] = useState<boolean>(false)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [localSearch, setLocalSearch] = useState<string>('')

  // Register Ctrl+K shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setShowSearchModal(prev => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Filter niches belonging to active group
  const groupNiches = useMemo(() => {
    return spyData.niches.filter(n => n.group === activeGroup)
  }, [activeGroup])

  // Current active niche object
  const currentNiche = useMemo(() => {
    return spyData.niches.find(n => n.id === activeNicheId) || groupNiches[0] || spyData.niches[0]
  }, [activeNicheId, groupNiches])

  // When group changes, select first niche in group
  const handleSelectGroup = (groupId: string) => {
    setActiveGroup(groupId)
    const firstInGroup = spyData.niches.find(n => n.group === groupId)
    if (firstInGroup) {
      setActiveNicheId(firstInGroup.id)
      if (firstInGroup.shape === 'news') {
        setActiveSubtab('noticias')
      } else {
        setActiveSubtab('ads_kw')
      }
    }
  }

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 1500)
  }

  // Available subtabs depending on niche shape
  const availableSubtabs = useMemo(() => {
    if (!currentNiche) return []
    if (currentNiche.shape === 'news') {
      return [
        { key: 'noticias', label: 'Notícias & Estudos', icon: Newspaper },
        { key: 'trends', label: 'Trends Virais & Trends', icon: TrendingUp },
        { key: 'programas', label: 'Programas de TV & Formatos', icon: Tv },
      ]
    }

    const tabs: { key: string; label: string; count?: number; icon?: any }[] = []

    if (currentNiche.ads_keywords?.length || currentNiche.ads_links?.length) {
      tabs.push({ 
        key: 'ads_kw', 
        label: 'Meta Ads Library', 
        count: (currentNiche.ads_keywords?.length || 0) + (currentNiche.ads_links?.length || 0),
        icon: Flame 
      })
    }

    if (currentNiche.tiktok_keywords?.length || currentNiche.tiktok_links?.length || currentNiche.tiktok_profiles?.length) {
      tabs.push({ 
        key: 'tt_kw', 
        label: 'TikTok Search', 
        count: (currentNiche.tiktok_keywords?.length || 0) + (currentNiche.tiktok_links?.length || 0),
        icon: Radio 
      })
    }

    if (currentNiche.instagram_keywords?.length || currentNiche.instagram_links?.length || currentNiche.instagram_profiles?.length) {
      tabs.push({ 
        key: 'ig_kw', 
        label: 'Instagram Explore', 
        count: (currentNiche.instagram_keywords?.length || 0) + (currentNiche.instagram_links?.length || 0),
        icon: Share2 
      })
    }

    if (currentNiche.pinterest_keywords?.length || currentNiche.pinterest_links?.length) {
      tabs.push({ 
        key: 'pin_kw', 
        label: 'Pinterest Pins', 
        count: (currentNiche.pinterest_keywords?.length || 0) + (currentNiche.pinterest_links?.length || 0),
        icon: Layers 
      })
    }

    if (currentNiche.tiktok_profiles?.length || currentNiche.instagram_profiles?.length) {
      tabs.push({ 
        key: 'profiles', 
        label: 'Perfis de Referência', 
        count: (currentNiche.tiktok_profiles?.length || 0) + (currentNiche.instagram_profiles?.length || 0),
        icon: BookOpen 
      })
    }

    if (currentNiche.reels?.length) {
      tabs.push({ key: 'reels', label: 'Reels Virais', count: currentNiche.reels.length, icon: Film })
    }

    return tabs
  }, [currentNiche])

  // Ensure activeSubtab is valid when changing niche
  useEffect(() => {
    if (availableSubtabs.length > 0 && !availableSubtabs.some(t => t.key === activeSubtab)) {
      setActiveSubtab(availableSubtabs[0].key)
    }
  }, [availableSubtabs, activeSubtab])

  const filteredKeywords = (keywords?: string[]) => {
    if (!keywords) return []
    if (!localSearch.trim()) return keywords
    return keywords.filter(k => k.toLowerCase().includes(localSearch.toLowerCase()))
  }

  const filteredLinks = (links?: { label: string; url: string }[]) => {
    if (!links) return []
    if (!localSearch.trim()) return links
    return links.filter(l => l.label.toLowerCase().includes(localSearch.toLowerCase()))
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#1a1d24] p-6 rounded-xl border border-[var(--color-border)] shadow-lg">
        <div>
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-lg bg-[var(--color-brand)]/10 text-[var(--color-brand)]">
              <Flame className="w-6 h-6 animate-pulse" />
            </span>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
                MARTINS SPY <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 uppercase">US Live</span>
              </h1>
              <p className="text-xs text-[var(--color-text-muted)] mt-0.5 font-medium">
                {spyData.meta.subtitle}
              </p>
            </div>
          </div>
        </div>

        {/* Global Search Button + Info Toggle */}
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => setShowHowTo(!showHowTo)}
            className="text-xs flex items-center gap-1.5 border-[var(--color-border)] hover:text-white"
          >
            <Info className="w-3.5 h-3.5 text-[var(--color-brand)]" />
            {showHowTo ? 'Ocultar Dicas' : 'Instruções de DR'}
          </Button>

          <button
            onClick={() => setShowSearchModal(true)}
            className="flex items-center justify-between gap-3 px-4 py-2 rounded-lg bg-[#21252d] hover:bg-[#282d37] border border-[var(--color-border)] text-sm text-[var(--color-text-muted)] hover:text-white transition-all shadow-sm group min-w-[240px]"
          >
            <span className="flex items-center gap-2">
              <Search className="w-4 h-4 text-[var(--color-brand)] group-hover:scale-110 transition-transform" />
              <span>Buscar termo global...</span>
            </span>
            <kbd className="text-[10px] bg-black/40 px-2 py-0.5 rounded text-gray-400 border border-white/10 font-mono">
              Ctrl+K
            </kbd>
          </button>
        </div>
      </div>

      {/* Expandable How To */}
      {showHowTo && (
        <div className="bg-[#1e232d] border border-[var(--color-brand)]/30 rounded-xl p-5 text-sm space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2 font-bold text-white">
            <Sparkles className="w-4 h-4 text-[var(--color-brand)]" />
            Regras de Ouro para Espionagem de Anúncios no Mercado Americano (US)
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-gray-300">
            {spyData.how_to.map((item, idx) => (
              <div key={idx} className="bg-black/30 p-3 rounded-lg border border-white/5 flex gap-2">
                <span className="text-[var(--color-brand)] font-bold">#{idx + 1}</span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Group Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-[var(--color-border)] pb-2">
        {spyData.groups.map(g => {
          const isActive = activeGroup === g.id
          return (
            <button
              key={g.id}
              onClick={() => handleSelectGroup(g.id)}
              className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
                isActive
                  ? 'bg-[var(--color-brand)] text-white shadow-md shadow-[var(--color-brand)]/20'
                  : 'bg-[#1f2329] text-[var(--color-text-muted)] hover:bg-[#282d37] hover:text-white'
              }`}
            >
              {g.label}
            </button>
          )
        })}
      </div>

      {/* Niche Selector Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {groupNiches.map(n => {
          const isSelected = currentNiche.id === n.id
          const accentColor = NICHE_COLORS[n.id] || '#7C3AED'
          const imgUrl = NICHE_IMAGES[n.id]

          return (
            <button
              key={n.id}
              onClick={() => {
                setActiveNicheId(n.id)
                setLocalSearch('')
              }}
              className={`group relative p-3 rounded-xl border text-left transition-all flex flex-col justify-between overflow-hidden bg-[#1f2329] hover:bg-[#242931] ${
                isSelected
                  ? 'ring-2 ring-[var(--color-brand)] border-transparent shadow-lg shadow-[var(--color-brand)]/15 scale-[1.02]'
                  : 'border-[var(--color-border)] hover:border-white/20'
              }`}
              style={{ borderLeftColor: isSelected ? undefined : accentColor, borderLeftWidth: 4 }}
            >
              <div className="flex items-center justify-between w-full mb-2">
                <span className="text-xs font-black text-white uppercase tracking-tight truncate pr-1">
                  {n.title}
                </span>
                {n.badge && (
                  <Badge variant="secondary" className="text-[9px] px-1.5 py-0 uppercase bg-[var(--color-brand)]/20 text-[var(--color-brand)]">
                    {n.badge}
                  </Badge>
                )}
              </div>

              {imgUrl ? (
                <div className="w-full h-16 rounded-md overflow-hidden bg-black/50 mb-2 relative">
                  <img
                    src={imgUrl}
                    alt={n.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-80 group-hover:opacity-100"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                </div>
              ) : (
                <div className="w-full h-12 rounded-md bg-black/30 flex items-center justify-center mb-2 text-xs font-mono text-gray-400">
                  {n.group}
                </div>
              )}

              <div className="flex items-center justify-between text-[10px] text-[var(--color-text-muted)] mt-auto pt-1 border-t border-white/5">
                <span>{(n.ads_keywords?.length || 0) + (n.tiktok_keywords?.length || 0)} KWs</span>
                <span className="text-gray-500 font-mono">Abrir →</span>
              </div>
            </button>
          )
        })}
      </div>

      {/* Active Niche Content Pane */}
      <div className="bg-[#1a1d24] rounded-xl border border-[var(--color-border)] shadow-xl overflow-hidden">
        {/* Pane Header */}
        <div className="p-5 border-b border-[var(--color-border)] bg-[#21252d] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className="w-3.5 h-10 rounded-full"
              style={{ backgroundColor: NICHE_COLORS[currentNiche.id] || '#7C3AED' }}
            />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold text-white uppercase">{currentNiche.title}</h2>
                {currentNiche.badge && (
                  <Badge variant="secondary" className="text-xs uppercase bg-[var(--color-brand)]/20 text-[var(--color-brand)]">{currentNiche.badge}</Badge>
                )}
              </div>
              <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                Exploração profunda de palavras-chave, anúncios ativos e b-rolls do mercado americano.
              </p>
            </div>
          </div>

          {/* Local filter input */}
          <div className="relative min-w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Filtrar nesta aba..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-[#171a20] border border-[var(--color-border)] rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[var(--color-brand)]"
            />
          </div>
        </div>

        {/* Subtabs Bar */}
        {availableSubtabs.length > 0 && (
          <div className="flex flex-wrap gap-1 px-5 pt-3 border-b border-[var(--color-border)] bg-[#1e222a]">
            {availableSubtabs.map(tab => {
              const isActive = activeSubtab === tab.key
              const Icon = tab.icon || Layers
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveSubtab(tab.key)}
                  className={`px-3.5 py-2 text-xs font-semibold rounded-t-lg transition-all flex items-center gap-2 border-b-2 ${
                    isActive
                      ? 'border-[var(--color-brand)] text-[var(--color-brand)] bg-[#1a1d24]'
                      : 'border-transparent text-[var(--color-text-muted)] hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                  {tab.count !== undefined && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/40 text-gray-400 font-mono">
                      {tab.count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        )}

        {/* Tab Content Panels */}
        <div className="p-6">
          {/* 1. ADS LIBRARY TAB */}
          {activeSubtab === 'ads_kw' && (
            <div className="space-y-6">
              {/* Keywords Section */}
              {currentNiche.ads_keywords && currentNiche.ads_keywords.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <Flame className="w-4 h-4 text-orange-400" />
                      Palavras-Chave de Busca Direta (Meta Ads Library)
                    </h3>
                    <span className="text-xs text-[var(--color-text-muted)]">
                      {filteredKeywords(currentNiche.ads_keywords).length} termos
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                    {filteredKeywords(currentNiche.ads_keywords).map((kw, idx) => {
                      const url = adsUrl(kw)
                      const isCopied = copiedKey === `ads-kw-${idx}`
                      return (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-3 rounded-lg bg-[#21252d] border border-white/5 hover:border-[var(--color-brand)]/50 transition-all group"
                        >
                          <span className="text-xs font-medium text-gray-200 truncate pr-2 font-mono">
                            {kw}
                          </span>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <button
                              onClick={() => handleCopy(kw, `ads-kw-${idx}`)}
                              className="p-1.5 rounded bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
                              title="Copiar keyword"
                            >
                              {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                            <a
                              href={url}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 rounded bg-[var(--color-brand)]/20 hover:bg-[var(--color-brand)]/40 text-[var(--color-brand)] transition-colors"
                              title="Abrir pesquisa na Meta Ads Library"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Ads Links Section */}
              {currentNiche.ads_links && currentNiche.ads_links.length > 0 && (
                <div className="pt-4 border-t border-white/5">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                    <ExternalLink className="w-4 h-4 text-blue-400" />
                    Links Prontos de Anúncios na Ads Library
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                    {filteredLinks(currentNiche.ads_links).map((link, idx) => (
                      <a
                        key={idx}
                        href={link.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-between p-3 rounded-lg bg-[#21252d] border border-white/5 hover:border-blue-500/50 transition-all group text-left"
                      >
                        <span className="text-xs font-medium text-blue-300 group-hover:text-blue-200 truncate pr-2">
                          {link.label}
                        </span>
                        <ExternalLink className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 2. TIKTOK TAB */}
          {activeSubtab === 'tt_kw' && (
            <div className="space-y-6">
              {currentNiche.tiktok_keywords && currentNiche.tiktok_keywords.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Radio className="w-4 h-4 text-pink-400" />
                    Buscas & Tags de B-Rolls no TikTok
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                    {filteredKeywords(currentNiche.tiktok_keywords).map((kw, idx) => {
                      const url = tiktokUrl(kw)
                      const isCopied = copiedKey === `tt-kw-${idx}`
                      return (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-3 rounded-lg bg-[#21252d] border border-white/5 hover:border-pink-500/50 transition-all group"
                        >
                          <span className="text-xs font-medium text-gray-200 truncate pr-2 font-mono">
                            {kw}
                          </span>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <button
                              onClick={() => handleCopy(kw, `tt-kw-${idx}`)}
                              className="p-1.5 rounded bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
                              title="Copiar termo"
                            >
                              {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                            <a
                              href={url}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 rounded bg-pink-500/20 hover:bg-pink-500/40 text-pink-400 transition-colors"
                              title="Pesquisar no TikTok"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {currentNiche.tiktok_links && currentNiche.tiktok_links.length > 0 && (
                <div className="pt-4 border-t border-white/5">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-3">Links Diretos do TikTok</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                    {filteredLinks(currentNiche.tiktok_links).map((link, idx) => (
                      <a
                        key={idx}
                        href={link.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-between p-3 rounded-lg bg-[#21252d] border border-white/5 hover:border-pink-500/50 transition-all group"
                      >
                        <span className="text-xs font-medium text-pink-300 group-hover:text-pink-200 truncate pr-2">
                          {link.label}
                        </span>
                        <ExternalLink className="w-3.5 h-3.5 text-pink-400 flex-shrink-0" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 3. INSTAGRAM TAB */}
          {activeSubtab === 'ig_kw' && (
            <div className="space-y-6">
              {currentNiche.instagram_keywords && currentNiche.instagram_keywords.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Share2 className="w-4 h-4 text-purple-400" />
                    Tags & Explore do Instagram
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                    {filteredKeywords(currentNiche.instagram_keywords).map((kw, idx) => {
                      const url = instagramExploreUrl(kw)
                      const isCopied = copiedKey === `ig-kw-${idx}`
                      return (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-3 rounded-lg bg-[#21252d] border border-white/5 hover:border-purple-500/50 transition-all group"
                        >
                          <span className="text-xs font-medium text-gray-200 truncate pr-2 font-mono">
                            {kw}
                          </span>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <button
                              onClick={() => handleCopy(kw, `ig-kw-${idx}`)}
                              className="p-1.5 rounded bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
                              title="Copiar termo"
                            >
                              {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                            <a
                              href={url}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 rounded bg-purple-500/20 hover:bg-purple-500/40 text-purple-400 transition-colors"
                              title="Pesquisar no Instagram"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 4. PINTEREST & FACEBOOK TAB */}
          {activeSubtab === 'pin_kw' && (
            <div className="space-y-6">
              {currentNiche.pinterest_keywords && currentNiche.pinterest_keywords.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-red-400" />
                    Keywords de Pins no Pinterest
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                    {filteredKeywords(currentNiche.pinterest_keywords).map((kw, idx) => {
                      const url = pinterestUrl(kw)
                      const isCopied = copiedKey === `pin-kw-${idx}`
                      return (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-3 rounded-lg bg-[#21252d] border border-white/5 hover:border-red-500/50 transition-all group"
                        >
                          <span className="text-xs font-medium text-gray-200 truncate pr-2 font-mono">
                            {kw}
                          </span>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <button
                              onClick={() => handleCopy(kw, `pin-kw-${idx}`)}
                              className="p-1.5 rounded bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
                              title="Copiar termo"
                            >
                              {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                            <a
                              href={url}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 rounded bg-red-500/20 hover:bg-red-500/40 text-red-400 transition-colors"
                              title="Pesquisar no Pinterest"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 5. PROFILES TAB */}
          {activeSubtab === 'profiles' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-emerald-400" />
                Perfis de Concorrentes & Criadores de Conteúdo
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {currentNiche.tiktok_profiles?.map((p, idx) => (
                  <a
                    key={`tt-p-${idx}`}
                    href={p.url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-4 rounded-xl bg-[#21252d] border border-white/5 hover:border-emerald-500/50 transition-all group flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-white group-hover:text-emerald-400 transition-colors">
                          {p.name}
                        </span>
                        <Badge variant="outline" className="text-[9px] uppercase text-pink-400 border-pink-400/30">
                          TikTok
                        </Badge>
                      </div>
                      {p.handle && <p className="text-xs text-gray-400 font-mono">{p.handle}</p>}
                      {p.note && <p className="text-xs text-gray-300 mt-2 bg-black/20 p-2 rounded">{p.note}</p>}
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-gray-500 mt-3 pt-2 border-t border-white/5">
                      <span>{p.followers || 'Ver perfil'}</span>
                      <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                  </a>
                ))}

                {currentNiche.instagram_profiles?.map((p, idx) => (
                  <a
                    key={`ig-p-${idx}`}
                    href={p.url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-4 rounded-xl bg-[#21252d] border border-white/5 hover:border-purple-500/50 transition-all group flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-white group-hover:text-purple-400 transition-colors">
                          {p.name}
                        </span>
                        <Badge variant="outline" className="text-[9px] uppercase text-purple-400 border-purple-400/30">
                          Instagram
                        </Badge>
                      </div>
                      {p.handle && <p className="text-xs text-gray-400 font-mono">{p.handle}</p>}
                      {p.note && <p className="text-xs text-gray-300 mt-2 bg-black/20 p-2 rounded">{p.note}</p>}
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-gray-500 mt-3 pt-2 border-t border-white/5">
                      <span>{p.followers || 'Ver perfil'}</span>
                      <ExternalLink className="w-3.5 h-3.5 text-purple-400" />
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* 6. REELS TAB */}
          {activeSubtab === 'reels' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                <Film className="w-4 h-4 text-cyan-400" />
                Reels & Referências de Vídeo
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {currentNiche.reels?.map((r, idx) => (
                  <a
                    key={idx}
                    href={r.url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-3.5 rounded-xl bg-[#21252d] border border-white/5 hover:border-cyan-500/50 transition-all group flex items-center justify-between"
                  >
                    <div className="pr-3">
                      <p className="text-xs font-semibold text-white group-hover:text-cyan-300">{r.label}</p>
                      {r.profile && <p className="text-[10px] text-gray-400 font-mono mt-0.5">@{r.profile}</p>}
                    </div>
                    <ExternalLink className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* 7. NOTICIAS TAB */}
          {activeSubtab === 'noticias' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                <Newspaper className="w-4 h-4 text-amber-400" />
                Fontes de Notícias, Estudos & Descobertas Científicas
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {newsSourcesFor(currentNiche).map((src, idx) => (
                  <a
                    key={idx}
                    href={src.url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-3.5 rounded-xl bg-[#21252d] border border-white/5 hover:border-amber-500/50 transition-all group flex items-center justify-between"
                  >
                    <span className="text-xs font-semibold text-white group-hover:text-amber-300">{src.label}</span>
                    <ExternalLink className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* 8. TRENDS TAB */}
          {activeSubtab === 'trends' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                Plataformas de Tendências & Trending Searches
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {trendsSourcesFor(currentNiche).map((src, idx) => (
                  <a
                    key={idx}
                    href={src.url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-3.5 rounded-xl bg-[#21252d] border border-white/5 hover:border-emerald-500/50 transition-all group flex items-center justify-between"
                  >
                    <span className="text-xs font-semibold text-white group-hover:text-emerald-300">{src.label}</span>
                    <ExternalLink className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* 9. PROGRAMAS TAB */}
          {activeSubtab === 'programas' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                <Tv className="w-4 h-4 text-indigo-400" />
                Programas de TV & Formatos Populares Americanos
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {programsList().map((prog, idx) => (
                  <a
                    key={idx}
                    href={prog.url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-3.5 rounded-xl bg-[#21252d] border border-white/5 hover:border-indigo-500/50 transition-all group flex items-center justify-between"
                  >
                    <span className="text-xs font-semibold text-white group-hover:text-indigo-300">{prog.label}</span>
                    <ExternalLink className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Spotlight Search Modal */}
      <SpySearchModal
        isOpen={showSearchModal}
        onClose={() => setShowSearchModal(false)}
        onSelectNiche={(nicheId) => {
          const niche = spyData.niches.find(n => n.id === nicheId)
          if (niche) {
            setActiveGroup(niche.group)
            setActiveNicheId(niche.id)
            if (niche.shape === 'news') {
              setActiveSubtab('noticias')
            } else {
              setActiveSubtab('ads_kw')
            }
          }
        }}
      />
    </div>
  )
}
