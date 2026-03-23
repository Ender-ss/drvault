import { useState } from "react"
import { X } from "lucide-react"
import { Button } from "../ui/Button"
import { Input } from "../ui/Input"
import { type MediaItem } from "../../data/mock"

interface BatchEditModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (updates: Partial<MediaItem>) => void
  count: number
}

export function BatchEditModal({ isOpen, onClose, onSave, count }: BatchEditModalProps) {
  const [formTitle, setFormTitle] = useState("")
  const [formNiche, setFormNiche] = useState("")
  const [formCategory, setFormCategory] = useState("")
  const [formBrollType, setFormBrollType] = useState("")
  const [formTags, setFormTags] = useState("")

  if (!isOpen) return null

  const handleSave = () => {
    const updates: Partial<MediaItem> = {}
    
    if (formTitle.trim()) updates.title = formTitle.trim()
    if (formNiche.trim()) updates.niche = formNiche.trim()
    if (formCategory) updates.category = formCategory
    if (formBrollType.trim()) updates.brollType = formBrollType.trim()
    
    const tagsArr = formTags.split(",").map(t => t.trim()).filter(Boolean)
    if (tagsArr.length > 0) {
      updates.tags = tagsArr
    }

    onSave(updates)
    
    // Reset form after saving
    setFormTitle("")
    setFormNiche("")
    setFormCategory("")
    setFormBrollType("")
    setFormTags("")
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl shadow-2xl w-full max-w-lg p-6 space-y-5" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Editar Lote ({count} itens)</h2>
          <button onClick={onClose} className="text-[var(--color-text-muted)] hover:text-white transition-colors"><X className="w-5 h-5"/></button>
        </div>
        
        <p className="text-sm text-[var(--color-text-muted)]">
          Preencha apenas os campos que deseja alterar para <strong className="text-white">todos os {count} itens selecionados</strong>. Deixe em branco para manter original.
        </p>
        
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[var(--color-text-muted)] mb-1.5">Título</label>
            <Input placeholder="Novo título para os itens..." value={formTitle} onChange={e => setFormTitle(e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[var(--color-text-muted)] mb-1.5">Nicho</label>
              <Input placeholder="Qualquer valor..." value={formNiche} onChange={e => setFormNiche(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--color-text-muted)] mb-1.5">Categoria</label>
              <select
                className="w-full h-9 bg-[var(--color-background)] border border-[var(--color-border)] text-sm text-[var(--color-text)] rounded-md px-3 focus:outline-none focus:ring-1 focus:ring-[var(--color-brand)]"
                value={formCategory}
                onChange={e => setFormCategory(e.target.value)}
              >
                <option value="">(Sem alteração)</option>
                <option value="broll">B-Roll</option>
                <option value="reference">Referência</option>
                <option value="avatar">Avatar</option>
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-xs font-medium text-[var(--color-text-muted)] mb-1.5">Tipo Específico de B-Roll</label>
            <Input value={formBrollType} onChange={e => setFormBrollType(e.target.value)} placeholder="(Sem alteração)" />
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--color-text-muted)] mb-1.5">Tags (adicionar/sobrescrever)</label>
            <Input placeholder="(Sem alteração)" value={formTags} onChange={e => setFormTags(e.target.value)} />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button variant="brand" onClick={handleSave}>Aplicar Lote</Button>
        </div>
      </div>
    </div>
  )
}
