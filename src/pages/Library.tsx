import { useState, useRef } from "react"
import { Link as LinkIcon, Search, Plus, X, Edit, Trash2, Star, Copy, Upload } from "lucide-react"
import { Badge } from "../components/ui/Badge"
import { Button } from "../components/ui/Button"
import { Input } from "../components/ui/Input"
import { type MediaItem } from "../data/mock"
import { useTagColors } from "../hooks/useTagColors"
import { useMediaItems } from "../hooks/useMediaItems"
import { ManageColorsModal } from "../components/editor/ManageColorsModal"
import { BatchEditModal } from "../components/editor/BatchEditModal"

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

  // Unique values for filters
  const allTags = [...new Set(mediaItems.flatMap(m => m.tags))]
  const allNiches = [...new Set(mediaItems.map(m => m.niche))]
  const allCategories = [...new Set(mediaItems.map(m => m.category))]
  const allBrollTypes = [...new Set(mediaItems.map(m => m.brollType).filter(Boolean) as string[])]

  const filtered = mediaItems.filter(m => {
    const matchesSearch = searchTerm === "" ||
      m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.driveLink.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
          <p className="text-[var(--color-text-muted)] mt-1 font-semibold">B-Rolls e Referências Visuais</p>
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
          <Input className="pl-9" placeholder="Buscar por título, tag..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
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
        <select
          className="bg-[var(--color-surface)] border border-[var(--color-border)] text-sm text-[var(--color-text)] rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[var(--color-brand)]"
          value={filterTag}
          onChange={e => setFilterTag(e.target.value)}
        >
          <option value="Todos">Tag: Todos</option>
          {allTags.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <button
          onClick={() => setFilterFavorite(!filterFavorite)}
          className={`px-3 py-2 rounded-md border text-sm font-medium transition-colors flex items-center gap-1.5 ${filterFavorite ? 'bg-[var(--color-brand)]/10 text-[var(--color-brand)] border-[var(--color-brand)]' : 'bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-white'}`}
        >
          <Star className={`w-4 h-4 ${filterFavorite ? 'fill-[var(--color-brand)]' : ''}`} />
          Favoritos
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {filtered.map((media) => (
          <div key={media.id} className="bg-[#1f2329] rounded-lg overflow-hidden flex flex-col group border transition-colors relative"
            style={{ borderColor: selectedIds.has(media.id) ? 'var(--color-brand)' : 'transparent' }}
          >
            <div className="aspect-[3/4] bg-black relative overflow-hidden cursor-pointer" onClick={(e) => toggleSelection(media.id, e)}>
              <div className={`absolute top-2 left-2 z-10 w-5 h-5 rounded flex items-center justify-center border transition-colors ${selectedIds.has(media.id) ? 'bg-[var(--color-brand)] border-[var(--color-brand)]' : 'bg-black/50 border-white/50 group-hover:border-white'}`}>
                {selectedIds.has(media.id) && <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
              </div>
              <img src={media.thumbUrl} alt={media.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
              {media.isFavorite && (
                <div className="absolute top-2 right-2 text-yellow-400 z-10 filter drop-shadow-md">
                  <Star className="w-5 h-5 fill-yellow-400" />
                </div>
              )}
              {/* Hover actions */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button onClick={(e) => { e.stopPropagation(); toggleFavorite(media.id, !!media.isFavorite) }} className={`p-2 bg-[var(--color-surface)] rounded-full transition-colors ${media.isFavorite ? 'hover:bg-yellow-600' : 'hover:bg-[var(--color-surface-hover)]'}`} title={media.isFavorite ? "Remover dos favoritos" : "Favoritar"}>
                  <Star className={`w-4 h-4 ${media.isFavorite ? 'text-yellow-400 fill-yellow-400' : 'text-white'}`} />
                </button>
                <button onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(media.driveLink); }} className="p-2 bg-[var(--color-surface)] rounded-full hover:bg-blue-600 transition-colors" title="Copiar Link">
                  <Copy className="w-4 h-4" />
                </button>
                <button onClick={(e) => { e.stopPropagation(); openEditModal(media) }} className="p-2 bg-[var(--color-surface)] rounded-full hover:bg-[var(--color-brand)] transition-colors" title="Editar">
                  <Edit className="w-4 h-4" />
                </button>
                <button onClick={(e) => { e.stopPropagation(); handleDelete(media.id) }} className="p-2 bg-[var(--color-surface)] rounded-full hover:bg-red-600 transition-colors" title="Excluir">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="p-3 space-y-1.5 flex-grow bg-[#1f2329]">
              <p className="text-xs font-medium text-[var(--color-text)] truncate" title={media.title}>{media.title}</p>
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
    </div>
  )
}
