"use client"

import { useState } from "react"
import { Search, ChevronDown, ChevronUp } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import type { Client, ClientCategory, Product, ProductConfig } from "@/lib/types"
import { cn } from "@/lib/utils"

const getProductColor = (product: Product, configs: ProductConfig[]) => {
  const config = configs.find((c) => c.name === product)
  if (!config) return { bgColor: "#3b82f6", textColor: "#ffffff" }
  return { bgColor: config.bgColor, textColor: config.textColor }
}

interface ClientListProps {
  clients: Client[]
  selectedClient: Client | null
  onSelectClient: (client: Client) => void
  productFilter: Product[]
  productConfigs: ProductConfig[]
  onProductFilterChange: (products: Product[]) => void
  teamMembers: string[]
}

export function ClientList({
  clients,
  selectedClient,
  onSelectClient,
  productFilter,
  productConfigs,
  onProductFilterChange,
  teamMembers,
}: ClientListProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [branchFilter, setBranchFilter] = useState<ClientCategory | "All">("All")
  const [responsibleFilter, setResponsibleFilter] = useState<string | "All">("All")
  const [showMoreFilters, setShowMoreFilters] = useState(false)
  const [countryFilter, setCountryFilter] = useState<string | "All">("All")
  const [cityFilter, setCityFilter] = useState<string | "All">("All")
  const [upsellFilter, setUpsellFilter] = useState<Product[]>([])
  const [hasActiveTodosFilter, setHasActiveTodosFilter] = useState(false)

  // Get unique countries and cities
  const uniqueCountries = Array.from(new Set(clients.map((c) => c.country).filter(Boolean))) as string[]
  const uniqueCities = Array.from(new Set(clients.map((c) => c.city).filter(Boolean))) as string[]

  const filteredClients = clients.filter((client) => {
    const matchesSearch = client.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesBranch = branchFilter === "All" || client.category === branchFilter
    const matchesProducts = productFilter.length === 0 || productFilter.some((p) => client.products.includes(p))
    const matchesResponsible = responsibleFilter === "All" || client.assignedTo === responsibleFilter
    const matchesCountry = countryFilter === "All" || client.country === countryFilter
    const matchesCity = cityFilter === "All" || client.city === cityFilter
    const matchesUpsell = upsellFilter.length === 0 || upsellFilter.some((p) => (client.upsellStrategy || []).includes(p))
    const matchesActiveTodos = !hasActiveTodosFilter || (client.todos && client.todos.some((todo) => !todo.completed))
    return matchesSearch && matchesBranch && matchesProducts && matchesResponsible && matchesCountry && matchesCity && matchesUpsell && matchesActiveTodos
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

        <div className="mt-4">
          <label className="text-xs font-semibold text-muted-foreground mb-2 block">FILTER BY RESPONSIBLE PERSON</label>
          <Select value={responsibleFilter} onValueChange={(value) => setResponsibleFilter(value)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All</SelectItem>
              {teamMembers.map((member) => (
                <SelectItem key={member} value={member}>
                  {member}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="mt-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowMoreFilters(!showMoreFilters)}
            className="w-full flex items-center justify-between text-xs font-semibold text-muted-foreground hover:text-foreground"
          >
            <span>MORE FILTERS</span>
            {showMoreFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>

          {showMoreFilters && (
            <div className="mt-3 space-y-4">
              {/* Country Filter */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-2 block">COUNTRY</label>
                <Select value={countryFilter} onValueChange={(value) => setCountryFilter(value)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All</SelectItem>
                    {uniqueCountries.map((country) => (
                      <SelectItem key={country} value={country}>
                        {country}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* City Filter */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-2 block">CITY</label>
                <Select value={cityFilter} onValueChange={(value) => setCityFilter(value)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All</SelectItem>
                    {uniqueCities.map((city) => (
                      <SelectItem key={city} value={city}>
                        {city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Upsell Strategy Filter */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-2 block">UPSELL STRATEGY</label>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={upsellFilter.length === 0 ? "default" : "outline"}
                    size="sm"
                    onClick={() => setUpsellFilter([])}
                    className="text-xs"
                  >
                    All
                  </Button>
                  <Button
                    variant={upsellFilter.includes("Mobile App") ? "default" : "outline"}
                    size="sm"
                    onClick={() =>
                      setUpsellFilter(
                        upsellFilter.includes("Mobile App")
                          ? upsellFilter.filter((p) => p !== "Mobile App")
                          : [...upsellFilter, "Mobile App"],
                      )
                    }
                    className="text-xs"
                  >
                    mPanel/Apps
                  </Button>
                  <Button
                    variant={upsellFilter.includes("Litteraworks") ? "default" : "outline"}
                    size="sm"
                    onClick={() =>
                      setUpsellFilter(
                        upsellFilter.includes("Litteraworks")
                          ? upsellFilter.filter((p) => p !== "Litteraworks")
                          : [...upsellFilter, "Litteraworks"],
                      )
                    }
                    className="text-xs"
                  >
                    Litteraworks
                  </Button>
                  <Button
                    variant={upsellFilter.includes("Pchella") ? "default" : "outline"}
                    size="sm"
                    onClick={() =>
                      setUpsellFilter(
                        upsellFilter.includes("Pchella")
                          ? upsellFilter.filter((p) => p !== "Pchella")
                          : [...upsellFilter, "Pchella"],
                      )
                    }
                    className="text-xs"
                  >
                    Pchella
                  </Button>
                </div>
              </div>

              {/* Has Active To-Dos Filter */}
              <div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="active-todos"
                    checked={hasActiveTodosFilter}
                    onCheckedChange={(checked) => setHasActiveTodosFilter(checked === true)}
                  />
                  <label
                    htmlFor="active-todos"
                    className="text-xs font-semibold text-muted-foreground cursor-pointer"
                  >
                    HAS ACTIVE TO-DOS
                  </label>
                </div>
              </div>
            </div>
          )}
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
                <h3 className="font-semibold text-foreground truncate mb-1">{client.name}</h3>
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
                {client.products.map((product) => {
                  const colors = getProductColor(product, productConfigs)
                  return (
                    <span
                      key={product}
                      style={{ backgroundColor: colors.bgColor, color: colors.textColor }}
                      className="text-xs px-2 py-0.5 rounded font-medium"
                    >
                      {product}
                    </span>
                  )
                })}
              </div>
            )}

            {client.nextAction && (
              <p className="text-xs text-muted-foreground line-clamp-1 mb-1">
                <span className="font-medium">Next:</span> {client.nextAction}
                {client.nextActionDate && (
                  <span className="ml-1 text-muted-foreground/70">
                    (due: {new Date(client.nextActionDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })})
                  </span>
                )}
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
