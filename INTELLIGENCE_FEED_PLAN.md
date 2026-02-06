# Intelligence Feed Improvement Plan

## Current Status

### How it works now
- **Individual prospect page**: Clicking "Refresh Now" on a prospect's page calls `/api/fetch-intelligence` which actually searches the web using Gemini + Google Search grounding (3-tier fallback: Google Search grounding -> Google News RSS + Gemini -> Gemini knowledge base). New items are saved to the `intelligence_items` table.
- **Intelligence Feed page**: The "Refresh Now" button **only re-reads from the database**. It does NOT fetch new intelligence from the web. This means the button is essentially broken/misleading.

### What's working
- [x] 3-tier intelligence fetching (Gemini grounding, RSS, knowledge base)
- [x] Relevance scoring (0-100) with smart filtering
- [x] Company-type filtering (media vs sports vs general)
- [x] Duplicate detection (URL + title matching)
- [x] Country-specific locale for news search
- [x] Intelligence type categorization (news, company update, job change, funding, match result)
- [x] AI-generated actionable sales tips
- [x] Dismiss/undismiss functionality
- [x] Follow-up email generation from intelligence items

### What's broken / missing
- [ ] "Refresh Now" on feed page doesn't fetch new intelligence
- [ ] No automated/scheduled intelligence gathering
- [ ] No progress indicator showing which prospects are being scanned
- [ ] No way to prioritize which prospects to scan first

---

## Proposed Improvements

### Phase 1: Fix the "Refresh Now" Button (Priority: HIGH)
**Goal**: Make the Refresh Now button actually fetch new intelligence for all prospects.

**Option A - Sequential scan (simpler)**
- When "Refresh Now" is clicked, loop through all non-archived prospects
- Call `/api/fetch-intelligence` for each one sequentially
- Show progress: "Scanning prospect 3 of 45... (Chelsea FC)"
- Show results summary: "Found 12 new items across 45 prospects"

**Option B - Batch API endpoint (more robust)**
- Create a new endpoint `/api/fetch-intelligence/batch` that accepts an array of prospects
- Process them in parallel (with rate limiting, e.g., 3-5 concurrent)
- Return aggregated results
- Show progress via streaming or polling

**Recommendation**: Start with Option A for simplicity, upgrade to B later if needed.

### Phase 2: Smart Refresh Priorities (Priority: MEDIUM)
- Track when each prospect was last scanned (`intelligence_refresh_log` table already exists)
- Sort prospects by "staleness" - scan those not refreshed in longest time first
- Skip recently scanned prospects (e.g., scanned in last 24 hours)
- Allow manual "force refresh" for a specific prospect from the feed

### Phase 3: Automated Scheduled Refresh (Priority: MEDIUM)
- Add a background job that runs daily (or on a schedule)
- Options:
  - **Vercel Cron Jobs** - serverless, easy to set up
  - **Supabase Edge Functions** with pg_cron
  - **External scheduler** (e.g., GitHub Actions)
- Scan all prospects on a rotating basis (e.g., 10 per day)
- Prioritize "Hot" and "Warm" prospects for more frequent scans

### Phase 4: Enhanced Intelligence Sources (Priority: LOW)
- [ ] **Company website scraping**: Scan prospect websites for press releases/news pages
- [ ] **LinkedIn company page**: Monitor company updates (requires LinkedIn API or scraping)
- [ ] **Country-specific news sources**: Add local news RSS feeds for each country
- [ ] **Google Alerts style**: Set up keyword monitoring for each prospect
- [ ] **Industry news**: Track relevant industry publications

### Phase 5: Intelligence Quality Improvements (Priority: LOW)
- [ ] **Multi-step verification**: Cross-reference results from different sources
- [ ] **Company disambiguation**: Better handling of companies with common names
- [ ] **Historical intelligence**: Track intelligence over time, show trends
- [ ] **Intelligence scoring refinement**: Learn from user feedback (dismissed vs. used items)

---

## Quick Wins (Can do now)

1. **Fix the Refresh Now button** - Make it actually scan all prospects
2. **Add scan progress indicator** - Show which prospect is being scanned
3. **Add "last scanned" per prospect** - Show when each prospect was last checked
4. **Add a "Scan this prospect" button** per intelligence card group - so you can refresh just one company from the feed

---

## Decision Points (Need your input)

1. Should "Refresh Now" scan ALL prospects or just a subset (e.g., top 20 by priority)?
2. Do we want automated daily scans? If so, what time?
3. Should we add website scraping as a source?
4. Any specific news sources or RSS feeds to add for specific countries/industries?
