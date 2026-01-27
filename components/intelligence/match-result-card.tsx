"use client"

import { IntelligenceItem, Prospect } from "@/lib/types"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CountryFlag } from "@/components/country-flag"
import { Lightbulb, X, Sparkles, Trophy } from "lucide-react"
import Link from "next/link"

interface MatchResultCardProps {
  item: IntelligenceItem
  prospect?: Prospect
  onDismiss: (id: string) => void
  onUseInFollowUp?: (item: IntelligenceItem) => void
}

export function MatchResultCard({
  item,
  prospect,
  onDismiss,
  onUseInFollowUp,
}: MatchResultCardProps) {
  const initials = (item.companyName || item.title || 'XX')
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const formattedDate = item.publishedAt
    ? new Date(item.publishedAt).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' })
    : new Date(item.createdAt).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' })

  // Determine if home team won (for highlighting)
  const homeWon = (item.matchHomeScore ?? 0) > (item.matchAwayScore ?? 0)
  const awayWon = (item.matchAwayScore ?? 0) > (item.matchHomeScore ?? 0)
  const isDraw = item.matchHomeScore === item.matchAwayScore

  // Check if prospect's team won
  const prospectTeamName = prospect?.company || item.companyName
  const isProspectHomeTeam = item.matchHomeTeam?.toLowerCase().includes(prospectTeamName?.toLowerCase() || '')
  const isProspectAwayTeam = item.matchAwayTeam?.toLowerCase().includes(prospectTeamName?.toLowerCase() || '')
  const prospectWon = (isProspectHomeTeam && homeWon) || (isProspectAwayTeam && awayWon)

  return (
    <Card className={item.dismissed ? "opacity-60" : ""}>
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <span className="text-xs font-semibold px-2 py-1 rounded bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
            <Trophy className="h-3 w-3 inline mr-1" />
            MATCH RESULT
          </span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{formattedDate}</span>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => onDismiss(item.id)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Team Info */}
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center text-white font-medium text-sm">
            {initials}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold">{item.companyName || prospect?.company || item.title}</span>
              {item.countryCode && (
                <CountryFlag code={item.countryCode} className="w-4 h-3" />
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {item.matchLeague || item.description}
            </p>
          </div>
        </div>

        {/* Score Box */}
        {item.matchHomeTeam && item.matchAwayTeam && (
          <div className={`rounded-lg p-4 mb-4 text-center ${prospectWon ? 'bg-green-100 dark:bg-green-900/30' : isDraw ? 'bg-gray-100 dark:bg-gray-800' : 'bg-red-50 dark:bg-red-900/20'}`}>
            <div className="flex items-center justify-center gap-4 text-lg font-bold">
              <span className={homeWon ? 'text-green-700 dark:text-green-400' : ''}>{item.matchHomeTeam}</span>
              <span className="text-2xl font-bold px-4">
                {item.matchHomeScore ?? '?'} - {item.matchAwayScore ?? '?'}
              </span>
              <span className={awayWon ? 'text-green-700 dark:text-green-400' : ''}>{item.matchAwayTeam}</span>
            </div>
            {item.matchScorers && (
              <p className="text-xs text-muted-foreground mt-2">{item.matchScorers}</p>
            )}
          </div>
        )}

        {/* AI Tip */}
        {item.aiTip && (
          <div className="bg-amber-50 dark:bg-amber-950/50 border-l-4 border-amber-400 rounded-r-lg p-3 mb-4">
            <div className="flex items-start gap-2">
              <Lightbulb className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-amber-800 dark:text-amber-200">{item.aiTip}</p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-2">
            {prospect && (
              <Link href={`/acquisition/prospects/${prospect.id}`}>
                <Button variant="outline" size="sm">
                  View Prospect
                </Button>
              </Link>
            )}
          </div>
          {onUseInFollowUp && (
            <Button
              size="sm"
              className="bg-black hover:bg-gray-800 text-white dark:bg-white dark:text-black dark:hover:bg-gray-200"
              onClick={() => onUseInFollowUp(item)}
            >
              <Sparkles className="h-3 w-3 mr-1.5" />
              Use in Follow-up
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
