export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      clients: {
        Row: {
          id: string
          name: string
          logo_url: string | null
          category: "Media" | "Sport"
          status: "active" | "pending" | "inactive"
          products: string[]
          website: string | null
          next_action: string | null
          next_action_date: string | null
          assigned_to: string | null
          notes: string | null
          contacts: Json
          todos: Json
          activity: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          logo_url?: string | null
          category: "Media" | "Sport"
          status?: "active" | "pending" | "inactive"
          products?: string[]
          website?: string | null
          next_action?: string | null
          next_action_date?: string | null
          assigned_to?: string | null
          notes?: string | null
          contacts?: Json
          todos?: Json
          activity?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          logo_url?: string | null
          category?: "Media" | "Sport"
          status?: "active" | "pending" | "inactive"
          products?: string[]
          website?: string | null
          next_action?: string | null
          next_action_date?: string | null
          assigned_to?: string | null
          notes?: string | null
          contacts?: Json
          todos?: Json
          activity?: Json
          created_at?: string
          updated_at?: string
        }
      }
      products: {
        Row: {
          id: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
        }
      }
      team_members: {
        Row: {
          id: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
        }
      }
    }
  }
}
