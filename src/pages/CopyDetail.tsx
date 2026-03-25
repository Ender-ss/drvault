import { useParams } from "react-router-dom"
import { useState, useEffect, useRef } from "react"
import { Edit, Link as LinkIcon, Copy, Save, MessageSquare, Film, X, Plus, Trash2, Image, Download, Search, Pencil, Check, FileText } from "lucide-react"
import { Button } from "../components/ui/Button"
import { Badge } from "../components/ui/Badge"
import { Card } from "../components/ui/Card"
import { Input } from "../components/ui/Input"
import { useCopies, type Hook } from "../hooks/useCopies"
import { ScriptEditor, type Annotation } from "../components/editor/ScriptEditor"
import { useMediaItems } from "../hooks/useMediaItems"
import { BrollPicker } from "../components/editor/BrollPicker"
import { exportCopyToDocx } from "../utils/exportDocx"
import { getApiKey, saveApiKey, translateText, verifyTranslation } from "../services/aiService"
import { Panel, Group as PanelGroup, Separator as PanelResizeHandle } from "react-resizable-panels"
import { useLayout } from "../hooks/useLayout"
import type { MediaItem } from "../data/mock"

// ──────────────────────────

// ──────────────────────────

const defaultBriefing = "Quero um avatar do Oz no programa dele (tem que aparecer na tv ali escrito Dr.Oz Show)\nFaça uma edição igual à referência."

const defaultHooks: Hook[] = [
  { id: "hk1", label: "HK01", status: "Validado", text: "Beber água morna com sal rosa antes de dormir elimina nanopartículas de microplásticos dos seus nervos, redefine seus sinais nervosos e acaba com a queimação..." },
  { id: "hk2", label: "HK02", status: "Escala", text: "Você sabia que sal rosa com cúrcuma antes de dormir pode fazer você esquecer que algum dia teve que colocar os pés na água gelada?" },
  { id: "hk3", label: "HK03", status: "Escala", text: "Se seus pés queimam ou formigam, faça isso antes de dormir..." },
]

