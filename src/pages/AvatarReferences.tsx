import { useState, useRef, useEffect } from "react"
import { Link as LinkIcon, Search, Plus, X, Edit, Trash2, Star, Copy, Upload, Play, Tag, ChevronDown, RotateCcw, Sparkles, ExternalLink, Users } from "lucide-react"
import { Badge } from "../components/ui/Badge"
import { Button } from "../components/ui/Button"
import { Input } from "../components/ui/Input"
import { type MediaItem } from "../data/mock"
import { useTagColors } from "../hooks/useTagColors"
import { useMediaItems } from "../hooks/useMediaItems"
import { MediaInspectorModal } from "../components/spy/MediaInspectorModal"
import { parseMediaUrl } from "../utils/embedUtils"

const GDRIVE_FOLDER_URL = "https://drive.google.com/drive/folders/11vOlr-f1KTr0zv8hxUglAX7p5WaGXXLM"

export default function AvatarReferences() {
  const { 
    mediaItems, 
    addMediaItem, 
    updateMediaItem, 
    deleteMediaItem, 
    uploadThumbnail,
    toggleFavorite
  } = useMediaItems()

  // Base list of avatar items: items with category 'avatar' or tagged with 'Avatar' or related personas
  const avatarItems = mediaItems.filter(m => 
    m.category === "avatar" || 
    m.tags.some(t => t.toLowerCase().includes("avatar") || t.toLowerCase().includes("especialista") || t.toLowerCase().includes("depoimento"))
  )

  const [searchTerm, setSearchTerm] = useState("")
  const [filterTag, setFilterTag] = useState<string>("Todos")
  const [filterNiche, setFilterNiche] = useState<string>("Todos")
  const [filterFavorite, setFilterFavorite] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editingItem, setEditingItem] = useState<MediaItem | null>(null)
  const [previewItem, setPreviewItem] = useState<MediaItem | null>(null)
  const [playingId, setPlayingId] = useState<string | null>(null)

  // Tag filter dropdown state
  const [isTagDropdownOpen, setIsTagDropdownOpen] = useState(false)
  const [tagSearchTerm, setTagSearchTerm] = useState("")
  const tagDropdownRef = useRef<HTMLDivElement>(null)

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

  // Form state for creating/editing avatar
  const [formTitle, setFormTitle] = useState("")
  const [formDriveLink, setFormDriveLink] = useState("")
  const [formThumbUrl, setFormThumbUrl] = useState("")
  const [formNiche, setFormNiche] = useState("Diabetes")
  const [formTags, setFormTags] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Tag counts specifically for avatars
  const tagCounts = avatarItems.reduce((acc, item) => {
    (item.tags || []).forEach(t => {
      acc[t] = (acc[t] || 0) + 1
    })
    return acc
  }, {} as Record<string, number>)

  const allTags = Object.keys(tagCounts).sort((a, b) => {
    return tagCounts[b] - tagCounts[a] || a.localeCompare(b)
  })

  const popularQuickTags = allTags
    .filter(t => !['Standard', 'Importado', 'Google Drive', 'Avatar', 'B-Roll'].includes(t))
    .slice(0, 12)

  const allNiches = [...new Set(avatarItems.map(m => m.niche))]

  const filteredDropdownTags = allTags.filter(t => 
    t.toLowerCase().includes(tagSearchTerm.toLowerCase())
  )

  const hasActiveFilters = searchTerm !== "" || filterTag !== "Todos" || filterNiche !== "Todos" || filterFavorite

  const clearAllFilters = () => {
    setSearchTerm("")
    setFilterTag("Todos")
    setFilterNiche("Todos")
    setFilterFavorite(false)
  }

  const filtered = avatarItems.filter(m => {
    const matchesSearch = searchTerm === "" ||
      m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.driveLink.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesTag = filterTag === "Todos" || m.tags.includes(filterTag)
    const matchesNiche = filterNiche === "Todos" || m.niche === filterNiche
    const matchesFavorite = !filterFavorite || m.isFavorite
    return matchesSearch && matchesTag && matchesNiche && matchesFavorite
  })

  const openNewModal = () => {
    setEditingItem(null)
    setFormTitle("")
    setFormDriveLink("")
    setFormThumbUrl("")
    setFormNiche("Diabetes")
    setFormTags("Avatar, Especialista")
    setShowModal(true)
  }

  const openEditModal = (item: MediaItem) => {
    setEditingItem(item)
    setFormTitle(item.title)
    setFormDriveLink(item.driveLink)
    setFormThumbUrl(item.thumbUrl)
    setFormNiche(item.niche)
    setFormTags(item.tags.join(", "))
    setShowModal(true)
  }

  const handleSave = () => {
    if (!formTitle.trim() || !formDriveLink.trim()) return
    const tags = formTags.split(",").map(t => t.trim()).filter(Boolean)
    if (!tags.some(t => t.toLowerCase() === "avatar")) {
      tags.unshift("Avatar")
    }

    if (editingItem) {
      updateMediaItem({
        ...editingItem,
        title: formTitle,
        thumbUrl: formThumbUrl || editingItem.thumbUrl,
        driveLink: formDriveLink,
        niche: formNiche || "Geral",
        tags: tags.length > 0 ? tags : ["Avatar", "Especialista"],
        category: "avatar"
      })
    } else {
      const newItem: MediaItem = {
        id: `m${Date.now()}`,
        title: formTitle,
        thumbUrl: formThumbUrl || `https://picsum.photos/seed/${Date.now()}/300/400`,
        driveLink: formDriveLink,
        niche: formNiche || "Geral",
        tags: tags.length > 0 ? tags : ["Avatar", "Especialista"],
        category: "avatar"
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
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-[var(--color-brand)]" />
            Referências Avatares
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            Acervo de personas, autoridades médicas, depoimentos e criadores validados para Direct Response.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a 
            href={GDRIVE_FOLDER_URL} 
            target="_blank" 
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[#252a34] text-xs font-medium text-white transition-colors"
            title="Abrir pasta no Google Drive"
          >
            <ExternalLink className="w-4 h-4 text-[var(--color-brand)]" />
            Abrir no Google Drive
          </a>
          <Button variant="brand" onClick={openNewModal}>
            <Plus className="w-4 h-4 mr-1" /> Novo Avatar
          </Button>
        </div>
      </div>

      {/* Google Drive Folder Banner */}
      <div className="p-3.5 bg-gradient-to-r from-[#1c212b] via-[#1a1e27] to-[#151921] border border-[#2e3747] rounded-xl flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-lg bg-[var(--color-brand)]/15 border border-[var(--color-brand)]/30 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5 text-[var(--color-brand)]" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-white truncate">Pasta Vinculada: Referências Avatares</p>
            <p className="text-[11px] text-[var(--color-text-muted)] truncate">{GDRIVE_FOLDER_URL}</p>
          </div>
        </div>
        <div className="shrink-0 flex items-center gap-2">
          <Badge variant="outline" className="text-[11px] border-[var(--color-brand)]/40 text-[var(--color-brand)]">
            {avatarItems.length} Avatares Mapeados
          </Badge>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-muted)]" />
          <Input 
            className="pl-9" 
            placeholder="Buscar por nome, nicho, tag..." 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)} 
          />
        </div>

        <select
          className="bg-[var(--color-surface)] border border-[var(--color-border)] text-sm text-[var(--color-text)] rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[var(--color-brand)]"
          value={filterNiche}
          onChange={e => setFilterNiche(e.target.value)}
        >
          <option value="Todos">Nicho: Todos</option>
          {allNiches.map(n => <option key={n} value={n}>{n}</option>)}
        </select>

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
                    placeholder="Pesquisar tag de avatar..."
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
                  <span className="text-[10px] opacity-60 bg-white/5 px-1.5 py-0.5 rounded font-mono">{avatarItems.length}</span>
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
          <Sparkles className="w-3 h-3 text-[var(--color-brand)]" /> Personas:
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
          Todas ({avatarItems.length})
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

      {/* Results Status */}
      <div className="flex items-center justify-between text-xs text-[var(--color-text-muted)] pt-0.5">
        <div>
          Exibindo <strong className="text-white">{filtered.length}</strong> de {avatarItems.length} avatares
          {filterTag !== "Todos" && <span> • Tag: <strong className="text-[var(--color-brand)]">{filterTag}</strong></span>}
          {filterNiche !== "Todos" && <span> • Nicho: <strong className="text-white">{filterNiche}</strong></span>}
        </div>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearAllFilters}
            className="flex items-center gap-1 text-[var(--color-brand)] hover:underline cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" /> Limpar filtros
          </button>
        )}
      </div>

      {/* Grid of Avatars */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {filtered.map((media) => (
          <div key={media.id} className="bg-[#1f2329] rounded-lg overflow-hidden flex flex-col group border border-transparent hover:border-[var(--color-border-hover)] transition-all relative">
            <div 
              className="aspect-[3/4] bg-black relative overflow-hidden cursor-pointer" 
              onClick={() => {
                if (playingId !== media.id) {
                  setPlayingId(media.id)
                }
              }}
            >
              <img 
                src={media.thumbUrl} 
                alt={media.title} 
                referrerPolicy="no-referrer"
                loading="lazy"
                onError={(e) => { 
                  (e.target as HTMLImageElement).src = 'https://picsum.photos/seed/fallback/300/400' 
                }}
                className={`w-full h-full object-cover transition-opacity ${playingId === media.id ? 'hidden' : 'opacity-85 group-hover:opacity-100'}`} 
              />

              {playingId === media.id ? (
                <div className="absolute inset-0 bg-black z-10 flex flex-col">
                  {(() => {
                    const parsed = parseMediaUrl(media.driveLink)
                    if (parsed.platform === "tiktok" && parsed.embedUrl) {
                      return (
                        <iframe 
                          src={parsed.embedUrl} 
                          className="w-full h-full border-0 pointer-events-auto"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      )
                    }
                    if (parsed.platform === "youtube" && parsed.embedUrl) {
                      return (
                        <iframe 
                          src={parsed.embedUrl} 
                          className="w-full h-full border-0 pointer-events-auto"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      )
                    }
                    return (
                      <div className="w-full h-full flex flex-col items-center justify-center p-3 text-center bg-black/90">
                        <p className="text-xs text-white font-medium mb-3">Vídeo do Google Drive</p>
                        <button 
                          onClick={(e) => { e.stopPropagation(); setPreviewItem(media); }}
                          className="px-3 py-1.5 bg-[var(--color-brand)] text-white text-xs rounded-md shadow-lg flex items-center gap-1.5"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" /> Abrir Player
                        </button>
                      </div>
                    )
                  })()}
                  <button 
                    onClick={(e) => { e.stopPropagation(); setPlayingId(null) }}
                    className="absolute top-2 right-2 bg-black/70 hover:bg-black text-white p-1 rounded-full z-30"
                    title="Fechar vídeo"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setPreviewItem(media)
                    }}
                    className="pointer-events-auto w-11 h-11 rounded-full bg-black/75 hover:bg-[var(--color-brand)] text-white flex items-center justify-center shadow-2xl border border-white/25 hover:border-transparent transition-all transform opacity-85 group-hover:opacity-100 group-hover:scale-110 cursor-pointer z-20"
                    title="Assistir Vídeo"
                  >
                    <Play className="w-5 h-5 ml-0.5 fill-current text-white" />
                  </button>
                </div>
              )}

              {media.isFavorite && (
                <div className="absolute top-2 right-2 text-yellow-400 z-10 filter drop-shadow-md">
                  <Star className="w-4 h-4 fill-yellow-400" />
                </div>
              )}

              {/* Hover actions */}
              <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/95 via-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 z-20">
                <button onClick={(e) => { e.stopPropagation(); toggleFavorite(media.id, !!media.isFavorite) }} className="p-1.5 bg-[var(--color-surface)] rounded-full hover:bg-yellow-600 transition-colors" title="Favoritar">
                  <Star className={`w-3.5 h-3.5 ${media.isFavorite ? 'text-yellow-400 fill-yellow-400' : 'text-white'}`} />
                </button>
                <button onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(media.driveLink); }} className="p-1.5 bg-[var(--color-surface)] rounded-full hover:bg-blue-600 transition-colors" title="Copiar Link">
                  <Copy className="w-3.5 h-3.5" />
                </button>
                <button onClick={(e) => { e.stopPropagation(); openEditModal(media) }} className="p-1.5 bg-[var(--color-surface)] rounded-full hover:bg-[var(--color-brand)] transition-colors" title="Editar">
                  <Edit className="w-3.5 h-3.5" />
                </button>
                <button onClick={(e) => { e.stopPropagation(); deleteMediaItem(media.id) }} className="p-1.5 bg-[var(--color-surface)] rounded-full hover:bg-red-600 transition-colors" title="Excluir">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="p-3 space-y-1.5 flex-grow bg-[#1f2329]">
              <p className="text-xs font-semibold text-[var(--color-text)] truncate" title={media.title}>
                {media.title}
              </p>
              <a href={media.driveLink} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-[11px] text-[var(--color-text-muted)] hover:text-white truncate">
                <LinkIcon className="h-3 w-3 shrink-0" />
                <span className="truncate">{media.driveLink.replace('https://', '')}</span>
              </a>
              <div className="flex gap-1 flex-wrap mt-1">
                {isLoaded && <Badge variant="outline" colorHex={colors[media.niche]} className="text-[10px] py-0 px-1.5 rounded">{media.niche}</Badge>}
                {isLoaded && media.tags.slice(0, 3).map(tag => (
                  <Badge key={tag} variant="outline" colorHex={colors[tag]} className="text-[10px] py-0 px-1.5 rounded">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        ))}

        <div onClick={openNewModal} className="aspect-[3/4] border border-dashed border-[#383e47] rounded-lg flex flex-col items-center justify-center text-[var(--color-text-muted)] hover:bg-[#1f2329] hover:text-white transition-colors cursor-pointer gap-2">
          <Plus className="w-6 h-6 text-[var(--color-brand)]" />
          <span className="text-xs font-medium">+ Novo Avatar</span>
        </div>
      </div>

      {/* Add/Edit Avatar Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl shadow-2xl w-full max-w-lg p-6 space-y-5" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Users className="w-5 h-5 text-[var(--color-brand)]" />
                {editingItem ? "Editar Avatar" : "Novo Avatar"}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-[var(--color-text-muted)] hover:text-white transition-colors"><X className="w-5 h-5"/></button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[var(--color-text-muted)] mb-1.5">Nome / Título da Persona *</label>
                <Input placeholder="Ex: Dr. Oz - Declaração de Saúde" value={formTitle} onChange={e => setFormTitle(e.target.value)} autoFocus />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--color-text-muted)] mb-1.5">Link do Google Drive / Vídeo *</label>
                <Input placeholder="https://drive.google.com/file/d/..." value={formDriveLink} onChange={e => setFormDriveLink(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--color-text-muted)] mb-1.5">Thumbnail (URL da Imagem)</label>
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
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[var(--color-text-muted)] mb-1.5">Nicho</label>
                  <Input placeholder="Ex: Diabetes, Neuropatia" value={formNiche} onChange={e => setFormNiche(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--color-text-muted)] mb-1.5">Tags (separadas por vírgula)</label>
                  <Input placeholder="Avatar, Especialista, Mulher 40+" value={formTags} onChange={e => setFormTags(e.target.value)} />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-[var(--color-border)]">
              <Button variant="outline" onClick={() => setShowModal(false)}>Cancelar</Button>
              <Button variant="brand" onClick={handleSave}>Salvar Avatar</Button>
            </div>
          </div>
        </div>
      )}

      {/* Video Inspector Modal */}
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
          hideSaveAction
        />
      )}
    </div>
  )
}
