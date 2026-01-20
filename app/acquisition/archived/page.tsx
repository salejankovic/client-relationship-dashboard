"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { MainNav } from "@/components/main-nav"
import { AppSidebar } from "@/components/app-sidebar"
import { MobileNav } from "@/components/mobile-nav"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useProspects } from "@/hooks/use-prospects"
import { ProductBadge } from "@/components/product-badge"
import type { Prospect } from "@/lib/types"
import {
  Archive,
  ArchiveRestore,
  Trash2,
  Loader2,
  Filter,
  Search,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export default function ArchivedProspectsPage() {
  const { prospects, loading, unarchiveProspect, deleteProspect } = useProspects()
  const [searchQuery, setSearchQuery] = useState("")
  const [reasonFilter, setReasonFilter] = useState<string>("all")

  // Get archived prospects
  const archivedProspects = useMemo(() =>
    prospects.filter(p => p.archived),
    [prospects]
  )

  // Get unique archive reasons for filter
  const archiveReasons = useMemo(() => {
    const reasons = new Set(
      archivedProspects
        .map(p => p.archiveReason)
        .filter((reason): reason is string => !!reason)
    )
    return Array.from(reasons)
  }, [archivedProspects])

  // Apply filters
  const filteredProspects = useMemo(() => {
    let filtered = archivedProspects

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(p =>
        p.company.toLowerCase().includes(query) ||
        p.contactPerson?.toLowerCase().includes(query) ||
        p.email?.toLowerCase().includes(query)
      )
    }

    // Reason filter
    if (reasonFilter !== "all") {
      filtered = filtered.filter(p => p.archiveReason === reasonFilter)
    }

    return filtered
  }, [archivedProspects, searchQuery, reasonFilter])

  const handleUnarchive = async (prospectId: string) => {
    if (confirm("Restore this prospect to active prospects?")) {
      await unarchiveProspect(prospectId)
    }
  }

  const handleDelete = async (prospectId: string, company: string) => {
    if (confirm(`Permanently delete ${company}? This cannot be undone.`)) {
      await deleteProspect(prospectId)
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="text-muted-foreground">Loading archived prospects...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <MainNav />
      <AppSidebar />
      <MobileNav />

      <main className="lg:pl-64 pb-20 lg:pb-0 pt-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="flex items-center gap-3">
                <Archive className="h-7 w-7 text-muted-foreground" />
                <h1 className="text-3xl font-bold text-foreground">Archived Prospects</h1>
              </div>
              <p className="text-muted-foreground mt-2">
                {filteredProspects.length} archived {filteredProspects.length === 1 ? 'prospect' : 'prospects'}
              </p>
            </div>
            <Link href="/acquisition/prospects">
              <Button variant="outline">
                Back to Active Prospects
              </Button>
            </Link>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by company, contact, or email..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
                <div className="w-64">
                  <Select value={reasonFilter} onValueChange={setReasonFilter}>
                    <SelectTrigger>
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Filter by reason" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Reasons</SelectItem>
                      {archiveReasons.map((reason) => (
                        <SelectItem key={reason} value={reason}>
                          {reason}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Archived Prospects List */}
          {filteredProspects.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Archive className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {searchQuery || reasonFilter !== "all"
                    ? "No archived prospects match your filters"
                    : "No archived prospects"}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery || reasonFilter !== "all"
                    ? "Try adjusting your search or filters"
                    : "Archived prospects will appear here"}
                </p>
                {(searchQuery || reasonFilter !== "all") && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchQuery("")
                      setReasonFilter("all")
                    }}
                  >
                    Clear Filters
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredProspects.map((prospect) => (
                <Card key={prospect.id} className="hover:shadow-sm transition-shadow">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <div className="flex-1 min-w-0">
                        {/* Company Info */}
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg text-foreground">
                            {prospect.company}
                          </h3>
                          {prospect.productType && (
                            <ProductBadge product={prospect.productType} />
                          )}
                        </div>

                        {/* Contact Info */}
                        {prospect.contactPerson && (
                          <p className="text-sm text-muted-foreground mb-1">
                            {prospect.contactPerson}
                            {prospect.email && ` • ${prospect.email}`}
                          </p>
                        )}

                        {/* Archive Info */}
                        <div className="mt-3 p-3 bg-muted/50 rounded-lg">
                          <div className="flex items-start gap-2">
                            <Archive className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-foreground">
                                {prospect.archiveReason || "No reason provided"}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                Archived on {prospect.archivedDate
                                  ? new Date(prospect.archivedDate).toLocaleDateString("en-US", {
                                      year: "numeric",
                                      month: "short",
                                      day: "numeric"
                                    })
                                  : "Unknown date"
                                }
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Deal Value */}
                        {prospect.dealValue && (
                          <p className="text-sm text-muted-foreground mt-2">
                            Deal Value: €{prospect.dealValue.toLocaleString()}
                          </p>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUnarchive(prospect.id)}
                          className="text-green-600 hover:text-green-700 hover:bg-green-50"
                        >
                          <ArchiveRestore className="h-4 w-4 mr-2" />
                          Restore
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(prospect.id, prospect.company)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
