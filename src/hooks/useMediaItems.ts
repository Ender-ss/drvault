import { useState, useEffect } from 'react'
import { initialMediaItems, type MediaItem } from '../data/mock'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

export function useMediaItems() {
  const { user } = useAuth()
  const [mediaItems, setMediaItems] = useState<MediaItem[]>(initialMediaItems)
  const [isLoaded, setIsLoaded] = useState(false)

  const fetchItems = async () => {
    if (!user) return
    setIsLoaded(false)
    
    // 1. Fetch all media items (Shared)
    const { data: itemsData, error: itemsError } = await supabase
      .from('media_items')
      .select('*')
      .order('created_at', { ascending: false })

    if (itemsError) {
      console.error('Error fetching media items:', itemsError)
      return
    }

    // 2. Fetch user favorites (Individual)
    const { data: favsData, error: favsError } = await supabase
      .from('user_favorites')
      .select('media_item_id')
      .eq('user_id', user.id)

    if (favsError) {
      console.error('Error fetching favorites:', favsError)
    }

    const favoriteIds = new Set(favsData?.map(f => f.media_item_id) || [])

    if (itemsData && itemsData.length > 0) {
      // Map database snake_case to frontend camelCase
      const mappedItems: MediaItem[] = itemsData.map(item => ({
        id: item.id,
        title: item.title,
        thumbUrl: item.thumb_url,
        driveLink: item.drive_link,
        tags: item.tags || [],
        niche: item.niche,
        category: item.category,
        brollType: item.broll_type,
        isFavorite: favoriteIds.has(item.id)
      }))
      setMediaItems(mappedItems)
    } else {
      setMediaItems(initialMediaItems)
    }
    setIsLoaded(true)
  }

  useEffect(() => {
    fetchItems()
  }, [user])

  const addMediaItem = async (item: MediaItem) => {
    if (!user) return null
    
    // Create payload WITHOUT 'id' so Supabase generates a UUID
    const payload = {
      title: item.title,
      thumb_url: item.thumbUrl,
      drive_link: item.driveLink,
      niche: item.niche,
      tags: item.tags,
      category: item.category,
      broll_type: item.brollType,
      is_favorite: item.isFavorite,
      user_id: user.id
    }

    const { data, error } = await supabase
      .from('media_items')
      .insert([payload])
      .select()

    if (error) {
      console.error('Error adding item:', error)
      alert('Erro ao salvar no banco: ' + error.message)
      return null
    } else {
      await fetchItems()
      if (data && data[0]) {
        return {
          id: data[0].id,
          title: data[0].title,
          thumbUrl: data[0].thumb_url,
          driveLink: data[0].drive_link,
          tags: data[0].tags || [],
          niche: data[0].niche,
          category: data[0].category,
          brollType: data[0].broll_type,
          isFavorite: data[0].is_favorite
        } as MediaItem
      }
      return null
    }
  }

  const updateMediaItem = async (item: MediaItem) => {
    if (!user) return

    // Prevent updating mock items (IDs like 'm1' or 'ext_1')
    if (item.id.startsWith('m') || item.id.startsWith('ext')) {
      alert('Este é um item de exemplo e não pode ser editado no banco de dados. Crie um novo item primeiro!')
      return
    }

    const { error } = await supabase
      .from('media_items')
      .update({
        title: item.title,
        thumb_url: item.thumbUrl,
        drive_link: item.driveLink,
        niche: item.niche,
        tags: item.tags,
        category: item.category,
        broll_type: item.brollType
      })
      .eq('id', item.id)

    if (error) {
      console.error('Error updating item:', error)
      alert('Erro ao atualizar: ' + error.message)
    } else {
      fetchItems()
    }
  }

  const deleteMediaItem = async (id: string) => {
    if (!user) return
    const { error } = await supabase
      .from('media_items')
      .delete()
      .eq('id', id)

    if (error) console.error('Error deleting item:', error)
    else fetchItems()
  }

  const batchUpdateMediaItems = async (ids: string[], updates: Partial<MediaItem>) => {
    if (!user) return
    
    // Map updates to snake_case
    const dbUpdates: any = {}
    if (updates.title) dbUpdates.title = updates.title
    if (updates.thumbUrl) dbUpdates.thumb_url = updates.thumbUrl
    if (updates.driveLink) dbUpdates.drive_link = updates.driveLink
    if (updates.niche) dbUpdates.niche = updates.niche
    if (updates.tags) dbUpdates.tags = updates.tags
    if (updates.category) dbUpdates.category = updates.category
    if (updates.brollType) dbUpdates.broll_type = updates.brollType

    const { error } = await supabase
      .from('media_items')
      .update(dbUpdates)
      .in('id', ids)

    if (error) console.error('Error batch updating:', error)
    else fetchItems()
  }

  const batchDeleteMediaItems = async (ids: string[]) => {
    if (!user) return
    const { error } = await supabase
      .from('media_items')
      .delete()
      .in('id', ids)

    if (error) console.error('Error batch deleting:', error)
    else fetchItems()
  }

  const toggleFavorite = async (mediaItemId: string, currentStatus: boolean) => {
    if (!user) return

    if (currentStatus) {
      // Remove from favorites
      const { error } = await supabase
        .from('user_favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('media_item_id', mediaItemId)
      
      if (error) console.error('Error removing favorite:', error)
    } else {
      // Add to favorites
      const { error } = await supabase
        .from('user_favorites')
        .insert([{ user_id: user.id, media_item_id: mediaItemId }])
      
      if (error) console.error('Error adding favorite:', error)
    }
    
    fetchItems()
  }

  const uploadThumbnail = async (file: File): Promise<string | null> => {
    if (!user) return null
    
    const fileExt = file.name.split('.').pop()
    const fileName = `${Math.random()}.${fileExt}`
    const filePath = `shared/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('thumbnails')
      .upload(filePath, file)

    if (uploadError) {
      console.error('Error uploading thumbnail:', uploadError)
      alert('Erro ao carregar imagem: ' + uploadError.message)
      return null
    }

    const { data } = supabase.storage
      .from('thumbnails')
      .getPublicUrl(filePath)

    return data.publicUrl
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
    toggleFavorite
  }
}
