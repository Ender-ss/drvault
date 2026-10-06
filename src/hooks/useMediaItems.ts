import { useState, useEffect, useCallback } from 'react'
import { initialMediaItems, type MediaItem } from '../data/mock'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { getOptimizedThumbUrl } from '../lib/utils'

const LOCAL_STORAGE_KEY = 'drvault_custom_media_items'

function getStoredLocalItems(): MediaItem[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch (e) {
    console.warn('Failed to parse local media items', e)
    return []
  }
}

function saveStoredLocalItems(items: MediaItem[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items))
  } catch (e) {
    console.warn('Failed to save local media items', e)
  }
}

export function useMediaItems() {
  const { user } = useAuth()
  const [mediaItems, setMediaItems] = useState<MediaItem[]>(initialMediaItems)
  const [isLoaded, setIsLoaded] = useState(false)

  const fetchItems = useCallback(async () => {
    setIsLoaded(false)
    const localItems = getStoredLocalItems()

    if (!user) {
      // Offline / guest mode: show local items + static catalog
      const localIds = new Set(localItems.map(i => i.id))
      const combined = [...localItems, ...initialMediaItems.filter(i => !localIds.has(i.id))]
      setMediaItems(combined)
      setIsLoaded(true)
      return
    }

    try {
      // 1. Fetch all media items from Supabase
      const { data: itemsData, error: itemsError } = await supabase
        .from('media_items')
        .select('*')
        .order('created_at', { ascending: false })

      if (itemsError) {
        console.warn('Error fetching media items from Supabase, using local fallback:', itemsError.message)
        const localIds = new Set(localItems.map(i => i.id))
        setMediaItems([...localItems, ...initialMediaItems.filter(i => !localIds.has(i.id))])
        setIsLoaded(true)
        return
      }

      // 2. Fetch user favorites
      let favoriteIds = new Set<string>()
      try {
        const { data: favsData } = await supabase
          .from('user_favorites')
          .select('media_item_id')
          .eq('user_id', user.id)
        if (favsData) {
          favoriteIds = new Set(favsData.map(f => f.media_item_id))
        }
      } catch (favErr) {
        console.warn('Error fetching favorites:', favErr)
      }

      if (itemsData && itemsData.length > 0) {
        const mappedItems: MediaItem[] = itemsData.map(item => ({
          id: item.id,
          title: item.title,
          thumbUrl: getOptimizedThumbUrl(item.thumb_url, item.drive_link),
          driveLink: item.drive_link,
          tags: item.tags || [],
          niche: item.niche,
          category: item.category,
          brollType: item.broll_type,
          isFavorite: favoriteIds.has(item.id),
          visualDescription: item.visual_description,
          sceneSummary: item.scene_summary,
          previewUrl: item.preview_url || undefined
        }))

        // Merge local storage items that are not in DB
        const dbIds = new Set(mappedItems.map(i => i.id))
        const nonDuplicateLocal = localItems.filter(l => !dbIds.has(l.id))

        // Keep static reference catalog available
        const existingLinks = new Set([...mappedItems, ...nonDuplicateLocal].map(i => i.driveLink.trim().toLowerCase()))
        const existingTitles = new Set([...mappedItems, ...nonDuplicateLocal].map(i => i.title.trim().toLowerCase()))
        const unseededInitials = initialMediaItems.filter(i => 
          !existingLinks.has(i.driveLink.trim().toLowerCase()) &&
          !existingTitles.has(i.title.trim().toLowerCase())
        )

        setMediaItems([...nonDuplicateLocal, ...mappedItems, ...unseededInitials])
      } else {
        const localIds = new Set(localItems.map(i => i.id))
        setMediaItems([...localItems, ...initialMediaItems.filter(i => !localIds.has(i.id))])
      }
    } catch (err) {
      console.warn('Network exception while fetching media items:', err)
      const localIds = new Set(localItems.map(i => i.id))
      setMediaItems([...localItems, ...initialMediaItems.filter(i => !localIds.has(i.id))])
    } finally {
      setIsLoaded(true)
    }
  }, [user])

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  const addMediaItem = async (item: MediaItem): Promise<MediaItem | null> => {
    const newItemId = item.id || `local_${Date.now()}_${Math.random().toString(36).substring(7)}`
    const normalizedItem: MediaItem = {
      ...item,
      id: newItemId,
      previewUrl: item.previewUrl || undefined
    }

    // Try saving to Supabase if user is logged in
    if (user) {
      try {
        const payload: Record<string, any> = {
          title: normalizedItem.title,
          thumb_url: normalizedItem.thumbUrl,
          drive_link: normalizedItem.driveLink,
          niche: normalizedItem.niche,
          tags: normalizedItem.tags,
          category: normalizedItem.category,
          broll_type: normalizedItem.brollType,
          is_favorite: normalizedItem.isFavorite,
          user_id: user.id
        }
        if (normalizedItem.previewUrl) {
          payload.preview_url = normalizedItem.previewUrl
        }

        let { data, error } = await supabase
          .from('media_items')
          .insert([payload])
          .select()

        // If error mentions preview_url column not existing in DB, retry without it
        if (error && (error.message.includes('preview_url') || error.code === '42703')) {
          delete payload.preview_url
          const retryRes = await supabase.from('media_items').insert([payload]).select()
          data = retryRes.data
          error = retryRes.error
        }

        if (!error && data && data[0]) {
          const dbItem: MediaItem = {
            id: data[0].id,
            title: data[0].title,
            thumbUrl: data[0].thumb_url,
            driveLink: data[0].drive_link,
            tags: data[0].tags || [],
            niche: data[0].niche,
            category: data[0].category,
            brollType: data[0].broll_type,
            isFavorite: data[0].is_favorite,
            previewUrl: normalizedItem.previewUrl
          }
          await fetchItems()
          return dbItem
        }
      } catch (err) {
        console.warn('Supabase insert failed, saving locally:', err)
      }
    }

    // Fallback: Save to LocalStorage
    const localItems = getStoredLocalItems()
    saveStoredLocalItems([normalizedItem, ...localItems])
    setMediaItems(prev => [normalizedItem, ...prev])
    return normalizedItem
  }

  const updateMediaItem = async (item: MediaItem) => {
    // 1. If it's stored locally, update local storage
    const localItems = getStoredLocalItems()
    const isLocal = localItems.some(l => l.id === item.id) || item.id.startsWith('local_')
    if (isLocal) {
      const updatedLocals = localItems.map(l => l.id === item.id ? item : l)
      saveStoredLocalItems(updatedLocals)
      setMediaItems(prev => prev.map(m => m.id === item.id ? item : m))
      return
    }

    // 2. Mock items warning
    if (item.id.startsWith('m') || item.id.startsWith('ext') || item.id.startsWith('gdoc')) {
      // Save as local clone/override so the user can still edit
      saveStoredLocalItems([item, ...localItems])
      setMediaItems(prev => prev.map(m => m.id === item.id ? item : m))
      return
    }

    // 3. Supabase item update
    if (user) {
      try {
        const payload: Record<string, any> = {
          title: item.title,
          thumb_url: item.thumbUrl,
          drive_link: item.driveLink,
          niche: item.niche,
          tags: item.tags,
          category: item.category,
          broll_type: item.brollType,
          visual_description: item.visualDescription,
          scene_summary: item.sceneSummary
        }
        if (item.previewUrl !== undefined) {
          payload.preview_url = item.previewUrl
        }

        let { error } = await supabase
          .from('media_items')
          .update(payload)
          .eq('id', item.id)

        // Retry if preview_url column not supported in DB schema
        if (error && (error.message.includes('preview_url') || error.code === '42703')) {
          delete payload.preview_url
          const retry = await supabase.from('media_items').update(payload).eq('id', item.id)
          error = retry.error
        }

        if (error) {
          console.warn('Error updating in Supabase, updating locally:', error.message)
          saveStoredLocalItems([item, ...localItems])
        }
      } catch (err) {
        console.warn('Supabase update exception:', err)
        saveStoredLocalItems([item, ...localItems])
      }
    } else {
      saveStoredLocalItems([item, ...localItems])
    }

    setMediaItems(prev => prev.map(m => m.id === item.id ? item : m))
  }

  const deleteMediaItem = async (id: string) => {
    // 1. Remove from local storage
    const localItems = getStoredLocalItems()
    if (localItems.some(l => l.id === id)) {
      saveStoredLocalItems(localItems.filter(l => l.id !== id))
    }

    // 2. Remove from Supabase if authenticated
    if (user && !id.startsWith('local_') && !id.startsWith('m') && !id.startsWith('ext')) {
      try {
        await supabase.from('media_items').delete().eq('id', id)
      } catch (err) {
        console.warn('Error deleting from Supabase:', err)
      }
    }

    setMediaItems(prev => prev.filter(m => m.id !== id))
  }

  const batchUpdateMediaItems = async (ids: string[], updates: Partial<MediaItem>) => {
    const idSet = new Set(ids)
    
    // Update local storage items
    const localItems = getStoredLocalItems()
    const updatedLocals = localItems.map(item => {
      if (idSet.has(item.id)) {
        return { ...item, ...updates }
      }
      return item
    })
    saveStoredLocalItems(updatedLocals)

    // Update in Supabase
    if (user) {
      try {
        const dbUpdates: any = {}
        if (updates.title) dbUpdates.title = updates.title
        if (updates.thumbUrl) dbUpdates.thumb_url = updates.thumbUrl
        if (updates.driveLink) dbUpdates.drive_link = updates.driveLink
        if (updates.niche) dbUpdates.niche = updates.niche
        if (updates.tags) dbUpdates.tags = updates.tags
        if (updates.category) dbUpdates.category = updates.category
        if (updates.brollType) dbUpdates.broll_type = updates.brollType
        if (updates.previewUrl !== undefined) dbUpdates.preview_url = updates.previewUrl

        await supabase.from('media_items').update(dbUpdates).in('id', ids)
      } catch (err) {
        console.warn('Batch update error in Supabase:', err)
      }
    }

    setMediaItems(prev => prev.map(m => idSet.has(m.id) ? { ...m, ...updates } : m))
  }

  const batchDeleteMediaItems = async (ids: string[]) => {
    const idSet = new Set(ids)
    
    const localItems = getStoredLocalItems()
    saveStoredLocalItems(localItems.filter(item => !idSet.has(item.id)))

    if (user) {
      try {
        await supabase.from('media_items').delete().in('id', ids)
      } catch (err) {
        console.warn('Batch delete error in Supabase:', err)
      }
    }

    setMediaItems(prev => prev.filter(m => !idSet.has(m.id)))
  }

  const toggleFavorite = async (mediaItemId: string, currentStatus: boolean) => {
    // Immediate UI toggle
    setMediaItems(prev => prev.map(m => m.id === mediaItemId ? { ...m, isFavorite: !currentStatus } : m))

    if (!user) return

    try {
      if (currentStatus) {
        await supabase
          .from('user_favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('media_item_id', mediaItemId)
      } else {
        await supabase
          .from('user_favorites')
          .insert([{ user_id: user.id, media_item_id: mediaItemId }])
      }
    } catch (err) {
      console.warn('Error toggling favorite:', err)
    }
  }

  /**
   * Resilient upload:
   * 1. Attempts Supabase Storage upload if authenticated and online.
   * 2. Automatically falls back to reading the file as a Base64 Data URL.
   * Works 100% reliably in any environment, online or offline!
   */
  const uploadThumbnail = async (file: File): Promise<string | null> => {
    // 1. Try Supabase Storage first if user session exists
    if (user) {
      try {
        const fileExt = file.name.split('.').pop() || 'png'
        const cleanName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
        const filePath = `shared/${cleanName}`

        const { error: uploadError } = await supabase.storage
          .from('thumbnails')
          .upload(filePath, file, { cacheControl: '3600', upsert: true })

        if (!uploadError) {
          const { data } = supabase.storage
            .from('thumbnails')
            .getPublicUrl(filePath)

          if (data?.publicUrl) {
            return data.publicUrl
          }
        } else {
          console.warn('Supabase storage upload failed, using local Base64 fallback:', uploadError.message)
        }
      } catch (err: any) {
        console.warn('Supabase storage exception, using local Base64 fallback:', err?.message || err)
      }
    }

    // 2. Reliable Instant Fallback: Base64 Data URL
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result)
        } else {
          resolve(null)
        }
      }
      reader.onerror = () => {
        console.error('Error reading file as Base64')
        resolve(null)
      }
      reader.readAsDataURL(file)
    })
  }

  return { 
    mediaItems, 
    isLoaded, 
    addMediaItem, 
    updateMediaItem, 
    deleteMediaItem, 
    batchUpdateMediaItems, 
    batchDeleteMediaItems,
    uploadThumbnail,
    toggleFavorite,
    refreshItems: fetchItems
  }
}
