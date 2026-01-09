"use client"

import { useState } from "react"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import type { Client, ClientCategory, Product } from "@/lib/types"

interface ClientListProps {
  clients: Client[]
  selectedClient: Client | null
  onSelectClient: (client: Client) => void
  productFilter: Product[]
  onProductFilterChange: (products: Product[]) => void
}

const getProductColor = (product: string) => {
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

export function ClientList({
  clients,
  selectedClient,
  onSelectClient,
  productFilter,
  onProductFilterChange,
}: ClientListProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [branchFilter, setBranchFilter] = useState<ClientCategory | "All">("All")

  const filteredClients = clients.filter((client) => {
    const matchesSearch = client.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesBranch = branchFilter === "All" || client.category === branchFilter
    const matchesProducts = productFilter.length === 0 || productFilter.some((p) => client.products.includes(p))

    return matchesSearch && matchesBranch && matchesProducts
  })

  return (
    <aside className="w-80 border-r border-border bg-card flex flex-col">
      <div className="p-4 border-b border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search clients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-background border-border"
          />
        </div>

        <div className="mt-4">
          <label className="text-xs font-semibold text-muted-foreground mb-2 block">FILTER BY PRODUCT</label>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={productFilter.length === 0 ? "default" : "outline"}
              size="sm"
              onClick={() => onProductFilterChange([])}
              className="text-xs"
            >
              All
            </Button>
            <Button
              variant={productFilter.includes("Mobile App") ? "default" : "outline"}
              size="sm"
              onClick={() =>
                onProductFilterChange(
                  productFilter.includes("Mobile App")
                    ? productFilter.filter((p) => p !== "Mobile App")
                    : [...productFilter, "Mobile App"],
                )
              }
              className="text-xs"
            >
              mPanel/Apps
            </Button>
            <Button
              variant={productFilter.includes("Litteraworks") ? "default" : "outline"}
              size="sm"
              onClick={() =>
                onProductFilterChange(
                  productFilter.includes("Litteraworks")
                    ? productFilter.filter((p) => p !== "Litteraworks")
                    : [...productFilter, "Litteraworks"],
                )
              }
              className="text-xs"
            >
              Litteraworks
            </Button>
            <Button
              variant={productFilter.includes("Pchella") ? "default" : "outline"}
              size="sm"
              onClick={() =>
                onProductFilterChange(
                  productFilter.includes("Pchella")
                    ? productFilter.filter((p) => p !== "Pchella")
                    : [...productFilter, "Pchella"],
                )
              }
              className="text-xs"
            >
              Pchella
            </Button>
          </div>
        </div>

        <div className="mt-4">
          <label className="text-xs font-semibold text-muted-foreground mb-2 block">FILTER BY BRANCH</label>
          <div className="flex gap-2">
            <Button
              variant={branchFilter === "All" ? "default" : "outline"}
              size="sm"
              onClick={() => setBranchFilter("All")}
              className="flex-1"
            >
              All
            </Button>
            <Button
              variant={branchFilter === "Media" ? "default" : "outline"}
              size="sm"
              onClick={() => setBranchFilter("Media")}
              className="flex-1"
            >
              Media
            </Button>
            <Button
              variant={branchFilter === "Sport" ? "default" : "outline"}
              size="sm"
              onClick={() => setBranchFilter("Sport")}
              className="flex-1"
            >
              Sport
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-2">
        {filteredClients.map((client) => (
          <button
            key={client.id}
            onClick={() => onSelectClient(client)}
            className={cn(
              "w-full text-left p-3 rounded-lg border transition-colors border-border",
              "hover:bg-accent",
              selectedClient?.id === client.id && "bg-accent",
            )}
          >
            <div className="flex items-start gap-3 mb-2">
              {client.logoUrl ? (
                <div className="h-10 w-10 rounded-md overflow-hidden bg-muted flex-shrink-0">
                  <img
                    src={client.logoUrl}
                    alt={client.name}
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : (
                <div className="h-10 w-10 rounded-md bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {client.name.substring(0, 2).toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-1">
                  <h3 className="font-semibold text-foreground truncate">{client.name}</h3>
                  <div
                    className={cn(
                      "h-2 w-2 rounded-full mt-1.5 flex-shrink-0",
                      client.status === "active" && "bg-green-500",
                      client.status === "pending" && "bg-yellow-500",
                      client.status === "inactive" && "bg-gray-500",
                    )}
                  />
                </div>
                {client.assignedTo && (
                  <p className="text-xs text-muted-foreground mb-1">Assigned to: {client.assignedTo}</p>
                )}
              </div>
            </div>

            <Badge
              variant="outline"
              className={cn(
                "mb-2",
                client.category === "Media" && "border-blue-500 text-blue-500",
                client.category === "Sport" && "border-orange-500 text-orange-500",
              )}
            >
              {client.category}
            </Badge>

            {client.products.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {client.products.map((product) => (
                  <span
                    key={product}
                    className={cn("text-xs px-2 py-0.5 rounded font-medium", getProductColor(product))}
                  >
                    {product}
                  </span>
                ))}
              </div>
            )}

            {client.nextAction && (
              <p className="text-xs text-muted-foreground line-clamp-1 mb-1">
                <span className="font-medium">Next:</span> {client.nextAction}
              </p>
            )}

            {client.todos && client.todos.filter((todo) => !todo.completed).length > 0 && (
              <div className="mt-2 pt-2 border-t border-border">
                <p className="text-xs font-medium text-muted-foreground mb-1">Active To-Dos:</p>
                <ul className="space-y-0.5">
                  {client.todos
                    .filter((todo) => !todo.completed)
                    .slice(0, 2)
                    .map((todo) => (
                      <li key={todo.id} className="text-xs text-muted-foreground line-clamp-1 flex items-start gap-1">
                        <span className="text-muted-foreground/50 mt-0.5">•</span>
                        <span className="flex-1">{todo.text}</span>
                      </li>
                    ))}
                  {client.todos.filter((todo) => !todo.completed).length > 2 && (
                    <li className="text-xs text-muted-foreground/70">
                      +{client.todos.filter((todo) => !todo.completed).length - 2} more
                    </li>
                  )}
                </ul>
              </div>
            )}
          </button>
        ))}
      </div>
    </aside>
  )
}
