"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"

export function MainNav() {
  const router = useRouter()
  const pathname = usePathname()
  const [theme, setTheme] = useState<"light" | "dark">("light")

  // Determine which dashboard we're on
  const isAcquisition = pathname.startsWith("/acquisition")
  const isClients = pathname === "/" || pathname.startsWith("/clients")

  useEffect(() => {
    // Check for saved theme preference or default to light
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches

    const initialTheme = savedTheme || (prefersDark ? "dark" : "light")
    setTheme(initialTheme)
    applyTheme(initialTheme)
  }, [])

  const applyTheme = (newTheme: "light" | "dark") => {
    const root = document.documentElement
    if (newTheme === "dark") {
      root.classList.add("dark")
    } else {
      root.classList.remove("dark")
    }
    localStorage.setItem("theme", newTheme)
  }

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light"
    setTheme(newTheme)
    applyTheme(newTheme)
  }

  const switchDashboard = (dashboard: "potential" | "existing") => {
    if (dashboard === "potential") {
      router.push("/acquisition")
    } else {
      router.push("/")
    }
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-background border-b border-border">
      <div className="flex items-center justify-between h-16 px-6">
        {/* Zlatko Branding */}
        <div className="flex items-center gap-8">
          <h1 className="text-2xl font-bold text-foreground">Zlatko</h1>

          {/* Dashboard Switcher */}
          <div className="flex items-center gap-2 bg-muted rounded-lg p-1">
            <button
              onClick={() => switchDashboard("potential")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                isAcquisition
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Potential Clients
            </button>
            <button
              onClick={() => switchDashboard("existing")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                isClients && !isAcquisition
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Existing Clients
            </button>
          </div>
        </div>

        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="rounded-full"
        >
          {theme === "light" ? (
            <Moon className="h-5 w-5" />
          ) : (
            <Sun className="h-5 w-5" />
          )}
        </Button>
      </div>
    </div>
  )
}
