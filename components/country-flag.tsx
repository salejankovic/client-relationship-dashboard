"use client"

import { hasFlag } from 'country-flag-icons'
import * as Flags from 'country-flag-icons/react/3x2'

interface CountryFlagProps {
  code: string
  className?: string
}

// Get the 2-letter country code from various formats
function normalizeCountryCode(code: string): string {
  if (!code) return ""

  // If it's already a 2-letter code, return uppercase
  if (code.length === 2 && /^[a-zA-Z]{2}$/.test(code)) {
    return code.toUpperCase()
  }

  // If it's a flag emoji (regional indicator symbols), convert back to code
  // Flag emojis are made of two regional indicator symbols (U+1F1E6 to U+1F1FF)
  if (code.length >= 2) {
    const firstCodePoint = code.codePointAt(0)
    if (firstCodePoint && firstCodePoint >= 0x1F1E6 && firstCodePoint <= 0x1F1FF) {
      const chars: string[] = []
      for (const char of code) {
        const cp = char.codePointAt(0)
        if (cp && cp >= 0x1F1E6 && cp <= 0x1F1FF) {
          chars.push(String.fromCharCode(cp - 0x1F1E6 + 65))
        }
      }
      if (chars.length === 2) {
        return chars.join('')
      }
    }
  }

  return code.toUpperCase()
}

export function CountryFlag({ code, className = "w-5 h-4" }: CountryFlagProps) {
  const normalizedCode = normalizeCountryCode(code)

  // Check if we have a flag for this code
  if (!normalizedCode || !hasFlag(normalizedCode)) {
    // Fallback to showing the code as text
    return <span className="text-xs text-muted-foreground font-medium">{normalizedCode || code}</span>
  }

  // Get the flag component dynamically
  const FlagComponent = (Flags as Record<string, React.ComponentType<{ className?: string }>>)[normalizedCode]

  if (!FlagComponent) {
    return <span className="text-xs text-muted-foreground font-medium">{normalizedCode}</span>
  }

  return <FlagComponent className={className} />
}
