# Supabase Setup

## Adding Test Data

To populate your prospects table with test data:

1. Go to your Supabase project: https://supabase.com/dashboard/project/YOUR_PROJECT_ID

2. Navigate to the SQL Editor

3. Copy the contents of `seed-prospects.sql` and paste it into the SQL Editor

4. Click "Run" to execute the SQL

This will create 15 realistic test prospects with:
- **Active prospects** (0-7 days since contact): 3 prospects
- **Cooling prospects** (8-14 days since contact): 3 prospects
- **Cold prospects** (15-60 days since contact): 4 prospects
- **Frozen prospects** (60+ days since contact): 3 prospects
- Various deal values, product types, and countries

The test data is designed to showcase the AI Daily Briefing and Follow-up Queue features on the acquisition dashboard.

## Database Schema

The main tables for the acquisition module:

- **prospects** - Main prospect data with health tracking
- **prospect_comments** - Comments/notes on prospects
- **intelligence_items** - News, updates, and insights about prospects
- **email_drafts** - AI-generated email drafts
- **ai_insights** - AI-generated insights and recommendations

All migrations are in the `migrations/` folder.
