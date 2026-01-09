# Appworks Client Dashboard

A comprehensive CRM (Client Relationship Management) tool for managing media and sports organization clients. Built with Next.js 15, React 19, and Supabase for real-time data synchronization.

![Next.js](https://img.shields.io/badge/Next.js-15.5.9-black)
![React](https://img.shields.io/badge/React-19-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green)

## Features

- **Client Management**: Full CRUD operations for managing clients
- **Logo Upload**: Upload and change client logos with base64 storage
- **Product Tracking**: Assign and track products for each client
- **Upsell Strategy**: Plan which products to sell to clients
- **Real-time Sync**: Live updates across all users with Supabase
- **Team Assignment**: Assign clients to team members
- **Activity Logging**: Track all interactions and notes
- **Todo Management**: Organize tasks per client
- **Responsive Design**: Beautiful UI built with shadcn/ui components

## Tech Stack

- **Framework**: Next.js 15.5.9 with App Router
- **UI Library**: React 19
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4.1.9
- **Database**: Supabase (PostgreSQL)
- **Components**: shadcn/ui (Radix UI primitives)
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+ installed
- A Supabase account and project

### Installation

1. Clone the repository:
```bash
git clone https://github.com/salejankovic/client-relationship-dashboard.git
cd client-relationship-dashboard
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:

Create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Set up Supabase database:

Run the SQL scripts in your Supabase SQL Editor:
- First run `supabase-setup.sql` to create the initial schema
- Then run `supabase-migration-upsell.sql` to add the upsell_strategy column

5. Start the development server:
```bash
npm run dev
```

6. Open [http://localhost:3001](http://localhost:3001) in your browser.

## Database Setup

The project uses Supabase with the following tables:

- **clients**: Stores client information, contacts, todos, and activity logs
- **products**: Manages available products
- **team_members**: Tracks team members for assignment

All tables include Row Level Security (RLS) policies and real-time subscriptions.

See `SUPABASE_SETUP.md` for detailed setup instructions.

## Project Structure

```
├── app/                    # Next.js app directory
│   ├── page.tsx           # Main dashboard page
│   ├── settings/          # Settings page
│   └── layout.tsx         # Root layout
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── client-list.tsx   # Client sidebar
│   └── client-profile.tsx # Client detail view
├── hooks/                 # Custom React hooks
│   ├── use-clients.ts    # Client CRUD operations
│   ├── use-products.ts   # Product management
│   └── use-team-members.ts
├── lib/                   # Utilities and types
│   ├── types.ts          # TypeScript interfaces
│   ├── constants.ts      # Shared constants
│   └── supabase.ts       # Supabase client
└── public/                # Static assets
```

## Documentation

- **PROJECT.md**: Comprehensive project documentation
- **IMPLEMENTATION_SUMMARY.md**: Summary of implementation changes
- **NEW_FEATURES.md**: Details on logo upload and upsell strategy features
- **SUPABASE_SETUP.md**: Supabase setup and configuration guide

## Deployment

The easiest way to deploy is using [Vercel](https://vercel.com):

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/salejankovic/client-relationship-dashboard)

Don't forget to add your environment variables in the Vercel dashboard.

## License

MIT

## Author

Created by Janko Sale for Appworks d.o.o.

---

Built with assistance from Claude Code
