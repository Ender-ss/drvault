import React, { useState, useRef, useEffect } from 'react'
import { Film } from 'lucide-react'
import { isDirectVideoUrl, isAnimatedMediaUrl } from '../../utils/embedUtils'

interface MediaHoverPreviewProps {
  thumbUrl: string
  title: string
  driveLink?: string
  previewUrl?: string
  className?: string
  aspectRatio?: string // e.g. "aspect-[3/4]" or "aspect-[9/16]"
  fallbackTitle?: string
  children?: React.ReactNode
}

export function MediaHoverPreview({
  thumbUrl,
  title,
  driveLink = '',
  previewUrl,
  className = '',
  aspectRatio = 'aspect-[3/4]',
  children
}: MediaHoverPreviewProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [isPlayingPreview, setIsPlayingPreview] = useState(false)
  const [videoError, setVideoError] = useState(false)
  const [progress, setProgress] = useState(0)
  
  const hoverTimerRef = useRef<NodeJS.Timeout | null>(null)
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)

  // Determine what type of preview is available
  const hasGif = Boolean(previewUrl && isAnimatedMediaUrl(previewUrl))
  const directVideoSrc = previewUrl && isDirectVideoUrl(previewUrl)
    ? previewUrl
    : driveLink && isDirectVideoUrl(driveLink)
      ? driveLink
      : null

  const canPreview = (hasGif || directVideoSrc) && !videoError

  const handleMouseEnter = () => {
    setIsHovered(true)
    if (!canPreview) return

    // Debounce preview activation (150ms) to prevent flickering on fast cursor movement
    hoverTimerRef.current = setTimeout(() => {
      setIsPlayingPreview(true)
      setProgress(0)

      // Start 3-second progress timer
      const startTime = Date.now()
      const durationMs = 3000
      progressIntervalRef.current = setInterval(() => {
        const elapsed = (Date.now() - startTime) % durationMs
        setProgress((elapsed / durationMs) * 100)
      }, 50)
    }, 150)
  }

  const handleMouseLeave = () => {
    setIsHovered(false)
    setIsPlayingPreview(false)
    setProgress(0)

    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current)
      hoverTimerRef.current = null
    }
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current)
      progressIntervalRef.current = null
    }

    if (videoRef.current) {
      videoRef.current.pause()
      videoRef.current.currentTime = 0
    }
  }

  // Handle video 3-second loop
  const handleTimeUpdate = () => {
    if (videoRef.current && videoRef.current.currentTime >= 3.0) {
      videoRef.current.currentTime = 0
      videoRef.current.play().catch(() => {})
    }
  }

  useEffect(() => {
    return () => {
      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current)
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current)
    }
  }, [])

  return (
    <div
      className={`relative w-full ${aspectRatio} bg-black/50 overflow-hidden select-none ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* 1. Video 3-Second Preview */}
      {isPlayingPreview && directVideoSrc && !hasGif && (
        <div className="absolute inset-0 z-10 bg-black flex items-center justify-center animate-in fade-in duration-200">
          <video
            ref={videoRef}
            src={directVideoSrc}
            autoPlay
            muted
            loop
            playsInline
            onTimeUpdate={handleTimeUpdate}
            onError={() => setVideoError(true)}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* 2. GIF 3-Second / Animated Preview */}
      {isPlayingPreview && hasGif && previewUrl && (
        <div className="absolute inset-0 z-10 bg-black flex items-center justify-center animate-in fade-in duration-200">
          <img
            src={previewUrl}
            alt={`${title} Preview`}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* 3. Base Static Thumbnail */}
      <img
        src={thumbUrl}
        alt={title}
        referrerPolicy="no-referrer"
        loading="lazy"
        onError={(e) => {
          const target = e.currentTarget
          if (!target.dataset.fallback) {
            target.dataset.fallback = 'true'
            target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(title || 'DR')}&background=1f2329&color=e2e8f0&size=400`
          }
        }}
        className={`w-full h-full object-cover transition-transform duration-500 ${
          isHovered ? 'scale-105 opacity-90' : 'opacity-80'
        }`}
      />

      {/* 4. Active 3s Preview Badge & Progress Bar */}
      {isPlayingPreview && (
        <>
          <div className="absolute top-2 left-2 z-20 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-black/80 backdrop-blur-md border border-[var(--color-brand)]/60 text-[10px] font-black tracking-wider text-[var(--color-brand)] shadow-lg animate-in fade-in duration-150">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-brand)] animate-ping" />
            <Film className="w-3 h-3 text-[var(--color-brand)]" />
            <span>PREVIEW 3s</span>
          </div>

          {/* 3-Second Micro Progress Bar at the bottom */}
          <div className="absolute inset-x-0 bottom-0 z-20 h-1 bg-black/60 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[var(--color-brand)] to-emerald-400 transition-[width] duration-75 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>
        </>
      )}

      {/* Subtle indicator that preview is available if hover hasn't started yet */}
      {canPreview && !isPlayingPreview && (
        <div className="absolute bottom-2 right-2 z-10 px-1.5 py-0.5 rounded bg-black/70 backdrop-blur-sm border border-white/10 text-[9px] text-gray-300 flex items-center gap-1 opacity-0 group-hover:opacity-90 transition-opacity">
          <Film className="w-2.5 h-2.5 text-[var(--color-brand)]" />
          <span>3s</span>
        </div>
      )}

      {/* Custom children overlays (e.g. action buttons, play button, checkboxes) */}
      {children}
    </div>
  )
}
