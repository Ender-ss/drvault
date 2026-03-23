import { useState, useEffect } from "react"
import { Youtube, Plus, X, ExternalLink, Info, Edit, Trash2, Sparkles, Loader2 } from "lucide-react"
import { Card } from "../components/ui/Card"
import { Button } from "../components/ui/Button"
import { Input } from "../components/ui/Input"
import { Badge } from "../components/ui/Badge"
import { getAiConfig, callAI } from "../services/aiService"

interface AdType {
  id: string
  title: string
  format: string
  description: string
  exampleLink: string
  thumbnailUrl: string
  tags: string[]
  aiAnalysis?: string
}

const initialAdTypes: AdType[] = [
  {
    id: "1",
    title: "UGC (User Generated Content)",
    format: "Vertical 9:16",
    description: "Anúncio com aparência orgânica, gravado por uma pessoa real falando sobre o produto. Foca em autenticidade e prova social.",
    exampleLink: "https://vimeo.com/768051230",
    thumbnailUrl: "https://picsum.photos/seed/ugc/400/600",
    tags: ["Validado", "Engajamento"]
  },
  {
    id: "2",
    title: "VSL (Video Sales Letter)",
    format: "Horizontal 16:9",
    description: "Vídeo focado em roteiro de vendas, geralmente com fundo branco e letras pretas ou narração com b-rolls cinemáticos.",
    exampleLink: "https://vimeo.com/768051230",
    thumbnailUrl: "https://picsum.photos/seed/vsl/400/600",
    tags: ["Vendas", "Direto"]
  },
  {
    id: "3",
    title: "Direct Response / Cinematic",
    format: "1:1 ou 4:5",
    description: "Produção de alta qualidade com hooks visuais fortes e narrativa rápida para prender a atenção no feed.",
    exampleLink: "https://vimeo.com/768051230",
    thumbnailUrl: "https://picsum.photos/seed/cine/400/600",
    tags: ["Premium", "Branding"]
  }
]

