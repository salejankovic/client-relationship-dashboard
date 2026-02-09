# Intelligence Feed Improvement Plan

## Implementation Status

### Phase 1: Fix "Refresh Now" Button - DONE
- [x] Extracted all intelligence fetching logic into shared module `lib/intelligence-fetcher.ts`
- [x] "Refresh Now" on feed page now scans ALL non-archived prospects via `/api/fetch-intelligence`
- [x] Progress dialog shows: current prospect being scanned, X of Y counter, green/red indicators per company
- [x] Results summary: total scanned, new items found, errors
- [x] Cancel button to abort mid-scan
- [x] 2-second delay between prospects for Gemini API rate limiting

### Phase 2: Automated Daily Refresh - DONE
- [x] Vercel Cron Job configured in `vercel.json` — runs at 1:00 AM UTC daily
- [x] Cron route at `app/api/cron/refresh-intelligence/route.ts`
- [x] Secured with `CRON_SECRET` Bearer token (needs to be set in Vercel dashboard)
- [x] Processes top 10 "stalest" prospects per run (fits within 60s timeout)
- [x] Priority order: Hot > Warm > Not contacted > Cold
- [x] Skips prospects scanned in last 24 hours
- [x] Uses `intelligence_refresh_log` table for tracking

### Phase 3: Enhanced Intelligence Sources - DONE
- [x] **LinkedIn company page**: Uses Gemini + Google Search grounding to find recent LinkedIn activity (company posts, employee announcements, hiring, milestones). Only triggers when prospect has `linkedinUrl` set.
- [x] **Industry news**: Maps prospect types (Media, Sports Club, Sports League) to relevant industry publications and search terms (Digiday, SportsPro, Press Gazette, etc.). Fetches via Google News RSS + Gemini analysis.
- [x] **Unified orchestrator**: `fetchAllIntelligenceForProspect()` calls all sources: 3-tier news + LinkedIn + industry news

### Phase 4: Intelligence Quality Improvements - DONE
- [x] **Multi-step verification**: After gathering results from all sources, Gemini cross-references them for accuracy. Items confirmed by multiple sources get +10 relevance boost. Items about wrong companies are excluded. Only triggers when 3+ results.
- [x] **Company disambiguation**: `buildDisambiguationContext()` builds detailed company context for all Gemini prompts. `isCommonName()` detects short/ambiguous names (<=4 chars). For ambiguous names, website domain is appended to search queries (e.g., "NIN nin.rs Serbia magazine").

---

## Architecture

### Key Files
| File | Purpose |
|------|---------|
| `lib/intelligence-fetcher.ts` | Shared module with ALL intelligence fetching logic |
| `app/api/fetch-intelligence/route.ts` | POST endpoint — thin wrapper around shared module |
| `app/api/cron/refresh-intelligence/route.ts` | Daily cron job for automated refresh |
| `components/intelligence/refresh-progress-dialog.tsx` | Progress UI for manual refresh |
| `app/acquisition/intelligence/page.tsx` | Intelligence feed page with fixed Refresh Now |
| `vercel.json` | Cron schedule configuration |

### Intelligence Sources (in order of execution)
1. **Gemini + Google Search grounding** (primary) — real-time web search
2. **Google News RSS + Gemini analysis** (fallback 1) — country-specific RSS
3. **Gemini knowledge base** (fallback 2) — if no web results
4. **LinkedIn company page** — Gemini searches for recent LinkedIn activity
5. **Industry news** — RSS for relevant industry publications

### Data Flow
```
User clicks "Refresh Now" on feed page
  → Opens RefreshProgressDialog
  → Loops through non-archived prospects client-side
  → For each: POST /api/fetch-intelligence
    → fetchAllIntelligenceForProspect()
      → fetchIntelligenceWithGemini() [3-tier]
      → fetchLinkedInCompanyIntelligence() [if linkedinUrl]
      → fetchIndustryNews() [if matching prospectType]
      → verifyIntelligenceResults() [if 3+ results]
    → Deduplicate against existing items
    → Save new items to intelligence_items table
    → Update intelligence_refresh_log
  → Progress dialog updates after each prospect
  → On complete: refetch() reloads the feed from DB
```

---

## Environment Variables Needed
- `GEMINI_API_KEY` — already configured
- `CRON_SECRET` — **NEW** — random string for Vercel Cron authentication. Set in Vercel dashboard.

---

## Future Improvements (TODO)
- [ ] Add "last scanned" timestamp per prospect visible in the feed
- [ ] Add per-company "Scan this prospect" button in the feed
- [ ] Company website scraping for press releases
- [ ] Country-specific local news RSS feeds
- [ ] Historical intelligence trending
- [ ] Intelligence scoring refinement based on user feedback (dismissed vs. used)
