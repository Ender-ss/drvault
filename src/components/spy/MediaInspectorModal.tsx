import { useState } from 'react'
import { X, ExternalLink, Check, Film, BookmarkPlus, Copy } from 'lucide-react'
import { parseMediaUrl } from '../../utils/embedUtils'
import { useMediaItems } from '../../hooks/useMediaItems'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'

export interface MediaInspectorProps {
  isOpen: boolean
  onClose: () => void
  title: string
  url: string
  niche?: string
  category?: string
  thumbUrl?: string
  tags?: string[]
  hideSaveAction?: boolean
}

export function MediaInspectorModal({
  isOpen,
  onClose,
  title,
  url,
  niche = 'Geral',
  category = 'broll',
  thumbUrl = '',
  tags = ['Importado Spy'],
  hideSaveAction = false
}: MediaInspectorProps) {
  const { addMediaItem } = useMediaItems()
  const [isSaved, setIsSaved] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [copied, setCopied] = useState(false)

  if (!isOpen) return null

  const embedInfo = parseMediaUrl(url)

  const handleSaveToLibrary = async () => {
    setIsSaving(true)
    try {
      const finalThumb = thumbUrl || (embedInfo.platform === 'drive' && embedInfo.videoId ? `https://drive.google.com/thumbnail?id=${embedInfo.videoId}&sz=w600` : '')

      await addMediaItem({
        id: `spy-${Date.now()}`,
        title: title || 'Mídia Salva do Spy',
        driveLink: url,
        thumbUrl: finalThumb,
        niche: niche || 'Geral',
        category: category || 'broll',
        tags: tags.length > 0 ? tags : ['Spy'],
        isFavorite: false
      })

      setIsSaved(true)
      setTimeout(() => setIsSaved(false), 3000)
    } catch (err) {
      console.error('Error saving to library:', err)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-3xl bg-[#1a1d24] border border-[var(--color-border)] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)] bg-[#21252d]">
          <div className="flex items-center gap-3 pr-4">
            <span className="p-2 rounded-lg bg-[var(--color-brand)]/10 text-[var(--color-brand)]">
              <Film className="w-5 h-5" />
            </span>
            <div className="min-w-0">
              <h3 className="text-base font-bold text-white truncate max-w-md">{title}</h3>
              <div className="flex items-center gap-2 mt-0.5">
                <Badge variant="secondary" className="text-[10px] uppercase font-bold text-[var(--color-brand)] bg-[var(--color-brand)]/15">
                  {embedInfo.platform}
                </Badge>
                {niche && (
                  <Badge variant="outline" className="text-[10px] text-gray-400">
                    {niche}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Player Container */}
        <div className="flex-1 bg-black flex items-center justify-center relative overflow-hidden min-h-[420px] max-h-[65vh]">
          {embedInfo.platform === 'tiktok' && embedInfo.videoId ? (
            <iframe
              src={embedInfo.embedUrl}
              className="w-full h-[580px] max-w-[360px] rounded-lg border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title={title}
            />
          ) : embedInfo.platform === 'youtube' && embedInfo.videoId ? (
            <iframe
              src={embedInfo.embedUrl}
              className="w-full h-full aspect-video border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title={title}
            />
          ) : embedInfo.platform === 'instagram' ? (
            <iframe
              src={embedInfo.embedUrl}
              className="w-full h-[580px] max-w-[400px] border-0"
              allowFullScreen
              title={title}
            />
          ) : embedInfo.platform === 'drive' && embedInfo.videoId ? (
            <iframe
              src={embedInfo.embedUrl}
              className="w-full h-full min-h-[460px] border-0"
              allow="autoplay; encrypted-media; fullscreen"
              allowFullScreen
              title={title}
            />
          ) : embedInfo.platform === 'direct' && embedInfo.embedUrl && (embedInfo.embedUrl.endsWith('.mp4') || embedInfo.embedUrl.endsWith('.webm') || embedInfo.embedUrl.includes('.mp4?') || embedInfo.embedUrl.includes('fbcdn.net') || embedInfo.embedUrl.includes('tiktokcdn.com')) ? (
            <video
              src={embedInfo.embedUrl}
              controls
              autoPlay
              className="w-full h-full max-h-[65vh] object-contain"
            />
          ) : (
            <div className="text-center p-8 text-gray-400 space-y-4">
              <Film className="w-12 h-12 mx-auto text-gray-600 animate-bounce" />
              <p className="text-sm max-w-sm mx-auto">
                Esta página externa ({embedInfo.platform}) requer abertura direta ou consulta de anúncios ativos.
              </p>
              <a
                href={url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[var(--color-brand)] text-white font-semibold text-sm hover:opacity-90 transition-opacity shadow-lg"
              >
                Abrir Link Oficial <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          )}
        </div>

        {/* Actions Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-t border-[var(--color-border)] bg-[#1e222a]">
          <div className="flex items-center gap-2">
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-semibold text-gray-200 hover:text-white transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5 text-[var(--color-brand)]" />
              Abrir Link Externo
            </a>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(url)
                setCopied(true)
                setTimeout(() => setCopied(false), 2000)
              }}
              className="text-xs flex items-center gap-1.5 px-3 py-2 bg-white/5 border-white/10 hover:bg-white/10"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Link Copiado!' : 'Copiar Link'}
            </Button>
          </div>

          {!hideSaveAction && (
            <div className="flex items-center gap-2">
              <Button
                variant={isSaved ? 'outline' : 'brand'}
                onClick={handleSaveToLibrary}
                disabled={isSaving}
                className="text-xs flex items-center gap-2 px-4 py-2"
              >
                {isSaved ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    Salvo na Biblioteca!
                  </>
                ) : (
                  <>
                    <BookmarkPlus className="w-4 h-4" />
                    {isSaving ? 'Salvando...' : 'Salvar na Minha Biblioteca'}
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
