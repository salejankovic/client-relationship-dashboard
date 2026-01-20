# Client Relationship Dashboard - Platform Documentation

**Last Updated:** January 2026
**Version:** 2.0 (with Client Acquisition module)

---

## Platform Overview

A unified client relationship management platform with two integrated modules:

1. **Client Management** (`/clients/*`) - Manage existing client relationships, projects, and deliverables
2. **Client Acquisition** (`/acquisition/*`) - Sales pipeline, prospect tracking, and deal management

Both modules share a unified database and common components while maintaining distinct workflows optimized for their respective use cases.

---

## Architecture

### Tech Stack
- **Framework:** Next.js 15.5.9 (App Router)
- **UI:** React 19 + TypeScript
- **Styling:** Tailwind CSS 4 + shadcn/ui
- **Database:** Supabase (PostgreSQL)
- **Deployment:** Vercel
- **Real-time:** Supabase Realtime subscriptions
- **AI:** Anthropic Claude API (for acquisition module)

### Core Principles
1. **Unified Data Model** - Single source of truth with status-based separation
2. **Route-based Modules** - Clear separation via `/clients/*` and `/acquisition/*`
3. **Shared Components** - Reuse UI components across both modules
4. **Optimistic Updates** - Instant UI feedback with rollback on errors
5. **Type Safety** - Full TypeScript coverage

---

## Database Schema

### Enhanced `companies` Table
**Unified table for both prospects and clients:**

```sql
CREATE TABLE companies (
  id TEXT PRIMARY KEY,

  -- Basic Info
  name TEXT NOT NULL,
  logo_url TEXT,
  website TEXT,
  city TEXT,
  country TEXT,

  -- Classification
  type TEXT NOT NULL CHECK (type IN ('prospect', 'client')),
  category TEXT CHECK (category IN ('Media', 'Sport')),
  status TEXT CHECK (status IN ('active', 'pending', 'inactive')),

  -- Acquisition Fields (for prospects)
  deal_value NUMERIC,
  expected_close_date DATE,
  health_status TEXT CHECK (health_status IN ('active', 'cooling', 'cold', 'frozen')),
  last_contact_date TIMESTAMPTZ,
  acquisition_source TEXT,

  -- Client Management Fields (for clients)
  products TEXT[],
  next_action TEXT,
  next_action_date DATE,
  assigned_to TEXT,
  notes TEXT,
  upsell_strategy TEXT[],

  -- Nested Data (JSONB)
  contacts JSONB DEFAULT '[]'::jsonb,
  todos JSONB DEFAULT '[]'::jsonb,
  activity JSONB DEFAULT '[]'::jsonb,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  converted_at TIMESTAMPTZ, -- When prospect became client
  converted_by TEXT
);

-- Indexes
CREATE INDEX idx_companies_type ON companies(type);
CREATE INDEX idx_companies_category ON companies(category);
CREATE INDEX idx_companies_status ON companies(status);
CREATE INDEX idx_companies_health_status ON companies(health_status);
CREATE INDEX idx_companies_assigned_to ON companies(assigned_to);
CREATE INDEX idx_companies_expected_close_date ON companies(expected_close_date);
```

### New `email_drafts` Table
**AI-generated emails for prospects:**

```sql
CREATE TABLE email_drafts (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id TEXT REFERENCES companies(id) ON DELETE CASCADE,
  contact_id TEXT, -- JSON path to contact in company.contacts

  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  tone TEXT, -- 'professional', 'casual', 'urgent'

  generated_at TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  replied_at TIMESTAMPTZ,

  ai_model TEXT, -- 'claude-3-opus', etc.
  prompt_context JSONB, -- What info was used to generate

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_email_drafts_company ON email_drafts(company_id);
CREATE INDEX idx_email_drafts_sent ON email_drafts(sent_at);
```

### New `intelligence_feed` Table
**External intelligence about prospects:**

