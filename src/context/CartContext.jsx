// File: src/context/CartContext.jsx
import { createContext, useCallback, useContext, useMemo, useState } from 'react'

const CartContext = createContext(null)

export function CartProvider({ children }) {
  const [items, setItems] = useState([])
  const [isCartOpen, setIsCartOpen] = useState(false)

  /** product: { id, name, sku, price, imageUrl, variantId, variantLabel, selectedOptions }. Adding an item already in the cart bumps its quantity. */
  const addItem = useCallback((product, quantity = 1) => {
    setItems((current) => {
      const existing = current.find((item) => item.id === product.id)
      if (existing) {
        return current.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + quantity } : item
        )
      }
      return [...current, { ...product, quantity }]
    })
    setIsCartOpen(true)
  }, [])

  const removeItem = useCallback((productId) => {
    setItems((current) => current.filter((item) => item.id !== productId))
  }, [])

  const updateQuantity = useCallback((productId, quantity) => {
    setItems((current) => {
      if (quantity <= 0) {
        return current.filter((item) => item.id !== productId)
      }
      return current.map((item) => (item.id === productId ? { ...item, quantity } : item))
    })
  }, [])

  const clearCart = useCallback(() => setItems([]), [])

  const openCart = useCallback(() => setIsCartOpen(true), [])
  const closeCart = useCallback(() => setIsCartOpen(false), [])

  const itemCount = useMemo(() => items.reduce((sum, item) => sum + item.quantity, 0), [items])
  const subtotal = useMemo(() => items.reduce((sum, item) => sum + item.price * item.quantity, 0), [items])

  const value = useMemo(
    () => ({
      items,
      itemCount,
      subtotal,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      isCartOpen,
      openCart,
      closeCart,
    }),
    [items, itemCount, subtotal, addItem, removeItem, updateQuantity, clearCart, isCartOpen, openCart, closeCart]
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within a <CartProvider>')
  return ctx
}