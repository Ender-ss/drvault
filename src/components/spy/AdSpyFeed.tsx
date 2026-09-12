import { useState, useMemo, useEffect } from 'react'
import { 
  Search, 
  Flame, 
  Play, 
  BookmarkPlus, 
  Check, 
  TrendingUp, 
  Globe, 
  Loader2, 
  RefreshCw, 
  Video, 
  Key 
} from 'lucide-react'
import { scaledAdsData } from '../../data/adSpyData'
import { searchMetaAds, fetchTikTokTopAds, type LiveAdItem } from '../../services/spyApi'
import { useMediaItems } from '../../hooks/useMediaItems'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { MediaInspectorModal } from './MediaInspectorModal'

type SpyMode = 'tiktok_live' | 'meta_live' | 'curated'

export function AdSpyFeed() {
  const { addMediaItem } = useMediaItems()
  const [mode, setMode] = useState<SpyMode>('tiktok_live')
  
  // Curated State
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedNiche, setSelectedNiche] = useState('Todos')
  const [selectedPlatform, setSelectedPlatform] = useState('Todas')
  const [selectedMinDays, setSelectedMinDays] = useState<number>(0)

  // TikTok Live State
  const [ttCountry, setTtCountry] = useState('BR')
  const [ttIndustry, setTtIndustry] = useState('all')
  const [ttPeriod, setTtPeriod] = useState<number>(30)
  const [ttAds, setTtAds] = useState<LiveAdItem[]>([])
  const [ttLoading, setTtLoading] = useState(false)
  const [ttError, setTtError] = useState('')

  // Meta Live State
  const [metaQuery, setMetaQuery] = useState('diabetes')
  const [metaCountry, setMetaCountry] = useState('BR')
  const [metaStatus] = useState('ACTIVE')
  const [metaToken, setMetaToken] = useState('')
  const [showTokenInput, setShowTokenInput] = useState(false)
  const [metaAds, setMetaAds] = useState<LiveAdItem[]>([])
  const [metaLoading, setMetaLoading] = useState(false)
  const [metaError, setMetaError] = useState('')

  // Inspector & Saved State
  const [inspectorData, setInspectorData] = useState<{
    isOpen: boolean
    title: string
    url: string
    niche?: string
    category?: string
    thumbUrl?: string
    tags?: string[]
  }>({
    isOpen: false,
    title: '',
    url: ''
  })
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set())

  // Niches and filters
  const niches = ['Todos', 'Diabetes', 'Emagrecimento', 'Alzheimer', 'Neuropatia', 'Disfunção Erétil', 'Dental']
  const platforms = ['Todas', 'meta', 'tiktok', 'youtube']

  // Initial fetch for TikTok live ads
  useEffect(() => {
    loadTikTokAds()
  }, [ttCountry, ttIndustry, ttPeriod])

  const loadTikTokAds = async () => {
    setTtLoading(true)
    setTtError('')
    try {
      const res = await fetchTikTokTopAds(ttCountry, ttIndustry, ttPeriod)
      if (res.success && res.data) {
        setTtAds(res.data)
      } else {
        setTtError(res.error || 'Não foi possível carregar os dados do TikTok')
      }
    } catch (err: any) {
      setTtError(err.message || 'Erro ao conectar ao motor de Spy do TikTok')
    } finally {
      setTtLoading(false)
    }
  }

  const handleSearchMeta = async () => {
    if (!metaQuery.trim()) return
    setMetaLoading(true)
    setMetaError('')
    try {
      const res = await searchMetaAds(metaQuery, metaCountry, metaStatus, metaToken || undefined)
      if (res.success && res.data) {
        setMetaAds(res.data)
      } else {
        setMetaError(res.error || 'Não foi possível buscar na Biblioteca de Anúncios')
      }
    } catch (err: any) {
      setMetaError(err.message || 'Erro ao conectar ao motor de Spy do Meta')
    } finally {
      setMetaLoading(false)
    }
  }

  // Filter curated ads
  const filteredCuratedAds = useMemo(() => {
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

  const handleSaveItem = async (
    id: string,
    title: string,
    videoUrl: string,
    thumbUrl?: string,
    niche?: string,
    source?: string,
    e?: React.MouseEvent
  ) => {
    if (e) e.stopPropagation()
    try {
      await addMediaItem({
        id: `spy-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        title: title || 'Criativo Live Spy',
        driveLink: videoUrl,
        thumbUrl: thumbUrl || '',
        niche: niche || 'Direct Response',
        category: 'avatar',
        tags: ['Live Spy', source || 'Ad Explorer'],
        isFavorite: true
      })
      setSavedIds(prev => new Set(prev).add(id))
    } catch (err) {
      console.error('Error saving item:', err)
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Banner & Mode Switcher */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-[#1b1f27] via-[#1a2333] to-[#161a22] border border-[var(--color-border)] shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-[var(--color-brand)]/15 text-[var(--color-brand)]">
                <Flame className="w-5 h-5 animate-pulse" />
              </span>
              <h2 className="text-xl font-bold text-white tracking-tight">
                Live Ad Spy & Competitor Intelligence
              </h2>
            </div>
            <p className="text-xs text-gray-400 max-w-2xl leading-relaxed">
              Monitore criativos validados em tempo real no <strong>TikTok Creative Center</strong> e na <strong>Meta Ads Library</strong>. Assista com o player in-app e salve na sua Biblioteca DRVault com 1 clique.
            </p>
          </div>

          {/* Mode Selector Tabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-black/40 border border-white/5 self-start lg:self-auto">
            <button
              onClick={() => setMode('tiktok_live')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                mode === 'tiktok_live'
                  ? 'bg-[#00f2fe]/20 text-[#00f2fe] border border-[#00f2fe]/30 shadow-lg'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Video className="w-4 h-4" />
              TikTok Radar (Live)
            </button>
            <button
              onClick={() => {
                setMode('meta_live')
                if (metaAds.length === 0) handleSearchMeta()
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                mode === 'meta_live'
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30 shadow-lg'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Globe className="w-4 h-4" />
              Meta Ads Library (Live)
            </button>
            <button
              onClick={() => setMode('curated')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                mode === 'curated'
                  ? 'bg-[var(--color-brand)]/20 text-[var(--color-brand)] border border-[var(--color-brand)]/30 shadow-lg'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              DR Validados (Curado)
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODE 1: TIKTOK CREATIVE CENTER RADAR (LIVE)                               */}
      {/* ========================================================================= */}
      {mode === 'tiktok_live' && (
        <div className="space-y-5 animate-in fade-in duration-300">
          {/* Controls Bar */}
          <div className="p-4 rounded-xl bg-[#1a1d24] border border-[var(--color-border)] flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              {/* Country */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-400">País:</span>
                <select
                  value={ttCountry}
                  onChange={(e) => setTtCountry(e.target.value)}
                  className="bg-[#121418] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[var(--color-brand)]"
                >
                  <option value="BR">🇧🇷 Brasil</option>
                  <option value="US">🇺🇸 Estados Unidos</option>
                  <option value="GB">🇬🇧 Reino Unido</option>
                  <option value="AU">🇦🇺 Austrália</option>
                  <option value="DE">🇩🇪 Alemanha</option>
                  <option value="FR">🇫🇷 França</option>
                </select>
              </div>

              {/* Industry / Niche */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-400">Nicho / Indústria:</span>
                <select
                  value={ttIndustry}
                  onChange={(e) => setTtIndustry(e.target.value)}
                  className="bg-[#121418] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[var(--color-brand)]"
                >
                  <option value="all">Todas as Indústrias</option>
                  <option value="health">Saúde & Suplementos (Health)</option>
                  <option value="beauty">Beleza & Cosméticos (Beauty)</option>
                  <option value="ecommerce">E-Commerce & Produtos Físicos</option>
                  <option value="education">Educação & Infoprodutos</option>
                  <option value="financial">Finanças & Renda Extra</option>
                </select>
              </div>

              {/* Period */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-400">Período:</span>
                <div className="flex items-center gap-1 p-0.5 rounded-lg bg-black/40 border border-white/5">
                  {[7, 30, 180].map((d) => (
                    <button
                      key={d}
                      onClick={() => setTtPeriod(d)}
                      className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                        ttPeriod === d
                          ? 'bg-[var(--color-brand)] text-white'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      {d}d
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={loadTikTokAds}
              disabled={ttLoading}
              className="text-xs flex items-center gap-1.5 border-white/10 hover:bg-white/5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${ttLoading ? 'animate-spin text-[var(--color-brand)]' : ''}`} />
              {ttLoading ? 'Consultando Radar...' : 'Atualizar Top Ads'}
            </Button>
          </div>

          {/* Error Message */}
          {ttError && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
              {ttError}
            </div>
          )}

          {/* Loading Skeleton */}
          {ttLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="h-80 rounded-2xl bg-white/[0.02] border border-white/5 animate-pulse flex flex-col justify-end p-4 space-y-2">
                  <div className="h-4 bg-white/10 rounded w-3/4" />
                  <div className="h-3 bg-white/5 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : ttAds.length === 0 ? (
            <div className="text-center py-16 bg-[#1a1d24] border border-[var(--color-border)] rounded-2xl space-y-3">
              <Video className="w-12 h-12 mx-auto text-gray-600 animate-bounce" />
              <p className="text-sm font-semibold text-gray-300">Nenhum anúncio encontrado para este filtro</p>
              <p className="text-xs text-gray-500">Tente selecionar outro país ou período.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {ttAds.map((item) => {
                const isSaved = savedIds.has(item.id)
                return (
                  <div
                    key={item.id}
                    className="group flex flex-col rounded-2xl bg-[#1a1d24] border border-[var(--color-border)] hover:border-[#00f2fe]/40 transition-all duration-300 overflow-hidden shadow-lg hover:shadow-2xl hover:-translate-y-1"
                  >
                    {/* Video / Thumbnail Container */}
                    <div className="relative aspect-[9/16] bg-black overflow-hidden flex items-center justify-center cursor-pointer"
                      onClick={() => setInspectorData({
                        isOpen: true,
                        title: item.title,
                        url: item.video_url,
                        niche: item.niche,
                        category: 'avatar',
                        thumbUrl: item.thumb_url,
                        tags: ['TikTok Radar', item.ctr_rating || 'Top Performer']
                      })}
                    >
                      {item.thumb_url ? (
                        <img
                          src={item.thumb_url}
                          alt={item.title}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="text-gray-600 flex flex-col items-center gap-2">
                          <Video className="w-10 h-10" />
                          <span className="text-[10px]">Preview Indisponível</span>
                        </div>
                      )}

                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

                      {/* CTR & Rank Badge */}
                      <div className="absolute top-3 left-3 flex items-center gap-1.5">
                        <span className="px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider bg-[#00f2fe]/90 text-black shadow-md">
                          CTR {item.ctr_rating}
                        </span>
                        <span className="px-2 py-1 rounded-md text-[10px] font-bold bg-black/60 backdrop-blur-md text-white border border-white/10">
                          {item.duration_sec}s
                        </span>
                      </div>

                      {/* Play Hover Trigger */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 backdrop-blur-[2px]">
                        <div className="w-14 h-14 rounded-full bg-[#00f2fe] text-black flex items-center justify-center shadow-2xl transform group-hover:scale-110 transition-transform">
                          <Play className="w-6 h-6 fill-current translate-x-0.5" />
                        </div>
                      </div>

                      {/* Likes count */}
                      {item.likes ? (
                        <div className="absolute bottom-3 left-3 flex items-center gap-1 text-[11px] font-semibold text-white/90 bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded">
                          ❤️ {item.likes.toLocaleString()}
                        </div>
                      ) : null}
                    </div>

                    {/* Content Details */}
                    <div className="p-4 flex-1 flex flex-col justify-between space-y-3 bg-[#171a21]">
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="text-[11px] font-bold text-gray-400 truncate">
                            {item.brand_name}
                          </span>
                          <Badge variant="outline" className="text-[9px] uppercase tracking-wider border-white/10 text-gray-400">
                            {ttCountry}
                          </Badge>
                        </div>
                        <h4 className="text-xs font-semibold text-white line-clamp-2 leading-snug">
                          {item.title}
                        </h4>
                      </div>

                      {/* Action Buttons */}
                      <div className="pt-2 border-t border-white/5 flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setInspectorData({
                            isOpen: true,
                            title: item.title,
                            url: item.video_url,
                            niche: item.niche,
                            category: 'avatar',
                            thumbUrl: item.thumb_url,
                            tags: ['TikTok Radar', item.ctr_rating || 'Top Performer']
                          })}
                          className="flex-1 text-[11px] h-8 bg-white/5 hover:bg-white/10 border-white/10 text-white"
                        >
                          <Play className="w-3 h-3 fill-current mr-1" />
                          Assistir
                        </Button>

                        <button
                          onClick={(e) => handleSaveItem(item.id, item.title, item.video_url, item.thumb_url, item.niche, 'TikTok Radar Live', e)}
                          disabled={isSaved}
                          className={`p-2 rounded-lg text-xs font-semibold transition-all ${
                            isSaved
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-[var(--color-brand)]/15 text-[var(--color-brand)] hover:bg-[var(--color-brand)] hover:text-white border border-[var(--color-brand)]/30'
                          }`}
                          title="Salvar na Biblioteca DRVault"
                        >
                          {isSaved ? <Check className="w-4 h-4" /> : <BookmarkPlus className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 2: META ADS LIBRARY LIVE SEARCH                                      */}
      {/* ========================================================================= */}
      {mode === 'meta_live' && (
        <div className="space-y-5 animate-in fade-in duration-300">
          {/* Search Box & Controls */}
          <div className="p-5 rounded-2xl bg-[#1a1d24] border border-[var(--color-border)] space-y-4">
            <div className="flex flex-col md:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={metaQuery}
                  onChange={(e) => setMetaQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearchMeta()}
                  placeholder="Pesquise anúncios ativos na Meta (ex: diabetes, calvície, próstata, emagrecimento, curso)..."
                  className="w-full bg-[#121418] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Country */}
              <select
                value={metaCountry}
                onChange={(e) => setMetaCountry(e.target.value)}
                className="bg-[#121418] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 w-full md:w-auto"
              >
                <option value="BR">🇧🇷 Brasil</option>
                <option value="US">🇺🇸 Estados Unidos</option>
                <option value="PT">🇵🇹 Portugal</option>
                <option value="ES">🇪🇸 Espanha</option>
                <option value="GB">🇬🇧 Reino Unido</option>
                <option value="MX">🇲🇽 México</option>
              </select>

              <Button
                onClick={handleSearchMeta}
                disabled={metaLoading}
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-6 py-2.5 rounded-xl flex items-center gap-2 w-full md:w-auto shadow-lg shadow-blue-600/20"
              >
                {metaLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                {metaLoading ? 'Buscando...' : 'Buscar no Meta'}
              </Button>
            </div>

            {/* Advanced Settings: Optional Meta Graph Token */}
            <div className="pt-2 border-t border-white/5 flex flex-wrap items-center justify-between gap-3 text-xs">
              <button
                onClick={() => setShowTokenInput(!showTokenInput)}
                className="text-gray-400 hover:text-blue-400 flex items-center gap-1.5 transition-colors"
              >
                <Key className="w-3.5 h-3.5" />
                {showTokenInput ? 'Ocultar Token da Graph API' : 'Conectar Token Oficial da Meta (Opcional)'}
              </button>

              <div className="flex items-center gap-2 text-gray-500">
                <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
                Consultando Meta Ads Library Playwright Engine
              </div>
            </div>

            {showTokenInput && (
              <div className="p-3 rounded-xl bg-black/40 border border-white/5 animate-in fade-in space-y-2">
                <label className="text-[11px] font-semibold text-gray-300">
                  Access Token de Desenvolvedor Facebook (Graph API):
                </label>
                <input
                  type="password"
                  value={metaToken}
                  onChange={(e) => setMetaToken(e.target.value)}
                  placeholder="EAA..."
                  className="w-full bg-[#121418] border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-blue-500"
                />
              </div>
            )}
          </div>

          {/* Error Message */}
          {metaError && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
              {metaError}
            </div>
          )}

          {/* Results Grid */}
          {metaLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-64 rounded-2xl bg-white/[0.02] border border-white/5 animate-pulse p-4 space-y-3">
                  <div className="h-4 bg-white/10 rounded w-1/2" />
                  <div className="h-20 bg-white/5 rounded" />
                  <div className="h-8 bg-white/10 rounded" />
                </div>
              ))}
            </div>
          ) : metaAds.length === 0 ? (
            <div className="text-center py-16 bg-[#1a1d24] border border-[var(--color-border)] rounded-2xl space-y-3">
              <Globe className="w-12 h-12 mx-auto text-gray-600" />
              <p className="text-sm font-semibold text-gray-300">Nenhum anúncio carregado ainda</p>
              <p className="text-xs text-gray-500">Digite um termo acima e clique em "Buscar no Meta".</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {metaAds.map((item) => {
                const isSaved = savedIds.has(item.id)
                return (
                  <div
                    key={item.id}
                    className="flex flex-col rounded-2xl bg-[#1a1d24] border border-[var(--color-border)] hover:border-blue-500/40 transition-all duration-300 overflow-hidden shadow-lg justify-between space-y-3"
                  >
                    {/* Card Thumbnail / Preview */}
                    {item.thumb_url && !item.thumb_url.includes('unsplash') ? (
                      <div 
                        className="relative aspect-video bg-black overflow-hidden flex items-center justify-center cursor-pointer group"
                        onClick={() => setInspectorData({
                          isOpen: true,
                          title: item.title,
                          url: item.video_url,
                          niche: item.niche,
                          category: 'avatar',
                          thumbUrl: item.thumb_url,
                          tags: ['Meta Ads Library', item.niche]
                        })}
                      >
                        <img
                          src={item.thumb_url}
                          alt={item.title}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                          <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg">
                            <Play className="w-4 h-4 fill-current translate-x-0.5" />
                          </div>
                        </div>
                      </div>
                    ) : null}

                    <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                      <div>
                        {/* Header */}
                        <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-white/5">
                          <div className="flex items-center gap-2.5 min-w-0">
                            {item.thumb_url && item.thumb_url.includes('scontent') ? (
                              <img 
                                src={item.thumb_url} 
                                alt={item.brand_name}
                                referrerPolicy="no-referrer"
                                className="w-7 h-7 rounded-full object-cover border border-white/10" 
                              />
                            ) : (
                              <div className="w-7 h-7 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center font-black text-xs">
                                f
                              </div>
                            )}
                            <div className="min-w-0">
                              <h4 className="text-xs font-bold text-white truncate">{item.brand_name}</h4>
                              <span className="text-[10px] text-gray-400">{item.days_active}d ativo • {metaCountry}</span>
                            </div>
                          </div>
                          <Badge variant="secondary" className="text-[9px] bg-emerald-500/15 text-emerald-400 border-0">
                            ATIVO
                          </Badge>
                        </div>

                        {/* Title & Copy Preview */}
                        {item.title && (
                          <h5 className="text-[11px] font-semibold text-gray-200 mt-2 line-clamp-1">
                            {item.title}
                          </h5>
                        )}
                        <p className="mt-2 text-[11px] text-gray-300 leading-relaxed line-clamp-4 bg-black/25 p-2.5 rounded-xl border border-white/5 font-sans">
                          {item.copy_transcript}
                        </p>
                      </div>

                      {/* Action Buttons */}
                      <div className="pt-2 flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setInspectorData({
                            isOpen: true,
                            title: item.title || item.brand_name,
                            url: item.video_url,
                            niche: item.niche,
                            category: 'avatar',
                            thumbUrl: item.thumb_url,
                            tags: ['Meta Ads Library', item.niche]
                          })}
                          className="flex-1 text-xs h-8 bg-blue-600/10 hover:bg-blue-600/20 border-blue-500/20 text-blue-400"
                        >
                          <Play className="w-3 h-3 mr-1.5 fill-current" />
                          Inspecionar
                        </Button>

                        <button
                          onClick={(e) => handleSaveItem(item.id, item.title || item.brand_name, item.video_url, item.thumb_url, item.niche, 'Meta Ads Library', e)}
                          disabled={isSaved}
                          className={`p-2 rounded-lg text-xs font-semibold transition-all ${
                            isSaved
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-white/5 text-gray-300 hover:text-white hover:bg-white/10 border border-white/10'
                          }`}
                          title="Salvar na Biblioteca DRVault"
                        >
                          {isSaved ? <Check className="w-3.5 h-3.5" /> : <BookmarkPlus className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 3: CURATED WINNING DR ADS                                            */}
      {/* ========================================================================= */}
      {mode === 'curated' && (
        <div className="space-y-5 animate-in fade-in duration-300">
          {/* Filters Bar */}
          <div className="p-4 rounded-xl bg-[#1a1d24] border border-[var(--color-border)] flex flex-wrap items-center justify-between gap-4">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Filtrar por título, copy, hook ou marca..."
                className="w-full bg-[#121418] border border-white/10 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[var(--color-brand)]"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={selectedNiche}
                onChange={(e) => setSelectedNiche(e.target.value)}
                className="bg-[#121418] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[var(--color-brand)]"
              >
                {niches.map(n => <option key={n} value={n}>{n}</option>)}
              </select>

              <select
                value={selectedPlatform}
                onChange={(e) => setSelectedPlatform(e.target.value)}
                className="bg-[#121418] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[var(--color-brand)]"
              >
                {platforms.map(p => <option key={p} value={p}>{p.toUpperCase()}</option>)}
              </select>

              <div className="flex items-center gap-1 p-0.5 rounded-lg bg-black/40 border border-white/5">
                {[0, 7, 14, 30].map(d => (
                  <button
                    key={d}
                    onClick={() => setSelectedMinDays(d)}
                    className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                      selectedMinDays === d
                        ? 'bg-[var(--color-brand)] text-white'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {d === 0 ? 'Todos' : `>${d}d`}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Curated Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredCuratedAds.map((ad) => {
              const isSaved = savedIds.has(ad.id)
              return (
                <div
                  key={ad.id}
                  className="group flex flex-col rounded-2xl bg-[#1a1d24] border border-[var(--color-border)] hover:border-[var(--color-brand)]/40 transition-all duration-300 overflow-hidden shadow-lg hover:shadow-2xl hover:-translate-y-1"
                >
                  <div
                    className="relative aspect-video bg-black overflow-hidden flex items-center justify-center cursor-pointer"
                    onClick={() => setInspectorData({
                      isOpen: true,
                      title: `${ad.brand} - ${ad.title}`,
                      url: ad.videoUrl,
                      niche: ad.niche,
                      category: 'avatar',
                      thumbUrl: ad.thumbUrl,
                      tags: ['Curado DR', ad.niche, `${ad.daysActive} dias`]
                    })}
                  >
                    <img
                      src={ad.thumbUrl}
                      alt={ad.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />

                    <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[var(--color-brand)] text-white shadow">
                        {ad.scaleScore}/100 🔥
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-black/60 backdrop-blur-md text-gray-200 border border-white/10">
                        {ad.daysActive} dias no ar
                      </span>
                    </div>

                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 backdrop-blur-[2px]">
                      <div className="w-12 h-12 rounded-full bg-[var(--color-brand)] text-white flex items-center justify-center shadow-2xl transform group-hover:scale-110 transition-transform">
                        <Play className="w-5 h-5 fill-current translate-x-0.5" />
                      </div>
                    </div>
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3 bg-[#171a21]">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-[11px] font-bold text-gray-400 truncate">{ad.brand}</span>
                        <Badge variant="outline" className="text-[9px] uppercase border-white/10 text-gray-400">
                          {ad.niche}
                        </Badge>
                      </div>
                      <h4 className="text-xs font-semibold text-white line-clamp-2 leading-snug">
                        {ad.title}
                      </h4>
                      <p className="mt-2 text-[11px] text-gray-400 italic line-clamp-2 bg-black/30 p-2 rounded-lg border border-white/5">
                        "{ad.hook}"
                      </p>
                    </div>

                    <div className="pt-2 border-t border-white/5 flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setInspectorData({
                          isOpen: true,
                          title: `${ad.brand} - ${ad.title}`,
                          url: ad.videoUrl,
                          niche: ad.niche,
                          category: 'avatar',
                          thumbUrl: ad.thumbUrl,
                          tags: ['Curado DR', ad.niche, `${ad.daysActive} dias`]
                        })}
                        className="flex-1 text-[11px] h-8 bg-white/5 hover:bg-white/10 border-white/10 text-white"
                      >
                        <Play className="w-3 h-3 fill-current mr-1" />
                        Assistir In-App
                      </Button>

                      <button
                        onClick={(e) => handleSaveItem(ad.id, `${ad.brand} - ${ad.title}`, ad.videoUrl, ad.thumbUrl, ad.niche, 'Acervo Curado DR', e)}
                        disabled={isSaved}
                        className={`p-2 rounded-lg text-xs font-semibold transition-all ${
                          isSaved
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-[var(--color-brand)]/15 text-[var(--color-brand)] hover:bg-[var(--color-brand)] hover:text-white border border-[var(--color-brand)]/30'
                        }`}
                        title="Salvar na Biblioteca DRVault"
                      >
                        {isSaved ? <Check className="w-4 h-4" /> : <BookmarkPlus className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Media Inspector Player Modal */}
      <MediaInspectorModal
        isOpen={inspectorData.isOpen}
        onClose={() => setInspectorData(prev => ({ ...prev, isOpen: false }))}
        title={inspectorData.title}
        url={inspectorData.url}
        niche={inspectorData.niche}
        category={inspectorData.category}
        thumbUrl={inspectorData.thumbUrl}
        tags={inspectorData.tags}
      />
    </div>
  )
}
