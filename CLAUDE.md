# Claude Code Project Notes

## AI Models Used

All AI features use **`gemini-2.5-flash`** for consistency and reliability.

### Intelligence Fetching (`app/api/fetch-intelligence/route.ts`)
- **Purpose**: Fetch and analyze news/intelligence about prospects
- **Features**:
  - Primary: Gemini with Google Search grounding for real-time web search
  - Fallback 1: Google News RSS + Gemini analysis
  - Fallback 2: Gemini knowledge base (if RSS fails)

### Email Generation (`app/api/intelligence/generate-followup/route.ts`)
- **Purpose**: Generate follow-up emails based on intelligence

### AI Insights (`app/api/generate-insights/route.ts`)
- **Purpose**: Analyze prospect engagement and provide recommendations
- **Caching**: 24-hour localStorage cache per prospect (`components/ai-insights-card.tsx`)
  - Auto-refreshes only if cache is older than 24 hours
  - Shows "Updated X ago" timestamp on the card
  - Manual refresh button forces regeneration

### Email Drafts (`app/api/generate-email/route.ts`)
- **Purpose**: Generate personalized sales emails

## Intelligence System Architecture

### Data Flow
1. User clicks "Refresh Now" on prospect page
2. API receives: companyName, prospectId, website, prospectType, country
3. Try Gemini with Google Search grounding first
4. If fails/empty, fallback to Google News RSS + Gemini analysis
5. Filter by relevance score (>= 50)
6. Save to `intelligence_items` table

### Company Type Filtering
- **Media companies**: Only show news ABOUT the company, not articles they published
- **Sports teams**: Focus on sponsorships, stadium, leadership, financials; exclude injuries/routine matches

### Relevance Scoring (0-100)
- 80-100: New leadership, funding, expansion, tech adoption, sponsorships
- 60-79: Financial results, product launches, major wins
- 40-59: General mentions
- 0-39: Excluded (published content, injuries, routine matches)

## Recent Fixes (Completed)
- [x] **Task Board**: Tasks now clickable - clicking opens the client's profile
- [x] **Activity Log**: Fixed bug where notes weren't saving when completing tasks (stale closure issue)
- [x] **AI Insights Caching**: Implemented 24-hour cache to avoid regenerating on every profile open
- [x] **Model Updates**: All Gemini API routes now use `gemini-2.5-flash` (latest stable)
- [x] **Task Completion**: Confetti celebration when completing tasks with optional note dialog

## Key Files

### Components
- `components/task-board.tsx` - Task management with clickable tasks and activity log
- `components/ai-insights-card.tsx` - AI-powered insights with 24h caching
- `components/intelligence-card.tsx` - Company intelligence/news feed

### API Routes
- `app/api/fetch-intelligence/route.ts` - Intelligence fetching with 3-tier fallback
- `app/api/generate-insights/route.ts` - AI engagement analysis
- `app/api/generate-email/route.ts` - Email draft generation
- `app/api/intelligence/generate-followup/route.ts` - Follow-up email generation

### Main Page
- `app/page.tsx` - Main dashboard with client list and profile view

## Future Improvements (TODO)
- [ ] Add company website scraping for press releases
- [ ] LinkedIn company page integration
- [ ] Country-specific news sources
- [ ] Multi-step verification for company disambiguation
