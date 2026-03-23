import { useState, useEffect, useRef, useCallback } from "react"
import { MessageSquare, Link as LinkIcon, Film, X } from "lucide-react"
import { Button } from "../ui/Button"
import { BrollPicker } from "./BrollPicker"
import type { MediaItem } from "../../data/mock"

export interface Annotation {
  id: string
  selectedText: string
  type: "comment" | "link" | "broll"
  content: string
  refNumber?: number
  color?: string // hex color for the highlight
  // Extra data for broll type
  brollThumb?: string
  brollTitle?: string
}

const HIGHLIGHT_COLORS = [
  { name: "Azul", hex: "#3B82F6" },
  { name: "Verde", hex: "#22C55E" },
  { name: "Roxo", hex: "#A855F7" },
  { name: "Laranja", hex: "#F97316" },
  { name: "Rosa", hex: "#EC4899" },
  { name: "Amarelo", hex: "#EAB308" },
  { name: "Vermelho", hex: "#EF4444" },
  { name: "Ciano", hex: "#06B6D4" },
]

interface ScriptEditorProps {
  content: string
  isGlobalEditMode: boolean
  annotations: Annotation[]
  onAnnotationsChange: (annotations: Annotation[]) => void
  onContentChange: (newContent: string) => void
}

export function ScriptEditor({ content, isGlobalEditMode, annotations, onAnnotationsChange, onContentChange }: ScriptEditorProps) {
  
  const [selection, setSelection] = useState<string | null>(null)
  const [toolbarPos, setToolbarPos] = useState<{ top: number, left: number } | null>(null)
  const [activeForm, setActiveForm] = useState<"comment" | "link" | null>(null)
  const [formInput, setFormInput] = useState("")
  const [showBrollPicker, setShowBrollPicker] = useState(false)
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [selectedColor, setSelectedColor] = useState(HIGHLIGHT_COLORS[0].hex)

  const textRef = useRef<HTMLDivElement>(null)      // the text content area only
  const toolbarRef = useRef<HTMLDivElement>(null)    // the toolbar/popover area

  // Double-click enters inline text editing
  const [isInlineEditing, setIsInlineEditing] = useState(false)
  const isEditing = isGlobalEditMode || isInlineEditing

  useEffect(() => {
    const handleMouseUp = (e: MouseEvent) => {
      // Don't process if B-roll picker is open
      if (showBrollPicker) return
      
      // If clicking inside the toolbar/popover, do NOT reset — let the button handler work
      if (toolbarRef.current?.contains(e.target as Node)) return

      const sel = window.getSelection()
      if (sel && sel.toString().trim() !== "" && textRef.current?.contains(sel.anchorNode)) {
        const range = sel.getRangeAt(0)
        const rect = range.getBoundingClientRect()
        setSelection(sel.toString())
        setToolbarPos({ top: rect.top - 50, left: rect.left + rect.width / 2 })
        setActiveForm(null)
        setShowColorPicker(false)
      } else if (!activeForm && !showColorPicker) {
        // Click outside text & toolbar → close
        setToolbarPos(null)
        setSelection(null)
      }
    }
    document.addEventListener('mouseup', handleMouseUp)
    return () => document.removeEventListener('mouseup', handleMouseUp)
  }, [activeForm, showBrollPicker, showColorPicker])

  const getNextRefNumber = useCallback(() => {
    const existing = annotations.map(a => a.refNumber || 0)
    return existing.length > 0 ? Math.max(...existing) + 1 : 1
  }, [annotations])

  const handleCreateAnnotation = (type: "comment" | "link") => {
    if (!selection) return
    if (!activeForm) {
      setActiveForm(type)
      return
    }
    if (formInput.trim()) {
      const newAnnotation: Annotation = {
        id: Math.random().toString(36).substring(7),
        selectedText: selection,
        type,
        content: formInput,
        refNumber: getNextRefNumber(),
        color: selectedColor,
      }
      onAnnotationsChange([...annotations, newAnnotation])
    }
    // After saving, just clear the form — don't block further selections
    setActiveForm(null)
    setFormInput("")
    setSelection(null)
    setToolbarPos(null)
    setShowColorPicker(false)
    // Don't call removeAllRanges — let the user select again
  }

  const handleBrollClick = () => {
    if (!selection) return
    setShowBrollPicker(true)
  }

  const handleBrollSelect = (item: MediaItem) => {
    if (!selection) return
    const newAnnotation: Annotation = {
      id: Math.random().toString(36).substring(7),
      selectedText: selection,
      type: "broll",
      content: item.driveLink,
      brollThumb: item.thumbUrl,
      brollTitle: item.title,
      refNumber: getNextRefNumber(),
      color: selectedColor,
    }
    onAnnotationsChange([...annotations, newAnnotation])
    setShowBrollPicker(false)
    setActiveForm(null)
    setFormInput("")
    setSelection(null)
    setToolbarPos(null)
    setShowColorPicker(false)
  }

  const resetToolbar = () => {
    setActiveForm(null)
    setFormInput("")
    setSelection(null)
    setToolbarPos(null)
    setShowColorPicker(false)
  }

  const renderContentWithHighlights = (text: string) => {
    if (annotations.length === 0) {
      return <div className="whitespace-pre-wrap text-sm text-[var(--color-text)] leading-relaxed">{text}</div>
    }
    let highlightedHtml = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    annotations.forEach(ann => {
      const color = ann.color || "#3B82F6"
      const safeText = ann.selectedText.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const regex = new RegExp(`(${safeText})`)
      const refBadge = ann.refNumber ? `<sup style="background:${color};color:white;border-radius:999px;padding:0 4px;font-size:9px;font-weight:700;margin-left:2px;">${ann.refNumber}</sup>` : ''
      highlightedHtml = highlightedHtml.replace(
        regex,
        `<mark style="background:${color}22;color:inherit;border-bottom:2px solid ${color};border-radius:2px;padding:0 2px;">$1${refBadge}</mark>`
      )
    })
    return <div dangerouslySetInnerHTML={{ __html: highlightedHtml }} className="whitespace-pre-wrap text-sm text-[var(--color-text)] leading-relaxed" />
  }

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onContentChange(e.target.value)
  }

  return (
    <div>
      {isEditing ? (
        <textarea
          autoFocus
          className="w-full min-h-[300px] p-4 rounded-md bg-[var(--color-surface)] border border-[var(--color-brand)] focus:outline-none text-sm resize-y text-[var(--color-text)] leading-relaxed font-sans"
          value={content}
          onChange={handleTextChange}
          onBlur={() => setIsInlineEditing(false)}
          placeholder="Digite aqui o seu script..."
        />
      ) : (
        <div 
          ref={textRef}
          className="rounded px-2 -mx-2 py-2 transition-colors min-h-[200px] select-text"
          onDoubleClick={() => setIsInlineEditing(true)}
        >
          {renderContentWithHighlights(content)}
        </div>
      )}

      {/* All toolbar/popover elements go inside this ref so clicks are detected */}
      <div ref={toolbarRef}>
        {/* Floating Toolbar */}
        {toolbarPos && activeForm === null && !showBrollPicker && !showColorPicker && (
          <div 
            className="fixed z-50 flex items-center bg-[#1f2329] border border-[#383e47] rounded-md shadow-lg transform -translate-x-1/2 p-1 gap-1"
            style={{ top: toolbarPos.top, left: toolbarPos.left }}
          >
            <button className="p-1.5 hover:bg-[#2c313a] rounded text-[var(--color-text-muted)] hover:text-white transition-colors" onMouseDown={e => e.preventDefault()} onClick={() => handleCreateAnnotation('comment')} title="Adicionar Comentário">
              <MessageSquare className="w-4 h-4" />
            </button>
            <button className="p-1.5 hover:bg-[#2c313a] rounded text-[var(--color-text-muted)] hover:text-white transition-colors" onMouseDown={e => e.preventDefault()} onClick={() => handleCreateAnnotation('link')} title="Adicionar Link">
              <LinkIcon className="w-4 h-4" />
            </button>
            <button className="p-1.5 hover:bg-[#2c313a] rounded text-[var(--color-text-muted)] hover:text-purple-400 transition-colors" onMouseDown={e => e.preventDefault()} onClick={handleBrollClick} title="Selecionar B-roll da Biblioteca">
              <Film className="w-4 h-4" />
            </button>
            <div className="w-px h-5 bg-[#383e47] mx-0.5" />
            <button 
              className="p-1.5 hover:bg-[#2c313a] rounded transition-colors"
              onMouseDown={e => e.preventDefault()}
              onClick={() => setShowColorPicker(true)} 
              title="Escolher cor"
            >
              <div className="w-4 h-4 rounded-full border-2 border-white/50" style={{ background: selectedColor }} />
            </button>
          </div>
        )}

        {/* Color Picker */}
        {toolbarPos && showColorPicker && (
          <div 
            className="fixed z-50 bg-[#1f2329] border border-[#383e47] rounded-md shadow-lg transform -translate-x-1/2 p-2"
            style={{ top: toolbarPos.top, left: toolbarPos.left }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-[var(--color-text-muted)]">Cor da marcação</span>
              <button onMouseDown={e => e.preventDefault()} onClick={() => setShowColorPicker(false)} className="text-[var(--color-text-muted)] hover:text-white">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {HIGHLIGHT_COLORS.map(c => (
                <button
                  key={c.hex}
                  className={`w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 ${selectedColor === c.hex ? 'border-white scale-110' : 'border-transparent'}`}
                  style={{ background: c.hex }}
                  onMouseDown={e => e.preventDefault()}
                  onClick={() => { setSelectedColor(c.hex); setShowColorPicker(false) }}
                  title={c.name}
                />
              ))}
            </div>
          </div>
        )}

        {/* Comment/Link Form Popover */}
        {toolbarPos && activeForm !== null && (
          <div 
            className="fixed z-50 flex flex-col bg-[#1f2329] border border-[#383e47] rounded-md shadow-lg transform -translate-x-1/2 p-2 w-72 gap-2"
            style={{ top: toolbarPos.top, left: toolbarPos.left }}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase text-[var(--color-text-muted)] flex items-center gap-1">
                {activeForm === 'comment' && <MessageSquare className="w-3 h-3"/>}
                {activeForm === 'link' && <LinkIcon className="w-3 h-3"/>}
                Ref {getNextRefNumber()} — {activeForm}
              </span>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full" style={{ background: selectedColor }} />
                <button onMouseDown={e => e.preventDefault()} onClick={resetToolbar} className="text-[var(--color-text-muted)] hover:text-white">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <textarea
              autoFocus
              className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded text-sm p-2 focus:outline-none focus:border-[var(--color-brand)] resize-none"
              rows={2}
              placeholder={activeForm === 'link' ? 'Cole o link aqui...' : 'Digite o comentário...'}
              value={formInput}
              onChange={e => setFormInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleCreateAnnotation(activeForm)
                }
              }}
            />
            <Button size="sm" variant="brand" onMouseDown={(e: React.MouseEvent) => e.preventDefault()} onClick={() => handleCreateAnnotation(activeForm)}>
              Salvar
            </Button>
          </div>
        )}
      </div>

      {/* B-roll Picker Modal */}
      <BrollPicker
        isOpen={showBrollPicker}
        onClose={() => { setShowBrollPicker(false); resetToolbar() }}
        onSelect={handleBrollSelect}
      />
    </div>
  )
}
