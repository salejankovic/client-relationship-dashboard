import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import type { Product } from "@/lib/types"

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase.from("products").select("*").order("name", { ascending: true })

      if (error) throw error

      setProducts((data || []).map((row: any) => row.name as Product))
      setError(null)
    } catch (err) {
      setError(err as Error)
      console.error("Error fetching products:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()

    // Subscribe to real-time changes
    const subscription = supabase
      .channel("products-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, () => {
        fetchProducts()
      })
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const addProduct = async (productName: string) => {
    try {
      const { error } = await supabase.from("products").insert({ name: productName })

      if (error) throw error
      await fetchProducts()
    } catch (err) {
      console.error("Error adding product:", err)
      throw err
    }
  }

  const deleteProduct = async (productName: string) => {
    try {
      const { error } = await supabase.from("products").delete().eq("name", productName)

      if (error) throw error
      await fetchProducts()
    } catch (err) {
      console.error("Error deleting product:", err)
      throw err
    }
  }

  return {
    products,
    loading,
    error,
    addProduct,
    deleteProduct,
    refetch: fetchProducts,
  }
}
