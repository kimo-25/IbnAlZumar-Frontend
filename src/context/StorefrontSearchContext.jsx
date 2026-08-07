import { createContext, useContext, useMemo, useState } from 'react'

const StorefrontSearchContext = createContext(null)

export function StorefrontSearchProvider({ children }) {
  const [searchInput, setSearchInput] = useState('')

  const value = useMemo(
    () => ({
      searchInput,
      setSearchInput,
    }),
    [searchInput]
  )

  return <StorefrontSearchContext.Provider value={value}>{children}</StorefrontSearchContext.Provider>
}

export function useStorefrontSearch() {
  const ctx = useContext(StorefrontSearchContext)
  if (!ctx) throw new Error('useStorefrontSearch must be used within a <StorefrontSearchProvider>')
  return ctx
}