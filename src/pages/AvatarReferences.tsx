import { useState, useRef, useEffect } from "react"
import { Search, Plus, X, Edit, Trash2, Star, Copy, Upload, Tag, ChevronDown, RotateCcw, ExternalLink, Users, Eye, Check } from "lucide-react"
import { Badge } from "../components/ui/Badge"
import { Button } from "../components/ui/Button"
import { Input } from "../components/ui/Input"
import { type MediaItem } from "../data/mock"
import { useTagColors } from "../hooks/useTagColors"
import { useMediaItems } from "../hooks/useMediaItems"
import driveAvatarsData from "../data/driveAvatars.json"

const GDRIVE_FOLDER_URL = "https://drive.google.com/drive/folders/11vOlr-f1KTr0zv8hxUglAX7p5WaGXXLM"

export default function AvatarReferences() {
  const { 
    mediaItems, 
    updateMediaItem, 
    deleteMediaItem, 
    uploadThumbnail,
    toggleFavorite
  } = useMediaItems()

  // Base list of avatar items loaded directly from the Google Drive catalog
  const [localAvatars, setLocalAvatars] = useState<MediaItem[]>(() => {
    return driveAvatarsData.map(item => ({
      id: item.id,
      title: item.title,
      thumbUrl: item.thumbUrl,
      driveLink: item.driveLink,
      tags: item.tags,
      niche: item.niche,
      category: "avatar",
      isFavorite: false
    }))
  })

  // User-created avatar references from database (category = 'avatar_reference')
  const userCreatedAvatars = mediaItems.filter(m => m.category === "avatar_reference")
  
  // Combined list of avatar references (drive catalog + user created)
  const avatarItems = [...localAvatars, ...userCreatedAvatars]

  const [searchTerm, setSearchTerm] = useState("")
  const [filterTag, setFilterTag] = useState<string>("Todos")
  const [filterNiche, setFilterNiche] = useState<string>("Todos")
  const [filterFavorite, setFilterFavorite] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editingItem, setEditingItem] = useState<MediaItem | null>(null)
  const [previewItem, setPreviewItem] = useState<MediaItem | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

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

  const { colors } = useTagColors()

  // Form state for creating/editing avatar
  const [formTitle, setFormTitle] = useState("")
  const [formDriveLink, setFormDriveLink] = useState("")
  const [formThumbUrl, setFormThumbUrl] = useState("")
  const [formNiche, setFormNiche] = useState("Masculino 50+")
  const [formTags, setFormTags] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Tag counts specifically for these avatars
  const tagCounts = avatarItems.reduce((acc, item) => {
    (item.tags || []).forEach(t => {
      acc[t] = (acc[t] || 0) + 1
    })
    return acc
  }, {} as Record<string, number>)

  const allTags = Object.keys(tagCounts).sort((a, b) => {
    return tagCounts[b] - tagCounts[a] || a.localeCompare(b)
  })

  // Quick tags tailored for avatar persona navigation
  const popularQuickTags = [
    "Celebridade",
    "Especialista",
    "Autoridade Médica",
    "Dr. Oz",
    "Dr. Phil",
    "Oprah",
    "Dr. Gupta",
    "Mark Cuban",
    "Depoimento",
    "Maternidade",
    "UGC",
    "Cowboy"
  ].filter(t => allTags.includes(t) || t === "Celebridade" || t === "Especialista")

  const allNiches = [...new Set(avatarItems.map(m => m.niche).filter(Boolean))]

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

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsUploading(true)
    try {
      const url = await uploadThumbnail(file)
      if (url) setFormThumbUrl(url)
    } catch (err) {
      console.error(err)
    } finally {
      setIsUploading(false)
    }
  }

  const handleSave = async () => {
    if (!formTitle.trim()) return

    const parsedTags = formTags.split(",").map(t => t.trim()).filter(Boolean)

    if (editingItem) {
      if (editingItem.id.startsWith("avatar-")) {
        // Update local item
        setLocalAvatars(prev => prev.map(item => item.id === editingItem.id ? {
          ...item,
          title: formTitle,
          driveLink: formDriveLink || GDRIVE_FOLDER_URL,
          thumbUrl: formThumbUrl || item.thumbUrl,
          niche: formNiche,
          tags: parsedTags
        } : item))
      } else {
        await updateMediaItem({
          ...editingItem,
          title: formTitle,
          driveLink: formDriveLink || GDRIVE_FOLDER_URL,
          thumbUrl: formThumbUrl,
          niche: formNiche,
          category: "avatar_reference",
          tags: parsedTags
        })
      }
    } else {
      const newItem: MediaItem = {
        id: `avatar-custom-${Date.now()}`,
        title: formTitle,
        driveLink: formDriveLink || GDRIVE_FOLDER_URL,
        thumbUrl: formThumbUrl || "/avatar-images/tom_hanks.png",
        niche: formNiche,
        category: "avatar",
        tags: parsedTags.length > 0 ? parsedTags : ["Avatar", "Referência"],
        isFavorite: false
      }
      setLocalAvatars(prev => [newItem, ...prev])
    }

    setShowModal(false)
    setEditingItem(null)
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

  const openNewModal = () => {
    setEditingItem(null)
    setFormTitle("")
    setFormDriveLink(GDRIVE_FOLDER_URL)
    setFormThumbUrl("")
    setFormNiche("Masculino 50+")
    setFormTags("Celebridade, Autoridade")
    setShowModal(true)
  }

  const handleDelete = (id: string) => {
    if (confirm("Tem certeza que deseja remover esta referência de avatar?")) {
      setLocalAvatars(prev => prev.filter(item => item.id !== id))
      deleteMediaItem(id)
    }
  }

  const toggleLocalFavorite = (item: MediaItem) => {
    setLocalAvatars(prev => prev.map(m => 
      m.id === item.id ? { ...m, isFavorite: !m.isFavorite } : m
    ))
    toggleFavorite(item.id, !!item.isFavorite)
  }

  // Filtering
  const filtered = avatarItems.filter(item => {
    const matchesSearch = 
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase())) ||
      item.niche.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesTag = filterTag === "Todos" || item.tags.includes(filterTag)
    const matchesNiche = filterNiche === "Todos" || item.niche === filterNiche
    const matchesFav = !filterFavorite || item.isFavorite

    return matchesSearch && matchesTag && matchesNiche && matchesFav
  })

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Users className="w-7 h-7 text-[var(--color-brand)]" />
            Referências Avatares
          </h1>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">
            Acervo visual de personas, autoridades médicas, celebridades, depoimentos e criadores sincronizados com o Google Drive.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <a
            href={GDRIVE_FOLDER_URL}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 px-3.5 py-2 bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover)] border border-[var(--color-border)] text-xs text-white font-medium rounded-lg shadow-sm transition-all hover:border-[var(--color-brand)]"
          >
            <ExternalLink className="w-3.5 h-3.5 text-[var(--color-brand)]" />
            Abrir Pasta no Google Drive
          </a>
          <Button variant="brand" onClick={openNewModal} className="flex items-center gap-1.5 shadow-sm text-xs">
            <Plus className="w-4 h-4" /> Novo Avatar
          </Button>
        </div>
      </div>

      {/* Google Drive Banner Info */}
      <div className="bg-[#1f2329]/80 border border-[var(--color-border)] rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-inner">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-white">Pasta Vinculada: Referências Avatares</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                31 Personas Mapeadas
              </span>
            </div>
            <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5 break-all">
              {GDRIVE_FOLDER_URL}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
          <span>Clique em qualquer card para ampliar a referência e copiar detalhes</span>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-3.5 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-[var(--color-text-muted)]" />
            <Input 
              placeholder="Buscar por nome, celebridade, nicho ou tag (Ex: Dr. Oz, Tom Hanks, Depoimento)..." 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-9 bg-[#17191d] border-[var(--color-border)] text-xs h-9"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm("")} 
                className="absolute right-3 top-2.5 text-gray-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Niche Filter */}
          <div className="w-full sm:w-48">
            <select 
              value={filterNiche} 
              onChange={e => setFilterNiche(e.target.value)}
              aria-label="Filtrar por Perfil / Nicho"
              className="w-full bg-[#17191d] border border-[var(--color-border)] rounded-md px-3 h-9 text-xs text-[var(--color-text)] focus:outline-none focus:border-[var(--color-brand)] cursor-pointer"
            >
              <option value="Todos">Perfil: Todos</option>
              {allNiches.map(n => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>

          {/* Searchable Tag Dropdown */}
          <div className="relative w-full sm:w-56" ref={tagDropdownRef}>
            <button
              type="button"
              onClick={() => setIsTagDropdownOpen(!isTagDropdownOpen)}
              className="w-full bg-[#17191d] border border-[var(--color-border)] rounded-md px-3 h-9 text-xs text-left flex items-center justify-between text-[var(--color-text)] hover:border-[var(--color-border-hover)] focus:outline-none focus:border-[var(--color-brand)] transition-colors"
            >
              <div className="flex items-center gap-1.5 truncate">
                <Tag className="w-3.5 h-3.5 text-[var(--color-brand)] shrink-0" />
                <span className="truncate">
                  {filterTag === "Todos" ? "Tag: Todas" : filterTag}
                </span>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${isTagDropdownOpen ? "rotate-180" : ""}`} />
            </button>

            {isTagDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-1.5 z-40 bg-[#17191d] border border-[var(--color-border)] rounded-lg shadow-2xl py-1.5 max-h-64 flex flex-col">
                <div className="px-2.5 pb-2 border-b border-[var(--color-border)]">
                  <div className="relative">
                    <Search className="absolute left-2 top-2 h-3 w-3 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Pesquisar tag..."
                      value={tagSearchTerm}
                      onChange={e => setTagSearchTerm(e.target.value)}
                      className="w-full pl-6 pr-2 py-1 text-[11px] bg-[var(--color-surface)] border border-[var(--color-border)] rounded text-white focus:outline-none focus:border-[var(--color-brand)]"
                      autoFocus
                    />
                  </div>
                </div>

                <div className="overflow-y-auto py-1 text-xs">
                  <button
                    type="button"
                    onClick={() => { setFilterTag("Todos"); setIsTagDropdownOpen(false); }}
                    className={`w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-[var(--color-surface-hover)] transition-colors ${filterTag === "Todos" ? "text-[var(--color-brand)] font-semibold bg-[var(--color-brand)]/10" : "text-gray-300"}`}
                  >
                    <span>Todas as tags</span>
                    <span className="text-[10px] text-gray-500">{avatarItems.length}</span>
                  </button>

                  {filteredDropdownTags.map(tag => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => { setFilterTag(tag); setIsTagDropdownOpen(false); }}
                      className={`w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-[var(--color-surface-hover)] transition-colors ${filterTag === tag ? "text-[var(--color-brand)] font-semibold bg-[var(--color-brand)]/10" : "text-gray-300"}`}
                    >
                      <div className="flex items-center gap-1.5">
                        <span 
                          className="w-2 h-2 rounded-full shrink-0" 
                          style={{ backgroundColor: colors[tag] || '#3b82f6' }} 
                        />
                        <span>{tag}</span>
                      </div>
                      <span className="text-[10px] text-gray-500">{tagCounts[tag] || 0}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Favorite Toggle */}
          <Button
            variant="outline"
            onClick={() => setFilterFavorite(!filterFavorite)}
            className={`h-9 px-3 text-xs shrink-0 flex items-center gap-1.5 ${filterFavorite ? 'bg-amber-500/10 border-amber-500/40 text-amber-400' : ''}`}
          >
            <Star className={`w-3.5 h-3.5 ${filterFavorite ? 'fill-amber-400' : ''}`} />
            Favoritos
          </Button>
        </div>

        {/* Quick Tag Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-none pt-1 border-t border-[var(--color-border)]/60">
          <span className="text-[10px] uppercase font-bold text-[var(--color-text-muted)] shrink-0 mr-1 flex items-center gap-1">
            Personas:
          </span>

          <button
            type="button"
            onClick={() => setFilterTag("Todos")}
            className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all shrink-0 cursor-pointer ${filterTag === "Todos" ? "bg-[var(--color-brand)] text-white shadow-sm" : "bg-[#17191d] text-[var(--color-text-muted)] hover:text-white hover:bg-[#282c34] border border-[var(--color-border)]"}`}
          >
            Todas ({avatarItems.length})
          </button>

          {popularQuickTags.map(tag => {
            const isSelected = filterTag === tag
            const tagCount = tagCounts[tag] || 0
            const tagColor = colors[tag] || '#3b82f6'
            return (
              <button
                key={tag}
                type="button"
                onClick={() => setFilterTag(isSelected ? "Todos" : tag)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all shrink-0 flex items-center gap-1.5 cursor-pointer border ${isSelected ? "bg-[var(--color-brand)] text-white border-[var(--color-brand)] shadow-sm" : "bg-[#17191d] text-[var(--color-text-muted)] hover:text-white hover:bg-[#282c34] border-[var(--color-border)]"}`}
              >
                <span 
                  className="w-1.5 h-1.5 rounded-full shrink-0" 
                  style={{ backgroundColor: isSelected ? '#ffffff' : tagColor }} 
                />
                <span>{tag}</span>
                {tagCount > 0 && (
                  <span className={`text-[9px] px-1 rounded-full ${isSelected ? "bg-black/30 text-white" : "bg-white/5 text-gray-400"}`}>
                    {tagCount}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Results stats */}
      <div className="flex items-center justify-between text-xs text-[var(--color-text-muted)] pt-0.5">
        <div>
          Exibindo <strong className="text-white">{filtered.length}</strong> de {avatarItems.length} avatares
          {filterTag !== "Todos" && <span> • Tag: <strong className="text-[var(--color-brand)]">{filterTag}</strong></span>}
          {filterNiche !== "Todos" && <span> • Perfil: <strong className="text-white">{filterNiche}</strong></span>}
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
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {filtered.map((media) => (
          <div 
            key={media.id} 
            className="bg-[#1f2329] rounded-xl overflow-hidden flex flex-col group border border-[var(--color-border)] hover:border-[var(--color-brand)]/60 transition-all relative shadow-sm hover:shadow-lg"
          >
            {/* Card Image Area */}
            <div 
              className="aspect-square bg-black relative overflow-hidden cursor-pointer flex items-center justify-center" 
              onClick={() => setPreviewItem(media)}
            >
              <img 
                src={media.thumbUrl} 
                alt={media.title} 
                referrerPolicy="no-referrer"
                loading="lazy"
                onError={(e) => { 
                  (e.target as HTMLImageElement).src = '/avatar-images/tom_hanks.png' 
                }}
                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300 opacity-90 group-hover:opacity-100" 
              />

              {/* Hover overlay with zoom icon */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                <div className="px-2.5 py-1.5 bg-black/70 backdrop-blur-sm rounded-full text-white text-[11px] font-medium flex items-center gap-1.5 shadow-lg border border-white/10">
                  <Eye className="w-3.5 h-3.5 text-[var(--color-brand)]" />
                  Ver Referência
                </div>
              </div>

              {/* Top action buttons */}
              <div className="absolute top-2 right-2 flex gap-1 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={(e) => { e.stopPropagation(); toggleLocalFavorite(media); }} 
                  className={`p-1.5 rounded-full transition-colors ${media.isFavorite ? 'bg-amber-500 text-black' : 'bg-black/70 text-white hover:bg-black'}`}
                  title="Favoritar"
                >
                  <Star className="w-3.5 h-3.5 fill-current" />
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); handleCopyText(media.id, media.title); }} 
                  className="p-1.5 bg-black/70 text-white rounded-full hover:bg-black transition-colors" 
                  title="Copiar Nome da Persona"
                >
                  {copiedId === media.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); openEditModal(media); }} 
                  className="p-1.5 bg-black/70 text-white rounded-full hover:bg-[var(--color-brand)] transition-colors" 
                  title="Editar"
                >
                  <Edit className="w-3.5 h-3.5" />
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); handleDelete(media.id); }} 
                  className="p-1.5 bg-black/70 text-white rounded-full hover:bg-red-600 transition-colors" 
                  title="Excluir"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Persona Badge */}
              <div className="absolute bottom-2 left-2 z-10">
                <span className="px-2 py-0.5 bg-black/70 backdrop-blur-md rounded text-[10px] font-medium text-gray-200 border border-white/10">
                  {media.niche}
                </span>
              </div>
            </div>

            {/* Card Content Area */}
            <div className="p-3 space-y-2 flex-grow bg-[#1f2329] flex flex-col justify-between">
              <div>
                <p 
                  className="text-xs font-bold text-white group-hover:text-[var(--color-brand)] transition-colors line-clamp-1 cursor-pointer"
                  title={media.title}
                  onClick={() => setPreviewItem(media)}
                >
                  {media.title}
                </p>
                <a 
                  href={media.driveLink} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="flex items-center gap-1 text-[10px] text-[var(--color-text-muted)] hover:text-white truncate mt-0.5"
                >
                  <ExternalLink className="h-2.5 w-2.5 shrink-0 text-emerald-400" />
                  <span className="truncate">Abrir no Google Drive</span>
                </a>
              </div>

              <div className="flex gap-1 flex-wrap pt-1 border-t border-[var(--color-border)]/50">
                {media.tags.slice(0, 3).map(tag => (
                  <Badge 
                    key={tag} 
                    variant="outline" 
                    colorHex={colors[tag] || '#3b82f6'} 
                    className="text-[9px] py-0 px-1.5 rounded cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation()
                      setFilterTag(tag)
                    }}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        ))}

        {/* Add New Avatar Card */}
        <div 
          onClick={openNewModal} 
          className="aspect-square border-2 border-dashed border-[#383e47] rounded-xl flex flex-col items-center justify-center text-[var(--color-text-muted)] hover:bg-[#1f2329] hover:text-white hover:border-[var(--color-brand)] transition-all cursor-pointer gap-2 p-4 text-center group"
        >
          <div className="w-10 h-10 rounded-full bg-[var(--color-brand)]/10 flex items-center justify-center group-hover:bg-[var(--color-brand)]/20 transition-colors">
            <Plus className="w-5 h-5 text-[var(--color-brand)]" />
          </div>
          <span className="text-xs font-semibold text-white">+ Novo Avatar</span>
          <span className="text-[10px] text-gray-500">Adicionar persona ou link de referência</span>
        </div>
      </div>

      {/* Add/Edit Avatar Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={() => setShowModal(false)}>
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-5" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold flex items-center gap-2 text-white">
                <Users className="w-5 h-5 text-[var(--color-brand)]" />
                {editingItem ? "Editar Referência" : "Nova Referência de Avatar"}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-[var(--color-text-muted)] hover:text-white transition-colors">
                <X className="w-5 h-5"/>
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[var(--color-text-muted)] mb-1.5">Nome / Celebridade / Persona *</label>
                <Input placeholder="Ex: Dr. Oz, Tom Hanks, Dra. Jennifer Ashton..." value={formTitle} onChange={e => setFormTitle(e.target.value)} autoFocus />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--color-text-muted)] mb-1.5">Link do Google Drive / Pasta</label>
                <Input placeholder={GDRIVE_FOLDER_URL} value={formDriveLink} onChange={e => setFormDriveLink(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--color-text-muted)] mb-1.5">Thumbnail / Imagem de Referência</label>
                <div className="flex gap-2 mb-2">
                  <Input 
                    placeholder="URL da imagem (/avatar-images/...) ou faça upload" 
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
                  <label className="block text-xs font-medium text-[var(--color-text-muted)] mb-1.5">Perfil / Faixa Etária</label>
                  <Input placeholder="Ex: Masculino 50+, Feminino 40+" value={formNiche} onChange={e => setFormNiche(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--color-text-muted)] mb-1.5">Tags (separadas por vírgula)</label>
                  <Input placeholder="Celebridade, Autoridade Médica, Especialista" value={formTags} onChange={e => setFormTags(e.target.value)} />
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

      {/* Image Inspector / Zoom Modal */}
      {previewItem && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4" 
          onClick={() => setPreviewItem(null)}
        >
          <div 
            className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]" 
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-4 border-b border-[var(--color-border)] flex items-center justify-between bg-[#17191d]">
              <div className="flex items-center gap-2.5">
                <Users className="w-5 h-5 text-[var(--color-brand)]" />
                <div>
                  <h3 className="text-sm font-bold text-white">{previewItem.title}</h3>
                  <span className="text-[11px] text-[var(--color-text-muted)]">{previewItem.niche}</span>
                </div>
              </div>
              <button 
                onClick={() => setPreviewItem(null)} 
                className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body / Image Zoom */}
            <div className="flex-1 bg-black/90 p-6 flex items-center justify-center min-h-[350px] overflow-hidden">
              <img 
                src={previewItem.thumbUrl} 
                alt={previewItem.title} 
                className="max-h-[60vh] max-w-full object-contain rounded-lg shadow-2xl border border-white/10"
              />
            </div>

            {/* Modal Footer / Details & Actions */}
            <div className="p-4 bg-[#17191d] border-t border-[var(--color-border)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex flex-wrap gap-1.5 items-center">
                {previewItem.tags.map(tag => (
                  <Badge 
                    key={tag} 
                    variant="outline" 
                    colorHex={colors[tag] || '#3b82f6'} 
                    className="text-[10px] py-0.5 px-2 rounded-full"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => handleCopyText(previewItem.id, previewItem.title)}
                  className="px-3 py-1.5 bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover)] border border-[var(--color-border)] text-xs text-white rounded-lg flex items-center gap-1.5 transition-colors"
                >
                  {copiedId === previewItem.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedId === previewItem.id ? "Copiado!" : "Copiar Nome"}
                </button>

                <a
                  href={previewItem.driveLink}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-1.5 bg-[var(--color-brand)] hover:bg-[var(--color-brand)]/90 text-xs text-white font-medium rounded-lg flex items-center gap-1.5 shadow-sm transition-all"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Abrir no Google Drive
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
