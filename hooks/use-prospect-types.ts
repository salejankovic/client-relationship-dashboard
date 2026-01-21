import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import type { ProspectType } from "@/lib/types"

export function useProspectTypes() {
  const [prospectTypes, setProspectTypes] = useState<ProspectType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchProspectTypes = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("prospect_types")
        .select("*")
        .order("name", { ascending: true })

      if (error) throw error

      const types: ProspectType[] = (data || []).map((row: any) => row.name as ProspectType)
      setProspectTypes(types)
      setError(null)
    } catch (err) {
      setError(err as Error)
      console.error("Error fetching prospect types:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProspectTypes()

    // Subscribe to real-time changes
    const subscription = supabase
      .channel("prospect-types-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "prospect_types" }, () => {
        fetchProspectTypes()
      })
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const addProspectType = async (typeName: string) => {
    try {
      // Optimistic update
      setProspectTypes((prev) => [...prev, typeName as ProspectType])

      const { error } = await supabase.from("prospect_types").insert({
        name: typeName,
      })

      if (error) {
        // Rollback on error
        await fetchProspectTypes()
        throw error
      }
      // Real-time subscription will handle the refresh
    } catch (err) {
      console.error("Error adding prospect type:", err)
      throw err
    }
  }

  const deleteProspectType = async (typeName: string) => {
    try {
      // Optimistic update
      setProspectTypes((prev) => prev.filter((t) => t !== typeName))

      const { error } = await supabase.from("prospect_types").delete().eq("name", typeName)

      if (error) {
        // Rollback on error
        await fetchProspectTypes()
        throw error
      }
      // Real-time subscription will handle the refresh
    } catch (err) {
      console.error("Error deleting prospect type:", err)
      throw err
    }
  }

  return {
    prospectTypes,
    loading,
    error,
    addProspectType,
    deleteProspectType,
    refetch: fetchProspectTypes,
  }
}
