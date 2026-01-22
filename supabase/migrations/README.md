# Supabase Database Migrations

Run these migrations in order in your Supabase SQL Editor.

## Migration Order

### 001_initial_schema.sql
**Purpose:** Initial database setup
- Creates `clients` table with all base fields
- Creates `products` table
- Creates `team_members` table
- Adds indexes for performance
- Sets up Row Level Security (RLS) policies
- Inserts default products and team members
- Creates `updated_at` trigger

**Run this first** if setting up a new database.

---

### 002_client_enhancements.sql
**Purpose:** Client feature enhancements
- Adds `upsell_strategy` column to clients (product cross-sell tracking)
- Adds `bg_color` and `text_color` columns to products (customizable badges)
- Adds `email` column to team_members
- Updates existing products with color schemes
- Ensures RLS policies exist

**Run after:** 001_initial_schema.sql

---

### 003_email_sync_config.sql
**Purpose:** Gmail integration
- Creates `email_sync_config` table for OAuth tokens
- Adds email-specific fields to `communications` table:
  - `email_message_id` (Gmail message ID)
  - `email_thread_id` (Gmail thread ID)
  - `email_labels` (Gmail labels array)
  - `synced_from` (source: gmail/outlook/imap)
  - `synced_at` (timestamp)
- Creates indexes for email deduplication

**Run after:** 002_client_enhancements.sql
**Required for:** Gmail OAuth integration and email import

---

### 004_add_location.sql
**Purpose:** Location tracking for clients
- Adds `city` column to clients
- Adds `country` column to clients

**Run after:** 003_email_sync_config.sql
**Optional:** Only run if you need location tracking

---

## How to Run

1. **Open Supabase SQL Editor:**
   - Go to https://supabase.com/dashboard/project/YOUR_PROJECT_ID/sql/new

2. **Run migrations in order:**
   - Copy contents of `001_initial_schema.sql`
   - Paste into SQL Editor
   - Click "Run"
   - Verify success
   - Repeat for 002, 003, 004

3. **Verify tables created:**
   - Go to Table Editor
   - Check for: clients, products, team_members, email_sync_config, communications

## Idempotent Design

All migrations use `IF NOT EXISTS` or `ON CONFLICT` clauses, so they're safe to run multiple times without errors.

## Rollback

To rollback a migration, you'll need to manually write the inverse SQL. For example:

```sql
-- Rollback 004_add_location.sql
ALTER TABLE clients DROP COLUMN IF EXISTS city;
ALTER TABLE clients DROP COLUMN IF EXISTS country;
```

---

**Last Updated:** 2026-01-22
