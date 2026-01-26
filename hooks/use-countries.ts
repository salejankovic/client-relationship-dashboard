import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import type { Country } from "@/lib/types"

// Convert 2-letter country code to flag emoji
export function countryCodeToFlag(code: string): string {
  if (!code) return ""
  // If it's already an emoji (starts with high unicode), return as-is
  if (code.codePointAt(0)! > 127) return code
  // If it's a 2-letter code, convert to flag emoji
  if (code.length === 2 && /^[a-zA-Z]{2}$/.test(code)) {
    const upper = code.toUpperCase()
    const codePoints = [...upper].map(char => 0x1F1E6 + char.charCodeAt(0) - 65)
    return String.fromCodePoint(...codePoints)
  }
  return code
}

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
        flagEmoji: row.flag_emoji ? countryCodeToFlag(row.flag_emoji) : undefined,
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
