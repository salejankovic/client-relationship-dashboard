"use client"

import { useState } from "react"
import { useProspects } from "@/hooks/use-prospects"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Search, Loader2, ArrowLeft } from "lucide-react"
import Link from "next/link"
import type { Prospect, ProspectStatus } from "@/lib/types"

export default function AcquisitionPage() {
  const { prospects, loading } = useProspects()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<ProspectStatus | "all">("all")

  // Filter prospects
  const filteredProspects = prospects.filter((prospect) => {
    // Filter out archived prospects
    if (prospect.archived) return false

    // Status filter
    if (statusFilter !== "all" && prospect.status !== statusFilter) return false

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      return (
        prospect.company.toLowerCase().includes(search) ||
        prospect.contactPerson?.toLowerCase().includes(search) ||
        prospect.email?.toLowerCase().includes(search)
      )
    }

    return true
  })

  // Group by status
  const groupedProspects = {
    Hot: filteredProspects.filter((p) => p.status === "Hot"),
    Warm: filteredProspects.filter((p) => p.status === "Warm"),
    Cold: filteredProspects.filter((p) => p.status === "Cold"),
    Lost: filteredProspects.filter((p) => p.status === "Lost"),
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="text-muted-foreground">Loading prospects...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Clients
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Acquisition Pipeline</h1>
            <p className="text-muted-foreground mt-1">Manage your sales prospects and deals</p>
          </div>
        </div>
        <Link href="/acquisition/prospects/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Prospect
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search prospects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={statusFilter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("all")}
          >
            All ({filteredProspects.length})
          </Button>
          <Button
            variant={statusFilter === "Hot" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("Hot")}
          >
            🔥 Hot ({groupedProspects.Hot.length})
          </Button>
          <Button
            variant={statusFilter === "Warm" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("Warm")}
          >
            ☀️ Warm ({groupedProspects.Warm.length})
          </Button>
          <Button
            variant={statusFilter === "Cold" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("Cold")}
          >
            ❄️ Cold ({groupedProspects.Cold.length})
          </Button>
          <Button
            variant={statusFilter === "Lost" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("Lost")}
          >
            Lost ({groupedProspects.Lost.length})
          </Button>
        </div>
      </div>

      {/* Prospects Grid */}
      {filteredProspects.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <h3 className="text-lg font-semibold mb-2">No prospects found</h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm ? "Try adjusting your search terms" : "Get started by adding your first prospect"}
          </p>
          {!searchTerm && (
            <Link href="/acquisition/prospects/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Prospect
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProspects.map((prospect) => (
            <ProspectCard key={prospect.id} prospect={prospect} />
          ))}
        </div>
      )}
    </div>
  )
}

// Prospect Card Component
function ProspectCard({ prospect }: { prospect: Prospect }) {
  const statusColors = {
    Hot: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    Warm: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
    Cold: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    Lost: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400",
  }

  return (
    <Link href={`/acquisition/prospects/${prospect.id}`}>
      <div className="border rounded-lg p-4 hover:border-primary transition-colors cursor-pointer bg-card">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="font-semibold text-foreground line-clamp-1">{prospect.company}</h3>
            {prospect.contactPerson && (
              <p className="text-sm text-muted-foreground line-clamp-1">{prospect.contactPerson}</p>
            )}
          </div>
          <span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[prospect.status]}`}>
            {prospect.status}
          </span>
        </div>

        {prospect.dealValue && (
          <p className="text-sm font-medium text-foreground mb-2">
            €{prospect.dealValue.toLocaleString()}
          </p>
        )}

        {prospect.productType && (
          <p className="text-xs text-muted-foreground mb-2">{prospect.productType}</p>
        )}

        {prospect.daysSinceContact !== undefined && (
          <p className="text-xs text-muted-foreground">
            Last contact: {prospect.daysSinceContact === 0 ? "Today" : `${prospect.daysSinceContact} days ago`}
          </p>
        )}

        {prospect.nextAction && (
          <p className="text-xs text-muted-foreground mt-2 line-clamp-1">
            <span className="font-medium">Next:</span> {prospect.nextAction}
          </p>
        )}
      </div>
    </Link>
  )
}