```sql
CREATE TABLE intelligence_feed (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id TEXT REFERENCES companies(id) ON DELETE CASCADE,

  source_type TEXT NOT NULL CHECK (source_type IN ('linkedin', 'news', 'sports', 'manual')),
  title TEXT NOT NULL,
  summary TEXT,
  url TEXT,
  image_url TEXT,

  relevance_score NUMERIC, -- 0-100
  tags TEXT[],

  published_at TIMESTAMPTZ,
  ingested_at TIMESTAMPTZ DEFAULT NOW(),

  metadata JSONB -- Source-specific data
);

CREATE INDEX idx_intelligence_company ON intelligence_feed(company_id);
CREATE INDEX idx_intelligence_source ON intelligence_feed(source_type);
CREATE INDEX idx_intelligence_published ON intelligence_feed(published_at DESC);
```

### New `follow_up_queue` Table
**Automated follow-up suggestions:**

```sql
CREATE TABLE follow_up_queue (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id TEXT REFERENCES companies(id) ON DELETE CASCADE,

  suggested_date DATE NOT NULL,
  priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  reason TEXT, -- Why this follow-up is suggested

  ai_suggestion TEXT, -- AI-generated follow-up message
  ai_reasoning JSONB, -- Why AI suggested this

  status TEXT CHECK (status IN ('pending', 'scheduled', 'completed', 'dismissed')),

  completed_at TIMESTAMPTZ,
  dismissed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_followup_company ON follow_up_queue(company_id);
CREATE INDEX idx_followup_date ON follow_up_queue(suggested_date);
CREATE INDEX idx_followup_status ON follow_up_queue(status);
```

### Existing Tables (Unchanged)
- `products` - Product catalog with colors
- `team_members` - Team members for assignment

---

## Folder Structure

```
/client-relationship-dashboard/
├── app/
│   ├── layout.tsx (Root layout with module switcher)
│   ├── page.tsx (Landing dashboard - overview of both modules)
│   │
│   ├── clients/ (Existing Client Management Module)
│   │   ├── page.tsx (Client list + profile)
│   │   └── [id]/
│   │       └── page.tsx (Individual client detail)
│   │
│   ├── acquisition/ (NEW - Sales/Acquisition Module)
│   │   ├── layout.tsx (Acquisition-specific layout)
│   │   ├── page.tsx (Pipeline board view)
│   │   ├── prospects/
│   │   │   └── [id]/
│   │   │       └── page.tsx (Prospect detail)
│   │   ├── follow-ups/
│   │   │   └── page.tsx (Follow-up queue)
│   │   ├── intelligence/
│   │   │   └── page.tsx (Intelligence feed)
│   │   └── import/
│   │       └── page.tsx (CSV import wizard)
│   │
│   ├── settings/ (Shared settings)
│   │   ├── page.tsx (General settings)
│   │   ├── products/
│   │   ├── team/
│   │   └── integrations/ (NEW - API keys, Gmail, etc.)
│   │
│   └── api/ (NEW - API routes)
│       ├── ai/
│       │   ├── generate-email/
│       │   │   └── route.ts
│       │   └── suggest-followup/
│       │       └── route.ts
│       └── intelligence/
│           ├── linkedin/
│           │   └── route.ts
│           └── news/
│               └── route.ts
│
├── components/
│   ├── shared/ (Shared across modules)
│   │   ├── company-card.tsx
│   │   ├── contact-list.tsx
│   │   ├── activity-timeline.tsx
│   │   ├── module-switcher.tsx (NEW)
│   │   └── conversion-modal.tsx (NEW)
│   │
│   ├── clients/ (Client-specific components)
│   │   ├── client-list.tsx (existing)
│   │   ├── client-profile.tsx (existing)
│   │   └── product-manager.tsx
│   │
│   ├── acquisition/ (NEW - Acquisition-specific)
│   │   ├── prospect-board.tsx
│   │   ├── prospect-card.tsx
│   │   ├── health-indicator.tsx
│   │   ├── email-generator.tsx
│   │   ├── intelligence-card.tsx
│   │   ├── follow-up-item.tsx
│   │   └── csv-import-wizard.tsx
│   │
│   └── ui/ (shadcn/ui components - unchanged)
│
├── hooks/
│   ├── use-companies.ts (NEW - unified hook)
│   ├── use-clients.ts (refactored to use companies)
│   ├── use-prospects.ts (NEW)
│   ├── use-email-drafts.ts (NEW)
│   ├── use-intelligence.ts (NEW)
│   ├── use-follow-ups.ts (NEW)
│   ├── use-products.ts (existing)
│   └── use-team-members.ts (existing)
│
├── lib/
│   ├── types.ts (Extended types)
│   ├── supabase.ts (existing)
│   ├── claude-client.ts (NEW - Claude API wrapper)
│   ├── linkedin-scraper.ts (NEW)
│   ├── news-fetcher.ts (NEW)
│   ├── gmail-integration.ts (NEW)
│   ├── csv-parser.ts (NEW)
│   └── health-calculator.ts (NEW - Auto-calculate health status)
│
└── migrations/ (NEW - Database migrations)
    ├── 001_add_acquisition_tables.sql
    ├── 002_migrate_clients_to_companies.sql
    └── 003_add_intelligence_tables.sql
```

