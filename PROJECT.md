# Client Relationship Dashboard - Project Documentation

## Project Overview

A lightweight CRM (Customer Relationship Management) tool built for **Appworks d.o.o.** to manage relationships with media and sports organization clients. This application replaces traditional Google Sheets tracking with a modern, interactive interface designed for business development and account management teams.

### Purpose
- Track client information, contacts, and engagement history
- Manage product assignments across different clients
- Organize action items and to-dos for each client
- Maintain activity logs and strategic notes
- Filter and search clients by category, products, and status

### Target Users
- Business Development team at Appworks
- Account Management team
- Internal stakeholders managing client relationships

### Client Categories
- **Media**: RTS, HRT, Telegraf, Politika, Danas
- **Sport**: Panathinaikos FC, ESAKE, AS Roma, FK Partizan, Cedevita Olimpija

### Products Offered
- Mobile App (mPanel/Apps)
- Pchella (Digital Asset Management)
- TTS (Text-to-Speech)
- Litteraworks
- Komentari (Comments system)
- e-Kiosk
- CMS (Content Management System)

---

## Technology Stack

### Frontend Framework
- **Next.js 16** (App Router with React Server Components)
- **React 19.2** with TypeScript
- **Tailwind CSS 4.1.9** for styling

### UI Components
- **shadcn/ui** component library (Radix UI primitives)
- Fully accessible, customizable components
- Dark mode support via `next-themes`

### Key Libraries
- **lucide-react**: Icon library
- **date-fns**: Date formatting and manipulation
- **react-hook-form** + **zod**: Form validation
- **sonner**: Toast notifications
- **class-variance-authority** + **clsx** + **tailwind-merge**: Conditional styling utilities

### State Management
- **React useState hooks** (local component state)
- No global state management library currently implemented
- Data flows from main page component down to children

### Styling System
- CSS Variables for theming (supports light/dark mode)
- Tailwind utility classes
- Custom product color scheme via CSS variables

---

## File Structure

```
client-relationship-dashboard/
├── app/                          # Next.js App Router
│   ├── page.tsx                  # Main dashboard page (client list + profile view)
│   ├── layout.tsx                # Root layout with theme provider
│   ├── globals.css               # Global styles and CSS variables
│   └── settings/
│       └── page.tsx              # Settings page (manage products, team, branches)
│
├── components/                   # React components
│   ├── client-list.tsx           # Sidebar with filterable client list
│   ├── client-profile.tsx        # Main client detail view with all features
│   ├── add-client-modal.tsx      # Modal for adding new clients
│   ├── product-manager-modal.tsx # Modal for managing products (limited functionality)
│   ├── theme-provider.tsx        # Dark/light mode provider wrapper
│   └── ui/                       # shadcn/ui components (40+ components)
│       ├── button.tsx
│       ├── card.tsx
│       ├── dialog.tsx
│       ├── input.tsx
│       └── ... (other UI primitives)
│
├── lib/                          # Utilities and data
│   ├── types.ts                  # TypeScript type definitions
│   ├── client-data.ts            # Mock data (10 sample clients)
│   └── utils.ts                  # Helper functions (cn utility)
│
├── hooks/                        # Custom React hooks
│   ├── use-mobile.ts             # Mobile detection hook
│   └── use-toast.ts              # Toast notification hook
│
├── public/                       # Static assets
│   ├── *-logo.jpg                # Client logos (10 images)
│   └── placeholder-*.{svg,jpg}   # Placeholder images
│
├── styles/
│   └── globals.css               # Additional global styles
│
└── Configuration files
    ├── package.json              # Dependencies and scripts
    ├── tsconfig.json             # TypeScript configuration
    ├── next.config.mjs           # Next.js configuration
    ├── postcss.config.mjs        # PostCSS configuration
    ├── components.json           # shadcn/ui configuration
    └── .gitignore                # Git ignore rules
```

---

## Data Model

