import { useState, useEffect } from 'react'
import { mockCopies, type Copy } from '../data/mock'
import { type Annotation } from '../components/editor/ScriptEditor'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

export interface Hook {
  id: string
  label: string       // e.g. "HK01"
  status: string      // e.g. "Validado", "Escala", "Teste"
  text: string
  textEN?: string     // Translated text
}

export interface AdContent {
  id: string
  title: string
  script: string
  scriptEN?: string
  decisionMaking?: string
  format?: string
  videoStyle?: string
  reference?: string
  briefing: string
  briefingEN?: string
  hooks: Hook[]
  annotations: Annotation[]
  avatarUrl: string
  avatarTitle: string
  avatarLink: string
}

export interface ExtendedCopy extends Copy {
  ads: AdContent[]
  // Legacy root-level properties for migrating old copies
  script?: string
  scriptEN?: string
  annotations?: Annotation[]
  briefing?: string
  briefingEN?: string
  hooks?: Hook[]
  avatarUrl?: string
  avatarTitle?: string
  avatarLink?: string
}

export function useCopies() {
  const { user } = useAuth()
  const [copies, setCopies] = useState<ExtendedCopy[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  const fetchCopies = async () => {
    if (!user) return
    setIsLoaded(false)
    
    const { data, error } = await supabase
      .from('copies')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching copies:', error)
      return
    }

    if (data && data.length > 0) {
      // Map Supabase rows back to ExtendedCopy
      const mappedCopies = data.map(row => ({
        ...row.data,
        id: row.id,
        user_id: row.user_id,
        title: row.title,
        niche: row.niche,
        status: row.status
      }))
      setCopies(mappedCopies as ExtendedCopy[])
    } else {
      setCopies(mockCopies as ExtendedCopy[])
    }
    setIsLoaded(true)
  }

  useEffect(() => {
    fetchCopies()
  }, [user])

  const addCopy = async (copy: ExtendedCopy) => {
    if (!user) return
    const { error } = await supabase
      .from('copies')
      .insert([{
        title: copy.title,
        niche: copy.niche,
        status: copy.status,
        user_id: user.id,
        data: copy
      }])

    if (error) console.error('Error adding copy:', error)
    else fetchCopies()
  }

  const updateCopy = async (id: string, updates: Partial<ExtendedCopy>) => {
    if (!user) return
    
    // Get current copy to merge updates
    const currentCopy = copies.find(c => c.id === id)
    if (!currentCopy) return

    const updatedCopy = { ...currentCopy, ...updates }

    const { error } = await supabase
      .from('copies')
      .update({
        title: updatedCopy.title,
        niche: updatedCopy.niche,
        status: updatedCopy.status,
        data: updatedCopy
      })
      .eq('id', id)

    if (error) console.error('Error updating copy:', error)
    else fetchCopies()
  }

  const deleteCopy = async (id: string) => {
    if (!user) return
    const { error } = await supabase
      .from('copies')
      .delete()
      .eq('id', id)

    if (error) console.error('Error deleting copy:', error)
    else fetchCopies()
  }

  return { copies, isLoaded, addCopy, updateCopy, deleteCopy }
}
