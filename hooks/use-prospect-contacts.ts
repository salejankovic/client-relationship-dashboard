import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import type { ProspectContact } from "@/lib/types"

export function useProspectContacts(prospectId?: string) {
  const [contacts, setContacts] = useState<ProspectContact[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchContacts = async () => {
    if (!prospectId) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("prospect_contacts")
        .select("*")
        .eq("prospect_id", prospectId)
        .order("is_primary", { ascending: false })
        .order("created_at", { ascending: true })

      if (error) throw error

      const transformedContacts: ProspectContact[] = (data || []).map((row: any) => ({
        id: row.id,
        prospectId: row.prospect_id,
        name: row.name,
        position: row.position || undefined,
        email: row.email || undefined,
        telephone: row.telephone || undefined,
        linkedinUrl: row.linkedin_url || undefined,
        isPrimary: row.is_primary || false,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }))

      setContacts(transformedContacts)
      setError(null)
    } catch (err) {
      setError(err as Error)
      console.error("Error fetching contacts:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (prospectId) {
      fetchContacts()

      // Subscribe to real-time changes
      const subscription = supabase
        .channel(`prospect-contacts-${prospectId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "prospect_contacts",
            filter: `prospect_id=eq.${prospectId}`,
          },
          () => {
            fetchContacts()
          }
        )
        .subscribe()

      return () => {
        subscription.unsubscribe()
      }
    }
  }, [prospectId])

  const addContact = async (contact: Omit<ProspectContact, "id" | "createdAt" | "updatedAt">) => {
    try {
      const { error } = await supabase.from("prospect_contacts").insert([{
        id: `contact-${Date.now()}`,
        prospect_id: contact.prospectId,
        name: contact.name,
        position: contact.position,
        email: contact.email,
        telephone: contact.telephone,
        linkedin_url: contact.linkedinUrl,
        is_primary: contact.isPrimary,
      }])

      if (error) throw error
    } catch (err) {
      console.error("Error adding contact:", err)
      throw err
    }
  }

  const updateContact = async (contact: ProspectContact) => {
    try {
      const { error } = await supabase
        .from("prospect_contacts")
        .update({
          name: contact.name,
          position: contact.position,
          email: contact.email,
          telephone: contact.telephone,
          linkedin_url: contact.linkedinUrl,
          is_primary: contact.isPrimary,
        })
        .eq("id", contact.id)

      if (error) throw error
    } catch (err) {
      console.error("Error updating contact:", err)
      throw err
    }
  }

  const deleteContact = async (contactId: string) => {
    try {
      const { error } = await supabase.from("prospect_contacts").delete().eq("id", contactId)

      if (error) throw error
    } catch (err) {
      console.error("Error deleting contact:", err)
      throw err
    }
  }

  const setPrimaryContact = async (contactId: string) => {
    try {
      if (!prospectId) return

      // First, unset all primary contacts for this prospect
      await supabase
        .from("prospect_contacts")
        .update({ is_primary: false })
        .eq("prospect_id", prospectId)

      // Then set the new primary contact
      const { error } = await supabase
        .from("prospect_contacts")
        .update({ is_primary: true })
        .eq("id", contactId)

      if (error) throw error
    } catch (err) {
      console.error("Error setting primary contact:", err)
      throw err
    }
  }

  return {
    contacts,
    loading,
    error,
    addContact,
    updateContact,
    deleteContact,
    setPrimaryContact,
    refetch: fetchContacts,
  }
}
