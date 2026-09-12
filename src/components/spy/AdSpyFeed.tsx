import { useState, useMemo } from 'react'
import { 
  Search, 
  Flame, 
  Play, 
  BookmarkPlus, 
  Check, 
  TrendingUp, 
  Layers, 
  Globe
} from 'lucide-react'
import { scaledAdsData, type ScaledAd } from '../../data/adSpyData'
import { useMediaItems } from '../../hooks/useMediaItems'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { MediaInspectorModal } from './MediaInspectorModal'

export function AdSpyFeed() {
  const { addMediaItem } = useMediaItems()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedNiche, setSelectedNiche] = useState('Todos')
  const [selectedPlatform, setSelectedPlatform] = useState('Todas')
  const [selectedMinDays, setSelectedMinDays] = useState<number>(0)
  const [inspectorAd, setInspectorAd] = useState<ScaledAd | null>(null)
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set())

  const niches = ['Todos', 'Diabetes', 'Emagrecimento', 'Alzheimer', 'Neuropatia', 'Disfunção Erétil', 'Dental']
  const platforms = ['Todas', 'meta', 'tiktok', 'youtube']

  const filteredAds = useMemo(() => {
    return scaledAdsData.filter(ad => {
      const matchesSearch = 
        !searchTerm.trim() ||
        ad.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ad.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ad.hook.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ad.copySnippet.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesNiche = selectedNiche === 'Todos' || ad.niche === selectedNiche
      const matchesPlatform = selectedPlatform === 'Todas' || ad.platform === selectedPlatform
      const matchesDays = ad.daysActive >= selectedMinDays

      return matchesSearch && matchesNiche && matchesPlatform && matchesDays
    })
  }, [searchTerm, selectedNiche, selectedPlatform, selectedMinDays])

  const handleSaveAd = async (ad: ScaledAd, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await addMediaItem({
        id: `ad-${Date.now()}`,
        title: `${ad.brand} - ${ad.title}`,
        driveLink: ad.videoUrl,
        thumbUrl: ad.thumbUrl,
        niche: ad.niche,
        category: 'avatar',
        tags: ['BigSpy Escalado', ad.format, `${ad.daysActive} dias`],
        isFavorite: true
      })
      setSavedIds(prev => new Set(prev).add(ad.id))
      setTimeout(() => {
        setSavedIds(prev => {
          const next = new Set(prev)
          next.delete(ad.id)
          return next
        })
      }, 3000)
    } catch (err) {
      console.error('Error saving ad:', err)
    }
  }

  return (
    <div className="space-y-6">
      {/* Banner / Intro */}
      <div className="bg-gradient-to-r from-purple-900/40 via-[#21252d] to-blue-900/40 p-6 rounded-2xl border border-[var(--color-border)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[var(--color-brand)] font-bold text-xs uppercase tracking-wider mb-1">
            <Flame className="w-4 h-4 text-orange-400" />
            BigSpy & Pipads Direct Response Engine
          </div>
          <h2 className="text-2xl font-black text-white">Criativos Escalados & Anúncios Ativos no Mercado Americano</h2>
          <p className="text-xs text-gray-300 mt-1 max-w-2xl">
            Monitore criativos validados há mais de 14 dias com alta escala no Facebook Ads e TikTok Ads. Reproduza o vídeo no player interno e salve na sua biblioteca com 1 clique.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-black/40 px-4 py-2.5 rounded-xl border border-white/10 text-center">
            <span className="text-xs text-gray-400 block font-medium">Anúncios no Feed</span>
            <span className="text-xl font-black text-white">{filteredAds.length}</span>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-[#1a1d24] p-4 rounded-xl border border-[var(--color-border)] flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por marca, hook, ângulo ou palavra-chave..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-[#14171d] border border-[var(--color-border)] rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[var(--color-brand)]"
          />
        </div>

        {/* Niche Filter */}
        <select
          value={selectedNiche}
          onChange={(e) => setSelectedNiche(e.target.value)}
          className="bg-[#14171d] border border-[var(--color-border)] text-xs text-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-[var(--color-brand)]"
        >
          {niches.map(n => <option key={n} value={n}>Nicho: {n}</option>)}
        </select>

        {/* Platform Filter */}
        <select
          value={selectedPlatform}
          onChange={(e) => setSelectedPlatform(e.target.value)}
          className="bg-[#14171d] border border-[var(--color-border)] text-xs text-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-[var(--color-brand)] uppercase"
        >
          {platforms.map(p => <option key={p} value={p}>Plataforma: {p}</option>)}
        </select>

        {/* Days Active Filter */}
        <select
          value={selectedMinDays}
          onChange={(e) => setSelectedMinDays(Number(e.target.value))}
          className="bg-[#14171d] border border-[var(--color-border)] text-xs text-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-[var(--color-brand)]"
        >
          <option value={0}>Tempo no Ar: Todos</option>
          <option value={7}>Escalados &gt; 7 dias</option>
          <option value={14}>Alta Escala &gt; 14 dias (Recomendado)</option>
          <option value={30}>Ultra Escalados &gt; 30 dias</option>
        </select>
      </div>

      {/* Ads Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAds.map(ad => {
          const isSaved = savedIds.has(ad.id)

          return (
            <div
              key={ad.id}
              className="bg-[#1a1d24] rounded-2xl border border-[var(--color-border)] hover:border-[var(--color-brand)]/60 transition-all flex flex-col overflow-hidden group shadow-lg hover:shadow-[var(--color-brand)]/10"
            >
              {/* Media Preview & Overlay */}
              <div 
                className="aspect-video bg-black relative overflow-hidden cursor-pointer group/media"
                onClick={() => setInspectorAd(ad)}
              >
                <img
                  src={ad.thumbUrl}
                  alt={ad.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover/media:scale-105 transition-transform duration-500 opacity-85"
                />

                {/* Scale Score Badge */}
                <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md border border-orange-500/40 text-orange-400 text-xs font-black">
                  <Flame className="w-3.5 h-3.5 fill-orange-400 text-orange-400" />
                  Score: {ad.scaleScore}/100
                </div>

                {/* Days Active Badge */}
                <div className="absolute top-3 right-3 z-10 flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-950/80 backdrop-blur-md border border-emerald-500/40 text-emerald-300 text-xs font-bold">
                  <TrendingUp className="w-3 h-3 text-emerald-400" />
                  {ad.daysActive} dias ativo
                </div>

                {/* Play Button Overlay */}
                <div className="absolute inset-0 bg-black/40 group-hover/media:bg-black/20 transition-all flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-[var(--color-brand)] text-white flex items-center justify-center shadow-2xl group-hover/media:scale-110 transition-transform">
                    <Play className="w-5 h-5 fill-white ml-0.5" />
                  </div>
                </div>

                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[11px] text-white/90 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg">
                  <span className="font-semibold uppercase text-[var(--color-brand)]">{ad.platform} Ads</span>
                  <span className="text-gray-300">{ad.country} Market</span>
                </div>
              </div>

              {/* Content Body */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  {/* Brand & Format */}
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-xs font-bold text-gray-300 uppercase truncate">
                      {ad.brand}
                    </span>
                    <Badge variant="outline" className="text-[10px] text-purple-300 border-purple-400/30">
                      {ad.format}
                    </Badge>
                  </div>

                  {/* Title */}
                  <h3 className="text-sm font-bold text-white line-clamp-2 mb-3 group-hover:text-[var(--color-brand)] transition-colors">
                    {ad.title}
                  </h3>

                  {/* Hook Box */}
                  <div className="bg-[#14171d] p-3 rounded-xl border border-white/5 space-y-1 mb-3">
                    <div className="text-[10px] font-bold text-orange-400 uppercase tracking-wider flex items-center gap-1">
                      <Flame className="w-3 h-3" /> Hook Principal:
                    </div>
                    <p className="text-xs text-gray-200 italic line-clamp-2">
                      {ad.hook}
                    </p>
                  </div>

                  {/* Angle */}
                  <div className="text-xs text-gray-400 flex items-center gap-1.5">
                    <span className="text-[var(--color-text-muted)] font-semibold">Ângulo:</span>
                    <span className="text-gray-200">{ad.angle}</span>
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="pt-4 border-t border-white/5 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {ad.adsLibraryUrl && (
                      <a
                        href={ad.adsLibraryUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
                        title="Ver Anúncios Ativos na Meta Ads Library"
                      >
                        <Layers className="w-4 h-4 text-blue-400" />
                      </a>
                    )}
                    {ad.landingPageUrl && (
                      <a
                        href={ad.landingPageUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
                        title="Ver Landing Page / VSL"
                      >
                        <Globe className="w-4 h-4 text-emerald-400" />
                      </a>
                    )}
                  </div>

                  <Button
                    variant={isSaved ? 'outline' : 'brand'}
                    size="sm"
                    onClick={(e) => handleSaveAd(ad, e)}
                    className="text-xs flex items-center gap-1.5"
                  >
                    {isSaved ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        Salvo!
                      </>
                    ) : (
                      <>
                        <BookmarkPlus className="w-3.5 h-3.5" />
                        Salvar Mídia
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Media Inspector Modal */}
      {inspectorAd && (
        <MediaInspectorModal
          isOpen={!!inspectorAd}
          onClose={() => setInspectorAd(null)}
          title={inspectorAd.title}
          url={inspectorAd.videoUrl}
          niche={inspectorAd.niche}
          category="avatar"
          thumbUrl={inspectorAd.thumbUrl}
          tags={['BigSpy', inspectorAd.format, `${inspectorAd.daysActive} dias`]}
        />
      )}
    </div>
  )
}
