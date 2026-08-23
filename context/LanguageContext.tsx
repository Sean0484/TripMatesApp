import React, { createContext, useContext, useState } from 'react'
import { Language } from '../lib/i18n'

const LanguageContext = createContext<{
  language: Language
  setLanguage: (lang: Language) => void
}>({ language: 'en', setLanguage: () => {} })

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>('en')
  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  )
}

export const useLanguage = () => useContext(LanguageContext)
