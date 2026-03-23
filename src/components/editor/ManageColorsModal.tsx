import { useState } from "react"
import { X } from "lucide-react"
import { useTagColors } from "../../hooks/useTagColors"
import { Button } from "../ui/Button"

interface ManageColorsModalProps {
  isOpen: boolean
  onClose: () => void
  tags: string[]
  categories: string[]
  niches: string[]
  brollTypes: string[]
}

export function ManageColorsModal({ isOpen, onClose, tags, categories, niches, brollTypes }: ManageColorsModalProps) {
  const { colors, updateColor } = useTagColors()
  const [activeTab, setActiveTab] = useState<"tags" | "categories" | "niches" | "brollTypes">("categories")

  if (!isOpen) return null

  const getList = () => {
    switch(activeTab) {
      case "tags": return tags;
      case "categories": return categories;
      case "niches": return niches;
      case "brollTypes": return brollTypes;
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold">Gerenciar Cores</h2>
          <button onClick={onClose} className="text-[var(--color-text-muted)] hover:text-white"><X className="w-5 h-5"/></button>
        </div>

        <div className="flex gap-2 mb-4 border-b border-[var(--color-border)] pb-2">
          {(["categories", "niches", "brollTypes", "tags"] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`text-xs uppercase font-bold py-1 px-2 rounded-md transition-colors ${activeTab === tab ? "bg-[var(--color-brand)]/20 text-[var(--color-brand)]" : "text-[var(--color-text-muted)] hover:text-white"}`}
            >
              {tab === "categories" ? "Categorias" : tab === "niches" ? "Nichos" : tab === "brollTypes" ? "Tipos" : "Tags"}
            </button>
          ))}
        </div>

        <div className="max-h-[60vh] overflow-y-auto space-y-3">
          {getList().length === 0 && <p className="text-sm text-[var(--color-text-muted)] text-center py-4">Nenhum item encontrado.</p>}
          {getList().map(item => (
            <div key={item} className="flex items-center justify-between bg-[#1f2329] p-3 rounded-md">
              <span className="text-sm font-medium">{item}</span>
              <input 
                type="color" 
                value={colors[item] || "#ffffff"}
                onChange={(e) => updateColor(item, e.target.value)}
                className="w-8 h-8 rounded cursor-pointer border-0 p-0 bg-transparent"
              />
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-end">
          <Button variant="brand" onClick={onClose}>Pronto</Button>
        </div>
      </div>
    </div>
  )
}
