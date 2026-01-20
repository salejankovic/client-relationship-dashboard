# Phase 1 Action Plan: Add Acquisition Module

**Goal:** Add prospect management to existing client dashboard without breaking anything.

---

## 👤 WHAT YOU NEED TO DO

### 1. Supabase Database Setup (10 minutes)

#### Step 1.1: Run Migration SQL
1. Open your Supabase project: https://supabase.com/dashboard/project/ycisxbdqddbcwhmyhljo
2. Go to **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy the entire contents of `migrations/001_add_prospects_tables.sql`
5. Paste into the SQL editor
6. Click **Run** (bottom right)
7. ✅ Verify success message: "Success. No rows returned"

#### Step 1.2: Verify Tables Created
1. Go to **Table Editor** in Supabase
2. ✅ Confirm you see these NEW tables:
   - `prospects` (0-1 rows if seed data loaded)
   - `prospect_comments`
   - `intelligence_items`
   - `email_drafts`
   - `ai_insights`
3. ✅ Confirm EXISTING tables are untouched:
   - `clients` (your 10 existing clients)
   - `products`
   - `team_members`

#### Step 1.3: Test Seed Data (Optional)
1. Open **Table Editor** → `prospects`
2. You should see 1 sample prospect: "HRT Croatia"
3. Open `prospect_comments` → should see 1 comment
4. Open `intelligence_items` → should see 1 intelligence item
5. If you see this data, **database setup is complete!** ✅

---

### 2. GitHub Setup (2 minutes)

**Option A: Keep Single Repo (Recommended)**
- ✅ No action needed
- I'll add code to your existing repo
- Push changes to `main` branch
- Vercel will auto-deploy

**Option B: Create Separate Branch**
- Run: `git checkout -b feature/acquisition-module`
- I'll commit changes to this branch
- You can review before merging to `main`

**Which do you prefer?** (Just let me know)

---

### 3. Vercel Setup (0 minutes)

**No action needed!**
- ✅ Existing Vercel deployment will auto-update
- Same environment variables work (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY)
- No new env vars needed for Phase 1

**Later (Phase 5 - AI Features):**
- You'll need to add: `ANTHROPIC_API_KEY` for Claude AI

---

### 4. Verification Checklist

After I complete the code integration, you should:

- [ ] Visit your site (localhost or Vercel URL)
- [ ] ✅ **Existing functionality works:**
  - [ ] Can view clients in main dashboard
  - [ ] Can add/edit/delete clients
  - [ ] Products and team members work
  - [ ] Settings page works
- [ ] ✅ **New acquisition module appears:**
  - [ ] See "Acquisition" link in sidebar
  - [ ] Can visit `/acquisition` route
  - [ ] See sample prospect "HRT Croatia"
  - [ ] Can add new prospects
  - [ ] Can view prospect detail page
- [ ] ✅ **Data persists:**
  - [ ] Add a prospect → refresh page → still there
  - [ ] Edit prospect → changes saved to Supabase
  - [ ] Delete prospect → removed from database

---

## 🤖 WHAT I WILL DO

### 1. Copy v0 Components (15 min)

**Components to integrate:**
- [x] `email-composer-modal.tsx` → Prospect email generation
- [x] `csv-import-modal.tsx` → CSV import wizard
- [x] `ai-insights-card.tsx` → AI analysis display
- [x] `intelligence-card.tsx` → Intelligence feed items
- [x] `prospect-detail-client.tsx` → Prospect detail view
- [x] `app-sidebar.tsx` → Navigation (add acquisition links)
- [x] All shadcn/ui components (already present)

**Strategy:** Copy components directly, minimal changes needed.

---

### 2. Create New Hooks (30 min)

#### `hooks/use-prospects.ts`
Following the same pattern as `use-clients.ts`:
```typescript
export function useProspects() {
  const [prospects, setProspects] = useState<Prospect[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch from Supabase prospects table
  // Real-time subscription to prospect changes
  // CRUD operations: add, update, delete, archive

  return {
    prospects,
    loading,
    addProspect,
    updateProspect,
    deleteProspect,
    archiveProspect,
    unarchiveProspect,
  }
}
```

#### `hooks/use-intelligence.ts`
```typescript
export function useIntelligence(prospectId?: string) {
  // Fetch intelligence items
  // Filter by prospect
  // Dismiss/undismiss items

  return {
    intelligenceItems,
    loading,
    dismissItem,
    undismissItem,
  }
}
```

