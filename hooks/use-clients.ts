import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import type { Client } from "@/lib/types"

export function useClients() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  // Fetch clients from Supabase
  const fetchClients = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .order("name", { ascending: true })

      if (error) throw error

      // Transform database format to Client format
      const transformedClients: Client[] = (data || []).map((row: any) => ({
        id: row.id,
        name: row.name,
        logoUrl: row.logo_url || undefined,
        category: row.category as "Media" | "Sport",
        status: row.status as "active" | "pending" | "inactive",
        products: row.products as any[],
        website: row.website || undefined,
        city: row.city || undefined,
        country: row.country || undefined,
        nextAction: row.next_action || undefined,
        nextActionDate: row.next_action_date || undefined,
        assignedTo: row.assigned_to || undefined,
        notes: row.notes || undefined,
        upsellStrategy: (row.upsell_strategy as any[]) || undefined,
        contacts: (row.contacts as any) || [],
        todos: (row.todos as any) || [],
        activity: (row.activity as any) || [],
      }))

      setClients(transformedClients)
      setError(null)
    } catch (err) {
      setError(err as Error)
      console.error("Error fetching clients:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchClients()

    // Subscribe to real-time changes
    const subscription = supabase
      .channel("clients-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "clients" }, () => {
        fetchClients()
      })
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // Add client
  const addClient = async (client: Client) => {
    try {
      console.log('Attempting to insert client into database:', client)
      const { data, error } = await supabase.from("clients").insert([{
        id: client.id,
        name: client.name,
        logo_url: client.logoUrl,
        category: client.category,
        status: client.status,
        products: client.products,
        website: client.website,
        city: client.city,
        country: client.country,
        next_action: client.nextAction,
        next_action_date: client.nextActionDate,
        assigned_to: client.assignedTo,
        notes: client.notes,
        upsell_strategy: client.upsellStrategy || [],
        contacts: client.contacts as any,
        todos: client.todos as any,
        activity: client.activity as any,
      }])

      if (error) {
        console.error("Supabase error details:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        })
        throw error
      }

      console.log('Client inserted successfully, data:', data)
      await fetchClients()
    } catch (err) {
      console.error("Error adding client:", err)
      throw err
    }
  }

  // Update client
  const updateClient = async (client: Client) => {
    try {
      const { error } = await supabase
        .from("clients")
        .update({
          name: client.name,
          logo_url: client.logoUrl,
          category: client.category,
          status: client.status,
          products: client.products,
          website: client.website,
          city: client.city,
          country: client.country,
          next_action: client.nextAction,
          next_action_date: client.nextActionDate,
          assigned_to: client.assignedTo,
          notes: client.notes,
          upsell_strategy: client.upsellStrategy || [],
          contacts: client.contacts as any,
          todos: client.todos as any,
          activity: client.activity as any,
        })
        .eq("id", client.id)

      if (error) throw error
      await fetchClients()
    } catch (err) {
      console.error("Error updating client:", err)
      throw err
    }
  }

  // Delete client
  const deleteClient = async (clientId: string) => {
    try {
      const { error } = await supabase.from("clients").delete().eq("id", clientId)

      if (error) throw error
      await fetchClients()
    } catch (err) {
      console.error("Error deleting client:", err)
      throw err
    }
  }

  return {
    clients,
    loading,
    error,
    addClient,
    updateClient,
    deleteClient,
    refetch: fetchClients,
  }
}
