# Zlatko CRM

A comprehensive CRM platform for managing client relationships and prospect acquisition, built for Appworks d.o.o.

![Next.js](https://img.shields.io/badge/Next.js-15.5.9-black)
![React](https://img.shields.io/badge/React-19-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green)

## Overview

**Zlatko** tracks both existing clients and potential prospects with features including:

- **Client Management** - Full CRUD with real-time Supabase sync
- **Prospect Tracking** - Pipeline management with status tracking
- **Gmail Integration** - OAuth 2.0 email import with AI summaries
- **Communication Log** - Track emails, calls, meetings, notes
- **Intelligence Feed** - Automated news and insights
- **AI Features** - Gemini Pro for email summaries and insights
- **Dynamic Settings** - Customizable products, owners, and types

## Quick Start

### Prerequisites
- Node.js 18+
- Supabase account
- Google Cloud account (for Gmail integration)

### Installation

1. **Clone and install:**
```bash
git clone https://github.com/salejankovic/client-relationship-dashboard.git
cd client-relationship-dashboard
npm install
```

2. **Environment variables:**

Create `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
GEMINI_API_KEY=your_gemini_api_key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_random_secret
```

3. **Database setup:**

Run migrations in Supabase SQL Editor (in order):
- `supabase/migrations/001_initial_schema.sql`
- `supabase/migrations/002_client_enhancements.sql`
- `supabase/migrations/003_email_sync_config.sql`
- `supabase/migrations/004_add_location.sql` (optional)

See [supabase/migrations/README.md](supabase/migrations/README.md) for details.

4. **Start development:**
```bash
npm run dev
# Open http://localhost:3000
```

## Tech Stack

- **Framework:** Next.js 15.5.9 (App Router)
- **UI:** React 19, TypeScript, Tailwind CSS
- **Database:** Supabase (PostgreSQL with real-time)
- **Components:** shadcn/ui (Radix UI primitives)
- **AI:** Google Gemini Pro
- **Email:** Gmail API with OAuth 2.0
- **Icons:** Lucide React

## Documentation

- **[PROJECT_STATUS.md](PROJECT_STATUS.md)** - Complete current state & architecture
- **[PROJECT.md](PROJECT.md)** - Original project documentation
- **[SUPABASE_SETUP.md](SUPABASE_SETUP.md)** - Database setup guide
- **[CLAUDE_SESSION_PROMPT.md](CLAUDE_SESSION_PROMPT.md)** - For fresh AI sessions

## Deployment

Deploy to Vercel:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/salejankovic/client-relationship-dashboard)

**Important:**
- Repository must be PUBLIC for Vercel GitHub integration
- Add all environment variables in Vercel dashboard
- Configure Google OAuth redirect URIs for production URL

## Project Structure

```
├── app/                      # Next.js routes
│   ├── acquisition/          # Prospects module
│   ├── settings/             # Settings page
│   └── api/                  # API routes (Gmail OAuth, sync)
├── components/               # React components
│   ├── communication-log.tsx
│   ├── client-profile.tsx
│   └── ui/                   # shadcn/ui
├── hooks/                    # Data management hooks
├── lib/                      # Utilities and types
└── supabase/migrations/      # Database migrations
```

## Features

### Client Management
- Real-time CRUD operations
- Logo upload (base64 storage)
- Product assignment with custom colors
- Contact tracking
- Todo lists and notes
- Activity logging

### Prospect Management
- Status pipeline (Hot/Warm/Cold/Lost)
- Archive system with reasons
- CSV import wizard
- Next action tracking
- Days since contact calculation

### Communication Log
- 5 types: Email, Call, Meeting, Note, LinkedIn
- Direction tracking (inbound/outbound)
- AI-generated summaries
- Import from Gmail
- Type-specific fields (duration, attendees)

### Gmail Integration
- OAuth 2.0 authentication
- Automatic email import
- AI summaries via Gemini
- Token refresh handling
- Connection status in Settings

### Intelligence Feed
- Google News RSS
- AI-powered insights
- Company tracking
- Relevance scoring

## License

MIT

## Author

Created by Janko Sale for Appworks d.o.o.

Built with assistance from [Claude Code](https://claude.ai/claude-code)

---

**Status:** ✅ Production Ready | **Last Updated:** 2026-01-22
