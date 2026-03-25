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
    if (!user) {
      console.log('useCopies: No user found, skipping fetch.')
      return
    }
    
    setIsLoaded(false)
    console.log('useCopies: Starting fetch for user', user.id)
    
    try {
      const { data, error } = await supabase
        .from('copies')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('useCopies: Supabase error:', error)
        setCopies(mockCopies as ExtendedCopy[])
        return
      }

      if (data && data.length > 0) {
        console.log('useCopies: Fetched', data.length, 'copies')
        const mappedCopies = data.map(row => {
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
        console.log('useCopies: No copies found in DB, using mocks')
        setCopies(mockCopies as ExtendedCopy[])
      }
    } catch (err) {
      console.error('useCopies: Unexpected crash during fetch:', err)
      setCopies(mockCopies as ExtendedCopy[])
    } finally {
      setIsLoaded(true)
      console.log('useCopies: Fetch finished, isLoaded set to true')
    }
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

  return { copies, isLoaded, setIsLoaded, addCopy, updateCopy, deleteCopy, fetchCopies }
}
