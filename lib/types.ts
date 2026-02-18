export type ClientCategory = "Media" | "Sport"
export type ClientStatus = "active" | "pending" | "inactive"
export type Product = "Pchella" | "TTS" | "Litteraworks" | "Mobile App" | "e-Kiosk" | "Komentari" | "CMS"

export interface ProductConfig {
  name: Product
  bgColor: string
  textColor: string
}

export interface Contact {
  id: string
  name: string
  email: string
  role?: string
}

export interface TodoItem {
  id: string
  text: string
  completed: boolean
}

export interface ActivityLog {
  id: string
  comment: string
  date: string
}

export interface Client {
  id: string
  name: string
  logoUrl?: string
  category: ClientCategory
  status: ClientStatus
  products: Product[]
  website?: string
  city?: string
  country?: string
  nextAction?: string
  nextActionDate?: string
  contacts: Contact[]
  assignedTo?: string
  todos: TodoItem[]
  notes?: string
  upsellStrategy?: Product[]
  activity: ActivityLog[]
}

// ==================================================
// ACQUISITION MODULE TYPES
// ==================================================

export type ProspectStatus = 'Not contacted yet' | 'Hot' | 'Warm' | 'Cold' | 'Lost'
export type ProspectType = 'Media' | 'Sports Club' | 'Sports League' | 'Other'
export type ProductType = 'Mobile app' | 'Website/CMS' | 'LitteraWorks' | 'CMS' | 'Other'
export type IntelligenceSourceType = 'linkedin' | 'news' | 'sports' | 'job-change' | 'funding' | 'other'

// Intelligence card types for rich UI rendering
export type IntelligenceType =
  | 'linkedin_post'    // Person posted on LinkedIn
  | 'match_result'     // Sports match result
  | 'news'             // News article about company
  | 'job_change'       // Person changed jobs
  | 'company_update'   // Company announcement (hiring, funding, etc.)
  | 'funding'          // Funding round
  | 'other'            // Catch-all

// Constants
export const PRODUCT_BADGE_COLORS: Record<ProductType, string> = {
  "Mobile app": "bg-blue-100 text-blue-700",
  "Website/CMS": "bg-purple-100 text-purple-700",
  "LitteraWorks": "bg-green-100 text-green-700",
  "CMS": "bg-cyan-100 text-cyan-700",
  "Other": "bg-gray-100 text-gray-700",
}
export type EmailTone = 'formal' | 'casual' | 'urgent' | 'english' | 'shorter'
export type EmailGoal = 'check-in' | 'schedule-call' | 'share-update' | 're-introduce' | 'close-deal'
export type EmailLanguage = string
export type Sentiment = 'positive' | 'neutral' | 'negative'
export type RiskLevel = 'low' | 'medium' | 'high'

export interface Prospect {
  id: string
  company: string
  contactPerson?: string
  contactPosition?: string
  contactLinkedinUrl?: string
  email?: string
  telephone?: string
  website?: string
  linkedinUrl?: string

  // Classification
  productType?: ProductType
  prospectType?: ProspectType
  country?: string

  // Sales Pipeline
  status: ProspectStatus
  owner?: string
  source?: string
  dealValue?: string
  customLabel?: string

  // Activity Tracking
  nextAction?: string
  nextActionDate?: string
  lastContactDate?: string
  daysSinceContact?: number

  // Archiving
  archived: boolean
  archivedDate?: string
  archiveReason?: string

  // Metadata
  createdAt: string
  updatedAt: string
}

export interface ProspectComment {
  id: string
  prospectId: string
  comment: string
  author?: string
  createdAt: string
}

export interface IntelligenceItem {
  id: string
  prospectId?: string
  title: string
  description?: string
  sourceType: IntelligenceSourceType
  intelligenceType?: IntelligenceType
  url?: string
  imageUrl?: string
  publishedAt?: string
  createdAt: string
  dismissed: boolean
  aiTip?: string
  relevanceScore?: number

  // Person-related fields (LinkedIn posts, job changes)
  personName?: string
  personPosition?: string
  personLinkedinUrl?: string
  personAvatarUrl?: string

  // Company/source fields
  companyName?: string
  sourceName?: string
  contentQuote?: string

  // Match result fields (sports)
  matchHomeTeam?: string
  matchAwayTeam?: string
  matchHomeScore?: number
  matchAwayScore?: number
  matchScorers?: string
  matchLeague?: string

  // Job change fields
  previousPosition?: string
  previousCompany?: string

  // Country code for flag display
  countryCode?: string
}

export interface EmailDraft {
  id: string
  prospectId: string
  subject: string
  body: string
  tone?: EmailTone
  goal?: EmailGoal
  language?: EmailLanguage
  sentAt?: string
  openedAt?: string
  repliedAt?: string
  aiModel?: string
  createdAt: string
}

export interface AIInsight {
  id: string
  prospectId: string
  sentiment: Sentiment
  engagementScore: number
  riskLevel: RiskLevel
  recommendedAction?: string
  bestTimeToReach?: string
  keyTopics?: string[]
  generatedAt: string
  aiModel?: string
}

export type CommunicationType = 'email' | 'call' | 'meeting' | 'note' | 'linkedin' | 'online_call' | 'sms_whatsapp' | 'email_reply' | 'followup_sent'

// Activity types for the Activity Log (subset of CommunicationType, excluding synced emails)
export type ActivityType = 'note' | 'call' | 'meeting' | 'online_call' | 'sms_whatsapp' | 'linkedin' | 'email_reply' | 'followup_sent'

// Activity types that don't require a comment
export const OPTIONAL_COMMENT_TYPES: ActivityType[] = ['followup_sent']

export const ACTIVITY_TYPE_CONFIG: Record<ActivityType, { label: string; icon: string }> = {
  note: { label: 'Note', icon: 'FileText' },
  call: { label: 'Phone Call', icon: 'Phone' },
  meeting: { label: 'Meeting', icon: 'Users' },
  online_call: { label: 'Online Call', icon: 'Video' },
  sms_whatsapp: { label: 'SMS/WhatsApp', icon: 'MessageCircle' },
  linkedin: { label: 'LinkedIn', icon: 'Linkedin' },
  email_reply: { label: 'Email Reply', icon: 'Reply' },
  followup_sent: { label: 'Followup Sent', icon: 'Send' },
}

export interface Communication {
  id: string
  prospectId: string
  type: CommunicationType
  subject?: string
  content: string
  direction?: 'inbound' | 'outbound'
  duration?: number // for calls/meetings in minutes
  attendees?: string[]
  author?: string
  createdAt: string
  aiSummary?: string
}

// ==================================================
// COUNTRIES & CONTACTS
// ==================================================

export interface Country {
  id: string
  name: string
  flagEmoji?: string
  createdAt: string
}

export interface ProspectContact {
  id: string
  prospectId: string
  name: string
  position?: string
  email?: string
  telephone?: string
  linkedinUrl?: string
  isPrimary: boolean
  createdAt: string
  updatedAt: string
}
