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
      setMediaItems(data)
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
      .insert([{ ...item, user_id: user.id }])

    if (error) console.error('Error adding item:', error)
    else fetchItems()
  }

  const updateMediaItem = async (item: MediaItem) => {
    if (!user) return
    const { error } = await supabase
      .from('media_items')
      .update(item)
      .eq('id', item.id)

    if (error) console.error('Error updating item:', error)
    else fetchItems()
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
    const { error } = await supabase
      .from('media_items')
      .update(updates)
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

  return { mediaItems, isLoaded, addMediaItem, updateMediaItem, deleteMediaItem, batchUpdateMediaItems, batchDeleteMediaItems }
}
