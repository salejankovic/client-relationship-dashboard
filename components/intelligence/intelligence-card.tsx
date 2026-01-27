"use client"

import { IntelligenceItem, Prospect } from "@/lib/types"
import { LinkedInPostCard } from "./linkedin-post-card"
import { MatchResultCard } from "./match-result-card"
import { NewsCard } from "./news-card"
import { JobChangeCard } from "./job-change-card"
import { CompanyUpdateCard } from "./company-update-card"

interface IntelligenceCardProps {
  item: IntelligenceItem
  prospect?: Prospect
  onDismiss: (id: string) => void
  onUseInFollowUp?: (item: IntelligenceItem) => void
  onAddAsContact?: (item: IntelligenceItem) => void
}

export function IntelligenceCard({
  item,
  prospect,
  onDismiss,
  onUseInFollowUp,
  onAddAsContact,
}: IntelligenceCardProps) {
  // Determine which card type to render based on intelligenceType or sourceType
  const cardType = item.intelligenceType || mapSourceToType(item.sourceType)

  switch (cardType) {
    case 'linkedin_post':
      return (
        <LinkedInPostCard
          item={item}
          prospect={prospect}
          onDismiss={onDismiss}
          onUseInFollowUp={onUseInFollowUp}
        />
      )

    case 'match_result':
      return (
        <MatchResultCard
          item={item}
          prospect={prospect}
          onDismiss={onDismiss}
          onUseInFollowUp={onUseInFollowUp}
        />
      )

    case 'job_change':
      return (
        <JobChangeCard
          item={item}
          prospect={prospect}
          onDismiss={onDismiss}
          onUseInFollowUp={onUseInFollowUp}
          onAddAsContact={onAddAsContact}
        />
      )

    case 'company_update':
    case 'funding':
      return (
        <CompanyUpdateCard
          item={item}
          prospect={prospect}
          onDismiss={onDismiss}
          onUseInFollowUp={onUseInFollowUp}
        />
      )

    case 'news':
    default:
      return (
        <NewsCard
          item={item}
          prospect={prospect}
          onDismiss={onDismiss}
          onUseInFollowUp={onUseInFollowUp}
        />
      )
  }
}

// Map legacy sourceType to intelligenceType
function mapSourceToType(sourceType: string): string {
  switch (sourceType) {
    case 'linkedin':
      return 'linkedin_post'
    case 'sports':
      return 'match_result'
    case 'job-change':
      return 'job_change'
    case 'funding':
      return 'company_update'
    case 'news':
      return 'news'
    default:
      return 'news'
  }
}
