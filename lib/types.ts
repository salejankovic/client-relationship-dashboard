export type ClientCategory = "Media" | "Sport"
export type ClientStatus = "active" | "pending" | "inactive"
export type Product = "Pchella" | "TTS" | "Litteraworks" | "Mobile App" | "e-Kiosk" | "Komentari" | "CMS"

export interface ProductConfig {
  name: Product
  bgColor: string
  textColor: string
}

export interface Contact {
  id: string
  name: string
  email: string
  role?: string
}

export interface TodoItem {
  id: string
  text: string
  completed: boolean
}

export interface ActivityLog {
  id: string
  comment: string
  date: string
}

export interface Client {
  id: string
  name: string
  logoUrl?: string
  category: ClientCategory
  status: ClientStatus
  products: Product[]
  website?: string
  city?: string
  country?: string
  nextAction?: string
  nextActionDate?: string
  contacts: Contact[]
  assignedTo?: string
  todos: TodoItem[]
  notes?: string
  upsellStrategy?: Product[]
  activity: ActivityLog[]
}