export default function CopyDetail() {
  const { id } = useParams()
  const { copies, updateCopy, isLoaded } = useCopies()
  const { mediaItems } = useMediaItems()
  const copy = copies.find(c => c.id === id)
  const { layoutMode } = useLayout()

  const [isEditing, setIsEditing] = useState(false)
  const [language, setLanguage] = useState<"PT" | "EN">("PT")
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const defaultAds = copy?.ads || [{
    id: 'ad1', title: 'Ad 1', script: '', scriptEN: '', briefing: defaultBriefing, briefingEN: '',
    hooks: defaultHooks, annotations: [], avatarUrl: '', avatarTitle: '', avatarLink: ''
  }]
  const [activeAdId, setActiveAdId] = useState<string>(defaultAds[0].id)
  const activeAd = defaultAds.find(a => a.id === activeAdId) || defaultAds[0]

  // Diretrizes / Briefing
  const [decisionMaking, setDecisionMaking] = useState<string>(activeAd.decisionMaking || "")
  const [format, setFormat] = useState<string>(activeAd.format || "")
  const [videoStyle, setVideoStyle] = useState<string>(activeAd.videoStyle || "")
  const [reference, setReference] = useState<string>(activeAd.reference || "")
  const [briefing, setBriefing] = useState<string>(activeAd.briefing || defaultBriefing)
  const [briefingEN, setBriefingEN] = useState<string>(activeAd.briefingEN || "")

  // Hooks
  const [hooks, setHooks] = useState<Hook[]>(activeAd.hooks || defaultHooks)

  // Avatar
  const [avatarUrl, setAvatarUrl] = useState<string>(activeAd.avatarUrl || "")
  const [avatarTitle, setAvatarTitle] = useState<string>(activeAd.avatarTitle || "")
  const [avatarLink, setAvatarLink] = useState<string>(activeAd.avatarLink || "")
  const [showAvatarPicker, setShowAvatarPicker] = useState(false)
  const [avatarInput, setAvatarInput] = useState("")

  // Avatar picker filters
  const [avSearch, setAvSearch] = useState("")
  const [avFilterNiche, setAvFilterNiche] = useState("Todos")
  const [avFilterCategory, setAvFilterCategory] = useState("Todos")
  const [avFilterTag, setAvFilterTag] = useState("Todos")

  // Script + Annotations
  const [editingAnnId, setEditingAnnId] = useState<string | null>(null)
  const [editingAnnContent, setEditingAnnContent] = useState("")
  const initialScript = [
    "Esta é a última vez que estou compartilhando isso aqui. Este único truque nativo de 15 segundos força seu corpo a eliminar nanopartículas de microplásticos pela urina...",
    "9 em cada 10 americanos estão lidando com sintomas de neuropatia, mas menos de 1% sequer percebe isso...",
    "O verdadeiro culpado por trás da neuropatia não é idade, má circulação ou diabetes...",
    "São microplásticos que se acumulam ao longo de 40 a 50 anos e ficam alojados entre seus neurônios..."
  ].join("\n\n")

  const [annotations, setAnnotations] = useState<Annotation[]>(activeAd.annotations || [])
  const [scriptContent, setScriptContent] = useState<string>(activeAd.script || initialScript)
  const [scriptEN, setScriptEN] = useState<string>(activeAd.scriptEN || "")

  // Sync states on tab change OR when copy is first loaded
  useEffect(() => {
    const currentAd = copy?.ads?.find(a => a.id === activeAdId) || copy?.ads?.[0]
    if (currentAd) {
      setDecisionMaking(currentAd.decisionMaking || "")
      setFormat(currentAd.format || "")
      setVideoStyle(currentAd.videoStyle || "")
      setReference(currentAd.reference || "")
      setBriefing(currentAd.briefing || "")
      setBriefingEN(currentAd.briefingEN || "")
      setHooks(currentAd.hooks || [])
      setAvatarUrl(currentAd.avatarUrl || "")
      setAvatarTitle(currentAd.avatarTitle || "")
      setAvatarLink(currentAd.avatarLink || "")
      setAnnotations(currentAd.annotations || [])
      setScriptContent(currentAd.script || "")
      setScriptEN(currentAd.scriptEN || "")
      if (!activeAdId || activeAdId === 'ad1') {
        setActiveAdId(currentAd.id)
      }
    }
  }, [activeAdId, copy, isLoaded])

  // AI State
  const [isTranslating, setIsTranslating] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [verificationFeedback, setVerificationFeedback] = useState<string | null>(null)

  // Global hook selection for annotations
  const HIGHLIGHT_COLORS = [
    { name: "Azul", hex: "#3B82F6" }, { name: "Verde", hex: "#22C55E" }, { name: "Roxo", hex: "#A855F7" },
    { name: "Laranja", hex: "#F97316" }, { name: "Rosa", hex: "#EC4899" }, { name: "Amarelo", hex: "#EAB308" },
    { name: "Vermelho", hex: "#EF4444" }, { name: "Ciano", hex: "#06B6D4" },
  ]
  const hooksContainerRef = useRef<HTMLDivElement>(null)
  const hookToolbarRef = useRef<HTMLDivElement>(null)
  const [hookSel, setHookSel] = useState<string | null>(null)
  const [hookToolbar, setHookToolbar] = useState<{ top: number; left: number } | null>(null)
  const [hookActiveForm, setHookActiveForm] = useState<"comment" | "link" | null>(null)
  const [hookFormInput, setHookFormInput] = useState("")

  // EARLY RETURNS (Must be after ALL hooks)
  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-brand)]"></div>
      </div>
    )
  }

  if (!copy) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <h2 className="text-xl font-bold">Criativo não encontrado</h2>
        <p className="text-[var(--color-text-muted)]">O criativo solicitado não existe ou foi excluído.</p>
        <Button variant="brand" onClick={() => window.history.back()}>Voltar</Button>
      </div>
    )
  }
  const [hookShowBroll, setHookShowBroll] = useState(false)
  const [hookShowColor, setHookShowColor] = useState(false)
  const [hookColor, setHookColor] = useState("#3B82F6")

  const getNextRefNumber = () => {
    const existing = annotations.map(a => a.refNumber || 0)
    return existing.length > 0 ? Math.max(...existing) + 1 : 1
  }

  useEffect(() => {
    const handleMouseUp = (e: MouseEvent) => {
      if (hookShowBroll) return
      // If clicking inside the hook toolbar/popover, don't reset
      if (hookToolbarRef.current?.contains(e.target as Node)) return
      const sel = window.getSelection()
      if (sel && sel.toString().trim() !== "" && hooksContainerRef.current?.contains(sel.anchorNode)) {
        const range = sel.getRangeAt(0)
        const rect = range.getBoundingClientRect()
        setHookSel(sel.toString())
        setHookToolbar({ top: rect.top - 50, left: rect.left + rect.width / 2 })
        setHookActiveForm(null)
        setHookShowColor(false)
      } else if (!hookActiveForm && !hookShowColor) {
        // Outside hooks & toolbar → reset
        setHookToolbar(null)
        setHookSel(null)
      }
    }
    document.addEventListener('mouseup', handleMouseUp)
    return () => document.removeEventListener('mouseup', handleMouseUp)
  }, [hookActiveForm, hookShowBroll, hookShowColor])

  const resetHookToolbar = () => {
    setHookActiveForm(null)
    setHookFormInput("")
    setHookSel(null)
    setHookToolbar(null)
    setHookShowColor(false)
    window.getSelection()?.removeAllRanges()
  }

  const hookCreateAnnotation = (type: "comment" | "link") => {
    if (!hookSel) return
    if (!hookActiveForm) { setHookActiveForm(type); return }
    if (hookFormInput.trim()) {
      const newAnn: Annotation = {
        id: Math.random().toString(36).substring(7),
        selectedText: hookSel,
        type,
        content: hookFormInput,
        refNumber: getNextRefNumber(),
        color: hookColor,
      }
      handleAnnotationsChange([...annotations, newAnn])
    }
    resetHookToolbar()
  }

  const hookBrollSelect = (item: MediaItem) => {
    if (!hookSel) return
    const newAnn: Annotation = {
      id: Math.random().toString(36).substring(7),
      selectedText: hookSel,
      type: "broll",
      content: item.driveLink,
      brollThumb: item.thumbUrl,
      brollTitle: item.title,
      refNumber: getNextRefNumber(),
      color: hookColor,
    }
    handleAnnotationsChange([...annotations, newAnn])
    setHookShowBroll(false)
    resetHookToolbar()
  }

  // ──────────────── Handlers ────────────────
  const handleAnnotationsChange = (newAnn: Annotation[]) => {
    setAnnotations(newAnn)
    autoSave({ annotations: newAnn })
  }

  const autoSave = (extra: Record<string, unknown> = {}, targetAdId: string = activeAdId) => {
    const latestTargetAd = copy?.ads?.find(ad => ad.id === targetAdId) || copy?.ads?.[0]
    if (!latestTargetAd) return

    const updatedAd = {
      ...latestTargetAd,
      annotations,
      decisionMaking,
      format,
      videoStyle,
      reference,
      briefing,
      briefingEN,
      hooks,
      script: scriptContent,
      scriptEN,
      avatarUrl,
      avatarTitle,
      avatarLink,
      ...extra
    }
    
    const newAds = (copy?.ads || []).map(ad => ad.id === targetAdId ? updatedAd : ad)
    updateCopy(copy.id, { ads: newAds })
  }

  const handleSave = () => {
    autoSave()
    setIsEditing(false)
  }

  // Hook CRUD
  const addHook = () => {
    const num = hooks.length + 1
    const newHook: Hook = { id: `hk${Date.now()}`, label: `HK${String(num).padStart(2, '0')}`, status: "Escala", text: "" }
    const next = [...hooks, newHook]
    setHooks(next)
    autoSave({ hooks: next })
  }
  const deleteHook = (hookId: string) => {
    const next = hooks.filter(h => h.id !== hookId)
    setHooks(next)
    autoSave({ hooks: next })
  }
  const updateHookField = (hookId: string, field: keyof Hook, value: string) => {
    const next = hooks.map(h => h.id === hookId ? { ...h, [field]: value } : h)
    setHooks(next)
  }
  const commitHooks = () => autoSave({ hooks })

  // Avatar from library
  const avatarItems = mediaItems.filter(m => {
    const matchSearch = avSearch === "" || m.title.toLowerCase().includes(avSearch.toLowerCase()) || m.tags.some(t => t.toLowerCase().includes(avSearch.toLowerCase()))
    const matchNiche = avFilterNiche === "Todos" || m.niche === avFilterNiche
    const matchCategory = avFilterCategory === "Todos" || m.category === avFilterCategory
    const matchTag = avFilterTag === "Todos" || m.tags.includes(avFilterTag)
    return matchSearch && matchNiche && matchCategory && matchTag
  })
  const avAllNiches = [...new Set(mediaItems.map(m => m.niche))]
  const avAllCategories = [...new Set(mediaItems.map(m => m.category))]
  const avAllTags = [...new Set(mediaItems.flatMap(m => m.tags))]

  const handlePickAvatar = (item: { thumbUrl: string; title: string; driveLink?: string }) => {
    setAvatarUrl(item.thumbUrl)
    setAvatarTitle(item.title)
    const link = item.driveLink || item.thumbUrl
    setAvatarLink(link)
    autoSave({ avatarUrl: item.thumbUrl, avatarTitle: item.title, avatarLink: link })
    setShowAvatarPicker(false)
  }

  const handleSetAvatarManual = () => {
    if (avatarInput.trim()) {
      setAvatarUrl(avatarInput.trim())
      setAvatarTitle("Avatar customizado")
      setAvatarLink(avatarInput.trim())
      autoSave({ avatarUrl: avatarInput.trim(), avatarTitle: "Avatar customizado", avatarLink: avatarInput.trim() })
    }
    setShowAvatarPicker(false)
    setAvatarInput("")
  }

  // ──────────────── Translation / AI ────────────────
  const handleTranslateAI = async () => {
    let key = getApiKey()
    if (!key) {
      key = prompt("Insira sua chave de API do OpenRouter para ativar a IA:")
      if (!key) return
      saveApiKey(key)
    }

    setIsTranslating(true)
    try {
      const newBriefingEN = await translateText(briefing, key)
      const newScriptEN = await translateText(scriptContent, key)
      
      const newHooks = await Promise.all(
        hooks.map(async h => ({ ...h, textEN: await translateText(h.text, key) }))
      )

      setBriefingEN(newBriefingEN)
      setScriptEN(newScriptEN)
      setHooks(newHooks)
      autoSave({ briefingEN: newBriefingEN, scriptEN: newScriptEN, hooks: newHooks })
      
      setLanguage("EN")
    } catch (err: any) {
      alert("Erro na tradução: " + err.message)
    } finally {
      setIsTranslating(false)
    }
  }

  const handleVerifyAI = async () => {
    let key = getApiKey()
    if (!key) {
      key = prompt("Insira sua chave de API do OpenRouter:")
      if (!key) return
      saveApiKey(key)
    }

    setIsVerifying(true)
    setVerificationFeedback("Gerando análise...")
    try {
      // Send the entire copy for context, or just the script. Let's send the script.
      const feedback = await verifyTranslation(scriptContent, scriptEN, key)
      setVerificationFeedback(feedback)
    } catch (err: any) {
      alert("Erro na verificação: " + err.message)
      setVerificationFeedback(null)
    } finally {
      setIsVerifying(false)
    }
  }

  const displayBriefing = language === "PT" ? briefing : briefingEN
  const displayHooks = language === "PT" ? hooks : hooks.map(h => ({ ...h, text: h.textEN || "" }))

  const renderHookText = (text: string) => {
    if (annotations.length === 0) return <p className="text-sm">{text}</p>
    let html = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    annotations.forEach(ann => {
      const color = ann.color || "#3B82F6"
      const safeText = ann.selectedText.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const regex = new RegExp(`(${safeText})`)
      const refBadge = ann.refNumber ? `<sup style="background:${color};color:white;border-radius:999px;padding:0 4px;font-size:9px;font-weight:700;margin-left:2px;">${ann.refNumber}</sup>` : ''
      html = html.replace(regex, `<mark style="background:${color}22;color:inherit;border-bottom:2px solid ${color};border-radius:2px;padding:0 2px;">$1${refBadge}</mark>`)
    })
    return <div dangerouslySetInnerHTML={{ __html: html }} className="text-sm leading-relaxed" />
  }

  const renderHookItem = (hook: Hook, lang: "PT" | "EN") => {
    const isValidado = hook.status.toLowerCase() === "validado"
    const isPT = lang === "PT"
    const hookText = isPT ? hook.text : (hook.textEN || "")
    
    return (
      <div
        key={`${hook.id}-${lang}`}
        className={`border ${isValidado ? "border-[var(--color-brand)]/30" : "border-[var(--color-border)]"} bg-[var(--color-surface)] p-4 rounded-md space-y-2 relative group`}
      >
        {isEditing && lang === "PT" ? (
          <>
            <div className="flex items-center gap-2 mb-2">
              <input
                className="bg-transparent border-b border-[var(--color-brand)] text-xs font-bold text-[var(--color-brand)] focus:outline-none w-14"
                value={hook.label}
                onChange={e => updateHookField(hook.id, "label", e.target.value)}
                onBlur={commitHooks}
              />
              <span className="text-xs text-[var(--color-text-muted)]">–</span>
              <select
                className="bg-transparent border-b border-[var(--color-border)] text-xs font-bold text-[var(--color-brand)] focus:outline-none"
                value={hook.status}
                onChange={e => { updateHookField(hook.id, "status", e.target.value); commitHooks() }}
              >
                <option value="Validado">Validado</option>
                <option value="Escala">Escala</option>
                <option value="Teste">Teste</option>
                <option value="Pausado">Pausado</option>
              </select>
              <button
                className="ml-auto text-[var(--color-text-muted)] hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                onClick={() => deleteHook(hook.id)}
                title="Excluir hook"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <textarea
              className="w-full bg-transparent border-none focus:outline-none text-sm resize-none min-h-[60px] text-[var(--color-text)]"
              value={hook.text}
              onChange={e => updateHookField(hook.id, "text", e.target.value)}
              onBlur={commitHooks}
              placeholder="Escreva o hook aqui..."
            />
          </>
        ) : isEditing && lang === "EN" ? (
          <>
            <div className="flex items-center gap-2 mb-2">
              <div className="text-xs font-bold text-[var(--color-brand)]">{hook.label} - {hook.status}</div>
            </div>
            <textarea
              className="w-full bg-transparent border-none focus:outline-none text-sm resize-none min-h-[60px] text-[var(--color-text)]"
              value={hook.textEN || ""}
              onChange={e => updateHookField(hook.id, "textEN", e.target.value)}
              onBlur={commitHooks}
              placeholder="Write the hook in English..."
            />
          </>
        ) : (
          <>
            <div className="text-xs font-bold text-[var(--color-brand)] mb-2">{hook.label} - {hook.status}</div>
            {renderHookText(hookText)}
          </>
        )}
      </div>
    )
  }
  // ──────────────── RENDER ────────────────
  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Badge variant={copy.status === "Validado" ? "success" : "default"}>
            {copy.status?.toLowerCase() || 'teste'}
          </Badge>
          <h1 className="text-xl font-bold tracking-tight">{copy.title || "Sem título"}</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.print()}>
            <FileText className="w-4 h-4 mr-2" /> Exportar PDF
          </Button>
          <Button variant="outline" onClick={() => {
            const currentAd = copy?.ads?.find(ad => ad.id === activeAdId)
            const exportBriefing = [
              decisionMaking ? `Tomada de Decisão: ${decisionMaking}` : "",
              format ? `Formato: ${format}` : "",
              videoStyle ? `Como você deseja o vídeo: ${videoStyle}` : "",
              reference ? `Referência: ${reference}` : "",
              "",
              briefing
            ].filter(Boolean).join("\n")
            
            exportCopyToDocx(copy, hooks, exportBriefing, scriptContent, annotations, briefingEN, scriptEN, currentAd?.title)
          }}>
            <Download className="w-4 h-4 mr-2" /> Exportar DOCX
          </Button>
          <Button variant="outline" onClick={handleTranslateAI} disabled={isTranslating}>
             {isTranslating ? "Traduzindo..." : "Traduzir com IA"}
          </Button>
          {language === "EN" && (
            <Button variant="outline" onClick={handleVerifyAI} disabled={isVerifying}>
               {isVerifying ? "Verificando..." : "Verificar Tradução"}
            </Button>
          )}
          {isEditing ? (
            <Button variant="brand" onClick={handleSave}><Save className="w-4 h-4 mr-2"/> Salvar</Button>
          ) : (
            <Button variant="outline" onClick={() => setIsEditing(true)}><Edit className="w-4 h-4 mr-2"/> Editar</Button>
          )}
        </div>
      </div>

      {/* META BAR */}
      <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)] bg-[var(--color-surface)] p-2 rounded max-w-fit">
        <span className="font-semibold text-[var(--color-text)]">{copy.niche || "Geral"}</span>
        <span>•</span>
        <span>{copy.platform || "Facebook Ads"}</span>
        <span>•</span>
        <span>Funil: {copy.funnel || "N/A"}</span>
        <span>•</span>
        <span>Copy: {copy.authors?.[0] || "Equipe"}</span>
        <span>•</span>
        <span>Editor: {copy.authors?.[1] || "Equipe"}</span>
      </div>

      {/* TABS FOR ADS */}
      <div className="flex items-center gap-2 mt-4 mb-2 overflow-x-auto">
        {copy?.ads?.map((ad, idx) => (
          <button
            key={ad.id}
            onClick={() => {
              if (activeAdId !== ad.id) {
                autoSave({}, activeAdId) // Salvar na tab atual antes de trocar
                setActiveAdId(ad.id)
                setLanguage("PT") // force language check
              }
            }}
            className={`px-4 py-2 text-sm font-semibold rounded-t-md transition-colors border-b-2 whitespace-nowrap ${activeAdId === ad.id ? "border-[var(--color-brand)] text-white bg-[var(--color-surface)]" : "border-transparent text-[var(--color-text-muted)] hover:text-white"}`}
          >
            {isEditing && activeAdId === ad.id ? (
              <input 
                className="bg-transparent border-none text-white focus:outline-none w-24 text-center ring-1 ring-[var(--color-brand)]/30 rounded" 
                value={ad.title} 
                onChange={(e) => {
                  const newAds = copy.ads.map(a => a.id === ad.id ? { ...a, title: e.target.value } : a)
                  updateCopy(copy.id, { ads: newAds })
                }} 
                onClick={e => e.stopPropagation()}
              />
            ) : (
              ad.title || `Ad ${idx + 1}`
            )}
          </button>
        ))}
        {isEditing && (
          <button
            onClick={() => {
              autoSave({}, activeAdId)
              const newAdId = `ad-${Math.random().toString(36).substr(2, 6)}`
              const newAdNum = (copy?.ads?.length || 0) + 1
              const newAd = {
                id: newAdId,
                title: `Ad ${newAdNum}`,
                script: "",
                decisionMaking: "",
                format: "",
                videoStyle: "",
                reference: "",
                briefing: defaultBriefing,
                hooks: [],
                annotations: [],
                avatarUrl: "",
                avatarTitle: "",
                avatarLink: ""
              }
              const newAds = [...(copy?.ads || []), newAd]
              updateCopy(copy.id, { ads: newAds })
              setActiveAdId(newAdId)
            }}
            className="px-3 py-1.5 ml-2 text-sm font-medium rounded-md border border-dashed border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-white hover:bg-[var(--color-surface)] transition-colors flex items-center gap-1"
          >
            <Plus className="w-4 h-4" /> Novo Criativo
          </button>
        )}
      </div>

      {/* AVATAR SECTION */}
      <div className="flex items-center gap-4 bg-[var(--color-surface)] p-4 rounded-b-lg rounded-tr-lg border border-[var(--color-border)] -mt-2">
        {avatarUrl ? (
          <div className="relative group">
            <img src={avatarUrl} alt={avatarTitle || "Avatar"} className="w-16 h-16 rounded-full object-cover border-2 border-[var(--color-brand)]" />
            {isEditing && (
              <button
                onClick={() => { setAvatarUrl(""); setAvatarTitle(""); setAvatarLink(""); autoSave({ avatarUrl: "", avatarTitle: "", avatarLink: "" }) }}
                className="absolute -top-1 -right-1 bg-red-600 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        ) : (
          <div className="w-16 h-16 rounded-full bg-[var(--color-surface-hover)] border-2 border-dashed border-[var(--color-border)] flex items-center justify-center">
            <Image className="w-6 h-6 text-[var(--color-text-muted)]" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold">{avatarTitle || "Nenhum avatar selecionado"}</p>
          <p className="text-xs text-[var(--color-text-muted)]">Avatar / Referência visual da copy</p>
          {(avatarLink || avatarUrl) && (
            <a href={avatarLink || avatarUrl} target="_blank" rel="noreferrer" className="text-[11px] text-blue-400 hover:underline truncate block mt-0.5">
              <LinkIcon className="w-3 h-3 inline mr-1" />{(avatarLink || avatarUrl).replace('https://', '').substring(0, 50)}{(avatarLink || avatarUrl).length > 50 ? '...' : ''}
            </a>
          )}
        </div>
        {isEditing && (
          <Button variant="outline" size="sm" onClick={() => setShowAvatarPicker(true)}>
            <Image className="w-4 h-4 mr-1" /> {avatarUrl ? "Trocar" : "Selecionar"} Avatar
          </Button>
        )}
      </div>

      {/* MAIN LAYOUT */}
      {isMobile ? (
        <div className="flex flex-col gap-8">
          <div className="space-y-6">
          {/* DIRETRIZES DO CRIATIVO */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-[var(--color-text-muted)] tracking-wider mb-2 border-b border-[var(--color-border)] pb-2 flex items-center justify-between">
              DIRETRIZES DO CRIATIVO
              <span className="text-[10px] bg-brand text-background px-1.5 py-0.5 rounded font-black">NOVO</span>
            </h3>
            
            {/* Tomada de Decisão */}
            <div>
              <label className="block text-xs font-semibold text-[var(--color-text-muted)] mb-1">Tomada de Decisão:</label>
              {isEditing && language === "PT" ? (
                <input placeholder="Ex: Racional / Emocional" className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded text-sm p-2 text-[var(--color-text)] focus:outline-none focus:border-[var(--color-brand)]" value={decisionMaking} onChange={e => setDecisionMaking(e.target.value)} onBlur={() => autoSave({ decisionMaking })} />
              ) : decisionMaking ? (
                <p className="text-sm bg-[#1f2329] p-2 rounded text-[#e2e8f0]">{decisionMaking}</p>
              ) : <p className="text-xs italic text-[var(--color-text-muted)]">Não especificado</p>}
            </div>
            
            {/* Formato */}
            <div>
              <label className="block text-xs font-semibold text-[var(--color-text-muted)] mb-1">Formato:</label>
              {isEditing && language === "PT" ? (
                <input placeholder="Ex: VSL, Vídeo Animado, FWC..." className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded text-sm p-2 text-[var(--color-text)] focus:outline-none focus:border-[var(--color-brand)]" value={format} onChange={e => setFormat(e.target.value)} onBlur={() => autoSave({ format })} />
              ) : format ? (
                <p className="text-sm bg-[#1f2329] p-2 rounded text-[#e2e8f0]">{format}</p>
              ) : <p className="text-xs italic text-[var(--color-text-muted)]">Não especificado</p>}
            </div>

            {/* Como deseja o vídeo */}
            <div>
              <label className="block text-xs font-semibold text-[var(--color-text-muted)] mb-1">Como você deseja o vídeo:</label>
              {isEditing && language === "PT" ? (
                <textarea rows={2} placeholder="Descreva os cortes, impacto visual esperado..." className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded text-sm p-2 text-[var(--color-text)] focus:outline-none focus:border-[var(--color-brand)] resize-y" value={videoStyle} onChange={e => setVideoStyle(e.target.value)} onBlur={() => autoSave({ videoStyle })} />
              ) : videoStyle ? (
                <p className="text-sm bg-[#1f2329] p-2 rounded text-[#e2e8f0] whitespace-pre-wrap">{videoStyle}</p>
              ) : <p className="text-xs italic text-[var(--color-text-muted)]">Não especificado</p>}
            </div>

            {/* Referência */}
            <div>
              <label className="block text-xs font-semibold text-[var(--color-text-muted)] mb-1">Link de Referência:</label>
              {isEditing && language === "PT" ? (
                <input placeholder="https://..." className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded text-sm p-2 text-blue-400 focus:outline-none focus:border-[var(--color-brand)]" value={reference} onChange={e => setReference(e.target.value)} onBlur={() => autoSave({ reference })} />
              ) : reference ? (
                <a href={reference.startsWith('http') ? reference : `https://${reference}`} target="_blank" rel="noreferrer" className="text-sm px-2 py-1.5 bg-[#1e293b] rounded text-blue-400 hover:text-blue-300 transition-colors hover:underline break-all flex items-center gap-1.5 border border-blue-900/50 hover:border-blue-500/50">
                  <LinkIcon className="h-3.5 w-3.5" /> Acessar Referência
                </a>
              ) : <p className="text-xs italic text-[var(--color-text-muted)]">Não especificado</p>}
            </div>
          </div>

          {/* BRIEFING */}
          <div>
            <h3 className="text-xs font-bold text-[var(--color-text-muted)] tracking-wider mb-2 border-b border-[var(--color-border)] pb-2">OBSERVAÇÕES DO BRIEFING</h3>
            {isEditing && language === "PT" ? (
              <textarea
                className="w-full min-h-[100px] p-4 rounded-md bg-[var(--color-surface)] border border-[var(--color-border)] text-sm focus:outline-none focus:border-[var(--color-brand)] resize-y font-sans"
                value={briefing}
                onChange={e => setBriefing(e.target.value)}
                onBlur={() => autoSave({ briefing })}
                placeholder="Detalhes adicionais do briefing..."
              />
            ) : (
              <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-md p-4 text-sm whitespace-pre-wrap">
                {displayBriefing || <span className="text-[var(--color-text-muted)] italic">Nenhuma observação.</span>}
              </div>
            )}
          </div>

          {/* REFERÊNCIAS DE VÍDEO */}
          <div>
            <h3 className="text-xs font-bold text-[var(--color-text-muted)] tracking-wider mb-3">REFERÊNCIAS DE VÍDEO</h3>
            <a href="#" className="flex items-center justify-between text-sm text-[var(--color-text-muted)] hover:text-white transition-colors bg-[var(--color-surface)] p-3 rounded-md border border-[var(--color-border)] hover:border-[var(--color-brand)]">
              <span className="flex items-center gap-2"><LinkIcon className="h-4 w-4"/> Vídeo 1</span>
            </a>
          </div>

          {/* ANNOTATIONS */}
          {annotations.length > 0 && (
            <div>
              <h3 className="text-xs font-bold text-[var(--color-text-muted)] tracking-wider mb-3">COMENTÁRIOS E ANOTAÇÕES ({annotations.length})</h3>
              <div className="space-y-3">
                {annotations.map(ann => {
                  const annColor = ann.color || "#3B82F6"
                  const isEditingThis = editingAnnId === ann.id
                  return (
                    <Card key={ann.id} className="p-3 bg-[var(--color-surface)] shadow-none" style={{ borderLeft: `3px solid ${annColor}` }}>
                      <div className="flex items-center gap-2 mb-2">
                        {ann.refNumber && (
                          <span className="text-[10px] font-bold rounded-full px-1.5 py-0.5 text-white" style={{ background: annColor }}>Ref {ann.refNumber}</span>
                        )}
                        {ann.type === "comment" && <MessageSquare className="w-3.5 h-3.5 shrink-0" style={{ color: annColor }} />}
                        {ann.type === "link" && <LinkIcon className="w-3.5 h-3.5 shrink-0" style={{ color: annColor }} />}
                        {ann.type === "broll" && <Film className="w-3.5 h-3.5 shrink-0" style={{ color: annColor }} />}
                        <span className="text-xs font-medium uppercase text-[var(--color-text-muted)]">
                          {ann.type === "broll" ? "B-Roll" : ann.type}
                        </span>
                        <div className="ml-auto flex gap-1">
                          {!isEditingThis && (
                            <button
                              className="text-[var(--color-text-muted)] hover:text-blue-400 transition-colors"
                              onClick={() => { setEditingAnnId(ann.id); setEditingAnnContent(ann.content) }}
                              title="Editar"
                            ><Pencil className="w-3 h-3" /></button>
                          )}
                          {isEditingThis && (
                            <button
                              className="text-[var(--color-text-muted)] hover:text-green-400 transition-colors"
                              onClick={() => {
                                handleAnnotationsChange(annotations.map(a => a.id === ann.id ? { ...a, content: editingAnnContent } : a))
                                setEditingAnnId(null)
                              }}
                              title="Salvar"
                            ><Check className="w-3.5 h-3.5" /></button>
                          )}
                          <button
                            className="text-[var(--color-text-muted)] hover:text-red-400 transition-colors"
                            onClick={() => handleAnnotationsChange(annotations.filter(a => a.id !== ann.id))}
                            title="Excluir"
                          ><X className="w-3.5 h-3.5" /></button>
                        </div>
                      </div>
                      <div className="text-[11px] border-l-2 pl-2 italic mb-2 line-clamp-2" style={{ borderColor: annColor + '50', color: annColor + '99' }}>
                        "{ann.selectedText}"
                      </div>
                      {ann.type === "broll" && ann.brollThumb && (
                        <div className="mb-2 rounded overflow-hidden">
                          <img src={ann.brollThumb} alt={ann.brollTitle || "B-roll"} className="w-full h-20 object-cover rounded" />
                          <p className="text-xs font-medium mt-1" style={{ color: annColor }}>{ann.brollTitle}</p>
                        </div>
                      )}
                      {isEditingThis ? (
                        <textarea
                          autoFocus
                          className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded text-xs p-2 focus:outline-none focus:border-[var(--color-brand)] resize-none"
                          rows={2}
                          value={editingAnnContent}
                          onChange={e => setEditingAnnContent(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault()
                              handleAnnotationsChange(annotations.map(a => a.id === ann.id ? { ...a, content: editingAnnContent } : a))
                              setEditingAnnId(null)
                            }
                          }}
                        />
                      ) : (
                        <p className="text-sm break-all" title={ann.content}>
                          {ann.type === "link" || ann.type === "broll" ? (
                            <a href={ann.content.startsWith('http') ? ann.content : `https://${ann.content}`} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline text-xs">{ann.content.replace('https://', '')}</a>
                          ) : (
                            <span>{ann.content}</span>
                          )}
                        </p>
                      )}
                    </Card>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-8">
          {/* LANGUAGE TABS */}
          <div className="flex gap-2 border-b border-[var(--color-border)] pb-2">
            <button
              onClick={() => setLanguage("PT")}
              className={`px-4 py-1.5 text-sm font-medium rounded-md border transition-colors ${language === "PT" ? "bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text)]" : "border-transparent text-[var(--color-text-muted)] hover:text-white"}`}>
              BR Português
            </button>
            <button
              onClick={() => setLanguage("EN")}
              className={`px-4 py-1.5 text-sm font-medium rounded-md border transition-colors ${language === "EN" ? "bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text)]" : "border-transparent text-[var(--color-text-muted)] hover:text-white"}`}>
              US Inglês
            </button>
          </div>

          {/* HOOKS */}
          <div>
            <h3 className="text-xs font-bold text-[var(--color-text-muted)] tracking-wider mb-3 flex items-center justify-between">
              HOOKS ({displayHooks.length})
              {isEditing && language === "PT" && (
                <Button variant="outline" size="sm" onClick={addHook} className="py-1 h-7 text-xs">
                  <Plus className="w-3.5 h-3.5 mr-1" /> Novo Hook
                </Button>
              )}
            </h3>
            <div ref={hooksContainerRef} className="flex flex-col gap-4">
              {displayHooks.map(hook => {
                const isValidado = hook.status.toLowerCase() === "validado"
                // Render hook text with annotation highlights (same logic as ScriptEditor)
                const renderHookText = (text: string) => {
                  if (annotations.length === 0) return <p className="text-sm">{text}</p>
                  let html = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
                  annotations.forEach(ann => {
                    const color = ann.color || "#3B82F6"
                    const safeText = ann.selectedText.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
                    const regex = new RegExp(`(${safeText})`)
                    const refBadge = ann.refNumber ? `<sup style="background:${color};color:white;border-radius:999px;padding:0 4px;font-size:9px;font-weight:700;margin-left:2px;">${ann.refNumber}</sup>` : ''
                    html = html.replace(regex, `<mark style="background:${color}22;color:inherit;border-bottom:2px solid ${color};border-radius:2px;padding:0 2px;">$1${refBadge}</mark>`)
                  })
                  return <div dangerouslySetInnerHTML={{ __html: html }} className="text-sm leading-relaxed" />
                }
                return (
                  <div
                    key={hook.id}
                    className={`border ${isValidado ? "border-[var(--color-brand)]/30" : "border-[var(--color-border)]"} bg-[var(--color-surface)] p-4 rounded-md space-y-2 relative group`}
                  >
                    {isEditing && language === "PT" ? (
                      <>
                        <div className="flex items-center gap-2 mb-2">
                          <input
                            className="bg-transparent border-b border-[var(--color-brand)] text-xs font-bold text-[var(--color-brand)] focus:outline-none w-14"
                            value={hook.label}
                            onChange={e => updateHookField(hook.id, "label", e.target.value)}
                            onBlur={commitHooks}
                          />
                          <span className="text-xs text-[var(--color-text-muted)]">–</span>
                          <select
                            className="bg-transparent border-b border-[var(--color-border)] text-xs font-bold text-[var(--color-brand)] focus:outline-none"
                            value={hook.status}
                            onChange={e => { updateHookField(hook.id, "status", e.target.value); commitHooks() }}
                          >
                            <option value="Validado">Validado</option>
                            <option value="Escala">Escala</option>
                            <option value="Teste">Teste</option>
                            <option value="Pausado">Pausado</option>
                          </select>
                          <button
                            className="ml-auto text-[var(--color-text-muted)] hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                            onClick={() => deleteHook(hook.id)}
                            title="Excluir hook"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <textarea
                          className="w-full bg-transparent border-none focus:outline-none text-sm resize-none min-h-[60px] text-[var(--color-text)]"
                          value={hook.text}
                          onChange={e => updateHookField(hook.id, "text", e.target.value)}
                          onBlur={commitHooks}
                          placeholder="Escreva o hook aqui..."
                        />
                      </>
                    ) : (
                      <>
                        <div className="text-xs font-bold text-[var(--color-brand)] mb-2">{hook.label} - {hook.status}</div>
                        {renderHookText(hook.text)}
                      </>
                    )}
                  </div>
                )
              })}
            </div>

            <div ref={hookToolbarRef}>
            {/* Hook Floating Toolbar */}
            {hookToolbar && hookActiveForm === null && !hookShowBroll && !hookShowColor && (
              <div className="fixed z-50 flex items-center bg-[#1f2329] border border-[#383e47] rounded-md shadow-lg transform -translate-x-1/2 p-1 gap-1" style={{ top: hookToolbar.top, left: hookToolbar.left }}>
                <button className="p-1.5 hover:bg-[#2c313a] rounded text-[var(--color-text-muted)] hover:text-white transition-colors" onMouseDown={e => e.preventDefault()} onClick={() => hookCreateAnnotation('comment')} title="Comentário"><MessageSquare className="w-4 h-4" /></button>
                <button className="p-1.5 hover:bg-[#2c313a] rounded text-[var(--color-text-muted)] hover:text-white transition-colors" onMouseDown={e => e.preventDefault()} onClick={() => hookCreateAnnotation('link')} title="Link"><LinkIcon className="w-4 h-4" /></button>
                <button className="p-1.5 hover:bg-[#2c313a] rounded text-[var(--color-text-muted)] hover:text-purple-400 transition-colors" onMouseDown={e => e.preventDefault()} onClick={() => setHookShowBroll(true)} title="B-Roll"><Film className="w-4 h-4" /></button>
                <div className="w-px h-5 bg-[#383e47] mx-0.5" />
                <button className="p-1.5 hover:bg-[#2c313a] rounded transition-colors" onMouseDown={e => e.preventDefault()} onClick={() => setHookShowColor(true)} title="Cor">
                  <div className="w-4 h-4 rounded-full border-2 border-white/50" style={{ background: hookColor }} />
                </button>
              </div>
            )}

            {/* Hook Color Picker */}
            {hookToolbar && hookShowColor && (
              <div className="fixed z-50 bg-[#1f2329] border border-[#383e47] rounded-md shadow-lg transform -translate-x-1/2 p-2" style={{ top: hookToolbar.top, left: hookToolbar.left }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-[var(--color-text-muted)]">Cor</span>
                  <button onMouseDown={e => e.preventDefault()} onClick={() => setHookShowColor(false)} className="text-[var(--color-text-muted)] hover:text-white"><X className="w-3.5 h-3.5" /></button>
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {HIGHLIGHT_COLORS.map(c => (
                    <button key={c.hex} className={`w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 ${hookColor === c.hex ? 'border-white scale-110' : 'border-transparent'}`} style={{ background: c.hex }} onMouseDown={e => e.preventDefault()} onClick={() => { setHookColor(c.hex); setHookShowColor(false) }} title={c.name} />
                  ))}
                </div>
              </div>
            )}

            {/* Hook Comment/Link Form */}
            {hookToolbar && hookActiveForm !== null && (
              <div className="fixed z-50 flex flex-col bg-[#1f2329] border border-[#383e47] rounded-md shadow-lg transform -translate-x-1/2 p-2 w-72 gap-2" style={{ top: hookToolbar.top, left: hookToolbar.left }}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium uppercase text-[var(--color-text-muted)] flex items-center gap-1">
                    {hookActiveForm === 'comment' && <MessageSquare className="w-3 h-3"/>}
                    {hookActiveForm === 'link' && <LinkIcon className="w-3 h-3"/>}
                    Ref {getNextRefNumber()} — {hookActiveForm}
                  </span>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full" style={{ background: hookColor }} />
                    <button onMouseDown={e => e.preventDefault()} onClick={resetHookToolbar} className="text-[var(--color-text-muted)] hover:text-white"><X className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
                <textarea autoFocus className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded text-sm p-2 focus:outline-none focus:border-[var(--color-brand)] resize-none" rows={2} placeholder={hookActiveForm === 'link' ? 'Cole o link...' : 'Comentário...'} value={hookFormInput} onChange={e => setHookFormInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); hookCreateAnnotation(hookActiveForm) } }} />
                <Button size="sm" variant="brand" onClick={() => hookCreateAnnotation(hookActiveForm)}>Salvar</Button>
              </div>
            )}
            </div>

            <BrollPicker isOpen={hookShowBroll} onClose={() => { setHookShowBroll(false); resetHookToolbar() }} onSelect={hookBrollSelect} />
          </div>

          {/* BODY / SCRIPT */}
          <div>
            <h3 className="text-xs font-bold text-[var(--color-text-muted)] tracking-wider mb-3 flex items-center justify-between">
              BODY / SCRIPT
              <button
                className="flex items-center gap-1 text-[var(--color-text-muted)] hover:text-white transition-colors bg-transparent border-none cursor-pointer"
                onClick={() => navigator.clipboard.writeText(scriptContent)}
              >
                <Copy className="h-3.5 w-3.5" /> Copiar
              </button>
            </h3>
            <div className="bg-[var(--color-surface-hover)] p-6 rounded-md border border-[var(--color-border)]">
              {verificationFeedback && language === "EN" && (
                <div className="mb-4 p-4 rounded bg-[#1e293b] border border-[#334155] text-sm whitespace-pre-wrap leading-relaxed text-[#e2e8f0]">
                  <strong className="text-brand block mb-2">⚡ Feedback da IA:</strong>
                  {verificationFeedback}
                </div>
              )}
              <ScriptEditor
                content={language === "PT" ? scriptContent : scriptEN}
                isGlobalEditMode={isEditing}
                annotations={annotations}
                onAnnotationsChange={handleAnnotationsChange}
                onContentChange={(newContent) => {
                  if (language === "PT") setScriptContent(newContent)
                  else setScriptEN(newContent)
                }}
              />
            </div>
          </div>
        </div>
      </div>
      ) : (
        <div className="h-[calc(100vh-250px)] min-h-[600px] border border-[var(--color-border)] rounded-lg bg-transparent">
          <PanelGroup orientation="horizontal">
            {/* LEFT SIDEBAR PANEL */}
            <Panel defaultSize={30} minSize={20} className="pr-4 py-4 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
              <div className="space-y-6">
                {/* DIRETRIZES DO CRIATIVO */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-[var(--color-text-muted)] tracking-wider mb-2 border-b border-[var(--color-border)] pb-2 flex items-center justify-between">
                    DIRETRIZES DO CRIATIVO
                    <span className="text-[10px] bg-brand text-background px-1.5 py-0.5 rounded font-black">NOVO</span>
                  </h3>
                  
                  {/* Tomada de Decisão */}
                  <div>
                    <label className="block text-xs font-semibold text-[var(--color-text-muted)] mb-1">Tomada de Decisão:</label>
                    {isEditing && language === "PT" ? (
                      <input placeholder="Ex: Racional / Emocional" className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded text-sm p-2 text-[var(--color-text)] focus:outline-none focus:border-[var(--color-brand)]" value={decisionMaking} onChange={e => setDecisionMaking(e.target.value)} onBlur={() => autoSave({ decisionMaking })} />
                    ) : decisionMaking ? (
                      <p className="text-sm bg-[#1f2329] p-2 rounded text-[#e2e8f0]">{decisionMaking}</p>
                    ) : <p className="text-xs italic text-[var(--color-text-muted)]">Não especificado</p>}
                  </div>
                  
                  {/* Formato */}
                  <div>
                    <label className="block text-xs font-semibold text-[var(--color-text-muted)] mb-1">Formato:</label>
                    {isEditing && language === "PT" ? (
                      <input placeholder="Ex: VSL, Vídeo Animado, FWC..." className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded text-sm p-2 text-[var(--color-text)] focus:outline-none focus:border-[var(--color-brand)]" value={format} onChange={e => setFormat(e.target.value)} onBlur={() => autoSave({ format })} />
                    ) : format ? (
                      <p className="text-sm bg-[#1f2329] p-2 rounded text-[#e2e8f0]">{format}</p>
                    ) : <p className="text-xs italic text-[var(--color-text-muted)]">Não especificado</p>}
                  </div>

                  {/* Como deseja o vídeo */}
                  <div>
                    <label className="block text-xs font-semibold text-[var(--color-text-muted)] mb-1">Como você deseja o vídeo:</label>
                    {isEditing && language === "PT" ? (
                      <textarea rows={2} placeholder="Descreva os cortes, impacto visual esperado..." className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded text-sm p-2 text-[var(--color-text)] focus:outline-none focus:border-[var(--color-brand)] resize-y" value={videoStyle} onChange={e => setVideoStyle(e.target.value)} onBlur={() => autoSave({ videoStyle })} />
                    ) : videoStyle ? (
                      <p className="text-sm bg-[#1f2329] p-2 rounded text-[#e2e8f0] whitespace-pre-wrap">{videoStyle}</p>
                    ) : <p className="text-xs italic text-[var(--color-text-muted)]">Não especificado</p>}
                  </div>

                  {/* Referência */}
                  <div>
                    <label className="block text-xs font-semibold text-[var(--color-text-muted)] mb-1">Link de Referência:</label>
                    {isEditing && language === "PT" ? (
                      <input placeholder="https://..." className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded text-sm p-2 text-blue-400 focus:outline-none focus:border-[var(--color-brand)]" value={reference} onChange={e => setReference(e.target.value)} onBlur={() => autoSave({ reference })} />
                    ) : reference ? (
                      <a href={reference.startsWith('http') ? reference : `https://${reference}`} target="_blank" rel="noreferrer" className="text-sm px-2 py-1.5 bg-[#1e293b] rounded text-blue-400 hover:text-blue-300 transition-colors hover:underline break-all flex items-center gap-1.5 border border-blue-900/50 hover:border-blue-500/50">
                        <LinkIcon className="h-3.5 w-3.5" /> Acessar Referência
                      </a>
                    ) : <p className="text-xs italic text-[var(--color-text-muted)]">Não especificado</p>}
                  </div>
                </div>

                {/* BRIEFING */}
                <div>
                  <h3 className="text-xs font-bold text-[var(--color-text-muted)] tracking-wider mb-2 border-b border-[var(--color-border)] pb-2">OBSERVAÇÕES DO BRIEFING</h3>
                  {isEditing && language === "PT" ? (
                    <textarea
                      className="w-full min-h-[100px] p-4 rounded-md bg-[var(--color-surface)] border border-[var(--color-border)] text-sm focus:outline-none focus:border-[var(--color-brand)] resize-y font-sans"
                      value={briefing}
                      onChange={e => setBriefing(e.target.value)}
                      onBlur={() => autoSave({ briefing })}
                      placeholder="Detalhes adicionais do briefing..."
                    />
                  ) : (
                    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-md p-4 text-sm whitespace-pre-wrap">
                      {displayBriefing || <span className="text-[var(--color-text-muted)] italic">Nenhuma observação.</span>}
                    </div>
                  )}
                </div>

                {/* ANNOTATIONS */}
                {annotations.length > 0 && (
                  <div>
                    <h3 className="text-xs font-bold text-[var(--color-text-muted)] tracking-wider mb-3">COMENTÁRIOS E ANOTAÇÕES ({annotations.length})</h3>
                    <div className="space-y-3">
                      {annotations.map(ann => {
                        const annColor = ann.color || "#3B82F6"
                        const isEditingThis = editingAnnId === ann.id
                        return (
                          <Card key={ann.id} className="p-3 bg-[var(--color-surface)] shadow-none" style={{ borderLeft: `3px solid ${annColor}` }}>
                            <div className="flex items-center gap-2 mb-2">
                              {ann.refNumber && (
                                <span className="text-[10px] font-bold rounded-full px-1.5 py-0.5 text-white" style={{ background: annColor }}>Ref {ann.refNumber}</span>
                              )}
                              {ann.type === "comment" && <MessageSquare className="w-3.5 h-3.5 shrink-0" style={{ color: annColor }} />}
                              {ann.type === "link" && <LinkIcon className="w-3.5 h-3.5 shrink-0" style={{ color: annColor }} />}
                              {ann.type === "broll" && <Film className="w-3.5 h-3.5 shrink-0" style={{ color: annColor }} />}
                              <span className="text-xs font-medium uppercase text-[var(--color-text-muted)]">
                                {ann.type === "broll" ? "B-Roll" : ann.type}
                              </span>
                              <div className="ml-auto flex gap-1">
                                {!isEditingThis && (
                                  <button
                                    className="text-[var(--color-text-muted)] hover:text-blue-400 transition-colors"
                                    onClick={() => { setEditingAnnId(ann.id); setEditingAnnContent(ann.content) }}
                                    title="Editar"
                                  ><Pencil className="w-3 h-3" /></button>
                                )}
                                {isEditingThis && (
                                  <button
                                    className="text-[var(--color-text-muted)] hover:text-green-400 transition-colors"
                                    onClick={() => {
                                      handleAnnotationsChange(annotations.map(a => a.id === ann.id ? { ...a, content: editingAnnContent } : a))
                                      setEditingAnnId(null)
                                    }}
                                    title="Salvar"
                                  ><Check className="w-3.5 h-3.5" /></button>
                                )}
                                <button
                                  className="text-[var(--color-text-muted)] hover:text-red-400 transition-colors"
                                  onClick={() => handleAnnotationsChange(annotations.filter(a => a.id !== ann.id))}
                                  title="Excluir"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                            <div className="text-[11px] border-l-2 pl-2 italic mb-2 line-clamp-2" style={{ borderColor: annColor + '50', color: annColor + '99' }}>
                              "{ann.selectedText}"
                            </div>
                            {ann.type === "broll" && ann.brollThumb && (
                              <div className="mb-2 rounded overflow-hidden">
                                <img src={ann.brollThumb} alt={ann.brollTitle || "B-roll"} className="w-full h-40 object-cover rounded" />
                                <p className="text-xs font-medium mt-1" style={{ color: annColor }}>{ann.brollTitle}</p>
                              </div>
                            )}
                            {isEditingThis ? (
                              <textarea
                                autoFocus
                                className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded text-xs p-2 focus:outline-none focus:border-[var(--color-brand)] resize-none"
                                rows={2}
                                value={editingAnnContent}
                                onChange={e => setEditingAnnContent(e.target.value)}
                                onKeyDown={e => {
                                  if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault()
                                    handleAnnotationsChange(annotations.map(a => a.id === ann.id ? { ...a, content: editingAnnContent } : a))
                                    setEditingAnnId(null)
                                  }
                                }}
                              />
                            ) : (
                              <p className="text-sm break-all" title={ann.content}>
                                {ann.type === "link" || ann.type === "broll" ? (
                                  <a href={ann.content.startsWith('http') ? ann.content : `https://${ann.content}`} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline text-xs">{ann.content.replace('https://', '')}</a>
                                ) : (
                                  <span>{ann.content}</span>
                                )}
                              </p>
                            )}
                          </Card>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            </Panel>

            <PanelResizeHandle className="w-4 bg-transparent hover:bg-[var(--color-surface-hover)] transition-colors cursor-col-resize flex flex-col items-center justify-center group relative z-10 border-x border-[var(--color-border)]">
              <div className="h-10 w-1 bg-[var(--color-border)] group-hover:bg-[var(--color-brand)] rounded-full transition-colors" />
            </PanelResizeHandle>

            {/* MAIN CONTENT PANEL */}
            <Panel defaultSize={70} minSize={40} className="pl-4 py-4 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
              <div className="space-y-8 pr-2">
                {/* LANGUAGE TABS */}
                <div className="flex gap-2 border-b border-[var(--color-border)] pb-2">
                  <button
                    onClick={() => setLanguage("PT")}
                    className={`px-4 py-1.5 text-sm font-medium rounded-md border transition-colors ${language === "PT" ? "bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text)]" : "border-transparent text-[var(--color-text-muted)] hover:text-white"}`}>
                    BR Português
                  </button>
                  <button
                    onClick={() => setLanguage("EN")}
                    className={`px-4 py-1.5 text-sm font-medium rounded-md border transition-colors ${language === "EN" ? "bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text)]" : "border-transparent text-[var(--color-text-muted)] hover:text-white"}`}>
                    US Inglês
                  </button>
                </div>

                {/* HOOKS */}
                <div>
                  <h3 className="text-xs font-bold text-[var(--color-text-muted)] tracking-wider mb-3 flex items-center justify-between">
                    HOOKS ({displayHooks.length})
                    {isEditing && language === "PT" && (
                      <Button variant="outline" size="sm" onClick={addHook} className="py-1 h-7 text-xs">
                        <Plus className="w-3.5 h-3.5 mr-1" /> Novo Hook
                      </Button>
                    )}
                  </h3>
                  
                  <div ref={hooksContainerRef}>
                    {layoutMode === 'split' ? (
                      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div className="text-[10px] font-bold text-[var(--color-brand)] uppercase border-b border-[var(--color-border)] pb-1 mb-2">Português (BR)</div>
                          <div className="flex flex-col gap-4">
                            {hooks.map(hook => renderHookItem(hook, "PT"))}
                          </div>
                        </div>
                        <div className="space-y-4">
                          <div className="text-[10px] font-bold text-[var(--color-brand)] uppercase border-b border-[var(--color-border)] pb-1 mb-2">Inglês (US)</div>
                          <div className="flex flex-col gap-4">
                            {hooks.map(hook => renderHookItem(hook, "EN"))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-4">
                        {hooks.map(hook => renderHookItem(hook, language))}
                      </div>
                    )}
                  </div>

                  <div ref={hookToolbarRef}>
                  {hookToolbar && hookActiveForm === null && !hookShowBroll && !hookShowColor && (
                    <div className="fixed z-50 flex items-center bg-[#1f2329] border border-[#383e47] rounded-md shadow-lg transform -translate-x-1/2 p-1 gap-1" style={{ top: hookToolbar.top, left: hookToolbar.left }}>
                      <button className="p-1.5 hover:bg-[#2c313a] rounded text-[var(--color-text-muted)] hover:text-white transition-colors" onMouseDown={e => e.preventDefault()} onClick={() => hookCreateAnnotation('comment')}><MessageSquare className="w-4 h-4" /></button>
                      <button className="p-1.5 hover:bg-[#2c313a] rounded text-[var(--color-text-muted)] hover:text-white transition-colors" onMouseDown={e => e.preventDefault()} onClick={() => hookCreateAnnotation('link')}><LinkIcon className="w-4 h-4" /></button>
                      <button className="p-1.5 hover:bg-[#2c313a] rounded text-[var(--color-text-muted)] hover:text-purple-400 transition-colors" onMouseDown={e => e.preventDefault()} onClick={() => setHookShowBroll(true)}><Film className="w-4 h-4" /></button>
                      <div className="w-px h-5 bg-[#383e47] mx-0.5" />
                      <button className="p-1.5 hover:bg-[#2c313a] rounded transition-colors" onMouseDown={e => e.preventDefault()} onClick={() => setHookShowColor(true)}>
                        <div className="w-4 h-4 rounded-full border-2 border-white/50" style={{ background: hookColor }} />
                      </button>
                    </div>
                  )}

                  {hookToolbar && hookShowColor && (
                    <div className="fixed z-50 bg-[#1f2329] border border-[#383e47] rounded-md shadow-lg transform -translate-x-1/2 p-2" style={{ top: hookToolbar.top, left: hookToolbar.left }}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-[var(--color-text-muted)]">Cor</span>
                        <button onMouseDown={e => e.preventDefault()} onClick={() => setHookShowColor(false)} className="text-[var(--color-text-muted)] hover:text-white"><X className="w-3.5 h-3.5" /></button>
                      </div>
                      <div className="grid grid-cols-4 gap-1.5">
                        {HIGHLIGHT_COLORS.map(c => (
                          <button key={c.hex} className={`w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 ${hookColor === c.hex ? 'border-white scale-110' : 'border-transparent'}`} style={{ background: c.hex }} onMouseDown={e => e.preventDefault()} onClick={() => { setHookColor(c.hex); setHookShowColor(false) }} title={c.name} />
                        ))}
                      </div>
                    </div>
                  )}

                  {hookToolbar && hookActiveForm !== null && (
                    <div className="fixed z-50 flex flex-col bg-[#1f2329] border border-[#383e47] rounded-md shadow-lg transform -translate-x-1/2 p-2 w-72 gap-2" style={{ top: hookToolbar.top, left: hookToolbar.left }}>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium uppercase text-[var(--color-text-muted)] flex items-center gap-1">
                          {hookActiveForm === 'comment' && <MessageSquare className="w-3 h-3"/>}
                          {hookActiveForm === 'link' && <LinkIcon className="w-3 h-3"/>}
                          Ref {getNextRefNumber()} — {hookActiveForm}
                        </span>
                        <div className="flex items-center gap-1">
                          <div className="w-3 h-3 rounded-full" style={{ background: hookColor }} />
                          <button onMouseDown={e => e.preventDefault()} onClick={resetHookToolbar} className="text-[var(--color-text-muted)] hover:text-white"><X className="w-3.5 h-3.5" /></button>
                        </div>
                      </div>
                      <textarea autoFocus className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded text-sm p-2 focus:outline-none focus:border-[var(--color-brand)] resize-none" rows={2} placeholder={hookActiveForm === 'link' ? 'Cole o link...' : 'Comentário...'} value={hookFormInput} onChange={e => setHookFormInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); hookCreateAnnotation(hookActiveForm) } }} />
                      <Button size="sm" variant="brand" onClick={() => hookCreateAnnotation(hookActiveForm)}>Salvar</Button>
                    </div>
                  )}
                  </div>

                  <BrollPicker isOpen={hookShowBroll} onClose={() => { setHookShowBroll(false); resetHookToolbar() }} onSelect={hookBrollSelect} />
                </div>

                {/* BODY / SCRIPT */}
                <div>
                  <h3 className="text-xs font-bold text-[var(--color-text-muted)] tracking-wider mb-3 flex items-center justify-between">
                    BODY / SCRIPT
                    <button
                      className="flex items-center gap-1 text-[var(--color-text-muted)] hover:text-white transition-colors bg-transparent border-none cursor-pointer"
                      onClick={() => navigator.clipboard.writeText(scriptContent)}
                    >
                      <Copy className="h-3.5 w-3.5" /> Copiar
                    </button>
                  </h3>
                  
                  {layoutMode === 'split' ? (
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                      <div>
                        <div className="text-[10px] font-bold text-[var(--color-brand)] uppercase border-b border-[var(--color-border)] pb-1 mb-3">Português (BR)</div>
                        <div className="bg-[var(--color-surface-hover)] p-6 rounded-md border border-[var(--color-border)]">
                          <ScriptEditor
                            content={scriptContent}
                            isGlobalEditMode={isEditing}
                            annotations={annotations}
                            onAnnotationsChange={handleAnnotationsChange}
                            onContentChange={setScriptContent}
                          />
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] font-bold text-[var(--color-brand)] uppercase border-b border-[var(--color-border)] pb-1 mb-3">Inglês (US)</div>
                        <div className="bg-[var(--color-surface-hover)] p-6 rounded-md border border-[var(--color-border)]">
                          <ScriptEditor
                            content={scriptEN}
                            isGlobalEditMode={isEditing}
                            annotations={annotations}
                            onAnnotationsChange={handleAnnotationsChange}
                            onContentChange={setScriptEN}
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-[var(--color-surface-hover)] p-6 rounded-md border border-[var(--color-border)]">
                      {verificationFeedback && language === "EN" && (
                        <div className="mb-4 p-4 rounded bg-[#1e293b] border border-[#334155] text-sm whitespace-pre-wrap leading-relaxed text-[#e2e8f0]">
                          <strong className="text-brand block mb-2">⚡ Feedback da IA:</strong>
                          {verificationFeedback}
                        </div>
                      )}
                      <ScriptEditor
                        content={language === "PT" ? scriptContent : scriptEN}
                        isGlobalEditMode={isEditing}
                        annotations={annotations}
                        onAnnotationsChange={handleAnnotationsChange}
                        onContentChange={(newContent) => {
                          if (language === "PT") setScriptContent(newContent)
                          else setScriptEN(newContent)
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </Panel>
          </PanelGroup>
        </div>
      )}

      {showAvatarPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowAvatarPicker(false)}>
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl shadow-2xl w-full max-w-2xl p-6 space-y-5" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">Selecionar Avatar</h2>
              <button onClick={() => setShowAvatarPicker(false)} className="text-[var(--color-text-muted)] hover:text-white"><X className="w-5 h-5"/></button>
            </div>

            {/* Manual URL input */}
            <div className="space-y-2">
              <label className="block text-xs font-medium text-[var(--color-text-muted)]">Inserir URL da Imagem / Link</label>
              <div className="flex gap-2">
                <Input
                  placeholder="https://... ou cole um link de imagem"
                  value={avatarInput}
                  onChange={e => setAvatarInput(e.target.value)}
                  className="flex-1"
                />
                <Button variant="brand" size="sm" onClick={handleSetAvatarManual} disabled={!avatarInput.trim()}>Usar</Button>
              </div>
            </div>

            <div className="text-xs text-[var(--color-text-muted)] uppercase font-bold mt-4 mb-2">Ou selecione da Biblioteca</div>

            {/* FILTERS */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative flex-1 min-w-[150px]">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--color-text-muted)]" />
                <Input className="pl-8 h-8 text-xs" placeholder="Buscar..." value={avSearch} onChange={e => setAvSearch(e.target.value)} />
              </div>
              <select className="bg-[var(--color-background)] border border-[var(--color-border)] text-xs text-[var(--color-text)] rounded-md px-2 py-1.5 focus:outline-none" value={avFilterCategory} onChange={e => setAvFilterCategory(e.target.value)}>
                <option value="Todos">Categoria: Todas</option>
                {avAllCategories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <select className="bg-[var(--color-background)] border border-[var(--color-border)] text-xs text-[var(--color-text)] rounded-md px-2 py-1.5 focus:outline-none" value={avFilterNiche} onChange={e => setAvFilterNiche(e.target.value)}>
                <option value="Todos">Nicho: Todos</option>
                {avAllNiches.map(n => <option key={n} value={n}>{n}</option>)}
              </select>
              <select className="bg-[var(--color-background)] border border-[var(--color-border)] text-xs text-[var(--color-text)] rounded-md px-2 py-1.5 focus:outline-none" value={avFilterTag} onChange={e => setAvFilterTag(e.target.value)}>
                <option value="Todos">Tag: Todas</option>
                {avAllTags.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            {/* Grid from library */}
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-3 max-h-[40vh] overflow-y-auto">
              {avatarItems.map(item => (
                <div
                  key={item.id}
                  className="rounded-lg overflow-hidden cursor-pointer border-2 border-transparent hover:border-[var(--color-brand)] transition-colors"
                  onClick={() => handlePickAvatar(item)}
                >
                  <img src={item.thumbUrl} alt={item.title} className="w-full aspect-square object-cover" />
                  <p className="text-[10px] p-1 truncate text-center">{item.title}</p>
                </div>
              ))}
              {avatarItems.length === 0 && (
                <p className="col-span-5 text-center text-sm text-[var(--color-text-muted)] py-8">Nenhum item encontrado com esses filtros.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