#### `hooks/use-email-drafts.ts`
```typescript
export function useEmailDrafts(prospectId: string) {
  // Fetch drafts for prospect
  // Generate new draft
  // Save draft to database

  return {
    drafts,
    loading,
    generateDraft,
    saveDraft,
    deleteDraft,
  }
}
```

---

### 3. Create New Routes (20 min)

#### Add to `app/` directory:
```
app/
├── acquisition/               # NEW MODULE
│   ├── layout.tsx            # Acquisition-specific layout
│   ├── page.tsx              # Dashboard with AI briefing
│   ├── prospects/
│   │   ├── page.tsx          # Prospect list view
│   │   └── [id]/
│   │       └── page.tsx      # Prospect detail view
│   ├── intelligence/
│   │   └── page.tsx          # Intelligence feed
│   ├── import/
│   │   └── page.tsx          # CSV import wizard
│   └── archive/
│       └── page.tsx          # Archived prospects
```

#### Existing routes (UNCHANGED):
```
app/
├── page.tsx                   # Main client dashboard (existing)
├── settings/                  # Settings (existing)
```

---

### 4. Update Type Definitions (10 min)

Add to `lib/types.ts`:
```typescript
// Prospect Types
export type ProspectStatus = 'Hot' | 'Warm' | 'Cold' | 'Lost'
export type ProspectType = 'Media' | 'Sports Club' | 'Sports League' | 'Other'
export type ProductType = 'Mobile app' | 'Website/CMS' | 'LitteraWorks' | 'CMS' | 'Other'

export interface Prospect {
  id: string
  company: string
  contactPerson?: string
  email?: string
  telephone?: string
  website?: string
  linkedinUrl?: string

  productType?: ProductType
  prospectType?: ProspectType
  country?: string

  status: ProspectStatus
  owner?: string
  source?: string
  dealValue?: number

  nextAction?: string
  nextActionDate?: string
  lastContactDate?: string
  daysSinceContact?: number

  archived: boolean
  archivedDate?: string
  archiveReason?: string

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
  sourceType: 'linkedin' | 'news' | 'sports' | 'job-change' | 'funding' | 'other'
  url?: string
  imageUrl?: string
  publishedAt?: string
  createdAt: string
  dismissed: boolean
  aiTip?: string
  relevanceScore?: number
}

export interface EmailDraft {
  id: string
  prospectId: string
  subject: string
  body: string
  tone?: string
  goal?: string
  language?: string
  sentAt?: string
  openedAt?: string
  repliedAt?: string
  aiModel?: string
  createdAt: string
}

export interface AIInsight {
  id: string
  prospectId: string
  sentiment: 'positive' | 'neutral' | 'negative'
  engagementScore: number
  riskLevel: 'low' | 'medium' | 'high'
  recommendedAction?: string
  bestTimeToReach?: string
  keyTopics?: string[]
  generatedAt: string
  aiModel?: string
}
```

---

### 5. Update Navigation (5 min)

Modify `components/app-sidebar.tsx` or create new sidebar:
```typescript
const navigationItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: Home,
  },
  {
    title: "Clients",
    url: "/clients", // NEW - move existing dashboard here
    icon: Building,
  },
  {
    title: "Acquisition", // NEW SECTION
    url: "/acquisition",
    icon: Target,
    items: [
      {
        title: "Prospects",
        url: "/acquisition/prospects",
      },
      {
        title: "Intelligence",
        url: "/acquisition/intelligence",
      },
      {
        title: "Import",
        url: "/acquisition/import",
      },
      {
        title: "Archive",
        url: "/acquisition/archive",
      },
    ]
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
  },
]
```

---

### 6. Test & Verify (30 min)

#### Testing Checklist:
- [ ] **Existing functionality preserved:**
  - [ ] Client dashboard loads
  - [ ] Can add/edit clients
  - [ ] Products work
  - [ ] Team members work
  - [ ] No console errors

- [ ] **New prospect features work:**
  - [ ] Can add prospect
  - [ ] Prospect saves to Supabase `prospects` table
  - [ ] Can edit prospect details
  - [ ] Can add comments (activity timeline)
  - [ ] Comments save to `prospect_comments` table
  - [ ] Can archive prospect
  - [ ] Archived prospects appear in archive page
  - [ ] Can unarchive prospect

- [ ] **UI/UX polish:**
  - [ ] Navigation smooth between modules
  - [ ] Loading states show correctly
  - [ ] Error messages display
  - [ ] Success toasts appear
  - [ ] Dark mode works

