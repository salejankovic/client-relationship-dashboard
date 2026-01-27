"use client"

import { IntelligenceItem, Prospect } from "@/lib/types"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CountryFlag } from "@/components/country-flag"
import { ExternalLink, Lightbulb, X, Sparkles, Newspaper } from "lucide-react"
import Link from "next/link"

interface NewsCardProps {
  item: IntelligenceItem
  prospect?: Prospect
  onDismiss: (id: string) => void
  onUseInFollowUp?: (item: IntelligenceItem) => void
}

export function NewsCard({
  item,
  prospect,
  onDismiss,
  onUseInFollowUp,
}: NewsCardProps) {
  const initials = (item.companyName || prospect?.company || item.title || 'XX')
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const formattedDate = item.publishedAt
    ? new Date(item.publishedAt).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' })
    : new Date(item.createdAt).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' })

  return (
    <Card className={item.dismissed ? "opacity-60" : ""}>
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <span className="text-xs font-semibold px-2 py-1 rounded bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300">
            <Newspaper className="h-3 w-3 inline mr-1" />
            NEWS
          </span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{formattedDate}</span>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => onDismiss(item.id)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Company Info */}
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-white font-medium text-sm">
            {initials}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold">{item.companyName || prospect?.company || 'Company'}</span>
              {item.countryCode && (
                <CountryFlag code={item.countryCode} className="w-4 h-3" />
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Source: {item.sourceName || 'News'}
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="mb-4">
          {item.contentQuote ? (
            <p className="text-sm text-foreground">"{item.contentQuote}"</p>
          ) : item.description ? (
            <p className="text-sm text-foreground">{item.description}</p>
          ) : (
            <p className="text-sm font-medium text-foreground">{item.title}</p>
          )}
        </div>

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
            {item.url && (
              <a href={item.url} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm">
                  Read Article
                  <ExternalLink className="h-3 w-3 ml-1.5" />
                </Button>
              </a>
            )}
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
