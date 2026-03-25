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
    // We still check for user to ensure they are logged in, but we don't filter by user.id
    if (!user) return
    setIsLoaded(false)
    
    const { data, error } = await supabase
      .from('copies')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching copies:', error)
      setCopies(mockCopies as ExtendedCopy[]) // Fallback to mocks on error to prevent crash
      setIsLoaded(true)
      return
    }

    if (data && data.length > 0) {
      // Map Supabase rows back to ExtendedCopy
      const mappedCopies = data.map(row => {
        // Ensure row.data is an object we can spread
        const rowData = row.data && typeof row.data === 'object' ? row.data : {}
        return {
          ...rowData,
          id: row.id,
          user_id: row.user_id,
          title: row.title,
          niche: row.category || row.niche || (rowData as any).niche, 
          status: row.status
        }
      })
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
    if (!user) return null
    
    // Create payload WITHOUT 'id' so Supabase generates a UUID
    const payload = {
      title: copy.title,
      category: copy.niche, 
      status: copy.status,
      user_id: user.id, // We still keep track of who created it
      data: copy
    }

    const { data, error } = await supabase
      .from('copies')
      .insert([payload])
      .select()

    if (error) {
      console.error('Error adding copy:', error)
      alert('Erro ao criar copy: ' + error.message)
      return null
    } else {
      await fetchCopies()
      return data?.[0] as ExtendedCopy
    }
  }

  const updateCopy = async (id: string, updates: Partial<ExtendedCopy>) => {
    if (!user) return

    if (id.length < 10) { 
      alert('Este é um item de exemplo e não pode ser editado no banco de dados. Crie um novo primeiro!')
      return
    }
    
    const currentCopy = copies.find(c => c.id === id)
    if (!currentCopy) return

    const updatedCopy = { ...currentCopy, ...updates }

    const { error } = await supabase
      .from('copies')
      .update({
        title: updatedCopy.title,
        category: updatedCopy.niche,
        status: updatedCopy.status,
        data: updatedCopy
      })
      .eq('id', id)
      // .eq('user_id', user.id) // REMOVED: allow anyone to update any copy

    if (error) {
      console.error('Error updating copy:', error)
      alert('Erro ao atualizar copy: ' + error.message)
    } else {
      fetchCopies()
    }
  }

  const deleteCopy = async (id: string) => {
    if (!user) return
    const { error } = await supabase
      .from('copies')
      .delete()
      .eq('id', id)
      // .eq('user_id', user.id) // REMOVED: allow anyone to delete any copy

    if (error) {
      console.error('Error deleting copy:', error)
      alert('Erro ao excluir copy: ' + (error as any).message)
    } else {
      fetchCopies()
    }
  }

  return { copies, isLoaded, addCopy, updateCopy, deleteCopy, fetchCopies }
}
