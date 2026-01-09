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

// Product colors for client list (legacy, keeping for backwards compatibility)
export const getProductColor = (product: string): string => {
  switch (product) {
    case "Mobile App":
      return "bg-red-500 text-white"
    case "Litteraworks":
      return "bg-gray-700 text-white"
    case "Pchella":
      return "bg-yellow-500 text-black"
    case "TTS":
      return "bg-yellow-500 text-black"
    case "Komentari":
      return "bg-gray-700 text-white"
    case "CMS":
      return "bg-gray-700 text-white"
    case "e-Kiosk":
      return "bg-gray-700 text-white"
    default:
      return "bg-gray-500 text-white"
  }
}

// LocalStorage keys
export const STORAGE_KEYS = {
  CLIENTS: "appworks-clients",
  PRODUCTS: "appworks-products",
  TEAM_MEMBERS: "appworks-team-members",
} as const
