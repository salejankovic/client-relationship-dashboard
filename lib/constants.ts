import type { Product } from "./types"

// All available products
export const ALL_PRODUCTS: Product[] = [
  "Mobile App",
  "Pchella",
  "TTS",
  "Litteraworks",
  "Komentari",
  "e-Kiosk",
  "CMS",
]

// Default team members
export const DEFAULT_TEAM_MEMBERS = [
  "John Smith",
  "Sarah Johnson",
  "Michael Chen",
  "Emma Williams",
]

// Product color mapping (using CSS variables defined in globals.css)
export const PRODUCT_COLORS: Record<Product, string> = {
  "Mobile App": "bg-[var(--product-mobile)] text-white",
  Pchella: "bg-[var(--product-pchella)] text-white",
  TTS: "bg-[var(--product-tts)] text-black",
  Litteraworks: "bg-[var(--product-litteraworks)] text-white",
  Komentari: "bg-[var(--product-komentari)] text-black",
  "e-Kiosk": "bg-[var(--product-ekiosk)] text-white",
  CMS: "bg-[var(--product-cms)] text-white",
}

// LocalStorage keys
export const STORAGE_KEYS = {
  CLIENTS: "appworks-clients",
  PRODUCTS: "appworks-products",
  TEAM_MEMBERS: "appworks-team-members",
} as const
