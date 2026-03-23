import { useState } from 'react'
import { mockCopies, type Copy } from '../data/mock'
import { type Annotation } from '../components/editor/ScriptEditor'

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
  const [copies, setCopies] = useState<ExtendedCopy[]>(() => {
    let baseCopies = mockCopies as ExtendedCopy[]
    const stored = localStorage.getItem('drvault_copies')
    if (stored) {
      try {
        baseCopies = JSON.parse(stored)
      } catch (e) {
        // use mockCopies
      }
    }
    
    // Migrate any copy that doesn't have an `ads` array yet
    return baseCopies.map(c => {
      if (!c.ads || c.ads.length === 0) {
        return {
          ...c,
          ads: [{
            id: `ad-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            title: 'Ad 1',
            script: c.script || '',
            scriptEN: c.scriptEN || '',
            decisionMaking: '',
            format: '',
            videoStyle: '',
            reference: '',
            briefing: c.briefing || '',
            briefingEN: c.briefingEN || '',
            hooks: c.hooks || [],
            annotations: c.annotations || [],
            avatarUrl: c.avatarUrl || '',
            avatarTitle: c.avatarTitle || '',
            avatarLink: c.avatarLink || ''
          }]
        }
      }
      return c
    })
  })
  const isLoaded = true

  const saveToStorage = (newCopies: ExtendedCopy[]) => {
    setCopies(newCopies)
    localStorage.setItem('drvault_copies', JSON.stringify(newCopies))
  }

  const addCopy = (copy: ExtendedCopy) => {
    saveToStorage([copy, ...copies])
  }

  const updateCopy = (id: string, updates: Partial<ExtendedCopy>) => {
    saveToStorage(copies.map(c => c.id === id ? { ...c, ...updates } : c))
  }

  const deleteCopy = (id: string) => {
    saveToStorage(copies.filter(c => c.id !== id))
  }

  return { copies, isLoaded, addCopy, updateCopy, deleteCopy }
}
