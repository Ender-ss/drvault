import { useState } from 'react'
import { initialMediaItems, type MediaItem } from '../data/mock'

export function useMediaItems() {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>(() => {
    const stored = localStorage.getItem('drvault_media_items')
    if (stored) {
      try {
        return JSON.parse(stored)
      } catch (e) {
        return initialMediaItems
      }
    }
    return initialMediaItems
  })
  const isLoaded = true

  const saveToStorage = (newMediaItems: MediaItem[]) => {
    setMediaItems(newMediaItems)
    localStorage.setItem('drvault_media_items', JSON.stringify(newMediaItems))
  }

  const addMediaItem = (item: MediaItem) => {
    saveToStorage([item, ...mediaItems])
  }

  const updateMediaItem = (item: MediaItem) => {
    saveToStorage(mediaItems.map(m => m.id === item.id ? item : m))
  }

  const deleteMediaItem = (id: string) => {
    saveToStorage(mediaItems.filter(m => m.id !== id))
  }

  const batchUpdateMediaItems = (ids: string[], updates: Partial<MediaItem>) => {
    saveToStorage(mediaItems.map(m => ids.includes(m.id) ? { ...m, ...updates } : m))
  }

  const batchDeleteMediaItems = (ids: string[]) => {
    saveToStorage(mediaItems.filter(m => !ids.includes(m.id)))
  }

  return { mediaItems, isLoaded, addMediaItem, updateMediaItem, deleteMediaItem, batchUpdateMediaItems, batchDeleteMediaItems }
}
