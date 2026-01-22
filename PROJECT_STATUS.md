# Zlatko CRM - Project Status

**Last Updated:** 2026-01-22
**Version:** 1.0
**Status:** Production Ready

---

## Project Overview

**Zlatko** is a comprehensive CRM platform for managing client relationships and prospect acquisition. Built for Appworks d.o.o., it tracks both existing clients and potential prospects across media and sports organizations.

### Platform Name
- Rebranded from "Appworks Dashboard" to "Zlatko"
- Dashboard switcher: "Potential Clients" / "Existing Clients"
- Full light/dark mode support

---

## Technology Stack

### Core
- **Next.js 15.5.9** (App Router, React Server Components)
- **React 19** with TypeScript
- **Supabase** (PostgreSQL with real-time sync)
- **Tailwind CSS 4.1.9**
- **shadcn/ui** components

### AI & APIs
- **Google Gemini Pro** - Email summarization, insights
- **Gmail API** - OAuth 2.0 email integration
- **Google News RSS** - Intelligence feed (no API key needed)

### Key Libraries
- **googleapis** - Gmail integration
- **@google/generative-ai** - Gemini AI
- **lucide-react** - Icons
- **date-fns** - Date handling

---

## Major Features Implemented

### ✅ 1. Client Management (Existing Clients)
- Full CRUD operations with Supabase
- Logo upload with base64 storage
- Product assignment with custom colors
- Team member assignment (dropdown)
- Contact management
- Todo/action items tracking
- Activity logging
- Notes and upsell strategy
- Real-time sync across users

### ✅ 2. Prospect Management (Potential Clients)
- Complete prospect lifecycle tracking
- Status management (Hot/Warm/Cold/Lost)
- Archive system with reasons
- CSV import wizard
- Product/owner assignment
- Next action tracking
- Days since contact calculation

### ✅ 3. Communication Log
- Track all prospect communications:
  - Email (with AI summaries)
  - Calls (with duration)
  - Meetings (with attendees)
  - Notes
  - LinkedIn messages
- Direction tracking (inbound/outbound)
- Expandable content view
- Type-specific fields
- Real-time updates

### ✅ 4. Gmail Integration
- **OAuth 2.0** authentication (Google Workspace - Internal mode)
- Automatic email import from Gmail
- Search emails by prospect address
- AI-generated summaries using Gemini Pro
- Deduplication via message IDs
- Token refresh handling
- Connection status in Settings
- Last sync timestamp tracking

**Credentials:**
- Client ID: (configured in environment variables)
- OAuth configured for Internal (Google Workspace) mode
- Scopes: `gmail.readonly`, `gmail.send`, `userinfo.email`

### ✅ 5. Intelligence Feed
- Google News RSS integration
- AI-powered insights with Gemini
- Company news tracking
- Dismiss/undismiss functionality
- Relevance scoring
- Source attribution

### ✅ 6. Settings Management
- **Products**: Add/edit with custom background & text colors
- **Team Members**: Add/remove owners
- **Prospect Types** (Branches): Editable types
- **Gmail Connection**: Connect/disconnect with status
- All changes persist to Supabase
- Real-time sync

### ✅ 7. AI Features
- Email summarization (Gemini Pro)
- Intelligence insights generation
- Email draft suggestions (ready to implement)
- Sentiment analysis (ready to implement)

---

## Database Schema (Supabase)

### Tables
1. **clients** - Existing client data
2. **products** - Product catalog with colors
3. **team_members** - User assignments
4. **prospect_types** - Editable prospect categories
5. **prospects** - Potential client tracking
6. **communications** - All communication history
7. **intelligence_items** - News & insights
8. **email_sync_config** - Gmail OAuth tokens
9. **email_drafts** - AI-generated draft emails (future)
10. **ai_insights** - AI analysis data (future)

### Key Features
- Row Level Security (RLS) with open policies (internal tool)
- Real-time subscriptions enabled
- TEXT primary keys (not UUID)
- Indexed for performance

---

## File Structure