### Client Interface
```typescript
interface Client {
  id: string                      // Unique identifier
  name: string                    // Client name
  logoUrl?: string                // Path to logo image
  category: "Media" | "Sport"     // Business category
  status: "active" | "pending" | "inactive"
  products: Product[]             // Array of assigned products
  website?: string                // Client website URL
  nextAction?: string             // Description of next action item
  nextActionDate?: string         // ISO date string for next action
  contacts: Contact[]             // Array of contact persons
  assignedTo?: string             // Team member assigned to client
  todos: TodoItem[]               // List of to-do items
  notes?: string                  // Strategic notes
  activity: ActivityLog[]         // Activity history
}
```

### Supporting Types
```typescript
interface Contact {
  id: string
  name: string
  email: string
  role?: string                   // Job title/position
}

interface TodoItem {
  id: string
  text: string
  completed: boolean
}

interface ActivityLog {
  id: string
  comment: string                 // Activity description
  date: string                    // ISO date string
}

type Product =
  | "Pchella"
  | "TTS"
  | "Litteraworks"
  | "Mobile App"
  | "e-Kiosk"
  | "Komentari"
  | "CMS"
```

---

## Component Breakdown

### 1. Main Dashboard ([app/page.tsx](app/page.tsx))
**Responsibilities:**
- Manages global state (clients array, selected client, product filters)
- Renders header with filters and action buttons
- Coordinates ClientList and ClientProfile components
- Handles client CRUD operations

**Key Features:**
- Product filter buttons in header (All Products, mPanel/Apps, Litteraworks, Pchella)
- Add Client button
- Settings navigation
- Theme toggle (dark/light mode)
- Product Manager modal

**State Management:**
```typescript
const [selectedClient, setSelectedClient] = useState<Client | null>(null)
const [clients, setClients] = useState<Client[]>(clientsData)
const [selectedProducts, setSelectedProducts] = useState<Product[]>([])
```

### 2. ClientList ([components/client-list.tsx](components/client-list.tsx))
**Responsibilities:**
- Display filterable/searchable list of clients
- Show client cards with key information
- Handle client selection

**Features:**
- Search input (filters by name)
- Product filter buttons (duplicates header filters - currently non-functional)
- Branch filter (All, Media, Sport)
- Client cards showing:
  - Logo/avatar
  - Status indicator (colored dot)
  - Assigned team member
  - Category badge
  - Products (color-coded badges)
  - Next action
  - Active to-dos preview (first 2 items)

**Filtering Logic:**
- Text search: case-insensitive name match
- Branch filter: "All" or specific category
- Product filter: shows clients with ANY selected product

### 3. ClientProfile ([components/client-profile.tsx](components/client-profile.tsx))
**Responsibilities:**
- Display detailed client information
- Enable inline editing of all client fields
- Manage contacts, todos, and activity log

**Sections:**
1. **Header**
   - Client logo, name, category badge
   - Website link

2. **Info Cards** (2-column grid)
   - Responsible Person (editable input)
   - Products (toggleable badges with custom colors)

3. **Action Items Card**
   - Next Action (text input)
   - Next Action Date (date picker)
   - To-Do list with checkboxes
   - Add new to-do functionality

4. **Contacts Card**
   - List of contacts (name, email, role)
   - Add contact form (inline, toggle-able)

5. **Strategy & Notes Card**
   - Free-form textarea for strategic notes

6. **Activity Log Card**
   - Chronological activity entries
   - Add new comment functionality
   - Date formatting (e.g., "Jan 5, 2026")

**Product Color Scheme:**
Uses CSS variables for customizable product colors (defined in globals.css)

### 4. AddClientModal ([components/add-client-modal.tsx](components/add-client-modal.tsx))
**Responsibilities:**
- Form for creating new clients
- Validates required fields (name)
- Auto-generates ID and initial activity log entry

**Form Fields:**
- Client Name (required)
- Branch (Media/Sport toggle)
- Status (active/pending/inactive)
- Website
- Products (multi-select badges)
- Next Action + Date
- Notes (textarea)
- Primary Contact (name, email, role)

