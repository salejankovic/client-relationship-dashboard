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

### 005_countries_and_contacts.sql
**Purpose:** Countries and multi-contact support
- Creates `countries` table with flag emojis
- Creates `prospect_contacts` table for multiple contacts per prospect
- Adds RLS policies
- Seeds default countries

**Run after:** 004_add_location.sql or 008_create_prospects_and_communications.sql
**Note:** References prospects table, so run 008 first if starting fresh

---

### 006_remove_product_type_constraint.sql
**Purpose:** Remove product type validation constraint
- Removes CHECK constraint on product_type column

**Run after:** 005_countries_and_contacts.sql

---

### 007_change_deal_value_to_text.sql
**Purpose:** Allow flexible deal value descriptions
- Changes deal_value from NUMERIC to TEXT
- Enables values like "385€ monthly + 1,500€ one time"

**Run after:** 006_remove_product_type_constraint.sql

---

### 008_create_prospects_and_communications.sql ⚠️ **CRITICAL**
**Purpose:** Create core prospects and communications tables
- Creates `prospects` table with all necessary columns
- Creates `communications` table for activity log
- Adds proper indexes for performance
- Sets up RLS policies
- Adds updated_at trigger

**Run after:** 001_initial_schema.sql (needs the update_updated_at_column function)
**IMPORTANT:** This should be run BEFORE migrations 003, 005, 006, and 007 if you're setting up a fresh database. If you already have these tables created manually, this migration is idempotent and will not overwrite existing data.

**Recommended order for fresh setup:**
1. Run 001 (creates base tables and functions)
2. Run 002 (enhances clients)
3. **Run 008 (creates prospects and communications)** ⬅️ NEW
4. Run 003 (adds email fields to communications)
5. Run 004 (adds location to clients)
6. Run 005 (creates countries and contacts)
7. Run 006 (removes constraint)
8. Run 007 (changes deal_value type)
9. Run 009 (adds custom label and status)

---

### 009_add_custom_label_and_status.sql
**Purpose:** Add custom label field and "Not contacted yet" status
- Adds `custom_label` column to prospects (for tags like "Athens trip March 2026")
- Updates status constraint to include "Not contacted yet" option
- Adds index for custom_label filtering

**Run after:** 008_create_prospects_and_communications.sql

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
