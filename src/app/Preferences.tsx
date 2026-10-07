import { createContext, useContext, useLayoutEffect, useState } from 'react'
import type { ReactNode } from 'react'

export const fontOptions = [
  { value: 'small', label: '小' },
  { value: 'medium', label: '中' },
  { value: 'large', label: '大' },
] as const
export type FontSize = (typeof fontOptions)[number]['value']
const storageKey = 'travelpilot.font-size'
const isFontSize = (value: unknown): value is FontSize =>
  fontOptions.some((option) => option.value === value)

function readFontSize(): FontSize {
  try {
    const value = localStorage.getItem(storageKey)
    return isFontSize(value) ? value : 'medium'
  } catch {
    return 'medium'
  }
}

const PreferencesContext = createContext<{
  fontSize: FontSize
  setFontSize: (size: FontSize) => void
  persistenceUnavailable: boolean
} | null>(null)

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [fontSize, updateFontSize] = useState(readFontSize)
  const [persistenceUnavailable, setPersistenceUnavailable] = useState(false)

  useLayoutEffect(() => {
    document.documentElement.dataset.fontSize = fontSize
  }, [fontSize])

  function setFontSize(size: FontSize) {
    updateFontSize(size)
    try {
      localStorage.setItem(storageKey, size)
      setPersistenceUnavailable(false)
    } catch {
      // The preference still works for this session when storage is blocked.
      setPersistenceUnavailable(true)
    }
  }

  return (
    <PreferencesContext.Provider value={{ fontSize, setFontSize, persistenceUnavailable }}>
      {children}
    </PreferencesContext.Provider>
  )
}

export function usePreferences() {
  const context = useContext(PreferencesContext)
  if (!context) throw new Error('PreferencesProvider is required')
  return context
}
