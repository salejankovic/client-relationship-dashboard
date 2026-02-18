import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

export interface EmailLanguageConfig {
  id: string
  name: string
  promptInstruction: string
}

export function useEmailLanguages() {
  const [languages, setLanguages] = useState<EmailLanguageConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchLanguages = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("email_languages")
        .select("*")
        .order("name", { ascending: true })

      if (error) throw error

      const mapped: EmailLanguageConfig[] = (data || []).map((row: any) => ({
        id: row.id,
        name: row.name,
        promptInstruction: row.prompt_instruction,
      }))
      setLanguages(mapped)
      setError(null)
    } catch (err) {
      setError(err as Error)
      console.error("Error fetching email languages:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLanguages()

    const subscription = supabase
      .channel("email-languages-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "email_languages" }, () => {
        fetchLanguages()
      })
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const addLanguage = async (name: string, promptInstruction: string) => {
    const id = name.toLowerCase().replace(/\s+/g, "-")
    const newLang: EmailLanguageConfig = { id, name, promptInstruction }

    // Optimistic update
    setLanguages((prev) => [...prev, newLang].sort((a, b) => a.name.localeCompare(b.name)))

    const { error } = await supabase.from("email_languages").insert({
      id,
      name,
      prompt_instruction: promptInstruction,
    })

    if (error) {
      await fetchLanguages()
      throw error
    }
  }

  const deleteLanguage = async (id: string) => {
    // Optimistic update
    setLanguages((prev) => prev.filter((l) => l.id !== id))

    const { error } = await supabase.from("email_languages").delete().eq("id", id)

    if (error) {
      await fetchLanguages()
      throw error
    }
  }

  return {
    languages,
    loading,
    error,
    addLanguage,
    deleteLanguage,
    refetch: fetchLanguages,
  }
}
