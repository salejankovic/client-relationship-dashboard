"use client"

import { IntelligenceItem, Prospect } from "@/lib/types"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CountryFlag } from "@/components/country-flag"
import { ExternalLink, Lightbulb, X, Sparkles } from "lucide-react"
import Link from "next/link"

interface LinkedInPostCardProps {
  item: IntelligenceItem
  prospect?: Prospect
  onDismiss: (id: string) => void
  onUseInFollowUp?: (item: IntelligenceItem) => void
}

export function LinkedInPostCard({
  item,
  prospect,
  onDismiss,
  onUseInFollowUp,
}: LinkedInPostCardProps) {
  const initials = item.personName
    ? item.personName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '??'

  const formattedDate = item.publishedAt
    ? new Date(item.publishedAt).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' })
    : new Date(item.createdAt).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' })

  return (
    <Card className={item.dismissed ? "opacity-60" : ""}>
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <span className="text-xs font-semibold px-2 py-1 rounded bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
            💼 LINKEDIN POST
          </span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{formattedDate}</span>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => onDismiss(item.id)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Person Info */}
        <div className="flex items-start gap-3 mb-4">
          {item.personAvatarUrl ? (
            <img
              src={item.personAvatarUrl}
              alt={item.personName || 'Person'}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium text-sm">
              {initials}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold">{item.personName || item.title}</span>
              {item.countryCode && (
                <CountryFlag code={item.countryCode} className="w-4 h-3" />
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {item.personPosition}
              {item.companyName && ` at ${item.companyName}`}
            </p>
          </div>
        </div>

        {/* Content Quote */}
        {item.contentQuote && (
          <div className="mb-4">
            <p className="text-sm text-foreground">
              "{item.contentQuote}"
            </p>
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
            {item.personLinkedinUrl && (
              <a href={item.personLinkedinUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm">
                  View on LinkedIn
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