---

## Type Definitions

### Extended Types (`lib/types.ts`)

```typescript
// Company Types
export type CompanyType = 'prospect' | 'client'
export type HealthStatus = 'active' | 'cooling' | 'cold' | 'frozen'
export type AcquisitionSource = 'inbound' | 'outbound' | 'referral' | 'event' | 'other'

// Existing Types (unchanged)
export type ClientCategory = 'Media' | 'Sport'
export type ClientStatus = 'active' | 'pending' | 'inactive'
export type Product = 'Pchella' | 'TTS' | 'Litteraworks' | 'Mobile App' | 'e-Kiosk' | 'Komentari' | 'CMS'

// Unified Company Interface
export interface Company {
  id: string
  name: string
  logoUrl?: string
  website?: string
  city?: string
  country?: string

  // Classification
  type: CompanyType
  category?: ClientCategory
  status?: ClientStatus

  // Acquisition Fields (for prospects)
  dealValue?: number
  expectedCloseDate?: string
  healthStatus?: HealthStatus
  lastContactDate?: string
  acquisitionSource?: AcquisitionSource

  // Client Fields (for clients)
  products?: Product[]
  nextAction?: string
  nextActionDate?: string
  assignedTo?: string
  notes?: string
  upsellStrategy?: Product[]

  // Shared Fields
  contacts: Contact[]
  todos: TodoItem[]
  activity: ActivityLog[]

  // Metadata
  createdAt?: string
  updatedAt?: string
  convertedAt?: string
  convertedBy?: string
}

// Convenience type aliases
export type Prospect = Company & { type: 'prospect' }
export type Client = Company & { type: 'client' }

// Email Draft
export interface EmailDraft {
  id: string
  companyId: string
  contactId?: string
  subject: string
  body: string
  tone?: 'professional' | 'casual' | 'urgent'
  generatedAt: string
  sentAt?: string
  openedAt?: string
  repliedAt?: string
  aiModel?: string
  promptContext?: Record<string, any>
}

// Intelligence Feed
export interface IntelligenceItem {
  id: string
  companyId: string
  sourceType: 'linkedin' | 'news' | 'sports' | 'manual'
  title: string
  summary?: string
  url?: string
  imageUrl?: string
  relevanceScore?: number
  tags?: string[]
  publishedAt?: string
  ingestedAt: string
  metadata?: Record<string, any>
}

// Follow-up Queue
export interface FollowUp {
  id: string
  companyId: string
  suggestedDate: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  reason?: string
  aiSuggestion?: string
  aiReasoning?: Record<string, any>
  status: 'pending' | 'scheduled' | 'completed' | 'dismissed'
  completedAt?: string
  dismissedAt?: string
  createdAt: string
}
```

---

## Migration Plan

### Phase 1: Database Migration (Non-Breaking)
**Goal:** Add new tables without touching existing data

1. ✅ Create `email_drafts` table
2. ✅ Create `intelligence_feed` table
3. ✅ Create `follow_up_queue` table
4. ⏸️ Keep `clients` table as-is (rename later)

