import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

export function useTeamMembers() {
  const [teamMembers, setTeamMembers] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchTeamMembers = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase.from("team_members").select("*").order("name", { ascending: true })

      if (error) throw error

      setTeamMembers((data || []).map((row: any) => row.name))
      setError(null)
    } catch (err) {
      setError(err as Error)
      console.error("Error fetching team members:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTeamMembers()

    // Subscribe to real-time changes
    const subscription = supabase
      .channel("team-members-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "team_members" }, () => {
        fetchTeamMembers()
      })
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const addTeamMember = async (memberName: string) => {
    try {
      const { error } = await supabase.from("team_members").insert({ name: memberName })

      if (error) throw error
      await fetchTeamMembers()
    } catch (err) {
      console.error("Error adding team member:", err)
      throw err
    }
  }

  const deleteTeamMember = async (memberName: string) => {
    try {
      const { error } = await supabase.from("team_members").delete().eq("name", memberName)

      if (error) throw error
      await fetchTeamMembers()
    } catch (err) {
      console.error("Error deleting team member:", err)
      throw err
    }
  }

  return {
    teamMembers,
    loading,
    error,
    addTeamMember,
    deleteTeamMember,
    refetch: fetchTeamMembers,
  }
}
