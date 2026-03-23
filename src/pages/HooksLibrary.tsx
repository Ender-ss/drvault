import { useState } from "react"
import { Search, Plus, X, Copy, Check, Star } from "lucide-react"
import { Card } from "../components/ui/Card"
import { Button } from "../components/ui/Button"
import { Input } from "../components/ui/Input"
import { Badge } from "../components/ui/Badge"

interface SavedHook {
  id: string
  text: string
  niche: string
  status: "Validado" | "Teste" | "Escala"
  performance: string
}

const initialHooks: SavedHook[] = [
  {
    id: "1",
    text: "Você sabia que o sal rosa que você usa na cozinha pode estar destruindo seus nervos?",
    niche: "Neuropatia",
    status: "Validado",
    performance: "CTR 2.4%"
  },
  {
    id: "2",
    text: "Parem de usar metformina antes de ver este vídeo de 30 segundos do Dr. Oz.",
    niche: "Diabetes",
    status: "Escala",
    performance: "ROI 3.5x"
  },
  {
    id: "3",
    text: "O segredo para dormir como um bebê não está em remédios, mas neste ritual de 2 minutos.",
    niche: "Sono/Insônia",
    status: "Teste",
    performance: "Em teste"
  }
]

export default function HooksLibrary() {
  const [hooks, setHooks] = useState<SavedHook[]>(initialHooks)
  const [searchTerm, setSearchTerm] = useState("")
  const [showModal, setShowModal] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // New hook state
  const [newText, setNewText] = useState("")
  const [newNiche, setNewNiche] = useState("")
  const [newStatus, setNewStatus] = useState<"Validado" | "Teste" | "Escala">("Teste")
  const [newPerf, setNewPerf] = useState("")

  const handleCreate = () => {
    if (!newText.trim()) return
    const newItem: SavedHook = {
      id: String(Date.now()),
      text: newText,
      niche: newNiche || "Geral",
      status: newStatus,
      performance: newPerf || "N/A"
    }
    setHooks([newItem, ...hooks])
    setShowModal(false)
    setNewText("")
    setNewNiche("")
    setNewStatus("Teste")
    setNewPerf("")
  }

  const handleCopy = (hook: SavedHook) => {
    navigator.clipboard.writeText(hook.text)
    setCopiedId(hook.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const filtered = hooks.filter(h => 
    h.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
    h.niche.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight uppercase">Biblioteca de Hooks</h1>
          <p className="text-[var(--color-text-muted)] mt-1 font-semibold">Os melhores ganchos de atenção validados</p>
        </div>
        <Button variant="brand" onClick={() => setShowModal(true)}>
          <Plus className="w-4 h-4 mr-1" /> Novo Hook
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-muted)]" />
        <Input 
          className="pl-9" 
          placeholder="Buscar gancho ou nicho..." 
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filtered.map((hook) => (
          <Card key={hook.id} className="p-4 bg-[var(--color-surface)] border-[var(--color-border)] hover:border-[var(--color-brand)]/30 transition-colors flex items-center justify-between gap-6 group">
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-brand)] border-[var(--color-brand)]/30">{hook.niche}</Badge>
                <Badge variant={hook.status === "Validado" ? "success" : "default"} className="text-[10px] uppercase font-bold">{hook.status}</Badge>
                {hook.status === "Escala" && <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-500" />}
              </div>
              <p className="text-[var(--color-text)] font-medium leading-relaxed italic">
                "{hook.text}"
              </p>
              <div className="text-[10px] text-[var(--color-text-muted)] font-bold uppercase tracking-wider">
                Performance: <span className="text-white">{hook.performance}</span>
              </div>
            </div>
            
            <button 
              onClick={() => handleCopy(hook)}
              className="p-3 rounded-lg bg-[var(--color-background)] border border-[var(--color-border)] hover:bg-[var(--color-brand)]/10 hover:border-[var(--color-brand)]/50 transition-all text-[var(--color-text-muted)] hover:text-white"
            >
              {copiedId === hook.id ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
            </button>
          </Card>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl shadow-2xl w-full max-w-lg p-6 space-y-5" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">Adicionar Melhor Hook</h2>
              <button onClick={() => setShowModal(false)} className="text-[var(--color-text-muted)] hover:text-white transition-colors"><X className="w-5 h-5"/></button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[var(--color-text-muted)] mb-1.5">Texto do Hook *</label>
                <textarea 
                  className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-md p-3 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--color-brand)] min-h-[100px]"
                  placeholder="Início promissor da copy..."
                  value={newText}
                  onChange={e => setNewText(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[var(--color-text-muted)] mb-1.5">Nicho</label>
                  <Input placeholder="Ex: Diabetes" value={newNiche} onChange={e => setNewNiche(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--color-text-muted)] mb-1.5">Status</label>
                  <select
                    className="w-full h-9 bg-[var(--color-background)] border border-[var(--color-border)] text-sm text-[var(--color-text)] rounded-md px-3 focus:outline-none focus:ring-1 focus:ring-[var(--color-brand)]"
                    value={newStatus}
                    onChange={e => setNewStatus(e.target.value as any)}
                  >
                    <option value="Teste">Teste</option>
                    <option value="Validado">Validado</option>
                    <option value="Escala">Escala</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--color-text-muted)] mb-1.5">Performance (Métrica)</label>
                <Input placeholder="Ex: CTR 3.1%" value={newPerf} onChange={e => setNewPerf(e.target.value)} />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setShowModal(false)}>Cancelar</Button>
              <Button variant="brand" onClick={handleCreate} disabled={!newText.trim()}>Adicionar</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