**Status:** Safe - no risk to existing functionality

---

### Phase 2: Add Acquisition Routes (Isolated)
**Goal:** Build acquisition module without affecting client management

1. ✅ Create `/app/acquisition/` folder structure
2. ✅ Build acquisition-specific components
3. ✅ Create acquisition hooks (use-prospects, use-email-drafts, etc.)
4. ✅ Add API routes for AI features
5. ✅ Test acquisition module independently

**Status:** Safe - completely separate from existing code

---

### Phase 3: Unify Data Model (Coordinated)
**Goal:** Merge `clients` table into `companies` table

1. 🔄 Create `companies` table with unified schema
2. 🔄 Migrate all existing clients → companies (type='client')
3. 🔄 Update `useClients` hook to query `companies` table
4. 🔄 Test client management module works with new table
5. 🔄 Drop old `clients` table after verification

**Status:** Requires careful coordination - backup database first

---

### Phase 4: Add Module Switcher
**Goal:** UI to toggle between modules

1. ✅ Create `<ModuleSwitcher>` component in sidebar/header
2. ✅ Update root layout with switcher
3. ✅ Add routing logic (preserve selected module in URL)
4. ✅ Add "Convert to Client" flow

**Status:** Low risk - pure UI enhancement

---

### Phase 5: AI Features
**Goal:** Integrate Claude API for email generation

1. ✅ Set up Claude API client (`lib/claude-client.ts`)
2. ✅ Create `/api/ai/generate-email` endpoint
3. ✅ Build `<EmailGenerator>` component
4. ✅ Add prompt templates
5. ✅ Test AI generation flow

**Status:** New feature - no impact on existing

---

### Phase 6: Intelligence Feed
**Goal:** Automated intelligence gathering

1. ✅ LinkedIn integration (web scraping or API)
2. ✅ News API integration (NewsAPI.org or similar)
3. ✅ Sports results (API-Football or similar)
4. ✅ Build intelligence dashboard
5. ✅ Add relevance scoring

**Status:** New feature - independent module

---

### Phase 7: CSV Import
**Goal:** Bulk import prospects

1. ✅ Build CSV parser (`lib/csv-parser.ts`)
2. ✅ Create import wizard UI
3. ✅ Add field mapping interface
4. ✅ Validate and preview before import
5. ✅ Bulk insert with progress tracking

**Status:** New feature - standalone tool

---

## Shared vs Module-Specific Components

### ✅ Shared Components (Reusable)
- `<Card>`, `<Button>`, `<Input>` (shadcn/ui primitives)
- `<CompanyCard>` - Display company info (works for both prospects/clients)
- `<ContactList>` - Manage contacts
- `<ActivityTimeline>` - Show activity history
- `<TodoList>` - Todo management
- `<ModuleSwitcher>` - Toggle between modules

### 📦 Client-Specific Components
- `<ClientList>` - Filter/search clients
- `<ClientProfile>` - Full client detail view
- `<ProductManager>` - Manage products per client
- `<UpsellStrategy>` - Upsell planning

### 🎯 Acquisition-Specific Components
- `<ProspectBoard>` - Kanban board (active/cooling/cold/frozen)
- `<HealthIndicator>` - Visual health status
- `<EmailGenerator>` - AI email composition
- `<IntelligenceFeed>` - External intelligence cards
- `<FollowUpQueue>` - Prioritized follow-up list
- `<CSVImportWizard>` - Bulk import tool

---

## Conversion Flow

### Prospect → Client Journey

```
┌─────────────────────┐
│  Prospect Detail    │
│  (Health: Active)   │
└──────────┬──────────┘
           │
           │ User clicks "Convert to Client"
           ▼
┌─────────────────────┐
│ Confirmation Modal  │
│ "Ready to onboard?" │
│ [Cancel] [Convert]  │
└──────────┬──────────┘
           │
           │ User confirms
           ▼
┌─────────────────────┐
│  Update Database    │
│  type: 'client'     │
│  convertedAt: NOW   │
│  convertedBy: user  │
└──────────┬──────────┘
           │
           │ Success
           ▼
┌─────────────────────┐
│  🎉 Confetti!       │
│  "Welcome aboard!"  │
└──────────┬──────────┘
           │
           │ Redirect (2s delay)
           ▼
┌─────────────────────┐
│  Client Profile     │
│  /clients/[id]      │
└─────────────────────┘
```

