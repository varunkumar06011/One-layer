import { useState, useEffect } from 'react'
import { getProducts, getProductById } from '../api/client.js'

// Fetch all products
export function useProducts() {
  const [products, setProducts] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    getProducts()
      .then(setProducts)
      .catch(setError)
      .finally(() => setLoading(false))
  }, [])

  return { products, loading, error }
}

// Fetch a single product by ID
export function useProduct(id) {
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    getProductById(id)
      .then(setProduct)
      .catch(setError)
      .finally(() => setLoading(false))
  }, [id])

  return { product, loading, error }
}
