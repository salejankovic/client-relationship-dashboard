import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import type { Product, ProductConfig } from "@/lib/types"

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [productConfigs, setProductConfigs] = useState<ProductConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase.from("products").select("*").order("name", { ascending: true })

      if (error) throw error

      const configs: ProductConfig[] = (data || []).map((row: any) => ({
        name: row.name as Product,
        bgColor: row.bg_color || "#3b82f6",
        textColor: row.text_color || "#ffffff",
      }))

      setProducts(configs.map((c) => c.name))
      setProductConfigs(configs)
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

  const addProduct = async (productName: string, bgColor = "#3b82f6", textColor = "#ffffff") => {
    try {
      // Optimistic update
      const newConfig: ProductConfig = { name: productName as Product, bgColor, textColor }
      setProductConfigs((prev) => [...prev, newConfig])
      setProducts((prev) => [...prev, productName as Product])

      const { error } = await supabase.from("products").insert({
        name: productName,
        bg_color: bgColor,
        text_color: textColor,
      })

      if (error) {
        // Rollback on error
        await fetchProducts()
        throw error
      }
      // Real-time subscription will handle the refresh
    } catch (err) {
      console.error("Error adding product:", err)
      throw err
    }
  }

  const updateProductColors = async (productName: string, bgColor: string, textColor: string) => {
    try {
      // Optimistic update
      setProductConfigs((prev) =>
        prev.map((c) => (c.name === productName ? { ...c, bgColor, textColor } : c))
      )

      const { error } = await supabase
        .from("products")
        .update({
          bg_color: bgColor,
          text_color: textColor,
        })
        .eq("name", productName)

      if (error) {
        // Rollback on error
        await fetchProducts()
        throw error
      }
      // Real-time subscription will handle the refresh
    } catch (err) {
      console.error("Error updating product colors:", err)
      throw err
    }
  }

  const updateProductName = async (oldName: string, newName: string) => {
    try {
      // Optimistic update
      setProductConfigs((prev) =>
        prev.map((c) => (c.name === oldName ? { ...c, name: newName as Product } : c))
      )
      setProducts((prev) => prev.map((p) => (p === oldName ? (newName as Product) : p)))

      const { error } = await supabase
        .from("products")
        .update({ name: newName })
        .eq("name", oldName)

      if (error) {
        // Rollback on error
        await fetchProducts()
        throw error
      }
      // Real-time subscription will handle the refresh
    } catch (err) {
      console.error("Error updating product name:", err)
      throw err
    }
  }

  const deleteProduct = async (productName: string) => {
    try {
      // Optimistic update
      setProductConfigs((prev) => prev.filter((c) => c.name !== productName))
      setProducts((prev) => prev.filter((p) => p !== productName))

      const { error } = await supabase.from("products").delete().eq("name", productName)

      if (error) {
        // Rollback on error
        await fetchProducts()
        throw error
      }
      // Real-time subscription will handle the refresh
    } catch (err) {
      console.error("Error deleting product:", err)
      throw err
    }
  }

  const getProductConfig = (productName: Product): ProductConfig => {
    return (
      productConfigs.find((c) => c.name === productName) || {
        name: productName,
        bgColor: "#3b82f6",
        textColor: "#ffffff",
      }
    )
  }

  return {
    products,
    productConfigs,
    loading,
    error,
    addProduct,
    updateProductColors,
    updateProductName,
    deleteProduct,
    getProductConfig,
    refetch: fetchProducts,
  }
}
