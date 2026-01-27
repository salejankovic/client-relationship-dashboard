"use client"

import { IntelligenceItem, Prospect } from "@/lib/types"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CountryFlag } from "@/components/country-flag"
import { ExternalLink, Lightbulb, X, Sparkles, Briefcase, UserPlus } from "lucide-react"
import Link from "next/link"

interface JobChangeCardProps {
  item: IntelligenceItem
  prospect?: Prospect
  onDismiss: (id: string) => void
  onUseInFollowUp?: (item: IntelligenceItem) => void
  onAddAsContact?: (item: IntelligenceItem) => void
}

export function JobChangeCard({
  item,
  prospect,
  onDismiss,
  onUseInFollowUp,
  onAddAsContact,
}: JobChangeCardProps) {
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
          <span className="text-xs font-semibold px-2 py-1 rounded bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300">
            <Briefcase className="h-3 w-3 inline mr-1" />
            JOB CHANGE
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
            <div className="w-10 h-10 rounded-full bg-orange-600 flex items-center justify-center text-white font-medium text-sm">
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

        {/* Job Change Details */}
        <div className="mb-4">
          <p className="text-sm font-medium text-foreground">
            {item.personName} joined as {item.personPosition}
          </p>
          {(item.previousPosition || item.previousCompany) && (
            <p className="text-sm text-muted-foreground mt-1">
              Previously: {item.previousPosition}
              {item.previousCompany && ` at ${item.previousCompany}`}
            </p>
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
            {onAddAsContact && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onAddAsContact(item)}
                className="text-green-600 border-green-200 hover:bg-green-50"
              >
                <UserPlus className="h-3 w-3 mr-1.5" />
                Add as Contact
              </Button>
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