### Implementation Details

```typescript
// components/shared/conversion-modal.tsx
export function ConversionModal({ prospect, onConvert }) {
  const handleConvert = async () => {
    // Update company type
    await updateCompany(prospect.id, {
      type: 'client',
      status: 'active',
      convertedAt: new Date().toISOString(),
      convertedBy: currentUser,
    })

    // Trigger confetti
    confetti()

    // Show success message
    toast.success("🎉 Converted to client!")

    // Redirect after 2 seconds
    setTimeout(() => {
      router.push(`/clients/${prospect.id}`)
    }, 2000)
  }

  return (
    <Dialog>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Convert to Client?</DialogTitle>
          <DialogDescription>
            This will move {prospect.name} from the acquisition pipeline
            to active client management.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleConvert}>Convert to Client</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

---

## Environment Variables

```env
# Existing
NEXT_PUBLIC_SUPABASE_URL=https://ycisxbdqddbcwhmyhljo.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# NEW - Claude AI
ANTHROPIC_API_KEY=sk-ant-xxx

# NEW - Intelligence Feeds
NEWSAPI_KEY=xxx
LINKEDIN_API_KEY=xxx (if using official API)
API_FOOTBALL_KEY=xxx

# NEW - Gmail Integration
GMAIL_CLIENT_ID=xxx
GMAIL_CLIENT_SECRET=xxx
GMAIL_REFRESH_TOKEN=xxx
```

---

## Implementation Checklist

### ✅ Completed
- [x] Existing client management platform
- [x] Supabase integration
- [x] Real-time subscriptions
- [x] Optimistic updates
- [x] TypeScript types

### 🚧 In Progress
- [ ] Database migration (Phase 1)
- [ ] Acquisition routes (Phase 2)
- [ ] Module switcher (Phase 4)

### 📋 To Do
- [ ] Unify data model (Phase 3)
- [ ] AI email generation (Phase 5)
- [ ] Intelligence feed (Phase 6)
- [ ] CSV import (Phase 7)
- [ ] Gmail integration
- [ ] Health status automation

---

## Design Principles

### 1. Don't Break Existing Functionality
- All new features in separate routes
- Database migrations are additive (no deletions until verified)
- Existing hooks remain backward compatible

### 2. Preserve Existing Data
- Migration scripts create backups
- Rollback plan for each phase
- No data loss during transition

### 3. Keep the Same Auth System
- No auth system currently (internal tool)
- Continue with open RLS policies
- Future: Add auth if needed

### 4. Match Existing Design Language
- Use existing shadcn/ui components
- Follow Tailwind color scheme
- Maintain dark/light mode support
- Keep same spacing/typography

### 5. Modular Architecture
- Each module can function independently
- Shared components are truly reusable
- Clear separation of concerns

---

## API Routes (NEW)

### `/api/ai/generate-email`
**POST** - Generate AI email draft
```typescript
Request: {
  companyId: string
  contactId?: string
  tone: 'professional' | 'casual' | 'urgent'
  context?: string
}

Response: {
  subject: string
  body: string
  draftId: string
}
```

### `/api/ai/suggest-followup`
**POST** - Get AI follow-up suggestions
```typescript
Request: {
  companyId: string
}

Response: {
  suggestedDate: string
  priority: string
  reason: string
  message: string
}
```

### `/api/intelligence/linkedin`
**GET** - Fetch LinkedIn company updates
```typescript
Query: ?companyName=xxx

Response: {
  items: IntelligenceItem[]
}
```

### `/api/intelligence/news`
**GET** - Fetch news articles
```typescript
Query: ?companyName=xxx&category=sports