---

### 7. Migration Safety (5 min)

**Rollback Plan:**
If anything breaks, I can:
1. Revert git commit
2. Redeploy previous Vercel version
3. Keep database changes (they don't affect existing tables)
4. No data loss

**Backup:**
- I'll create git tag: `pre-acquisition-module`
- You can rollback: `git reset --hard pre-acquisition-module`

---

## 📊 ESTIMATED TIMELINE

| Task | Time | Status |
|------|------|--------|
| **YOU: Supabase migration** | 10 min | ⏸️ Waiting |
| **ME: Copy components** | 15 min | ⏸️ Ready |
| **ME: Create hooks** | 30 min | ⏸️ Ready |
| **ME: Create routes** | 20 min | ⏸️ Ready |
| **ME: Update types** | 10 min | ⏸️ Ready |
| **ME: Update navigation** | 5 min | ⏸️ Ready |
| **ME: Test & verify** | 30 min | ⏸️ Ready |
| **Total** | ~2 hours | |

---

## 🚀 GETTING STARTED

### You Do First:
1. ✅ Run Supabase migration (10 min)
2. ✅ Tell me: Single repo or feature branch?
3. ✅ Confirm migration successful

### I Do Next:
1. ✅ Integrate v0 components
2. ✅ Create hooks for Supabase
3. ✅ Build acquisition routes
4. ✅ Update navigation
5. ✅ Test everything
6. ✅ Commit & push to GitHub
7. ✅ Verify Vercel deployment

---

## ❓ QUESTIONS TO ANSWER

Before I start coding, please confirm:

1. **GitHub Strategy:**
   - [ ] Option A: Push directly to `main` branch
   - [ ] Option B: Create `feature/acquisition-module` branch

2. **Route Structure:**
   - [ ] Option A: `/acquisition/*` for prospects (recommended)
   - [ ] Option B: `/prospects/*` for prospects

3. **Navigation:**
   - [ ] Option A: Sidebar with "Clients" and "Acquisition" sections
   - [ ] Option B: Header tabs to switch modules
   - [ ] Option C: Both (sidebar + module switcher badge)

4. **Existing Dashboard:**
   - [ ] Option A: Keep at `/` (root) - still shows clients
   - [ ] Option B: Move to `/clients` - root becomes overview of both modules

---

## 🎯 PHASE 1 SUCCESS CRITERIA

**You'll know Phase 1 is complete when:**

✅ **Database:**
- [ ] 5 new Supabase tables exist
- [ ] Sample prospect "HRT Croatia" visible in database
- [ ] Can add prospects via UI → appears in `prospects` table

✅ **UI:**
- [ ] See "Acquisition" in navigation
- [ ] Can visit `/acquisition` route
- [ ] Prospect list page loads with filters
- [ ] Prospect detail page shows all info
- [ ] Can add/edit/delete prospects
- [ ] Email composer modal opens
- [ ] CSV import wizard opens

✅ **Data Integrity:**
- [ ] Existing client data untouched
- [ ] Can still manage clients as before
- [ ] Products/team members work
- [ ] Real-time updates work

✅ **No Regressions:**
- [ ] No console errors
- [ ] No build errors
- [ ] Vercel deployment successful
- [ ] All existing pages load

---

## 🔧 TROUBLESHOOTING

### If Migration Fails:
- **Error: relation already exists**
  - Table already created
  - Delete table in Supabase Table Editor
  - Re-run migration

- **Error: permission denied**
  - Check Supabase project permissions
  - Verify you're in correct project

### If UI Doesn't Show:
- **Acquisition link missing**
  - Check sidebar component updated
  - Clear browser cache
  - Hard refresh (Ctrl+Shift+R)

- **Routes 404 error**
  - Verify files in `app/acquisition/`
  - Check Next.js build output
  - Restart dev server

### If Data Doesn't Save:
- **Check Supabase connection**
  - Verify env vars: `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - Test in Supabase SQL Editor: `SELECT * FROM prospects`

- **RLS policy blocking**
  - Verify policies created (open access)
  - Check Supabase logs for errors

---

## 📞 READY TO START?

**Just tell me:**
1. ✅ "Migration complete" (after running SQL)
2. Your preferred GitHub strategy (A or B)
3. Your preferred route structure (A or B)
4. Your preferred navigation (A, B, or C)

Then I'll start integrating! 🚀

---

**Last Updated:** 2026-01-20
**Estimated Completion:** 2 hours from start
