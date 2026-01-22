import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import type { Country } from "@/lib/types"

export function useCountries() {
  const [countries, setCountries] = useState<Country[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchCountries = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("countries")
        .select("*")
        .order("name", { ascending: true })

      if (error) throw error

      const transformedCountries: Country[] = (data || []).map((row: any) => ({
        id: row.id,
        name: row.name,
        flagEmoji: row.flag_emoji || undefined,
        createdAt: row.created_at,
      }))

      setCountries(transformedCountries)
      setError(null)
    } catch (err) {
      setError(err as Error)
      console.error("Error fetching countries:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCountries()

    // Subscribe to real-time changes
    const subscription = supabase
      .channel("countries-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "countries" }, () => {
        fetchCountries()
      })
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const addCountry = async (name: string, flagEmoji?: string) => {
    try {
      const id = name.toLowerCase().replace(/\s+/g, '-')
      const { error } = await supabase.from("countries").insert([{
        id,
        name,
        flag_emoji: flagEmoji,
      }])

      if (error) throw error
    } catch (err) {
      console.error("Error adding country:", err)
      throw err
    }
  }

  const deleteCountry = async (countryId: string) => {
    try {
      const { error } = await supabase.from("countries").delete().eq("id", countryId)

      if (error) throw error
    } catch (err) {
      console.error("Error deleting country:", err)
      throw err
    }
  }

  return {
    countries,
    loading,
    error,
    addCountry,
    deleteCountry,
    refetch: fetchCountries,
  }
}