```
client-relationship-dashboard/
├── app/
│   ├── page.tsx                          # Main dashboard (client switcher)
│   ├── layout.tsx                        # Root layout with theme
│   ├── globals.css                       # Light/dark mode theming
│   ├── settings/page.tsx                 # Settings with Gmail connection
│   ├── acquisition/                      # Prospects module
│   │   ├── page.tsx                      # Acquisition dashboard
│   │   ├── prospects/
│   │   │   ├── page.tsx                  # Prospect list
│   │   │   ├── new/page.tsx              # Add new prospect
│   │   │   └── [id]/page.tsx             # Prospect detail
│   │   ├── intelligence/page.tsx         # Intelligence feed
│   │   ├── import/page.tsx               # CSV import wizard
│   │   └── archive/page.tsx              # Archived prospects
│   └── api/
│       ├── auth/gmail/
│       │   ├── route.ts                  # OAuth initiation
│       │   └── callback/route.ts         # OAuth callback
│       └── gmail/sync/route.ts           # Email sync API
│
├── components/
│   ├── communication-log.tsx             # Communication tracking
│   ├── client-list.tsx                   # Client sidebar
│   ├── client-profile.tsx                # Client detail view
│   ├── app-sidebar.tsx                   # Navigation
│   ├── main-nav.tsx                      # Header navigation
│   ├── mobile-nav.tsx                    # Mobile menu
│   └── ui/                               # shadcn/ui components
│
├── hooks/
│   ├── use-clients.ts                    # Client CRUD
│   ├── use-prospects.ts                  # Prospect CRUD
│   ├── use-communications.ts             # Communication CRUD
│   ├── use-products.ts                   # Product management
│   ├── use-team-members.ts               # Team management
│   ├── use-prospect-types.ts             # Type management
│   ├── use-intelligence.ts               # Intelligence feed
│   ├── use-gmail-connection.ts           # Gmail status
│   └── use-email-drafts.ts               # Draft management (ready)
│
├── lib/
│   ├── types.ts                          # TypeScript interfaces
│   ├── constants.ts                      # Shared constants
│   ├── supabase.ts                       # Supabase client
│   └── utils.ts                          # Helper functions
│
├── supabase/migrations/                  # Database migrations (run in order)
│   ├── README.md                         # Migration guide
│   ├── 001_initial_schema.sql            # Base tables (clients, products, team_members)
│   ├── 002_client_enhancements.sql       # Upsell, product colors, team emails
│   ├── 003_email_sync_config.sql         # Gmail integration tables
│   └── 004_add_location.sql              # City/country columns (optional)
│
└── .env.local                            # Environment variables
```

---

## Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Gemini AI
GEMINI_API_KEY=your_gemini_api_key

# Gmail OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
NEXTAUTH_URL=http://localhost:3000 (or production URL)
NEXTAUTH_SECRET=your_nextauth_secret
```

---

## Deployment

### Vercel
- **URL**: https://client-relationship-dashboard.vercel.app
- **Branch**: main (auto-deploy)
- **Repository**: Must be PUBLIC for Vercel integration
- Add all environment variables in Vercel dashboard

### Google Cloud OAuth
- **Authorized Redirect URIs**:
  - `http://localhost:3000/api/auth/gmail/callback` (development)
  - `https://client-relationship-dashboard.vercel.app/api/auth/gmail/callback` (production)

---

## Recent Major Updates

### Gmail Integration (2026-01-22)
- OAuth 2.0 flow implemented
- Email import with AI summaries
- Token refresh automation
- Connection UI in Settings
- Migration: `create_email_sync_config.sql`

### Communication Log (2026-01-21)
- 5 communication types
- AI summary support
- Import emails button
- Direction tracking
- Migration: Added email fields to communications table

### Settings Enhancements (2026-01-20)
- Editable prospect types
- Product color customization
- Gmail connection card
- Dynamic dropdowns

### Platform Rebrand (2026-01-19)
- Renamed to "Zlatko"
- Added dashboard switcher
- Fixed light/dark mode theming

---

## Known Limitations

1. **Single User**: No multi-tenant authentication yet
2. **Email Import**: Manual trigger (no auto-sync)
3. **AI Costs**: Gemini API usage not optimized
4. **Mobile**: Desktop-first design
5. **File Attachments**: Not supported
6. **Bulk Operations**: No multi-select actions

---

## Future Enhancements

### High Priority
- [ ] Auto-sync emails on schedule
- [ ] Multi-user authentication
- [ ] Email sending via Gmail API
- [ ] Advanced filtering and search
- [ ] Export reports (CSV/PDF)

### Medium Priority
- [ ] Email open/click tracking
- [ ] Calendar integration
- [ ] Pipeline value forecasting
- [ ] Custom fields per prospect type
- [ ] Notification system

### Low Priority
- [ ] Mobile app
- [ ] Slack integration
- [ ] Advanced analytics dashboard
- [ ] Email templates library

---

## Development Workflow

### Local Development
```bash
npm install
npm run dev
# Open http://localhost:3000
```

### Database Migrations
1. Write SQL in `supabase/migrations/`
2. Run in Supabase SQL Editor
3. Test locally
4. Commit to git

### Git Workflow
```bash
git add .
git commit -m "Description"
git push origin main
# Vercel auto-deploys
```

---

## Support & Maintenance

### Team
- **Development**: Janko Sale (with Claude Code assistance)
- **Organization**: Appworks d.o.o.

### Tools
- **Database**: Supabase Dashboard
- **Hosting**: Vercel
- **Version Control**: GitHub (salejankovic/client-relationship-dashboard)
- **AI Assistant**: Claude Code (Anthropic)

---

## Success Metrics

✅ **Production Ready**
- All core features implemented
- Gmail integration working
- Real-time sync enabled
- Settings fully functional
- No critical bugs

✅ **Data Integrity**
- Supabase as single source of truth
- Real-time updates across tabs/users
- Email deduplication working
- Archive/restore functional

✅ **User Experience**
- Clean, intuitive interface
- Fast performance
- Mobile-friendly (basic)
- Dark/light mode working

---

## Quick Start for New Developers

1. Clone repo and install dependencies
2. Get Supabase credentials from team
3. Run database migrations
4. Add environment variables
5. Start dev server: `npm run dev`
6. Read this document for architecture overview

---

**Project Status:** ✅ Production
**Last Deploy:** Auto on push to main
**Current Focus:** Email automation & AI enhancements
