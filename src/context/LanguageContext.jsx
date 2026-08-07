import { createContext, useCallback, useContext, useLayoutEffect, useMemo, useState } from 'react'

const LANGUAGE_STORAGE_KEY = 'ibn-al-zumar-language'
const LanguageContext = createContext(null)

function getInitialLanguage() {
  if (typeof window === 'undefined') return 'ar'
  const storedLanguage = window.localStorage.getItem(LANGUAGE_STORAGE_KEY)
  return storedLanguage === 'en' ? 'en' : 'ar'
}

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(getInitialLanguage)

  useLayoutEffect(() => {
    const root = document.documentElement
    root.lang = language
    root.dir = language === 'en' ? 'ltr' : 'rtl'
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language)
  }, [language])

  const toggleLanguage = useCallback(() => {
    setLanguage((current) => (current === 'ar' ? 'en' : 'ar'))
  }, [])

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      toggleLanguage,
      direction: language === 'en' ? 'ltr' : 'rtl',
      isArabic: language === 'ar',
    }),
    [language, toggleLanguage]
  )

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used within a <LanguageProvider>')
  return ctx
}