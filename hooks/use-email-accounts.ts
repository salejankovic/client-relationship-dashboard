import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

export interface EmailAccount {
  id: string
  accountName: string
  emailAddress: string
  imapHost: string
  imapPort: number
  imapUsername: string
  imapPassword: string
  useSsl: boolean
  isActive: boolean
  lastSyncAt: string | null
  lastSyncStatus: string | null
  lastSyncError: string | null
  createdAt: string
  updatedAt: string
}

export function useEmailAccounts() {
  const [accounts, setAccounts] = useState<EmailAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchAccounts = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("email_accounts")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) throw error

      const mapped: EmailAccount[] = (data || []).map((row: any) => ({
        id: row.id,
        accountName: row.account_name,
        emailAddress: row.email_address,
        imapHost: row.imap_host,
        imapPort: row.imap_port,
        imapUsername: row.imap_username,
        imapPassword: row.imap_password,
        useSsl: row.use_ssl,
        isActive: row.is_active,
        lastSyncAt: row.last_sync_at,
        lastSyncStatus: row.last_sync_status,
        lastSyncError: row.last_sync_error,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }))

      setAccounts(mapped)
      setError(null)
    } catch (err) {
      setError(err as Error)
      console.error("Error fetching email accounts:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAccounts()

    // Subscribe to real-time changes
    const subscription = supabase
      .channel("email-accounts-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "email_accounts" }, () => {
        fetchAccounts()
      })
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const addAccount = async (account: Omit<EmailAccount, "id" | "lastSyncAt" | "lastSyncStatus" | "lastSyncError" | "createdAt" | "updatedAt">) => {
    try {
      const { error } = await supabase.from("email_accounts").insert({
        account_name: account.accountName,
        email_address: account.emailAddress,
        imap_host: account.imapHost,
        imap_port: account.imapPort,
        imap_username: account.imapUsername,
        imap_password: account.imapPassword,
        use_ssl: account.useSsl,
        is_active: account.isActive,
      })

      if (error) throw error

      // Real-time subscription will handle the refresh
    } catch (err) {
      console.error("Error adding email account:", err)
      throw err
    }
  }

  const updateAccount = async (id: string, updates: Partial<Omit<EmailAccount, "id" | "createdAt" | "updatedAt">>) => {
    try {
      const dbUpdates: any = {}
      if (updates.accountName !== undefined) dbUpdates.account_name = updates.accountName
      if (updates.emailAddress !== undefined) dbUpdates.email_address = updates.emailAddress
      if (updates.imapHost !== undefined) dbUpdates.imap_host = updates.imapHost
      if (updates.imapPort !== undefined) dbUpdates.imap_port = updates.imapPort
      if (updates.imapUsername !== undefined) dbUpdates.imap_username = updates.imapUsername
      if (updates.imapPassword !== undefined) dbUpdates.imap_password = updates.imapPassword
      if (updates.useSsl !== undefined) dbUpdates.use_ssl = updates.useSsl
      if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive

      const { error } = await supabase
        .from("email_accounts")
        .update(dbUpdates)
        .eq("id", id)

      if (error) throw error

      // Real-time subscription will handle the refresh
    } catch (err) {
      console.error("Error updating email account:", err)
      throw err
    }
  }

  const deleteAccount = async (id: string) => {
    try {
      const { error } = await supabase
        .from("email_accounts")
        .delete()
        .eq("id", id)

      if (error) throw error

      // Real-time subscription will handle the refresh
    } catch (err) {
      console.error("Error deleting email account:", err)
      throw err
    }
  }

  const testConnection = async (account: Omit<EmailAccount, "id" | "lastSyncAt" | "lastSyncStatus" | "lastSyncError" | "createdAt" | "updatedAt">) => {
    try {
      const response = await fetch("/api/imap/test-connection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imapHost: account.imapHost,
          imapPort: account.imapPort,
          imapUsername: account.imapUsername,
          imapPassword: account.imapPassword,
          useSsl: account.useSsl,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Connection test failed")
      }

      return { success: true, message: data.message }
    } catch (err) {
      console.error("Error testing connection:", err)
      throw err
    }
  }

  return {
    accounts,
    loading,
    error,
    addAccount,
    updateAccount,
    deleteAccount,
    testConnection,
    refetch: fetchAccounts,
  }
}
