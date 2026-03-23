import { useState } from "react"
import { Search, X, Film } from "lucide-react"
import { Input } from "../ui/Input"
import { Badge } from "../ui/Badge"
import { initialMediaItems, type MediaItem } from "../../data/mock"

interface BrollPickerProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (item: MediaItem) => void
}

export function BrollPicker({ isOpen, onClose, onSelect }: BrollPickerProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterNiche, setFilterNiche] = useState("Todos")
  const [filterCategory, setFilterCategory] = useState("Todos")

  if (!isOpen) return null

  const allNiches = [...new Set(initialMediaItems.map(m => m.niche))]
  const allCategories = [...new Set(initialMediaItems.map(m => m.category))]

  const filtered = initialMediaItems.filter(m => {
    const matchesSearch = searchTerm === "" ||
      m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase())) ||
      m.niche.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesNiche = filterNiche === "Todos" || m.niche === filterNiche
    const matchesCategory = filterCategory === "Todos" || m.category === filterCategory
    return matchesSearch && matchesNiche && matchesCategory
  })

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl shadow-2xl w-full max-w-3xl max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)]">
          <div className="flex items-center gap-2">
            <Film className="w-5 h-5 text-purple-400" />
            <h2 className="text-lg font-bold">Selecionar B-Roll da Biblioteca</h2>
          </div>
          <button onClick={onClose} className="text-[var(--color-text-muted)] hover:text-white transition-colors"><X className="w-5 h-5"/></button>
        </div>

        {/* Search */}
        <div className="flex items-center gap-3 p-4 border-b border-[var(--color-border)]">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-muted)]" />
            <Input className="pl-9" placeholder="Buscar por título, tag, nicho..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} autoFocus />
          </div>
          <select
            className="bg-[var(--color-background)] border border-[var(--color-border)] text-sm text-[var(--color-text)] rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[var(--color-brand)]"
            value={filterNiche}
            onChange={e => setFilterNiche(e.target.value)}
          >
            <option value="Todos">Nicho: Todos</option>
            {allNiches.map(n => <option key={n} value={n}>{n}</option>)}
          </select>
          <select
            className="bg-[var(--color-background)] border border-[var(--color-border)] text-sm text-[var(--color-text)] rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[var(--color-brand)]"
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
          >
            <option value="Todos">Categoria: Todas</option>
            {allCategories.map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
          </select>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
            {filtered.map(media => (
              <button
                key={media.id}
                onClick={() => onSelect(media)}
                className="bg-[#1f2329] rounded-lg overflow-hidden flex flex-col border border-transparent hover:border-[var(--color-brand)] transition-all group text-left cursor-pointer hover:scale-[1.02]"
              >
                <div className="aspect-square bg-black relative overflow-hidden">
                  <img src={media.thumbUrl} alt={media.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="p-2 space-y-1">
                  <p className="text-xs font-medium text-[var(--color-text)] truncate">{media.title}</p>
                  <div className="flex gap-1 flex-wrap">
                    <Badge variant="secondary" className="text-[9px] py-0 px-1 rounded uppercase">{media.category}</Badge>
                    <Badge variant="outline" className="text-[9px] py-0 px-1 rounded">{media.niche}</Badge>
                    {media.tags.slice(0, 2).map(tag => (
                      <Badge key={tag} variant={tag.toLowerCase() === 'validado' ? 'success' : 'outline'} className="text-[9px] py-0 px-1 rounded">{tag}</Badge>
                    ))}
                  </div>
                </div>
              </button>
            ))}
          </div>
          {filtered.length === 0 && (
            <div className="text-center text-[var(--color-text-muted)] py-12">
              Nenhum b-roll encontrado para essa busca.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