**Behavior:**
- Creates client with `Date.now()` as ID
- Adds "Client created" activity log entry
- Resets form on successful submission
- Closes modal automatically

### 5. ProductManagerModal ([components/product-manager-modal.tsx](components/product-manager-modal.tsx))
**Current State:** Limited functionality
- Displays list of products
- Add/remove products in local state
- Changes NOT persisted or applied to global state
- Informational note: "changes won't affect existing clients"

**Note:** This modal needs implementation work to actually manage products globally.

### 6. Settings Page ([app/settings/page.tsx](app/settings/page.tsx))
**Features:**
- Manage Products (add/remove)
- Display Branches (read-only)
- Manage Team Members (add/remove)
- View Client Fields (read-only list)

**Current Limitations:**
- Changes are local state only (no persistence)
- Back button navigates to home
- No actual connection to client data

---

## Dependencies

### Core Dependencies
| Package | Version | Purpose |
|---------|---------|---------|
| next | 16.0.10 | React framework with SSR/SSG |
| react | 19.2.0 | UI library |
| typescript | ^5 | Type safety |
| tailwindcss | ^4.1.9 | Utility-first CSS |

### UI & Styling
| Package | Version | Purpose |
|---------|---------|---------|
| @radix-ui/* | Various | Accessible UI primitives |
| lucide-react | ^0.454.0 | Icon library |
| next-themes | ^0.4.6 | Dark mode support |
| class-variance-authority | ^0.7.1 | Component variant management |
| tailwind-merge | ^3.3.1 | Merge Tailwind classes safely |
| tailwindcss-animate | ^1.0.7 | Animation utilities |

### Forms & Validation
| Package | Version | Purpose |
|---------|---------|---------|
| react-hook-form | ^7.60.0 | Form state management |
| @hookform/resolvers | ^3.10.0 | Form validation resolvers |
| zod | 3.25.76 | Schema validation |

### Other
| Package | Version | Purpose |
|---------|---------|---------|
| date-fns | 4.1.0 | Date manipulation |
| sonner | ^1.7.4 | Toast notifications |
| recharts | 2.15.4 | Charts (not currently used) |

---

## Local Development Setup

### Prerequisites
- Node.js 18+ (recommended: 20+)
- pnpm package manager (or npm/yarn)

### Installation Steps

1. **Navigate to project directory**
   ```bash
   cd client-relationship-dashboard
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   # or
   npm install
   ```

3. **Run development server**
   ```bash
   pnpm dev
   # or
   npm run dev
   ```

4. **Open browser**
   Navigate to `http://localhost:3000`

### Available Scripts
```json
{
  "dev": "next dev",           // Start dev server
  "build": "next build",       // Build for production
  "start": "next start",       // Start production server
  "lint": "eslint ."          // Run ESLint
}
```

### Environment Setup
- No environment variables currently required
- All configuration is in code

---

## Data Persistence Strategy

### Current State: **In-Memory Only**
- All data is stored in component state (`useState`)
- Data is initialized from [lib/client-data.ts](lib/client-data.ts)
- **Page refresh = data loss** (returns to mock data)

### Recommended Approaches (in order of complexity)

#### Option 1: localStorage (Quickest - 15 min implementation)
**Pros:**
- No backend required
- Simple implementation
- Works offline
- Perfect for single-user scenarios

**Cons:**
- Data tied to single browser
- ~5-10MB storage limit
- No multi-user sync
- Data in plain text

**Implementation:**
- Add `useEffect` to sync state to localStorage on changes
- Load initial state from localStorage || mockData
- Utility functions: `saveToLocalStorage()`, `loadFromLocalStorage()`

**Best for:** Quick v1, single user, same device access

#### Option 2: File-based Backend (Quick - 1-2 hours)
**Approach:**
- Next.js API routes
- Read/write to JSON file on server
- Simple REST endpoints

**Pros:**
- Centralized data
- Multi-device access
- Easy backups
- No database setup

**Cons:**
- No concurrent write protection
- Single point of failure
- Doesn't scale beyond ~5-10 users

**Implementation:**
```
/api/clients
  GET    - return all clients
  POST   - add new client
  PUT    - update client
  DELETE - remove client
```

**Best for:** Small team (2-5 people), quick deployment

#### Option 3: Database Backend (Robust - 3-5 hours)
**Recommended Stack:**
- **Supabase** (PostgreSQL + Auth + Real-time) - easiest
- **PlanetScale** (MySQL) - good free tier
- **MongoDB Atlas** - document-based (matches current structure)

**Pros:**
- Production-ready
- Concurrent access
- Backup/restore
- Can add authentication
- Real-time sync potential

**Cons:**
- More setup time
- External dependency
- May require environment variables

**Best for:** Growing team, long-term solution, multiple concurrent users

### Recommendation for v1 (1-2 hour build)
**Use localStorage** with this implementation:

```typescript
// hooks/use-local-storage.ts
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === "undefined") return initialValue
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch {
      return initialValue
    }
  })

  const setValue = (value: T | ((val: T) => T)) => {
    const valueToStore = value instanceof Function ? value(storedValue) : value
    setStoredValue(valueToStore)
    if (typeof window !== "undefined") {
      window.localStorage.setItem(key, JSON.stringify(valueToStore))
    }
  }

  return [storedValue, setValue] as const
}

// Usage in app/page.tsx
const [clients, setClients] = useLocalStorage<Client[]>("appworks-clients", clientsData)
```

---

## Development Roadmap

### ✅ What Works Out of the Box

1. **UI/UX Foundation**
   - Complete, polished interface with dark mode
   - Responsive layout (desktop-optimized)
   - All components render correctly
   - Smooth interactions and animations

2. **Client Management**
   - View client list with filtering
   - Select client to view details
   - Add new clients via modal
   - Edit client information inline

3. **Product Assignment**
   - Toggle products for each client
   - Visual product badges with colors
   - Filter clients by products (from header)

4. **Contacts & To-Dos**
   - Add/view contacts
   - Add/complete to-do items
   - See active to-dos in client list

5. **Activity Logging**
   - Add activity comments
   - View chronological activity history
   - Timestamps on all activities

6. **Filtering & Search**
   - Search clients by name
   - Filter by branch (Media/Sport)
   - Filter by product (header buttons work)

### ⚠️ What Needs to Be Added/Fixed

#### CRITICAL (Required for production)
1. **Data Persistence** 🔴
   - Implement localStorage/backend
   - Data currently resets on refresh
   - Priority: Highest

2. **Product Filter Sync Issue** 🔴
   - Sidebar filter buttons don't work (lines 71-100 in client-list.tsx)
   - They have empty `onClick` handlers
   - Need to call parent's filter state setter
   - Priority: High

3. **Product Manager Modal** 🔴
   - Currently doesn't persist changes
   - Need to connect to global state/storage
   - Should affect available products in forms
   - Priority: Medium

4. **Settings Page Persistence** 🔴
   - Products, team members changes not saved
   - Need to integrate with client data
   - Priority: Medium

#### NICE TO HAVE (Enhancements)
5. **Delete Clients** 🟡
   - No way to remove clients currently
   - Add delete button with confirmation dialog
   - Priority: Medium

6. **Edit/Delete Contacts** 🟡
   - Can only add contacts, not modify/remove
   - Add inline edit/delete buttons
   - Priority: Low

7. **Edit/Delete To-Dos** 🟡
   - Can only add/complete, not edit text or delete
   - Add edit/remove functionality
   - Priority: Low

8. **Edit/Delete Activity Log** 🟡
   - No way to modify or remove log entries
   - May want edit for typos, delete for mistakes
   - Priority: Very Low

9. **Assigned To Dropdown** 🟡
   - Currently free text input
   - Should be dropdown from Settings team members
   - Priority: Medium

10. **Mobile Responsiveness** 🟡
    - Layout is desktop-first
    - Sidebar should collapse on mobile
    - Profile cards should stack on small screens
    - Priority: Medium (if mobile users expected)

11. **Export/Import** 🟡
    - Export client data to CSV/JSON
    - Import from previous Google Sheets
    - Priority: Low

12. **Sorting Options** 🟡
    - Sort clients by name, date, status
    - Currently unsorted (or by ID)
    - Priority: Low

13. **Bulk Actions** 🟡
    - Select multiple clients
    - Bulk assign products or team member
    - Priority: Very Low

### 🎯 Priority Improvements (1-2 Hour Build)

**Phase 1: Make it functional (30 min)**
1. Add localStorage persistence (15 min)
2. Fix sidebar product filter buttons (5 min)
3. Add delete client functionality (10 min)

**Phase 2: Polish (30 min)**
4. Connect Settings to client data (15 min)
5. Make Assigned To a dropdown (10 min)
6. Fix ProductManagerModal to persist (5 min)

**Phase 3: Quality of life (30 min)**
7. Add edit/delete for contacts (15 min)
8. Add delete for to-dos (5 min)
9. Add basic mobile responsive tweaks (10 min)

---

## File Organization for Scaling

### Current Structure: ✅ Good for v1
The current structure is well-organized for a small application.

### Recommended Changes if Project Grows

1. **Split Client Profile Into Sections**
   ```
   components/client-profile/
     ├── index.tsx                    # Main container
     ├── client-header.tsx            # Logo, name, category
     ├── client-info-cards.tsx        # Responsible person, products
     ├── action-items-card.tsx        # Next action, to-dos
     ├── contacts-card.tsx            # Contacts list
     ├── notes-card.tsx               # Strategy notes
     └── activity-log-card.tsx        # Activity history
   ```

2. **Add Context for Global State**
   ```
   contexts/
     ├── ClientContext.tsx            # Client data + CRUD operations
     ├── ProductContext.tsx           # Product list management
     └── SettingsContext.tsx          # Team members, config
   ```

3. **Add API Layer (when backend added)**
   ```
   lib/
     ├── api/
     │   ├── clients.ts               # Client API calls
     │   ├── products.ts              # Product API calls
     │   └── settings.ts              # Settings API calls
     └── hooks/
         ├── useClients.ts            # Client data hook
         ├── useProducts.ts           # Products data hook
         └── useSettings.ts           # Settings data hook
   ```

4. **Constants File**
   ```
   lib/
     └── constants.ts                 # Product colors, default values, etc.
   ```

---

## Immediate Concerns & Recommendations

### 🔴 Critical Issues

1. **No Data Persistence**
   - **Impact:** All work lost on page refresh
   - **Fix:** Implement localStorage in next 15 minutes
   - **See:** "Data Persistence Strategy" section above

2. **Broken Product Filters in Sidebar**
   - **Impact:** Users confused why buttons don't work
   - **Fix:** Pass filter state setter as prop OR remove duplicate filters
   - **Location:** [components/client-list.tsx:71-100](components/client-list.tsx#L71-L100)

### 🟡 Code Organization Concerns

1. **Hardcoded Product Colors in Multiple Places**
   - **Locations:**
     - [client-list.tsx:19-38](components/client-list.tsx#L19-L38) (function)
     - [client-profile.tsx:19-27](components/client-profile.tsx#L19-L27) (object)
     - [app/globals.css](app/globals.css) (CSS variables)
   - **Fix:** Use single source of truth (CSS variables preferred)

2. **Product Type Union vs Array**
   - Product type is a union, but often need array of all products
   - Hardcoded in multiple files: `["Mobile App", "Pchella", ...]`
   - **Fix:** Create `ALL_PRODUCTS` constant in [lib/types.ts](lib/types.ts)

3. **Date Handling Inconsistency**
   - Sometimes ISO strings, sometimes date inputs
   - Some dates formatted, some raw
   - **Fix:** Create utility functions for date formatting

### 🟢 UI/UX Improvements

1. **Confirmation Dialogs Missing**
   - No confirmation when implied destructive actions might be added
   - **Recommendation:** Use AlertDialog from shadcn/ui

2. **Loading States**
   - No loading indicators (fine for localStorage, needed for backend)
   - **Recommendation:** Add Skeleton components when backend added

3. **Empty States**
   - Good empty state when no client selected
   - Missing empty states for:
     - No contacts
     - No to-dos
     - No activity logs
   - **Recommendation:** Add empty state messages/illustrations

4. **Form Validation**
   - Minimal validation (only required name in add client)
   - Email not validated
   - **Recommendation:** Add Zod schemas + react-hook-form (already installed!)

### 🎨 Visual/Theme Notes

1. **Product Colors**
   - Currently uses CSS variables for theming
   - Some products share colors (needs differentiation?)
   - **Current scheme:**
     - Mobile App: Red
     - Pchella: Yellow
     - TTS: Yellow (same as Pchella)
     - Litteraworks: Gray
     - Komentari: Gray
     - CMS: Gray
     - e-Kiosk: Gray

2. **Logo Handling**
   - Logos are in `/public` (good)
   - Fallback to initials works well
   - Missing logos for some clients? (check placeholder usage)

---

## Next Steps - Quick Win Checklist

### If you have 15 minutes:
- [ ] Add localStorage persistence
- [ ] Fix sidebar product filter buttons

### If you have 30 minutes:
- [ ] Above + Add delete client button
- [ ] Create ALL_PRODUCTS constant

### If you have 1 hour:
- [ ] Above + Connect Settings to main app
- [ ] Make Assigned To a dropdown
- [ ] Add confirmation dialogs

### If you have 2 hours:
- [ ] Everything above
- [ ] Add edit/delete for contacts and to-dos
- [ ] Improve mobile responsiveness
- [ ] Add empty states with illustrations
- [ ] Add form validation with Zod

---

## Architecture Decisions & Trade-offs

### Why In-Memory State?
- **Decision:** Use React useState for all state
- **Trade-off:** Simple but not persistent
- **Rationale:** v0 generated this, quick to iterate
- **Future:** Move to localStorage → backend when needed

### Why No Global State Library?
- **Decision:** No Redux/Zustand/Jotai
- **Trade-off:** Prop drilling in some places
- **Rationale:** App is small, prop drilling manageable
- **Future:** Add Context API if state becomes complex

### Why shadcn/ui?
- **Decision:** Use shadcn instead of component library like MUI
- **Trade-off:** Components in source code (more files)
- **Rationale:** Full customization, no bundle bloat, copy-paste
- **Future:** Keep using it, works great

### Why Next.js App Router?
- **Decision:** Use Next.js 16 with App Router (not Pages Router)
- **Trade-off:** Server/Client components complexity
- **Rationale:** Future-proof, modern React patterns
- **Future:** Consider RSC for data fetching when backend added

---

## Glossary

- **Branch**: Client category (Media or Sport)
- **CRM**: Customer Relationship Management
- **DAM**: Digital Asset Management (Pchella)
- **mPanel**: Mobile panel/app management platform
- **Product**: Software offering from Appworks
- **Action Item**: Next scheduled task or meeting
- **To-Do**: Checklist item for client management
- **Activity Log**: Historical record of interactions

---

## Support & Maintenance

### Who to Contact
- **Development**: Appworks development team
- **Business Logic**: Account managers, BD team
- **Bugs/Features**: (Add issue tracker link when available)

### Known Limitations
- Desktop-first design (limited mobile optimization)
- No user authentication/authorization
- No data export functionality
- No client archiving (only inactive status)
- No search within notes/activity
- No file attachments support

---

## License & Credits

- Built with [Next.js](https://nextjs.org)
- UI components from [shadcn/ui](https://ui.shadcn.com)
- Icons from [Lucide](https://lucide.dev)
- Initial design from [v0.dev](https://v0.dev)

---

**Last Updated:** 2026-01-09
**Version:** 0.1.0
**Status:** Development (v1 in progress)
