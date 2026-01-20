"use client"

import { useState } from "react"
import { useIntelligence } from "@/hooks/use-intelligence"
import { useProspects } from "@/hooks/use-prospects"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Loader2, Search, ExternalLink, Plus, Lightbulb, X } from "lucide-react"
import Link from "next/link"
import type { IntelligenceSourceType, IntelligenceItem } from "@/lib/types"

export default function IntelligencePage() {
  const { intelligenceItems, loading, dismissItem, undismissItem, deleteItem } = useIntelligence()
  const { prospects } = useProspects()
  const [searchTerm, setSearchTerm] = useState("")
  const [sourceFilter, setSourceFilter] = useState<IntelligenceSourceType | "all">("all")
  const [showDismissed, setShowDismissed] = useState(false)

  // Filter intelligence items
  const filteredItems = intelligenceItems.filter((item) => {
    // Filter by dismissed status
    if (!showDismissed && item.dismissed) return false

    // Filter by source type
    if (sourceFilter !== "all" && item.sourceType !== sourceFilter) return false

    // Filter by search term
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      const prospectName = prospects.find(p => p.id === item.prospectId)?.company || ""
      return (
        item.title.toLowerCase().includes(search) ||
        item.description?.toLowerCase().includes(search) ||
        prospectName.toLowerCase().includes(search)
      )
    }

    return true
  })

  // Group items by source type for stats
  const stats = {
    total: intelligenceItems.filter(i => !i.dismissed).length,
    linkedin: intelligenceItems.filter(i => i.sourceType === "linkedin" && !i.dismissed).length,
    news: intelligenceItems.filter(i => i.sourceType === "news" && !i.dismissed).length,
    sports: intelligenceItems.filter(i => i.sourceType === "sports" && !i.dismissed).length,
    other: intelligenceItems.filter(i => ["job-change", "funding", "other"].includes(i.sourceType) && !i.dismissed).length,
  }

  const getSourceIcon = (sourceType: IntelligenceSourceType) => {
    switch (sourceType) {
      case "linkedin":
        return "💼"
      case "news":
        return "📰"
      case "sports":
        return "⚽"
      case "job-change":
        return "👔"
      case "funding":
        return "💰"
      default:
        return "📌"
    }
  }

  const getSourceColor = (sourceType: IntelligenceSourceType) => {
    switch (sourceType) {
      case "linkedin":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      case "news":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
      case "sports":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "job-change":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
      case "funding":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="text-muted-foreground">Loading intelligence feed...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link href="/acquisition">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Pipeline
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Intelligence Feed</h1>
            <p className="text-muted-foreground mt-1">
              Stay updated on prospects with automated intelligence gathering
            </p>
          </div>
        </div>
        <Link href="/acquisition/intelligence/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Intelligence
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Total Items</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">💼 {stats.linkedin}</div>
            <p className="text-xs text-muted-foreground">LinkedIn</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">📰 {stats.news}</div>
            <p className="text-xs text-muted-foreground">News</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">⚽ {stats.sports}</div>
            <p className="text-xs text-muted-foreground">Sports</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">💰 {stats.other}</div>
            <p className="text-xs text-muted-foreground">Other</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search intelligence..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={sourceFilter} onValueChange={(value) => setSourceFilter(value as IntelligenceSourceType | "all")}>
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sources</SelectItem>
            <SelectItem value="linkedin">💼 LinkedIn</SelectItem>
            <SelectItem value="news">📰 News</SelectItem>
            <SelectItem value="sports">⚽ Sports</SelectItem>
            <SelectItem value="job-change">👔 Job Changes</SelectItem>
            <SelectItem value="funding">💰 Funding</SelectItem>
            <SelectItem value="other">📌 Other</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant={showDismissed ? "default" : "outline"}
          onClick={() => setShowDismissed(!showDismissed)}
        >
          {showDismissed ? "Hide" : "Show"} Dismissed
        </Button>
      </div>

      {/* Intelligence Items */}
      {filteredItems.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              {searchTerm || sourceFilter !== "all"
                ? "No intelligence items match your filters"
                : "No intelligence items yet. Add one to get started!"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredItems.map((item) => {
            const prospect = prospects.find(p => p.id === item.prospectId)
            return (
              <Card key={item.id} className={item.dismissed ? "opacity-60" : ""}>
                <CardContent className="p-6">
                  <div className="flex gap-4">
                    {/* Image */}
                    {item.imageUrl && (
                      <div className="flex-shrink-0">
                        <img
                          src={item.imageUrl}
                          alt={item.title}
                          className="w-24 h-24 rounded-lg object-cover"
                        />
                      </div>
                    )}

                    {/* Content */}
                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${getSourceColor(item.sourceType)}`}>
                              {getSourceIcon(item.sourceType)} {item.sourceType}
                            </span>
                            {item.relevanceScore !== undefined && (
                              <span className="text-xs px-2 py-1 rounded-full bg-secondary">
                                {item.relevanceScore}% relevant
                              </span>
                            )}
                            {prospect && (
                              <Link href={`/acquisition/prospects/${prospect.id}`}>
                                <span className="text-xs px-2 py-1 rounded-full bg-secondary hover:bg-secondary/80">
                                  {prospect.company}
                                </span>
                              </Link>
                            )}
                          </div>
                          <h3 className="font-semibold text-lg">{item.title}</h3>
                          {item.description && (
                            <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                          {item.url && (
                            <a href={item.url} target="_blank" rel="noopener noreferrer">
                              <Button variant="ghost" size="sm">
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            </a>
                          )}
                          {item.dismissed ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => undismissItem(item.id)}
                            >
                              Restore
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => dismissItem(item.id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteItem(item.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            Delete
                          </Button>
                        </div>
                      </div>

                      {/* AI Tip */}
                      {item.aiTip && (
                        <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mt-3">
                          <div className="flex items-start gap-2">
                            <Lightbulb className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">AI Tip</p>
                              <p className="text-sm text-blue-800 dark:text-blue-200">{item.aiTip}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Metadata */}
                      <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2">
                        {item.publishedAt && (
                          <span>Published {new Date(item.publishedAt).toLocaleDateString()}</span>
                        )}
                        {item.publishedAt && <span>•</span>}
                        <span>Added {new Date(item.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
