import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import type { Prospect, ProspectComment } from "@/lib/types"

export function useProspects() {
  const [prospects, setProspects] = useState<Prospect[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  // Fetch prospects from Supabase
  const fetchProspects = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("prospects")
        .select("*")
        .order("company", { ascending: true })

      if (error) throw error

      // Transform database format to Prospect format
      const transformedProspects: Prospect[] = (data || []).map((row: any) => ({
        id: row.id,
        company: row.company,
        contactPerson: row.contact_person || undefined,
        contactPosition: row.contact_position || undefined,
        contactLinkedinUrl: row.contact_linkedin_url || undefined,
        email: row.email || undefined,
        telephone: row.telephone || undefined,
        website: row.website || undefined,
        linkedinUrl: row.linkedin_url || undefined,
        productType: row.product_type || undefined,
        prospectType: row.prospect_type || undefined,
        country: row.country || undefined,
        status: row.status,
        owner: row.owner || undefined,
        source: row.source || undefined,
        dealValue: row.deal_value || undefined,
        nextAction: row.next_action || undefined,
        nextActionDate: row.next_action_date || undefined,
        lastContactDate: row.last_contact_date || undefined,
        daysSinceContact: row.days_since_contact || undefined,
        archived: row.archived || false,
        archivedDate: row.archived_date || undefined,
        archiveReason: row.archive_reason || undefined,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }))

      setProspects(transformedProspects)
      setError(null)
    } catch (err) {
      setError(err as Error)
      console.error("Error fetching prospects:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProspects()

    // Subscribe to real-time changes
    const subscription = supabase
      .channel("prospects-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "prospects" }, () => {
        fetchProspects()
      })
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // Add prospect
  const addProspect = async (prospect: Prospect) => {
    try {
      // Optimistic update - add to local state immediately
      setProspects((prevProspects) => [...prevProspects, prospect])

      const { data, error } = await supabase.from("prospects").insert([{
        id: prospect.id,
        company: prospect.company,
        contact_person: prospect.contactPerson,
        contact_position: prospect.contactPosition,
        contact_linkedin_url: prospect.contactLinkedinUrl,
        email: prospect.email,
        telephone: prospect.telephone,
        website: prospect.website,
        linkedin_url: prospect.linkedinUrl,
        product_type: prospect.productType,
        prospect_type: prospect.prospectType,
        country: prospect.country,
        status: prospect.status,
        owner: prospect.owner,
        source: prospect.source,
        deal_value: prospect.dealValue,
        next_action: prospect.nextAction,
        next_action_date: prospect.nextActionDate,
        last_contact_date: prospect.lastContactDate,
        archived: prospect.archived || false,
        archived_date: prospect.archivedDate,
        archive_reason: prospect.archiveReason,
      }])

      if (error) {
        console.error("Supabase error details:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        })
        // Rollback optimistic update on error
        await fetchProspects()
        throw error
      }

      console.log('Prospect inserted successfully, data:', data)
      // Real-time subscription will handle the refresh automatically
    } catch (err) {
      console.error("Error adding prospect:", err)
      throw err
    }
  }

  // Update prospect
  const updateProspect = async (prospect: Prospect) => {
    try {
      // Optimistic update - update local state immediately
      setProspects((prevProspects) =>
        prevProspects.map((p) => (p.id === prospect.id ? prospect : p))
      )

      const { error } = await supabase
        .from("prospects")
        .update({
          company: prospect.company,
          contact_person: prospect.contactPerson || null,
          contact_position: prospect.contactPosition || null,
          contact_linkedin_url: prospect.contactLinkedinUrl || null,
          email: prospect.email || null,
          telephone: prospect.telephone || null,
          website: prospect.website || null,
          linkedin_url: prospect.linkedinUrl || null,
          product_type: prospect.productType || null,
          prospect_type: prospect.prospectType || null,
          country: prospect.country || null,
          status: prospect.status,
          owner: prospect.owner || null,
          source: prospect.source || null,
          deal_value: prospect.dealValue || null,
          next_action: prospect.nextAction || null,
          next_action_date: prospect.nextActionDate || null,
          last_contact_date: prospect.lastContactDate || null,
          archived: prospect.archived,
          archived_date: prospect.archivedDate || null,
          archive_reason: prospect.archiveReason || null,
        })
        .eq("id", prospect.id)

      if (error) {
        // Rollback optimistic update on error
        await fetchProspects()
        throw error
      }
      // Real-time subscription will handle the refresh automatically
    } catch (err) {
      console.error("Error updating prospect:", err)
      throw err
    }
  }

  // Delete prospect
  const deleteProspect = async (prospectId: string) => {
    try {
      // Optimistic update - remove from local state immediately
      setProspects((prevProspects) => prevProspects.filter((p) => p.id !== prospectId))

      const { error } = await supabase.from("prospects").delete().eq("id", prospectId)

      if (error) {
        // Rollback optimistic update on error
        await fetchProspects()
        throw error
      }
      // Real-time subscription will handle the refresh automatically
    } catch (err) {
      console.error("Error deleting prospect:", err)
      throw err
    }
  }

  // Archive prospect
  const archiveProspect = async (prospectId: string, reason: string) => {
    try {
      const prospect = prospects.find((p) => p.id === prospectId)
      if (!prospect) return

      const archivedProspect = {
        ...prospect,
        archived: true,
        archivedDate: new Date().toISOString(),
        archiveReason: reason,
      }

      await updateProspect(archivedProspect)
    } catch (err) {
      console.error("Error archiving prospect:", err)
      throw err
    }
  }

  // Unarchive prospect
  const unarchiveProspect = async (prospectId: string) => {
    try {
      const prospect = prospects.find((p) => p.id === prospectId)
      if (!prospect) return

      const unarchivedProspect = {
        ...prospect,
        archived: false,
        archivedDate: undefined,
        archiveReason: undefined,
      }

      await updateProspect(unarchivedProspect)
    } catch (err) {
      console.error("Error unarchiving prospect:", err)
      throw err
    }
  }

  return {
    prospects,
    loading,
    error,
    addProspect,
    updateProspect,
    deleteProspect,
    archiveProspect,
    unarchiveProspect,
    refetch: fetchProspects,
  }
}

// Hook for prospect comments (activity timeline)
export function useProspectComments(prospectId: string) {
  const [comments, setComments] = useState<ProspectComment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchComments = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("prospect_comments")
        .select("*")
        .eq("prospect_id", prospectId)
        .order("created_at", { ascending: false })

      if (error) throw error

      const transformedComments: ProspectComment[] = (data || []).map((row: any) => ({
        id: row.id,
        prospectId: row.prospect_id,
        comment: row.comment,
        author: row.author || undefined,
        createdAt: row.created_at,
      }))

      setComments(transformedComments)
      setError(null)
    } catch (err) {
      setError(err as Error)
      console.error("Error fetching comments:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (prospectId) {
      fetchComments()

      // Subscribe to real-time changes
      const subscription = supabase
        .channel(`comments-${prospectId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "prospect_comments",
            filter: `prospect_id=eq.${prospectId}`,
          },
          () => {
            fetchComments()
          }
        )
        .subscribe()

      return () => {
        subscription.unsubscribe()
      }
    }
  }, [prospectId])

  const addComment = async (comment: string, author?: string) => {
    try {
      const newComment: ProspectComment = {
        id: `comment-${Date.now()}`,
        prospectId,
        comment,
        author,
        createdAt: new Date().toISOString(),
      }

      // Optimistic update
      setComments((prev) => [newComment, ...prev])

      const { error } = await supabase.from("prospect_comments").insert([{
        id: newComment.id,
        prospect_id: newComment.prospectId,
        comment: newComment.comment,
        author: newComment.author,
      }])

      if (error) {
        await fetchComments()
        throw error
      }
    } catch (err) {
      console.error("Error adding comment:", err)
      throw err
    }
  }

  const deleteComment = async (commentId: string) => {
    try {
      // Optimistic update
      setComments((prev) => prev.filter((c) => c.id !== commentId))

      const { error } = await supabase.from("prospect_comments").delete().eq("id", commentId)

      if (error) {
        await fetchComments()
        throw error
      }
    } catch (err) {
      console.error("Error deleting comment:", err)
      throw err
    }
  }

  return {
    comments,
    loading,
    error,
    addComment,
    deleteComment,
    refetch: fetchComments,
  }
}