export default function AdTypes() {
  const [adTypes, setAdTypes] = useState<AdType[]>(() => {
    const saved = localStorage.getItem("drvault_ad_types")
    return saved ? JSON.parse(saved) : initialAdTypes
  })
  const [showModal, setShowModal] = useState(false)
  const [editingAd, setEditingAd] = useState<AdType | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState<string | null>(null) // ID of ad being analyzed
  
  // Form state
  const [formTitle, setFormTitle] = useState("")
  const [formFormat, setFormFormat] = useState("")
  const [formDesc, setFormDesc] = useState("")
  const [formLink, setFormLink] = useState("")
  const [formThumb, setFormThumb] = useState("")
  const [formTags, setFormTags] = useState("")

  useEffect(() => {
    localStorage.setItem("drvault_ad_types", JSON.stringify(adTypes))
  }, [adTypes])

  const openModal = (ad?: AdType) => {
    if (ad) {
      setEditingAd(ad)
      setFormTitle(ad.title)
      setFormFormat(ad.format)
      setFormDesc(ad.description)
      setFormLink(ad.exampleLink)
      setFormThumb(ad.thumbnailUrl)
      setFormTags(ad.tags.join(", "))
    } else {
      setEditingAd(null)
      setFormTitle("")
      setFormFormat("")
      setFormDesc("")
      setFormLink("")
      setFormThumb("")
      setFormTags("")
    }
    setShowModal(true)
  }

  const handleSave = () => {
    if (!formTitle.trim()) return
    const tagsArr = formTags.split(",").map(t => t.trim()).filter(Boolean)
    
    if (editingAd) {
      setAdTypes(adTypes.map(a => a.id === editingAd.id ? {
        ...a,
        title: formTitle,
        format: formFormat,
        description: formDesc,
        exampleLink: formLink,
        thumbnailUrl: formThumb || a.thumbnailUrl,
        tags: tagsArr
      } : a))
    } else {
      const newItem: AdType = {
        id: String(Date.now()),
        title: formTitle,
        format: formFormat || "N/A",
        description: formDesc,
        exampleLink: formLink || "#",
        thumbnailUrl: formThumb || `https://picsum.photos/seed/${Date.now()}/400/600`,
        tags: tagsArr
      }
      setAdTypes([newItem, ...adTypes])
    }
    setShowModal(false)
  }

  const handleDelete = (id: string) => {
    if (confirm("Excluir este formato?")) {
      setAdTypes(adTypes.filter(a => a.id !== id))
    }
  }

  const handleAnalyzeWithAI = async (ad: AdType) => {
    setIsAnalyzing(ad.id)
    try {
      const config = getAiConfig()
      const prompt = `Você é um estrategista de anúncios de direct response. Analise o seguinte formato de anúncio e forneça uma breve estrutura (Hook, Body, CTA) e por que ele funciona. 
      Nome: ${ad.title}
      Formato: ${ad.format}
      Descrição: ${ad.description}
      Retorne um texto curto e direto em Português.`

      const result = await callAI([{ role: "user", content: prompt }], config)
      setAdTypes(prev => prev.map(a => a.id === ad.id ? { ...a, aiAnalysis: result } : a))
    } catch (error: any) {
      alert("Erro na análise: " + error.message)
    } finally {
      setIsAnalyzing(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight uppercase">Tipos de Ads</h1>
          <p className="text-[var(--color-text-muted)] mt-1 font-semibold">Formatos e referências de estrutura</p>
        </div>
        <Button variant="brand" onClick={() => openModal()}>
          <Plus className="w-4 h-4 mr-1" /> Novo Formato
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {adTypes.map((ad) => (
          <Card key={ad.id} className="overflow-hidden border-[var(--color-border)] hover:border-[var(--color-brand)]/50 transition-colors flex flex-col group h-full">
            <div className="aspect-[3/4] bg-black relative overflow-hidden">
              <img src={ad.thumbnailUrl} alt={ad.title} className="w-full h-full object-cover opacity-70 group-hover:opacity-90 transition-opacity" />
              
              <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 gap-4">
                <a href={ad.exampleLink} target="_blank" rel="noreferrer" className="bg-white text-black p-3 rounded-full hover:scale-110 transition-transform shadow-lg" title="Ver Exemplo">
                  <ExternalLink className="w-6 h-6" />
                </a>
                <div className="flex gap-2">
                  <button onClick={() => openModal(ad)} className="p-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-full hover:bg-[var(--color-brand)] transition-colors" title="Editar">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(ad.id)} className="p-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-full hover:bg-red-600 transition-colors" title="Excluir">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="absolute top-3 left-3 flex flex-col gap-2 pointer-events-none">
                <Badge variant="secondary" className="bg-black/80 backdrop-blur-sm border-white/20 text-white font-bold opacity-100">{ad.format}</Badge>
              </div>
            </div>
            
            <div className="p-5 flex-1 flex flex-col space-y-3">
              <h3 className="text-base font-bold flex items-center gap-2 leading-tight">
                <Youtube className="w-4 h-4 text-[var(--color-brand)] shrink-0" />
                {ad.title}
              </h3>
              
              <div className="flex flex-wrap gap-1">
                {ad.tags.map(tag => (
                  <Badge key={tag} variant="outline" className="text-[9px] py-0 px-1.5 uppercase border-[var(--color-brand)]/20 text-[var(--color-brand)]">{tag}</Badge>
                ))}
              </div>

              <p className="text-xs text-[var(--color-text-muted)] leading-relaxed line-clamp-3">
                {ad.description}
              </p>

              {ad.aiAnalysis && (
                <div className="mt-2 p-3 bg-[var(--color-brand)]/5 border border-[var(--color-brand)]/20 rounded-lg text-[10px] text-[var(--color-text-muted)] italic relative">
                  <Sparkles className="w-3 h-3 text-[var(--color-brand)] absolute top-2 right-2" />
                  {ad.aiAnalysis}
                </div>
              )}

              <div className="pt-3 mt-auto flex flex-col gap-2">
                <button 
                  onClick={() => handleAnalyzeWithAI(ad)}
                  disabled={!!isAnalyzing}
                  className="w-full py-1.5 rounded border border-[var(--color-border)] text-[10px] font-bold uppercase tracking-wider hover:bg-[var(--color-surface-hover)] transition-colors flex items-center justify-center gap-2 group"
                >
                  {isAnalyzing === ad.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3 text-[var(--color-brand)] group-hover:scale-110 transition-transform" />}
                  {ad.aiAnalysis ? "Analisar Novamente" : "Analisar com IA"}
                </button>
                
                <div className="flex items-center justify-between border-t border-[var(--color-border)]/50 pt-2">
                  <span className="text-[10px] font-bold text-[var(--color-text-muted)] flex items-center gap-1 uppercase tracking-wider">
                    <Info className="w-2.5 h-2.5" /> Referência
                  </span>
                  <a href={ad.exampleLink} target="_blank" rel="noreferrer" className="text-[10px] text-[var(--color-brand)] hover:underline flex items-center gap-1 font-bold">
                    VER VÍDEO <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl shadow-2xl w-full max-w-lg p-6 space-y-5" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">{editingAd ? "Editar Formato" : "Adicionar Formato"}</h2>
              <button onClick={() => setShowModal(false)} className="text-[var(--color-text-muted)] hover:text-white transition-colors"><X className="w-5 h-5"/></button>
            </div>
            
            <div className="space-y-4 max-h-[60vh] overflow-y-auto px-1">
              <div>
                <label className="block text-xs font-medium text-[var(--color-text-muted)] mb-1.5">Nome do Formato / Título *</label>
                <Input placeholder="Ex: UGC Reação" value={formTitle} onChange={e => setFormTitle(e.target.value)} autoFocus />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[var(--color-text-muted)] mb-1.5">Dimensões / Aspect Ratio</label>
                  <Input placeholder="Ex: Vertical 9:16" value={formFormat} onChange={e => setFormFormat(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--color-text-muted)] mb-1.5">Tags (vírgula)</label>
                  <Input placeholder="Ex: Validado, VSL" value={formTags} onChange={e => setFormTags(e.target.value)} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--color-text-muted)] mb-1.5">Descrição / Explicação</label>
                <textarea 
                  className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-md p-3 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--color-brand)] min-h-[100px]"
                  placeholder="Explique no que consiste este formato..."
                  value={formDesc}
                  onChange={e => setFormDesc(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--color-text-muted)] mb-1.5">Link de Referência (Vimeo/Drive/YouTube)</label>
                <Input placeholder="https://..." value={formLink} onChange={e => setFormLink(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--color-text-muted)] mb-1.5">URL da Thumbnail (Opcional)</label>
                <div className="flex gap-2">
                  <Input className="flex-1" placeholder="URL ou faça upload ao lado..." value={formThumb} onChange={e => setFormThumb(e.target.value)} />
                  <label className="cursor-pointer bg-[var(--color-surface-hover)] border border-[var(--color-border)] px-3 rounded-md flex items-center justify-center hover:bg-[var(--color-brand)]/10 hover:border-[var(--color-brand)]/50 transition-colors group">
                    <Plus className="w-4 h-4 text-[var(--color-text-muted)] group-hover:text-[var(--color-brand)]" />
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          const reader = new FileReader()
                          reader.onloadend = () => {
                            setFormThumb(reader.result as string)
                          }
                          reader.readAsDataURL(file)
                        }
                      }}
                    />
                  </label>
                </div>
                {formThumb && (
                  <div className="mt-2 rounded-lg overflow-hidden border border-[var(--color-border)] aspect-[3/4] w-24 mx-auto">
                    <img src={formThumb} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setShowModal(false)}>Cancelar</Button>
              <Button variant="brand" onClick={handleSave} disabled={!formTitle.trim()}>
                {editingAd ? "Salvar Alterações" : "Adicionar Formato"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
