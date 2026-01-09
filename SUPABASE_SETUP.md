# Supabase Setup Guide

## ✅ What's Been Done

All code changes have been completed! The application is now configured to use Supabase instead of localStorage.

### Files Created:
- `.env.local` - Environment variables with your Supabase credentials
- `lib/supabase.ts` - Supabase client configuration
- `lib/database.types.ts` - TypeScript types for database
- `hooks/use-clients.ts` - React hook for client data with real-time updates
- `hooks/use-products.ts` - React hook for products with real-time updates
- `hooks/use-team-members.ts` - React hook for team members with real-time updates
- `supabase-setup.sql` - Database migration SQL script

### Files Modified:
- `app/page.tsx` - Now uses Supabase hooks instead of localStorage
- `app/settings/page.tsx` - Now uses Supabase hooks instead of localStorage

---

## 🚀 Next Step: Run the Database Migration

You need to execute the SQL migration in your Supabase dashboard to create the tables.

### Step-by-Step Instructions:

1. **Go to your Supabase project dashboard:**
   - URL: https://supabase.com/dashboard/project/ycisxbdqddbcwhmyhljo

2. **Navigate to SQL Editor:**
   - Click on the **SQL Editor** icon in the left sidebar (looks like a document with "<>" symbol)
   - Or go directly to: https://supabase.com/dashboard/project/ycisxbdqddbcwhmyhljo/sql/new

3. **Open the migration file:**
   - Open the file `supabase-setup.sql` from your project folder
   - Copy ALL the contents (Ctrl+A, Ctrl+C)

4. **Paste and run:**
   - Paste the SQL into the SQL Editor in Supabase
   - Click the **"RUN"** button (or press Ctrl+Enter)

5. **Verify success:**
   - You should see green success messages
   - Check that tables were created by clicking **"Table Editor"** in the left sidebar
   - You should see 3 tables: `clients`, `products`, `team_members`

---

## 🎯 What the Migration Does

The SQL script will:

1. **Create 3 tables:**
   - `clients` - Stores all client data (name, logo, category, products, contacts, todos, activity, etc.)
   - `products` - Stores available products (Mobile App, Pchella, TTS, etc.)
   - `team_members` - Stores team member names for assignment

2. **Set up indexes** for better performance on common queries

3. **Create triggers** to automatically update `updated_at` timestamp

4. **Insert default data:**
   - 7 default products (Mobile App, Pchella, TTS, Litteraworks, Komentari, e-Kiosk, CMS)
   - 4 default team members (John Smith, Sarah Johnson, Michael Chen, Emma Williams)

5. **Enable Row Level Security (RLS)** with open policies (since this is an internal tool)

---

## 🧪 Testing the Integration

Once you've run the migration:

1. **Restart your dev server:**
   ```bash
   # Kill the current server (Ctrl+C)
   npm run dev -- --port 3001
   ```

2. **Open the app:**
   - Go to http://localhost:3001
   - You should see a "Loading data from Supabase..." spinner briefly
   - Then the dashboard should load (it will be empty at first)

3. **Test adding data:**
   - Click "Add Client" and create a test client
   - Refresh the page - the client should still be there!
   - Check your Supabase dashboard → Table Editor → clients table - you should see the data!

4. **Test real-time updates:**
   - Open two browser tabs with the dashboard
   - Add a client in one tab
   - Watch it appear in the other tab automatically! ✨

5. **Test Settings page:**
   - Go to Settings
   - Add a new product
   - Go back to dashboard - new product should be available in dropdowns
   - Changes sync across all tabs in real-time

---

## 📊 Viewing Your Data in Supabase

You can view and manage your data directly in Supabase:

1. **Go to Table Editor:**
   - https://supabase.com/dashboard/project/ycisxbdqddbcwhmyhljo/editor

2. **Select a table:**
   - Click on `clients`, `products`, or `team_members`
   - You'll see all your data in a spreadsheet-like interface

3. **Edit data directly:**
   - Click any cell to edit
   - Click "+ Insert row" to add data manually
   - Click the trash icon to delete rows

---

## 🔄 Migrating Existing localStorage Data (Optional)

If you have important data in localStorage that you want to keep:

1. **Export from localStorage:**
   - Open browser DevTools (F12)
   - Go to Console tab
   - Run this command:
   ```javascript
   JSON.parse(localStorage.getItem('appworks-clients'))
   ```
   - Copy the output

2. **Import to Supabase:**
   - Go to Table Editor → clients table
   - Click "+ Insert row"
   - Paste each client's data

Or contact me to create an automated migration script!

---

## ✨ New Features with Supabase

### Real-time Sync
- Changes made by any team member appear instantly for everyone
- No need to refresh the page
- Works across all devices

### Multi-device Access
- Access from any computer/device
- Data is centralized and always up-to-date

### Data Persistence
- No more data loss on browser clear
- Automatic backups by Supabase
- Export data anytime from Supabase dashboard

### Collaboration
- Multiple people can work simultaneously
- See changes in real-time
- No conflicts or overwriting

---

## 🐛 Troubleshooting

### "Loading data from Supabase..." never stops

**Possible causes:**
1. SQL migration not run yet → Go run it!
2. Wrong API keys in `.env.local` → Double-check them
3. Network issue → Check your internet connection

**Check browser console (F12) for errors**

### Data not appearing

**Check:**
1. SQL migration completed successfully
2. Browser console for errors
3. Supabase Table Editor to see if data exists

### Real-time not working

**Check:**
1. Multiple tabs open with same URL
2. Browser console for "subscription" errors
3. Network tab in DevTools for websocket connections

---

## 🔐 Security Notes

### Current Setup:
- **Row Level Security (RLS)** is enabled
- **Open policies** allow anyone with the anon key to read/write
- Suitable for **internal tools** without public access

### For Production (Optional):
If you want to add user authentication later:

1. Enable Supabase Auth
2. Update RLS policies to check `auth.uid()`
3. Add login/logout functionality
4. Restrict access to authenticated users only

---

## 📝 Database Schema Reference

### Clients Table
```sql
- id: TEXT (primary key, generated by app)
- name: TEXT (required)
- logo_url: TEXT (nullable)
- category: TEXT ('Media' or 'Sport')
- status: TEXT ('active', 'pending', 'inactive')
- products: TEXT[] (array of product names)
- website: TEXT (nullable)
- next_action: TEXT (nullable)
- next_action_date: TEXT (nullable, ISO date string)
- assigned_to: TEXT (nullable)
- notes: TEXT (nullable)
- contacts: JSONB (array of contact objects)
- todos: JSONB (array of todo objects)
- activity: JSONB (array of activity log objects)
- created_at: TIMESTAMPTZ (auto)
- updated_at: TIMESTAMPTZ (auto, trigger updates)
```

### Products Table
```sql
- id: TEXT (primary key, auto-generated UUID)
- name: TEXT (unique, required)
- created_at: TIMESTAMPTZ (auto)
```

### Team Members Table
```sql
- id: TEXT (primary key, auto-generated UUID)
- name: TEXT (unique, required)
- created_at: TIMESTAMPTZ (auto)
```

---

## 🎉 You're Almost Done!

Just run the SQL migration and you'll be ready to go!

**If you encounter any issues, check:**
1. Browser console (F12 → Console tab)
2. Network tab (F12 → Network tab)
3. Supabase dashboard logs

**Questions?** Let me know and I'll help debug!
