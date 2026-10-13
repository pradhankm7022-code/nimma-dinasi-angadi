import { createContext, useContext, useState } from 'react'

type Lang = 'en' | 'kn'

interface LangContextValue {
  lang: Lang
  toggle: () => void
}

const LangContext = createContext<LangContextValue | null>(null)

const LANG_KEY = 'nda_lang'

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>(
    () => (localStorage.getItem(LANG_KEY) as Lang) || 'kn'
  )

  function toggle() {
    setLang(l => {
      const next = l === 'kn' ? 'en' : 'kn'
      localStorage.setItem(LANG_KEY, next)
      return next
    })
  }

  return <LangContext.Provider value={{ lang, toggle }}>{children}</LangContext.Provider>
}

export function useLang() {
  const ctx = useContext(LangContext)
  if (!ctx) throw new Error('useLang must be used within LangProvider')
  return ctx
}
