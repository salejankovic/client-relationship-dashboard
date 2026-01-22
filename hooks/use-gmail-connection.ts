import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

interface GmailConnectionConfig {
  id: string
  userId: string
  provider: string
  emailAddress: string | null
  lastSyncAt: string | null
  syncEnabled: boolean
  createdAt: string
}

export function useGmailConnection() {
  const [config, setConfig] = useState<GmailConnectionConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchConfig = async () => {
    try {
      setLoading(true)
      const userId = "aleksandar" // TODO: Replace with actual user ID from auth

      const { data, error } = await supabase
        .from("email_sync_config")
        .select("*")
        .eq("user_id", userId)
        .eq("provider", "gmail")
        .single()

      if (error && error.code !== "PGRST116") {
        // PGRST116 is "not found" - not an error in this case
        throw error
      }

      if (data) {
        setConfig({
          id: data.id,
          userId: data.user_id,
          provider: data.provider,
          emailAddress: data.email_address,
          lastSyncAt: data.last_sync_at,
          syncEnabled: data.sync_enabled,
          createdAt: data.created_at,
        })
      } else {
        setConfig(null)
      }

      setError(null)
    } catch (err) {
      setError(err as Error)
      console.error("Error fetching Gmail config:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchConfig()

    // Subscribe to real-time changes
    const subscription = supabase
      .channel("gmail-config-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "email_sync_config" }, () => {
        fetchConfig()
      })
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const connectGmail = async () => {
    try {
      // Call the OAuth initiation endpoint
      const response = await fetch("/api/auth/gmail")
      const data = await response.json()

      if (data.url) {
        // Redirect to Google OAuth
        window.location.href = data.url
      } else {
        throw new Error("Failed to generate OAuth URL")
      }
    } catch (err) {
      console.error("Error connecting Gmail:", err)
      throw err
    }
  }

  const disconnectGmail = async () => {
    try {
      if (!config) return

      await supabase.from("email_sync_config").delete().eq("id", config.id)

      setConfig(null)
    } catch (err) {
      console.error("Error disconnecting Gmail:", err)
      throw err
    }
  }

  return {
    config,
    loading,
    error,
    isConnected: !!config,
    connectGmail,
    disconnectGmail,
    refetch: fetchConfig,
  }
}
