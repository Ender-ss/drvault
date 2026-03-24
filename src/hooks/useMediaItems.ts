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
    
    const { data, error } = await supabase
      .from('media_items')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching media items:', error)
      return
    }

    if (data && data.length > 0) {
      // Map database snake_case to frontend camelCase
      const mappedItems: MediaItem[] = data.map(item => ({
        id: item.id,
        title: item.title,
        thumbUrl: item.thumb_url,
        driveLink: item.drive_link,
        tags: item.tags || [],
        niche: item.niche,
        category: item.category,
        brollType: item.broll_type,
        isFavorite: item.is_favorite
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
    if (!user) return
    const { error } = await supabase
      .from('media_items')
      .insert([{
        title: item.title,
        thumb_url: item.thumbUrl,
        drive_link: item.driveLink,
        niche: item.niche,
        tags: item.tags,
        category: item.category,
        broll_type: item.brollType,
        is_favorite: item.isFavorite,
        user_id: user.id
      }])

    if (error) {
      console.error('Error adding item:', error)
      alert('Erro ao salvar no banco de dados. Verifique se as tabelas foram criadas: ' + error.message)
    } else {
      fetchItems()
    }
  }

  const updateMediaItem = async (item: MediaItem) => {
    if (!user) return
    const { error } = await supabase
      .from('media_items')
      .update({
        title: item.title,
        thumb_url: item.thumbUrl,
        drive_link: item.driveLink,
        niche: item.niche,
        tags: item.tags,
        category: item.category,
        broll_type: item.brollType,
        is_favorite: item.isFavorite
      })
      .eq('id', item.id)
      .eq('user_id', user.id)

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
      .eq('user_id', user.id)

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
    if (updates.isFavorite !== undefined) dbUpdates.is_favorite = updates.isFavorite

    const { error } = await supabase
      .from('media_items')
      .update(dbUpdates)
      .in('id', ids)
      .eq('user_id', user.id)

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

  return { mediaItems, isLoaded, addMediaItem, updateMediaItem, deleteMediaItem, batchUpdateMediaItems, batchDeleteMediaItems }
}