Response: {
  items: IntelligenceItem[]
}
```

---

## Health Status Calculation

**Automatic health scoring based on last contact:**

```typescript
// lib/health-calculator.ts
export function calculateHealthStatus(lastContactDate: string): HealthStatus {
  const daysSinceContact = daysBetween(new Date(lastContactDate), new Date())

  if (daysSinceContact <= 7) return 'active'       // Last 7 days
  if (daysSinceContact <= 21) return 'cooling'     // 1-3 weeks
  if (daysSinceContact <= 60) return 'cold'        // 3 weeks - 2 months
  return 'frozen'                                   // 2+ months
}

// Auto-update health status daily
export async function updateHealthStatuses() {
  const prospects = await supabase
    .from('companies')
    .select('*')
    .eq('type', 'prospect')

  for (const prospect of prospects) {
    const newHealth = calculateHealthStatus(prospect.lastContactDate)
    if (newHealth !== prospect.healthStatus) {
      await supabase
        .from('companies')
        .update({ healthStatus: newHealth })
        .eq('id', prospect.id)
    }
  }
}
```

**Run as cron job or edge function (daily at midnight)**

---

## Testing Strategy

### Unit Tests
- Database migration scripts
- Health status calculator
- CSV parser
- AI prompt generation

### Integration Tests
- Conversion flow (prospect → client)
- Email generation pipeline
- Intelligence feed ingestion
- Real-time subscription updates

### E2E Tests
- Complete prospect lifecycle
- CSV import wizard
- Module switching
- Data consistency across modules

---

## Deployment

### Vercel Configuration
```json
{
  "env": {
    "ANTHROPIC_API_KEY": "@anthropic-api-key",
    "NEWSAPI_KEY": "@newsapi-key"
  },
  "crons": [
    {
      "path": "/api/cron/update-health-statuses",
      "schedule": "0 0 * * *"
    }
  ]
}
```

### Build Process
1. TypeScript compilation
2. Database migration check
3. Environment variable validation
4. Edge function deployment (health status updater)

---

## Monitoring & Analytics

### Track Key Metrics
- Conversion rate (prospect → client)
- Health status distribution
- Email open/reply rates
- Time to close (acquisition)
- Average deal value
- Intelligence feed relevance

### Vercel Analytics
- Already integrated via `@vercel/analytics`
- Track page views per module
- Monitor performance

---

## Future Enhancements

### Phase 8+
- [ ] Email tracking (open/click rates)
- [ ] Automated follow-up reminders
- [ ] Deal stage customization
- [ ] Custom fields per company
- [ ] Multi-user authentication
- [ ] Role-based permissions
- [ ] Mobile app (React Native)
- [ ] Slack notifications
- [ ] Calendar integration
- [ ] Document management
- [ ] Reporting dashboard
- [ ] Export to PDF/Excel

---

## Support & Maintenance

### Backup Strategy
- Daily Supabase backups
- Point-in-time recovery enabled
- Export data to CSV weekly

### Update Process
1. Test migrations in staging environment
2. Backup production database
3. Deploy migrations
4. Deploy new code
5. Monitor for errors
6. Rollback if needed

---

## Questions & Decisions

### Open Questions
1. ❓ Should prospects and clients share the same detail view, or have completely separate UIs?
2. ❓ Email tracking: Use Sendgrid webhooks or build custom tracker?
3. ❓ LinkedIn scraping: Use official API (expensive) or web scraping (fragile)?
4. ❓ Health status: Allow manual override or always auto-calculate?
5. ❓ CSV import: Support scheduled imports or one-time only?

### Decisions Made
- ✅ Unified `companies` table (type-based separation)
- ✅ Route-based modules (`/clients/*` vs `/acquisition/*`)
- ✅ No authentication (internal tool)
- ✅ Claude API for AI features
- ✅ shadcn/ui for all new components
- ✅ Optimistic updates pattern throughout

---

## Contact

**Project Owner:** Janko
**Repository:** https://github.com/salejankovic/client-relationship-dashboard
**Deployment:** Vercel
**Database:** Supabase (ycisxbdqddbcwhmyhljo.supabase.co)

---

**Last Updated:** January 20, 2026
**Next Review:** After Phase 2 completion
