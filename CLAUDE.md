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

## Future Improvements (TODO)
- [ ] Add company website scraping for press releases
- [ ] LinkedIn company page integration
- [ ] Country-specific news sources
- [ ] Multi-step verification for company disambiguation
