import { createContext, useContext, useReducer, useEffect } from 'react'
import { CUSTOM_SURCHARGE, customPricing } from '../data/products.js'

const CartContext = createContext()

const initialState = { items: [] }

function cartReducer(state, action) {
  switch (action.type) {
    case 'ADD_ITEM': {
      const { product, size, color, quantity, customDesign, placement } = action.payload
      const key = `${product.id}-${size}-${color.name}${customDesign ? '-custom' : ''}`
      const existing = state.items.find((i) => i.key === key)
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.key === key ? { ...i, quantity: i.quantity + quantity } : i
          ),
        }
      }
      return {
        items: [
          ...state.items,
          { key, product, size, color, quantity, customDesign, placement },
        ],
      }
    }
    case 'REMOVE_ITEM':
      return { items: state.items.filter((i) => i.key !== action.payload) }
    case 'UPDATE_QTY':
      return {
        items: state.items.map((i) =>
          i.key === action.payload.key
            ? { ...i, quantity: Math.max(1, action.payload.quantity) }
            : i
        ),
      }
    case 'CLEAR':
      return { items: [] }
    default:
      return state
  }
}

export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(cartReducer, initialState, (init) => {
    try {
      const saved = localStorage.getItem('one-layer-cart')
      return saved ? JSON.parse(saved) : init
    } catch {
      return init
    }
  })

  useEffect(() => {
    localStorage.setItem('one-layer-cart', JSON.stringify(state))
  }, [state])

  const addItem = (payload) => dispatch({ type: 'ADD_ITEM', payload })
  const removeItem = (key) => dispatch({ type: 'REMOVE_ITEM', payload: key })
  const updateQty = (key, quantity) =>
    dispatch({ type: 'UPDATE_QTY', payload: { key, quantity } })
  const clearCart = () => dispatch({ type: 'CLEAR' })

  const itemCount = state.items.reduce((sum, i) => sum + i.quantity, 0)
  const subtotal = state.items.reduce((sum, i) => {
    const basePrice = i.customDesign
      ? customPricing[i.size] + CUSTOM_SURCHARGE // custom price + surcharge
      : i.product.pricing[i.size]
    return sum + basePrice * i.quantity
  }, 0)

  return (
    <CartContext.Provider
      value={{ items: state.items, addItem, removeItem, updateQty, clearCart, itemCount, subtotal }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  return useContext(CartContext)
}
