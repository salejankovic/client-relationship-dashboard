import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import type { Communication } from "@/lib/types"

export function useCommunications(prospectId?: string) {
  const [communications, setCommunications] = useState<Communication[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchCommunications = async () => {
    if (!prospectId) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("communications")
        .select("*")
        .eq("prospect_id", prospectId)
        .order("created_at", { ascending: false })

      if (error) throw error

      const mapped: Communication[] = (data || []).map((row: any) => ({
        id: row.id,
        prospectId: row.prospect_id,
        type: row.type,
        subject: row.subject,
        content: row.content,
        direction: row.direction,
        duration: row.duration,
        attendees: row.attendees,
        author: row.author,
        createdAt: row.created_at,
        aiSummary: row.ai_summary,
      }))

      setCommunications(mapped)
      setError(null)
    } catch (err) {
      setError(err as Error)
      console.error("Error fetching communications:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (prospectId) {
      fetchCommunications()

      // Subscribe to real-time changes
      const subscription = supabase
        .channel(`communications-${prospectId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "communications",
            filter: `prospect_id=eq.${prospectId}`,
          },
          () => {
            fetchCommunications()
          }
        )
        .subscribe()

      return () => {
        subscription.unsubscribe()
      }
    }
  }, [prospectId])

  const addCommunication = async (communication: Omit<Communication, "id" | "createdAt"> & { createdAt?: string }) => {
    // Create optimistic communication object
    const optimisticId = `temp-${Date.now()}`
    const optimisticComm: Communication = {
      id: optimisticId,
      prospectId: communication.prospectId,
      type: communication.type,
      subject: communication.subject,
      content: communication.content,
      direction: communication.direction,
      duration: communication.duration,
      attendees: communication.attendees,
      author: communication.author,
      aiSummary: communication.aiSummary,
      createdAt: communication.createdAt || new Date().toISOString(),
    }

    // Optimistic update - add to local state immediately
    setCommunications((prev) => [optimisticComm, ...prev])

    try {
      const { data, error } = await supabase
        .from("communications")
        .insert({
          prospect_id: communication.prospectId,
          type: communication.type,
          subject: communication.subject,
          content: communication.content,
          direction: communication.direction,
          duration: communication.duration,
          attendees: communication.attendees,
          author: communication.author,
          ai_summary: communication.aiSummary,
          created_at: communication.createdAt, // Allow custom created_at
        })
        .select()
        .single()

      if (error) {
        // Rollback optimistic update on error
        setCommunications((prev) => prev.filter((c) => c.id !== optimisticId))
        throw error
      }

      // Replace optimistic entry with real one
      if (data) {
        setCommunications((prev) =>
          prev.map((c) =>
            c.id === optimisticId
              ? {
                  id: data.id,
                  prospectId: data.prospect_id,
                  type: data.type,
                  subject: data.subject,
                  content: data.content,
                  direction: data.direction,
                  duration: data.duration,
                  attendees: data.attendees,
                  author: data.author,
                  createdAt: data.created_at,
                  aiSummary: data.ai_summary,
                }
              : c
          )
        )
      }

      return data
    } catch (err) {
      console.error("Error adding communication:", err)
      throw err
    }
  }

  const deleteCommunication = async (communicationId: string) => {
    // Store for potential rollback
    const previousCommunications = communications

    // Optimistic update - remove from local state immediately
    setCommunications((prev) => prev.filter((c) => c.id !== communicationId))

    try {
      const { error } = await supabase
        .from("communications")
        .delete()
        .eq("id", communicationId)

      if (error) {
        // Rollback optimistic update on error
        setCommunications(previousCommunications)
        throw error
      }
    } catch (err) {
      console.error("Error deleting communication:", err)
      throw err
    }
  }

  return {
    communications,
    loading,
    error,
    addCommunication,
    deleteCommunication,
    refetch: fetchCommunications,
  }
}
