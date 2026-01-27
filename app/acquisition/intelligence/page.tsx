"use client"

import { useState, useMemo } from "react"
import { useIntelligence } from "@/hooks/use-intelligence"
import { useProspects } from "@/hooks/use-prospects"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MainNav } from "@/components/main-nav"
import { AppSidebar } from "@/components/app-sidebar"
import { MobileNav } from "@/components/mobile-nav"
import { IntelligenceCard, FollowupEmailDialog } from "@/components/intelligence"
import { Loader2, Search, RefreshCw, Briefcase, Newspaper, Trophy, Building2, Sparkles } from "lucide-react"
import type { IntelligenceSourceType, IntelligenceItem } from "@/lib/types"

type FilterType = 'all' | 'linkedin' | 'company' | 'news' | 'sports' | 'jobs'

export default function IntelligencePage() {
  const { intelligenceItems, loading, dismissItem, refetch } = useIntelligence()
  const { prospects } = useProspects()
  const [searchTerm, setSearchTerm] = useState("")
  const [activeFilter, setActiveFilter] = useState<FilterType>("all")
  const [prospectFilter, setProspectFilter] = useState<string>("all")
  const [showDismissed, setShowDismissed] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [followupDialogOpen, setFollowupDialogOpen] = useState(false)
  const [selectedIntelligence, setSelectedIntelligence] = useState<IntelligenceItem | null>(null)
  const [selectedProspect, setSelectedProspect] = useState<typeof prospects[0] | undefined>(undefined)

  // Get last updated time
  const lastUpdated = useMemo(() => {
    if (intelligenceItems.length === 0) return null
    const latest = intelligenceItems.reduce((latest, item) => {
      const itemDate = new Date(item.createdAt)
      return itemDate > latest ? itemDate : latest
    }, new Date(0))

    const now = new Date()
    const diffMs = now.getTime() - latest.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffMins = Math.floor(diffMs / (1000 * 60))

    if (diffHours > 24) {
      return `${Math.floor(diffHours / 24)} days ago`
    } else if (diffHours > 0) {
      return `${diffHours} hours ago`
    } else if (diffMins > 0) {
      return `${diffMins} minutes ago`
    }
    return 'just now'
  }, [intelligenceItems])

  // Filter intelligence items
  const filteredItems = useMemo(() => {
    return intelligenceItems.filter((item) => {
      // Filter by dismissed status
      if (!showDismissed && item.dismissed) return false

      // Filter by type
      if (activeFilter !== "all") {
        const typeMatch = mapFilterToTypes(activeFilter).includes(item.sourceType)
        if (!typeMatch) return false
      }

      // Filter by prospect
      if (prospectFilter !== "all" && item.prospectId !== prospectFilter) return false

      // Filter by search term
      if (searchTerm) {
        const search = searchTerm.toLowerCase()
        const prospectName = prospects.find(p => p.id === item.prospectId)?.company || ""
        return (
          item.title.toLowerCase().includes(search) ||
          item.description?.toLowerCase().includes(search) ||
          item.personName?.toLowerCase().includes(search) ||
          item.companyName?.toLowerCase().includes(search) ||
          prospectName.toLowerCase().includes(search)
        )
      }

      return true
    })
  }, [intelligenceItems, showDismissed, activeFilter, prospectFilter, searchTerm, prospects])

  // Count items by filter type
  const counts = useMemo(() => {
    const nonDismissed = intelligenceItems.filter(i => !i.dismissed)
    return {
      all: nonDismissed.length,
      linkedin: nonDismissed.filter(i => i.sourceType === 'linkedin').length,
      company: nonDismissed.filter(i => ['funding', 'other'].includes(i.sourceType) || i.intelligenceType === 'company_update').length,
      news: nonDismissed.filter(i => i.sourceType === 'news').length,
      sports: nonDismissed.filter(i => i.sourceType === 'sports').length,
      jobs: nonDismissed.filter(i => i.sourceType === 'job-change').length,
    }
  }, [intelligenceItems])

  // Group items by date
  const groupedItems = useMemo(() => {
    const groups: { label: string; items: typeof filteredItems }[] = []
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const lastWeek = new Date(today)
    lastWeek.setDate(lastWeek.getDate() - 7)

    const todayItems: typeof filteredItems = []
    const yesterdayItems: typeof filteredItems = []
    const thisWeekItems: typeof filteredItems = []
    const earlierItems: typeof filteredItems = []

    filteredItems.forEach(item => {
      const itemDate = new Date(item.publishedAt || item.createdAt)
      itemDate.setHours(0, 0, 0, 0)

      if (itemDate.getTime() === today.getTime()) {
        todayItems.push(item)
      } else if (itemDate.getTime() === yesterday.getTime()) {
        yesterdayItems.push(item)
      } else if (itemDate > lastWeek) {
        thisWeekItems.push(item)
      } else {
        earlierItems.push(item)
      }
    })

    if (todayItems.length > 0) groups.push({ label: 'TODAY', items: todayItems })
    if (yesterdayItems.length > 0) groups.push({ label: 'YESTERDAY', items: yesterdayItems })
    if (thisWeekItems.length > 0) groups.push({ label: 'THIS WEEK', items: thisWeekItems })
    if (earlierItems.length > 0) groups.push({ label: 'EARLIER', items: earlierItems })

    return groups
  }, [filteredItems])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await refetch()
    setIsRefreshing(false)
  }

  const handleUseInFollowUp = (item: IntelligenceItem) => {
    const prospect = prospects.find(p => p.id === item.prospectId)
    setSelectedIntelligence(item)
    setSelectedProspect(prospect)
    setFollowupDialogOpen(true)
  }

  const handleAddAsContact = (item: IntelligenceItem) => {
    // TODO: Add person as contact to the prospect
    console.log('Add as contact:', item)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <MainNav />
        <AppSidebar />
        <MobileNav />
        <main className="lg:pl-64 pb-20 lg:pb-0 pt-16">
          <div className="flex h-[80vh] items-center justify-center">
            <div className="flex items-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="text-muted-foreground">Loading intelligence feed...</span>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <MainNav />
      <AppSidebar />
      <MobileNav />

      <main className="lg:pl-64 pb-20 lg:pb-0 pt-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Intelligence Feed</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Stay informed about your prospects
              </p>
              {lastUpdated && (
                <p className="text-xs text-muted-foreground mt-1">
                  Last updated: {lastUpdated}
                </p>
              )}
            </div>
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh Now
            </Button>
          </div>

          {/* Filter Tabs */}
          <div className="flex flex-wrap items-center gap-2 mb-6">
            <FilterTab
              active={activeFilter === 'all'}
              onClick={() => setActiveFilter('all')}
              count={counts.all}
            >
              All
            </FilterTab>
            <FilterTab
              active={activeFilter === 'linkedin'}
              onClick={() => setActiveFilter('linkedin')}
              count={counts.linkedin}
              icon={<Briefcase className="h-3 w-3" />}
            >
              LinkedIn
            </FilterTab>
            <FilterTab
              active={activeFilter === 'company'}
              onClick={() => setActiveFilter('company')}
              count={counts.company}
              icon={<Building2 className="h-3 w-3" />}
            >
              Company
            </FilterTab>
            <FilterTab
              active={activeFilter === 'news'}
              onClick={() => setActiveFilter('news')}
              count={counts.news}
              icon={<Newspaper className="h-3 w-3" />}
            >
              News
            </FilterTab>
            <FilterTab
              active={activeFilter === 'sports'}
              onClick={() => setActiveFilter('sports')}
              count={counts.sports}
              icon={<Trophy className="h-3 w-3" />}
            >
              Sports
            </FilterTab>
            <FilterTab
              active={activeFilter === 'jobs'}
              onClick={() => setActiveFilter('jobs')}
              count={counts.jobs}
              icon={<Briefcase className="h-3 w-3" />}
            >
              Jobs
            </FilterTab>
          </div>

          {/* Search and Prospect Filter */}
          <div className="flex gap-3 mb-6">
            <Select value={prospectFilter} onValueChange={setProspectFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All prospects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All prospects</SelectItem>
                {prospects.filter(p => !p.archived).map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.company}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              variant={showDismissed ? "default" : "outline"}
              onClick={() => setShowDismissed(!showDismissed)}
            >
              {showDismissed ? "Hide" : "Show"} Dismissed
            </Button>
          </div>

          {/* Intelligence Items */}
          {groupedItems.length === 0 ? (
            <div className="text-center py-12 border rounded-lg bg-card">
              <Sparkles className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No intelligence items yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {searchTerm || activeFilter !== "all" || prospectFilter !== "all"
                  ? "No items match your filters"
                  : "Intelligence will appear here as we gather updates about your prospects"}
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {groupedItems.map((group) => (
                <div key={group.label}>
                  <h3 className="text-xs font-semibold text-muted-foreground mb-4 flex items-center gap-2">
                    <span className="h-px flex-1 bg-border" />
                    {group.label}
                    <span className="h-px flex-1 bg-border" />
                  </h3>
                  <div className="space-y-4">
                    {group.items.map((item) => {
                      const prospect = prospects.find(p => p.id === item.prospectId)
                      return (
                        <IntelligenceCard
                          key={item.id}
                          item={item}
                          prospect={prospect}
                          onDismiss={dismissItem}
                          onUseInFollowUp={handleUseInFollowUp}
                          onAddAsContact={handleAddAsContact}
                        />
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Follow-up Email Dialog */}
      {selectedIntelligence && (
        <FollowupEmailDialog
          open={followupDialogOpen}
          onOpenChange={setFollowupDialogOpen}
          item={selectedIntelligence}
          prospect={selectedProspect}
        />
      )}
    </div>
  )
}

// Helper component for filter tabs
function FilterTab({
  active,
  onClick,
  count,
  icon,
  children,
}: {
  active: boolean
  onClick: () => void
  count: number
  icon?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={`
        inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors
        ${active
          ? 'bg-black text-white dark:bg-white dark:text-black'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
        }
      `}
    >
      {icon}
      {children}
      <span className={`text-xs ${active ? 'opacity-80' : 'opacity-60'}`}>({count})</span>
    </button>
  )
}

// Helper function to map filter type to source types
function mapFilterToTypes(filter: FilterType): IntelligenceSourceType[] {
  switch (filter) {
    case 'linkedin':
      return ['linkedin']
    case 'company':
      return ['funding', 'other']
    case 'news':
      return ['news']
    case 'sports':
      return ['sports']
    case 'jobs':
      return ['job-change']
    default:
      return []
  }
}
