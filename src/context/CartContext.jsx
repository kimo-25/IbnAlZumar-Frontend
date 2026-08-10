// File: src/context/CartContext.jsx
import { createContext, useCallback, useContext, useMemo, useState } from 'react'

const CartContext = createContext(null)

export function CartProvider({ children }) {
  const [items, setItems] = useState([])
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [toastMessage, setToastMessage] = useState(null)

  // دالة لإظهار التنبيه لفترة قصيرة
  const showNotification = (message) => {
    setToastMessage(message)
    setTimeout(() => {
      setToastMessage(null)
    }, 3000) // تختفي بعد 3 ثواني
  }

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
    
    // إظهار رسالة التنبيه في أعلى اليسار تلقائياً
    showNotification('تم إضافة المنتج إلى السلة بنجاح')
  }, [])

  const removeItem = useCallback((productId) => {
    setItems((current) => current.filter((item) => item.id !== productId))
    showNotification('تم إزالة المنتج من السلة')
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

  return (
    <CartContext.Provider value={value}>
      {children}
      
      {/* Toast Notification Component (Top Left) */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: '20px',
          left: '20px',
          zIndex: 9999,
          backgroundColor: '#10b981',
          color: '#ffffff',
          padding: '12px 20px',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          fontWeight: '500',
          direction: 'rtl',
          animation: 'fadeInOut 0.3s ease-in-out'
        }}>
          {toastMessage}
        </div>
      )}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within a <CartProvider>')
  return ctx
}