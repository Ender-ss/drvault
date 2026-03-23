import { useState } from "react"
import { Search, Filter, FileText, User, RefreshCw, X, Plus } from "lucide-react"
import { Input } from "../components/ui/Input"
import { Button } from "../components/ui/Button"
import { Card } from "../components/ui/Card"
import { Badge } from "../components/ui/Badge"
import { useCopies, type ExtendedCopy } from "../hooks/useCopies"
import { Link, useNavigate } from "react-router-dom"

export default function CopiesList() {
  const navigate = useNavigate()
  const { copies, addCopy } = useCopies()
  const [showModal, setShowModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  // New copy form state
  const [newTitle, setNewTitle] = useState("")
  const [newNiche, setNewNiche] = useState("")
  const [newPlatform, setNewPlatform] = useState("Facebook Ads")
  const [newFunnel, setNewFunnel] = useState("")
  const [newAuthor, setNewAuthor] = useState("")

  const handleCreateCopy = () => {
    if (!newTitle.trim()) return
    const newCopy: ExtendedCopy = {
      id: String(Date.now()),
      title: newTitle,
      status: "Draft",
      niche: newNiche || "Geral",
      platform: newPlatform,
      funnel: newFunnel || "N/A",
      authors: [newAuthor || "Equipe Copy"],
      hooksCount: 0,
      date: new Date().toISOString(),
      ads: [{
        id: `ad-${Date.now()}`,
        title: "Ad 1",
        script: "",
        decisionMaking: "",
        format: "",
        videoStyle: "",
        reference: "",
        briefing: "",
        hooks: [],
        annotations: [],
        avatarUrl: "",
        avatarTitle: "",
        avatarLink: ""
      }]
    }
    
    addCopy(newCopy)
    setShowModal(false)
    setNewTitle("")
    setNewNiche("")
    setNewFunnel("")
    setNewAuthor("")
    navigate(`/copies/${newCopy.id}`)
  }

  const filtered = copies.filter(c =>
    c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.niche.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.authors.some(a => a.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Copies</h1>
          <p className="text-[var(--color-text-muted)] mt-1">Scripts de anúncios da equipe</p>
        </div>
        <Button variant="brand" onClick={() => setShowModal(true)}>
          <Plus className="w-4 h-4 mr-1" /> Nova Copy
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-muted)]" />
          <Input 
            className="pl-9" 
            placeholder="Buscar por título, nicho ou copywriter..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="outline">
          <Filter className="h-4 w-4 mr-2" /> Todos
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((copy) => (
          <Link key={copy.id} to={`/copies/${copy.id}`}>
            <Card className="flex flex-col h-full hover:border-[var(--color-brand)]/50 transition-colors cursor-pointer">
              <div className="p-5 flex-1 space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-[var(--color-text)] leading-tight flex items-center gap-2">
                    <FileText className="h-4 w-4 text-[var(--color-brand)] shrink-0" />
                    {copy.title}
                  </h3>
                  <Badge variant={copy.status === "Validado" ? "success" : "default"} className="shrink-0">
                    {copy.status.toLowerCase()}
                  </Badge>
                </div>
                
                <div>
                  <Badge variant="secondary" className="mb-3">{copy.niche}</Badge>
                  
                  <div className="space-y-2 text-sm text-[var(--color-text-muted)]">
                    <div className="flex items-center gap-2">
                      <User className="h-3.5 w-3.5" />
                      <span>{copy.authors.join(", ")}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <RefreshCw className="h-3.5 w-3.5" />
                      <span>{copy.funnel || "N/A"}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="px-5 py-3 border-t border-[var(--color-border)] bg-[var(--color-surface-hover)]/30 text-xs text-[var(--color-text-muted)] mt-auto flex items-center gap-2">
                <span>{copy.hooksCount} hooks</span>
                <span>•</span>
                <span>{copy.platform}</span>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      {/* Nova Copy Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl shadow-2xl w-full max-w-lg p-6 space-y-5" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">Nova Copy</h2>
              <button onClick={() => setShowModal(false)} className="text-[var(--color-text-muted)] hover:text-white transition-colors"><X className="w-5 h-5"/></button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[var(--color-text-muted)] mb-1.5">Título *</label>
                <Input placeholder="Ex: AD 4 - Novo Hook Diabetes" value={newTitle} onChange={e => setNewTitle(e.target.value)} autoFocus />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[var(--color-text-muted)] mb-1.5">Nicho</label>
                  <Input placeholder="Ex: Neuropatia" value={newNiche} onChange={e => setNewNiche(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--color-text-muted)] mb-1.5">Plataforma</label>
                  <Input placeholder="Ex: Facebook Ads" value={newPlatform} onChange={e => setNewPlatform(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[var(--color-text-muted)] mb-1.5">Funil</label>
                  <Input placeholder="Ex: F273" value={newFunnel} onChange={e => setNewFunnel(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--color-text-muted)] mb-1.5">Copywriter</label>
                  <Input placeholder="Ex: Equipe Copy" value={newAuthor} onChange={e => setNewAuthor(e.target.value)} />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setShowModal(false)}>Cancelar</Button>
              <Button variant="brand" onClick={handleCreateCopy} disabled={!newTitle.trim()}>Criar Copy</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
