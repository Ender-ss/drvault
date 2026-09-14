import { useState, useRef, useEffect } from "react"
import { Link as LinkIcon, Search, Plus, X, Edit, Trash2, Star, Copy, Upload, Play, Maximize2, Tag, ChevronDown, RotateCcw, Sparkles } from "lucide-react"


import { Badge } from "../components/ui/Badge"
import { Button } from "../components/ui/Button"
import { Input } from "../components/ui/Input"
import { type MediaItem } from "../data/mock"
import { useTagColors } from "../hooks/useTagColors"
import { useMediaItems } from "../hooks/useMediaItems"
import { ManageColorsModal } from "../components/editor/ManageColorsModal"
import { BatchEditModal } from "../components/editor/BatchEditModal"
import { MediaInspectorModal } from "../components/spy/MediaInspectorModal"
import { parseMediaUrl } from "../utils/embedUtils"

export default function Library() {
  const { 
    mediaItems, 
    addMediaItem, 
    updateMediaItem, 
    deleteMediaItem, 
    batchUpdateMediaItems, 
    batchDeleteMediaItems,
    uploadThumbnail,
    toggleFavorite
  } = useMediaItems()
  const [searchTerm, setSearchTerm] = useState("")
  const [filterTag, setFilterTag] = useState<string>("Todos")
  const [filterCategory, setFilterCategory] = useState<string>("Todos")
  const [filterBrollType, setFilterBrollType] = useState<string>("Todos")
  const [filterNiche, setFilterNiche] = useState<string>("Todos")
  const [filterFavorite, setFilterFavorite] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [showColorsModal, setShowColorsModal] = useState(false)
  const [showBatchModal, setShowBatchModal] = useState(false)
  const [editingItem, setEditingItem] = useState<MediaItem | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [previewItem, setPreviewItem] = useState<MediaItem | null>(null)
  const [playingId, setPlayingId] = useState<string | null>(null)
  const [agentStatus, setAgentStatus] = useState<{
    total: number
    processed: number
    remaining: number
    progress_percent: number
    status: string
  } | null>(null)

  useEffect(() => {
    const checkStatus = () => {
      fetch("/vision_agent_status.json")
        .then(r => r.ok ? r.json() : null)
        .then(data => { if (data) setAgentStatus(data) })
        .catch(() => {})
    }
    checkStatus()
    const interval = setInterval(checkStatus, 8000)
    return () => clearInterval(interval)
  }, [])

  // Tag filter dropdown state
  const [isTagDropdownOpen, setIsTagDropdownOpen] = useState(false)
  const [tagSearchTerm, setTagSearchTerm] = useState("")
  const tagDropdownRef = useRef<HTMLDivElement>(null)

  // Close tag dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (tagDropdownRef.current && !tagDropdownRef.current.contains(event.target as Node)) {
        setIsTagDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])
  
  const { colors, isLoaded } = useTagColors()


  // Form state
  const [formTitle, setFormTitle] = useState("")
  const [formDriveLink, setFormDriveLink] = useState("")
  const [formThumbUrl, setFormThumbUrl] = useState("")
  const [formNiche, setFormNiche] = useState("")
  const [formTags, setFormTags] = useState("")
  const [formCategory, setFormCategory] = useState("broll")
  const [formBrollType, setFormBrollType] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Unique values and tag counts for filters
  const tagCounts = mediaItems.reduce((acc, item) => {
    (item.tags || []).forEach(t => {
      acc[t] = (acc[t] || 0) + 1
    })
    return acc
  }, {} as Record<string, number>)

  // Sort tags by frequency, then alphabetically
  const allTags = Object.keys(tagCounts).sort((a, b) => {
    return tagCounts[b] - tagCounts[a] || a.localeCompare(b)
  })

  // Popular quick tags for top chips bar
  const popularQuickTags = allTags
    .filter(t => !['Standard', 'Importado', 'Google Drive'].includes(t))
    .slice(0, 12)

  const allNiches = [...new Set(mediaItems.map(m => m.niche))]
  const allCategories = [...new Set(mediaItems.map(m => m.category))]
  const allBrollTypes = [...new Set(mediaItems.map(m => m.brollType).filter(Boolean) as string[])]

  // Filtered list of tags for dropdown search
  const filteredDropdownTags = allTags.filter(t => 
    t.toLowerCase().includes(tagSearchTerm.toLowerCase())
  )

  const hasActiveFilters = searchTerm !== "" || filterTag !== "Todos" || filterNiche !== "Todos" || filterCategory !== "Todos" || (filterBrollType && filterBrollType !== "Todos") || filterFavorite

  const clearAllFilters = () => {
    setSearchTerm("")
    setFilterTag("Todos")
    setFilterNiche("Todos")
    setFilterCategory("Todos")
    setFilterBrollType("Todos")
    setFilterFavorite(false)
  }

  const filtered = mediaItems.filter(m => {
    const matchesSearch = searchTerm === "" ||
      m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.driveLink.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.visualDescription && m.visualDescription.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (m.sceneSummary && m.sceneSummary.toLowerCase().includes(searchTerm.toLowerCase())) ||
      m.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesTag = filterTag === "Todos" || m.tags.includes(filterTag)
    const matchesNiche = filterNiche === "Todos" || m.niche === filterNiche
    const matchesCategory = filterCategory === "Todos" || m.category === filterCategory
    const matchesBrollType = filterBrollType === "Todos" || m.brollType === filterBrollType
    const matchesFavorite = !filterFavorite || m.isFavorite
    return matchesSearch && matchesTag && matchesNiche && matchesCategory && matchesBrollType && matchesFavorite
  })


  const openNewModal = () => {
    setEditingItem(null)
    setFormTitle("")
    setFormDriveLink("")
    setFormThumbUrl("")
    setFormNiche("")
    setFormTags("")
    setFormCategory("broll")
    setFormBrollType("")
    setShowModal(true)
  }

  const openEditModal = (item: MediaItem) => {
    setEditingItem(item)
    setFormTitle(item.title)
    setFormDriveLink(item.driveLink)
    setFormThumbUrl(item.thumbUrl)
    setFormNiche(item.niche)
    setFormTags(item.tags.join(", "))
    setFormCategory(item.category)
    setFormBrollType(item.brollType || "")
    setShowModal(true)
  }

  const handleSave = () => {
    if (!formTitle.trim() || !formDriveLink.trim()) return
    const tags = formTags.split(",").map(t => t.trim()).filter(Boolean)
    if (editingItem) {
      updateMediaItem({
        ...editingItem,
        title: formTitle,
        thumbUrl: formThumbUrl || editingItem.thumbUrl,
        driveLink: formDriveLink,
        niche: formNiche || "Geral",
        tags: tags.length > 0 ? tags : ["Standard"],
        category: formCategory,
        brollType: formBrollType
      })
    } else {
      const newItem: MediaItem = {
        id: `m${Date.now()}`,
        title: formTitle,
        thumbUrl: formThumbUrl || `https://picsum.photos/seed/${Date.now()}/300/400`,
        driveLink: formDriveLink,
        niche: formNiche || "Geral",
        tags: tags.length > 0 ? tags : ["Standard"],
        category: formCategory,
        brollType: formBrollType
      }
      addMediaItem(newItem)
    }
    setShowModal(false)
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    try {
      const url = await uploadThumbnail(file)
      if (url) {
        setFormThumbUrl(url)
      }
    } finally {
      setIsUploading(false)
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const handleDelete = (id: string) => {
    deleteMediaItem(id)
  }

  const toggleSelection = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation()
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedIds(next)
  }

  const clearSelection = () => setSelectedIds(new Set())

  const handleBatchSave = (updates: Partial<MediaItem>) => {
    if (Object.keys(updates).length > 0) {
      batchUpdateMediaItems(Array.from(selectedIds), updates)
    }
    setShowBatchModal(false)
    clearSelection()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight uppercase">Biblioteca</h1>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-[var(--color-text-muted)] font-semibold text-sm">B-Rolls e Referências Visuais</p>
            {agentStatus && (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-[11px] text-emerald-400 font-medium">
                <span className={`w-1.5 h-1.5 rounded-full ${agentStatus.status === 'running' ? 'bg-emerald-400 animate-pulse' : 'bg-gray-400'}`} />
                <span>Leitura Visual IA: <strong>{agentStatus.processed}</strong>/{agentStatus.total} ({agentStatus.progress_percent}%)</span>
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-2 bg-[var(--color-surface)] px-3 py-1.5 rounded-md border border-[var(--color-brand)]/50 mr-2 shadow-sm shadow-[var(--color-brand)]/10">
              <span className="text-sm font-medium">{selectedIds.size} selecionados</span>
              <Button variant="brand" size="sm" onClick={() => setShowBatchModal(true)} className="ml-2 py-1 h-7">Editar</Button>
              <Button variant="outline" size="sm" onClick={() => {
                if(confirm(`Excluir ${selectedIds.size} itens selecionados?`)) {
                  batchDeleteMediaItems(Array.from(selectedIds))
                  clearSelection()
                }
              }} className="text-red-400 hover:text-red-300 border-red-900/50 hover:bg-red-900/20 py-1 h-7">Excluir</Button>
              <button onClick={clearSelection} title="Desmarcar todos" className="ml-1 text-[var(--color-text-muted)] hover:text-white bg-transparent p-1"><X className="w-4 h-4" /></button>
            </div>
          )}
          <Button variant="outline" onClick={() => setShowColorsModal(true)}>
            🎨 Gerenciar Cores
          </Button>
          <Button variant="brand" onClick={openNewModal}>
            <Plus className="w-4 h-4 mr-1" /> Nova Mídia
          </Button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-muted)]" />
          <Input className="pl-9" placeholder="Buscar por título, tag ou cena (ex: baking soda no pé)..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
        <select
          className="bg-[var(--color-surface)] border border-[var(--color-border)] text-sm text-[var(--color-text)] rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[var(--color-brand)]"
          value={filterNiche}
          onChange={e => setFilterNiche(e.target.value)}
        >
          <option value="Todos">Nicho: Todos</option>
          {allNiches.map(n => <option key={n} value={n}>{n}</option>)}
        </select>
        <select
          className="bg-[var(--color-surface)] border border-[var(--color-border)] text-sm text-[var(--color-text)] rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[var(--color-brand)]"
          value={filterCategory}
          onChange={e => setFilterCategory(e.target.value)}
        >
          <option value="Todos">Categoria: Todas</option>
          {allCategories.map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
        </select>
        {allBrollTypes.length > 0 && (
          <select
            className="bg-[var(--color-surface)] border border-[var(--color-border)] text-sm text-[var(--color-text)] rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[var(--color-brand)]"
            value={filterBrollType}
            onChange={e => setFilterBrollType(e.target.value)}
          >
            <option value="Todos">Tipo: Todos</option>
            {allBrollTypes.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        )}
        {/* Custom Modern Searchable Tag Dropdown */}
        <div className="relative" ref={tagDropdownRef}>
          <button
            type="button"
            onClick={() => setIsTagDropdownOpen(!isTagDropdownOpen)}
            className={`h-9 px-3 rounded-md border text-sm font-medium transition-all flex items-center gap-2 cursor-pointer ${
              filterTag !== "Todos"
                ? "bg-[var(--color-surface)] border-[var(--color-brand)] text-[var(--color-brand)] ring-1 ring-[var(--color-brand)]/30"
                : "bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text)] hover:border-[var(--color-border-hover)]"
            }`}
          >
            <Tag className="w-3.5 h-3.5 opacity-70" />
            <span className="truncate max-w-[150px]">
              {filterTag === "Todos" ? "Tag: Todas" : filterTag}
            </span>
            {filterTag !== "Todos" && (
              <span
                onClick={(e) => {
                  e.stopPropagation()
                  setFilterTag("Todos")
                }}
                className="p-0.5 hover:bg-white/10 rounded-full"
                title="Limpar tag"
              >
                <X className="w-3 h-3" />
              </span>
            )}
            <ChevronDown className={`w-3.5 h-3.5 opacity-60 transition-transform ${isTagDropdownOpen ? "rotate-180" : ""}`} />
          </button>

          {/* Dropdown Popover */}
          {isTagDropdownOpen && (
            <div className="absolute left-0 mt-1.5 w-72 max-h-80 bg-[#1a1d23] border border-[#2e333d] rounded-xl shadow-2xl z-50 flex flex-col overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
              <div className="p-2 border-b border-[#2e333d] bg-[#16181d]">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
                  <input
                    type="text"
                    placeholder="Pesquisar tag..."
                    value={tagSearchTerm}
                    onChange={(e) => setTagSearchTerm(e.target.value)}
                    className="w-full bg-[#22262f] border border-[#383e4a] rounded-lg pl-8 pr-2.5 py-1.5 text-xs text-white placeholder:text-[#6b7280] focus:outline-none focus:border-[var(--color-brand)]"
                    autoFocus
                  />
                </div>
              </div>

              <div className="overflow-y-auto flex-1 p-1 divide-y divide-white/5 scrollbar-thin">
                <button
                  type="button"
                  onClick={() => {
                    setFilterTag("Todos")
                    setIsTagDropdownOpen(false)
                    setTagSearchTerm("")
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                    filterTag === "Todos" ? "bg-[var(--color-brand)]/20 text-[var(--color-brand)] font-semibold" : "text-gray-300 hover:bg-[#252a34]"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-gray-400" />
                    Todas as tags
                  </span>
                  <span className="text-[10px] opacity-60 bg-white/5 px-1.5 py-0.5 rounded font-mono">{mediaItems.length}</span>
                </button>

                {filteredDropdownTags.map((tag) => {
                  const count = tagCounts[tag] || 0
                  const color = colors[tag] || "#64748b"
                  const isSelected = filterTag === tag
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => {
                        setFilterTag(tag)
                        setIsTagDropdownOpen(false)
                        setTagSearchTerm("")
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors text-left cursor-pointer ${
                        isSelected ? "bg-[var(--color-brand)]/20 text-[var(--color-brand)] font-semibold" : "text-gray-300 hover:bg-[#252a34]"
                      }`}
                    >
                      <span className="flex items-center gap-2 truncate pr-2">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                        <span className="truncate">{tag}</span>
                      </span>
                      <span className="text-[10px] opacity-60 bg-white/5 px-1.5 py-0.5 rounded shrink-0 font-mono">{count}</span>
                    </button>
                  )
                })}

                {filteredDropdownTags.length === 0 && (
                  <div className="py-4 text-center text-xs text-[var(--color-text-muted)]">
                    Nenhuma tag encontrada
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <button
          onClick={() => setFilterFavorite(!filterFavorite)}
          className={`px-3 py-2 rounded-md border text-sm font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${filterFavorite ? 'bg-[var(--color-brand)]/10 text-[var(--color-brand)] border-[var(--color-brand)]' : 'bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-white'}`}
        >
          <Star className={`w-4 h-4 ${filterFavorite ? 'fill-[var(--color-brand)]' : ''}`} />
          Favoritos
        </button>
      </div>

      {/* Quick Tags Chips Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
        <span className="text-[11px] text-[var(--color-text-muted)] font-medium uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-[var(--color-brand)]" /> Tags:
        </span>
        <button
          type="button"
          onClick={() => setFilterTag("Todos")}
          className={`shrink-0 px-2.5 py-1 rounded-full text-xs transition-all cursor-pointer ${
            filterTag === "Todos"
              ? "bg-[var(--color-brand)] text-white font-medium shadow-sm"
              : "bg-[#252a34] text-gray-400 hover:text-white hover:bg-[#2e3442] border border-white/5"
          }`}
        >
          Todas ({mediaItems.length})
        </button>
        {popularQuickTags.map((tag) => {
          const isSelected = filterTag === tag
          const color = colors[tag] || "#94a3b8"
          const count = tagCounts[tag] || 0
          return (
            <button
              key={tag}
              type="button"
              onClick={() => setFilterTag(isSelected ? "Todos" : tag)}
              className={`shrink-0 px-2.5 py-1 rounded-full text-xs transition-all flex items-center gap-1.5 border cursor-pointer ${
                isSelected
                  ? "text-white font-medium shadow-sm border-transparent"
                  : "bg-[#1f232a] text-gray-300 hover:text-white hover:bg-[#2a303c] border-white/5"
              }`}
              style={isSelected ? { backgroundColor: color } : {}}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: isSelected ? "#fff" : color }} />
              <span>{tag}</span>
              <span className={`text-[10px] px-1 rounded-full ${isSelected ? "bg-black/30" : "bg-white/10 opacity-70"}`}>{count}</span>
            </button>
          )
        })}
      </div>

      {/* Filter Status and Result Count */}
      <div className="flex items-center justify-between text-xs text-[var(--color-text-muted)] pt-0.5">
        <div>
          Exibindo <strong className="text-white">{filtered.length}</strong> de {mediaItems.length} mídias
          {filterTag !== "Todos" && <span> • Tag: <strong className="text-[var(--color-brand)]">{filterTag}</strong></span>}
          {filterNiche !== "Todos" && <span> • Nicho: <strong className="text-white">{filterNiche}</strong></span>}
          {filterCategory !== "Todos" && <span> • Categoria: <strong className="text-white">{filterCategory}</strong></span>}
        </div>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearAllFilters}
            className="flex items-center gap-1 text-[var(--color-brand)] hover:underline cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" /> Limpar todos os filtros
          </button>
        )}
      </div>


      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {filtered.map((media) => (
          <div key={media.id} className="bg-[#1f2329] rounded-lg overflow-hidden flex flex-col group border transition-colors relative"
            style={{ borderColor: selectedIds.has(media.id) ? 'var(--color-brand)' : 'transparent' }}
          >
            <div 
              className="aspect-[3/4] bg-black relative overflow-hidden cursor-pointer" 
              onClick={(e) => {
                if (selectedIds.size > 0) {
                  toggleSelection(media.id, e)
                } else if (playingId !== media.id) {
                  setPlayingId(media.id)
                }
              }}
            >
              {playingId === media.id ? (
                <div className="relative w-full h-full bg-black flex items-center justify-center">
                  {(() => {
                    const embedInfo = parseMediaUrl(media.driveLink)
                    if (embedInfo.platform === 'drive' && embedInfo.videoId) {
                      return (
                        <iframe
                          src={`${embedInfo.embedUrl}?autoplay=1`}
                          className="w-full h-full border-0"
                          allow="autoplay; encrypted-media; fullscreen"
                          allowFullScreen
                          title={media.title}
                        />
                      )
                    }
                    if (embedInfo.platform === 'youtube' && embedInfo.videoId) {
                      return (
                        <iframe
                          src={embedInfo.embedUrl}
                          className="w-full h-full border-0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          title={media.title}
                        />
                      )
                    }
                    if (embedInfo.platform === 'tiktok' && embedInfo.videoId) {
                      return (
                        <iframe
                          src={embedInfo.embedUrl}
                          className="w-full h-full border-0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          title={media.title}
                        />
                      )
                    }
                    if (embedInfo.platform === 'instagram' && embedInfo.videoId) {
                      return (
                        <iframe
                          src={embedInfo.embedUrl}
                          className="w-full h-full border-0"
                          allowFullScreen
                          title={media.title}
                        />
                      )
                    }
                    if (
                      embedInfo.platform === 'direct' &&
                      (embedInfo.embedUrl.endsWith('.mp4') ||
                        embedInfo.embedUrl.endsWith('.webm') ||
                        embedInfo.embedUrl.includes('.mp4?') ||
                        embedInfo.embedUrl.includes('fbcdn.net') ||
                        embedInfo.embedUrl.includes('tiktokcdn.com'))
                    ) {
                      return (
                        <video
                          src={embedInfo.embedUrl}
                          controls
                          autoPlay
                          className="w-full h-full object-contain"
                        />
                      )
                    }
                    return (
                      <div className="p-3 text-center space-y-2">
                        <p className="text-[11px] text-gray-400">Link externo ({embedInfo.platform})</p>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setPreviewItem(media)
                          }}
                          className="px-2.5 py-1 bg-[var(--color-brand)] text-white text-xs rounded hover:opacity-90 transition-opacity"
                        >
                          Abrir Player
                        </button>
                      </div>
                    )
                  })()}

                  {/* Inline controls (Close / Maximize) */}
                  <div className="absolute top-2 right-2 z-30 flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setPreviewItem(media)
                      }}
                      className="p-1 rounded bg-black/80 hover:bg-[var(--color-brand)] text-white transition-colors shadow"
                      title="Tela Cheia / Pop-up"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setPlayingId(null)
                      }}
                      className="p-1 rounded bg-black/80 hover:bg-red-600 text-white transition-colors shadow"
                      title="Fechar vídeo / Voltar à imagem"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Batch selection checkbox */}
                  <div 
                    className={`absolute top-2 left-2 z-30 w-5 h-5 rounded flex items-center justify-center border transition-colors cursor-pointer ${selectedIds.has(media.id) ? 'bg-[var(--color-brand)] border-[var(--color-brand)]' : 'bg-black/50 border-white/50 hover:border-white'}`}
                    onClick={(e) => toggleSelection(media.id, e)}
                    title={selectedIds.has(media.id) ? "Desmarcar" : "Selecionar"}
                  >
                    {selectedIds.has(media.id) && <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                  </div>

                  <img 
                    src={media.thumbUrl} 
                    alt={media.title} 
                    referrerPolicy="no-referrer"
                    loading="lazy"
                    onError={(e) => {
                      const target = e.currentTarget;
                      if (!target.dataset.fallback) {
                        target.dataset.fallback = "true";
                        target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(media.title)}&background=1f2329&color=e2e8f0&size=400`;
                      }
                    }}
                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" 
                  />

                  {media.isFavorite && (
                    <div className="absolute top-2 right-2 text-yellow-400 z-10 filter drop-shadow-md">
                      <Star className="w-5 h-5 fill-yellow-400" />
                    </div>
                  )}

                  {/* Central Play Button */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setPlayingId(media.id)
                      }}
                      className="pointer-events-auto w-11 h-11 rounded-full bg-black/75 hover:bg-[var(--color-brand)] text-white flex items-center justify-center shadow-2xl border border-white/25 hover:border-transparent transition-all transform opacity-85 group-hover:opacity-100 group-hover:scale-110 cursor-pointer z-20"
                      title="Apertar Play / Assistir Vídeo Diretamente Aqui"
                    >
                      <Play className="w-5 h-5 ml-0.5 fill-current text-white" />
                    </button>
                  </div>

                  {/* Hover actions at bottom */}
                  <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/95 via-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 z-20">
                    <button onClick={(e) => { e.stopPropagation(); toggleFavorite(media.id, !!media.isFavorite) }} className={`p-1.5 bg-[var(--color-surface)] rounded-full transition-colors ${media.isFavorite ? 'hover:bg-yellow-600' : 'hover:bg-[var(--color-surface-hover)]'}`} title={media.isFavorite ? "Remover dos favoritos" : "Favoritar"}>
                      <Star className={`w-3.5 h-3.5 ${media.isFavorite ? 'text-yellow-400 fill-yellow-400' : 'text-white'}`} />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(media.driveLink); }} className="p-1.5 bg-[var(--color-surface)] rounded-full hover:bg-blue-600 transition-colors" title="Copiar Link">
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); openEditModal(media) }} className="p-1.5 bg-[var(--color-surface)] rounded-full hover:bg-[var(--color-brand)] transition-colors" title="Editar">
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); handleDelete(media.id) }} className="p-1.5 bg-[var(--color-surface)] rounded-full hover:bg-red-600 transition-colors" title="Excluir">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </>
              )}
            </div>
            <div className="p-3 space-y-1.5 flex-grow bg-[#1f2329]">
              <div className="flex items-start justify-between gap-1.5">
                <p className="text-xs font-medium text-[var(--color-text)] truncate flex-1" title={media.title}>{media.title}</p>
                {media.visualDescription && (
                  <span 
                    className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-1.5 py-0.5 rounded shrink-0 cursor-help"
                    title={`Leitura Visual IA:\n${media.visualDescription}`}
                  >
                    <Sparkles className="w-2.5 h-2.5" /> IA
                  </span>
                )}
              </div>
              <a href={media.driveLink} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-[11px] text-[var(--color-text-muted)] hover:text-white truncate">
                <LinkIcon className="h-3 w-3 shrink-0" />
                <span className="truncate">{media.driveLink.replace('https://', '')}</span>
              </a>
              <div className="flex gap-1 flex-wrap mt-1">
                {isLoaded && <Badge variant="secondary" colorHex={colors[media.category]} className="text-[10px] py-0 px-1.5 rounded uppercase">{media.category}</Badge>}
                {media.brollType && isLoaded && <Badge variant="secondary" colorHex={colors[media.brollType]} className="text-[10px] py-0 px-1.5 rounded truncate max-w-[80px]">{media.brollType}</Badge>}
                {isLoaded && <Badge variant="outline" colorHex={colors[media.niche]} className="text-[10px] py-0 px-1.5 rounded">{media.niche}</Badge>}
                {isLoaded && media.tags.map(tag => (
                  <Badge key={tag} variant={tag.toLowerCase() === 'validado' ? 'success' : 'outline'} colorHex={colors[tag]} className="text-[10px] py-0 px-1.5 rounded">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        ))}
        
        <div onClick={openNewModal} className="aspect-[3/4] border border-dashed border-[#383e47] rounded-lg flex items-center justify-center text-[var(--color-text-muted)] hover:bg-[#1f2329] hover:text-white transition-colors cursor-pointer">
          <span className="text-sm">+ Nova mídia</span>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl shadow-2xl w-full max-w-lg p-6 space-y-5" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">{editingItem ? "Editar Mídia" : "Nova Mídia"}</h2>
              <button onClick={() => setShowModal(false)} className="text-[var(--color-text-muted)] hover:text-white transition-colors"><X className="w-5 h-5"/></button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[var(--color-text-muted)] mb-1.5">Título *</label>
                <Input placeholder="Ex: Honey pouring close-up" value={formTitle} onChange={e => setFormTitle(e.target.value)} autoFocus />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--color-text-muted)] mb-1.5">Link do Google Drive *</label>
                <Input placeholder="https://drive.google.com/file/d/..." value={formDriveLink} onChange={e => setFormDriveLink(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--color-text-muted)] mb-1.5">Thumbnail (URL da imagem)</label>
                <div className="flex gap-2 mb-2">
                  <Input 
                    placeholder="https://... ou faça upload" 
                    value={formThumbUrl} 
                    onChange={e => setFormThumbUrl(e.target.value)} 
                    className="flex-1"
                  />
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                  />
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="shrink-0"
                    type="button"
                  >
                    <Upload className="w-4 h-4 mr-1.5" />
                    {isUploading ? "Enviando..." : "Upload"}
                  </Button>
                </div>
                
                {formThumbUrl && (
                  <div className="relative group/thumb w-24 h-24">
                    <div className="rounded-md overflow-hidden border border-[var(--color-border)] w-full h-full">
                      <img src={formThumbUrl} alt="Preview" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = 'https://picsum.photos/seed/fallback/300/400' }} />
                    </div>
                    <button 
                      onClick={() => setFormThumbUrl("")}
                      className="absolute -top-1.5 -right-1.5 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover/thumb:opacity-100 transition-opacity shadow-lg"
                      title="Remover imagem"
                      type="button"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
                {!formThumbUrl && (
                  <p className="text-[11px] text-[var(--color-text-muted)] mt-1">Se vazio, uma imagem placeholder será gerada automaticamente.</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[var(--color-text-muted)] mb-1.5">Nicho</label>
                  <Input placeholder="Ex: Diabetes" value={formNiche} onChange={e => setFormNiche(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--color-text-muted)] mb-1.5">Categoria</label>
                  <select
                    className="w-full h-9 bg-[var(--color-background)] border border-[var(--color-border)] text-sm text-[var(--color-text)] rounded-md px-3 focus:outline-none focus:ring-1 focus:ring-[var(--color-brand)]"
                    value={formCategory}
                    onChange={e => setFormCategory(e.target.value)}
                  >
                    <option value="broll">B-Roll</option>
                    <option value="reference">Referência</option>
                    <option value="avatar">Avatar</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-[var(--color-text-muted)] mb-1.5">Tipo Específico de B-Roll</label>
                <Input value={formBrollType} onChange={e => setFormBrollType(e.target.value)} placeholder="Ex: Copo D'água, Close-up (Opcional)" />
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--color-text-muted)] mb-1.5">Tags (separadas por vírgula)</label>
                <Input placeholder="Ex: Validado, Premium" value={formTags} onChange={e => setFormTags(e.target.value)} />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setShowModal(false)}>Cancelar</Button>
              <Button variant="brand" onClick={handleSave} disabled={!formTitle.trim() || !formDriveLink.trim()}>
                {editingItem ? "Salvar" : "Adicionar"}
              </Button>
            </div>
          </div>
        </div>
      )}

      <ManageColorsModal 
        isOpen={showColorsModal} 
        onClose={() => setShowColorsModal(false)}
        tags={allTags}
        categories={allCategories}
        niches={allNiches}
        brollTypes={allBrollTypes}
      />

      <BatchEditModal
        isOpen={showBatchModal}
        onClose={() => setShowBatchModal(false)}
        onSave={handleBatchSave}
        count={selectedIds.size}
      />

      {/* Video Preview / Player Modal */}
      {previewItem && (
        <MediaInspectorModal
          isOpen={!!previewItem}
          onClose={() => setPreviewItem(null)}
          title={previewItem.title}
          url={previewItem.driveLink}
          niche={previewItem.niche}
          category={previewItem.category}
          thumbUrl={previewItem.thumbUrl}
          tags={previewItem.tags}
          visualDescription={previewItem.visualDescription}
          sceneSummary={previewItem.sceneSummary}
          hideSaveAction
        />
      )}
    </div>
  )
}
