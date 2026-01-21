# Email Import & Sync Automation Plan

## Overview
Automatically import emails and conversation history into the CRM to provide AI with better context for prospect interactions, generate summaries, and maintain comprehensive communication history.

---

## Option 1: Gmail API Integration (Recommended for Gmail Users)

### Technology Stack
- **Gmail API** - Official Google API for email access
- **OAuth 2.0** - Secure authorization
- **Pub/Sub** or **Webhooks** - Real-time email notifications
- **Gemini AI** - Email summarization and analysis

### Implementation Steps

#### 1.1 Setup Gmail API
```bash
# Install required packages
npm install googleapis nodemailer
```

#### 1.2 OAuth Flow
1. Create Google Cloud Project
2. Enable Gmail API
3. Configure OAuth consent screen
4. Create OAuth 2.0 credentials
5. Implement OAuth flow in Settings page

#### 1.3 Email Syncing Strategy
**Initial Sync:**
- Fetch last 90 days of emails
- Filter by prospect email addresses
- Store in `communications` table

**Real-time Sync:**
- Use Gmail Push Notifications (Pub/Sub)
- Watch for new emails matching prospect addresses
- Auto-create communication entries

#### 1.4 AI Processing Pipeline
```typescript
async function processEmail(email: GmailMessage) {
  // 1. Extract email data
  const { subject, body, from, to, date } = parseEmail(email)

  // 2. Find matching prospect by email
  const prospect = await findProspectByEmail(from || to)

  // 3. Generate AI summary using Gemini
  const summary = await generateEmailSummary(subject, body)

  // 4. Store in communications table
  await createCommunication({
    prospectId: prospect.id,
    type: 'email',
    subject,
    content: body,
    direction: from.includes(userEmail) ? 'outbound' : 'inbound',
    aiSummary: summary,
    createdAt: date,
  })
}
```

### Pros
- ✅ Official Google API (reliable & secure)
- ✅ Real-time notifications via Pub/Sub
- ✅ Access to full email history
- ✅ Rich metadata (labels, threads, attachments)
- ✅ Free tier available

### Cons
- ❌ Gmail-specific (doesn't work with Outlook, etc.)
- ❌ Requires OAuth setup
- ❌ API rate limits (quota: 1 billion/day for personal, but per-user limits apply)

---

## Option 2: Microsoft Graph API (for Outlook/Microsoft 365)

### Technology Stack
- **Microsoft Graph API** - Official Microsoft email API
- **MSAL (Microsoft Authentication Library)** - OAuth 2.0
- **Webhooks** - Real-time notifications
- **Gemini AI** - Email processing

### Implementation Steps

#### 2.1 Setup
```bash
npm install @azure/msal-node @microsoft/microsoft-graph-client
```

#### 2.2 Authentication
- Register app in Azure AD
- Configure delegated permissions (Mail.Read, Mail.Send)
- Implement OAuth flow

#### 2.3 Email Syncing
**Initial:** Fetch messages via `/me/messages`
**Real-time:** Subscribe to webhooks for inbox changes

### Pros
- ✅ Works with Outlook, Office 365, Exchange
- ✅ Webhook support for real-time sync
- ✅ Enterprise-grade security

### Cons
- ❌ Outlook-specific
- ❌ More complex setup than Gmail
- ❌ Requires Azure AD app registration

---

## Option 3: IMAP/SMTP Integration (Universal Email Support)

### Technology Stack
- **node-imap** - IMAP client for fetching emails
- **nodemailer** - SMTP for sending
- **Polling** - Periodic email checks
- **Gemini AI** - Processing

### Implementation Steps

#### 3.1 Setup
```bash
npm install imap mailparser
```

#### 3.2 IMAP Configuration (Settings Page)
Allow users to configure:
- IMAP Server (e.g., imap.gmail.com)
- Port (993 for SSL)
- Username/Password or App Password
- Folders to monitor

#### 3.3 Email Polling
```typescript
// Background job (every 5-15 minutes)
async function pollEmails() {
  const imap = await connectIMAP(config)

  // Search for unread emails or emails since last sync
  const messages = await imap.search(['UNSEEN', ['SINCE', lastSyncDate]])

  for (const msg of messages) {
    const parsed = await parseEmail(msg)
    await processAndStore(parsed)
  }
}
```

### Pros
- ✅ Works with ANY email provider (Gmail, Outlook, custom domains)
- ✅ No API limits
- ✅ Simple to implement

### Cons
- ❌ No real-time sync (requires polling)
- ❌ Requires storing email passwords (security concern)
- ❌ May trigger security alerts with some providers

---

## Option 4: Nylas Email API (Unified Email Platform)

### Technology Stack
- **Nylas API** - Unified email API (works with Gmail, Outlook, IMAP, etc.)
- **Webhooks** - Real-time sync
- **Gemini AI** - Processing

### Implementation Steps
```bash
npm install nylas
```

### Features
- Unified API for all email providers
- Real-time webhooks
- Email tracking (opens, clicks)
- Calendar integration

### Pros
- ✅ Works with ALL major email providers
- ✅ Single API for everything
- ✅ Real-time webhooks
- ✅ Advanced features (tracking, scheduling)

### Cons
- ❌ Paid service ($9/user/month after free tier)
- ❌ Vendor lock-in
- ❌ External dependency

---

## Recommended Implementation (Phased Approach)

### Phase 1: Manual Email Import (MVP)
**Timeline:** 1-2 days
**Features:**
- Simple text area in prospect detail page
- User manually pastes email content
- AI generates summary automatically
- Stores in communications table

**Benefit:** Immediate value, no complex integration

### Phase 2: Gmail API Integration
**Timeline:** 3-5 days
**Features:**
- OAuth setup in Settings
- One-click email sync for prospects
- Automatic summary generation
- Match emails to prospects by address

**Benefit:** Automated for Gmail users (likely majority)

### Phase 3: Outlook/Microsoft 365 Support
**Timeline:** 3-4 days
**Features:**
- Add Microsoft Graph API integration
- Support both Gmail and Outlook
- Unified UI for email provider selection

### Phase 4: Advanced Features
**Timeline:** 5-7 days
**Features:**
- Real-time sync via webhooks/Pub/Sub
- Email threading (group related emails)
- Attachment extraction and storage
- Sentiment analysis on email threads
- Auto-categorization (follow-up, negotiation, objection)

---

## AI Processing Features

### 1. Email Summarization
```typescript
const prompt = `Summarize this email in 2-3 sentences, focusing on key action items and decisions:

Subject: ${email.subject}
Body: ${email.body}

Summary:`

const summary = await gemini.generateContent(prompt)
```

### 2. Sentiment Analysis
- Detect if prospect is interested, hesitant, or unresponsive
- Flag urgent emails
- Identify buying signals

### 3. Auto-Categorization
- Classify emails: inquiry, follow-up, objection, negotiation, won, lost
- Suggest next actions based on email content
- Extract key information (pricing discussed, demo requested, etc.)

### 4. Thread Context
- Combine multiple emails in a thread
- Provide full conversation context to AI
- Track conversation progression

---

## Database Schema

### communications table (already exists)
```sql
CREATE TABLE communications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prospect_id UUID REFERENCES prospects(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('email', 'call', 'meeting', 'note', 'linkedin')),
  subject TEXT,
  content TEXT NOT NULL,
  direction TEXT CHECK (direction IN ('inbound', 'outbound')),
  duration INTEGER, -- for calls/meetings
  attendees TEXT[],
  author TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  ai_summary TEXT,

  -- Email-specific fields
  email_message_id TEXT, -- Gmail/Outlook message ID for deduplication
  email_thread_id TEXT,  -- Thread grouping
  email_labels TEXT[],   -- Gmail labels or Outlook categories

  -- Tracking
  synced_from TEXT,      -- 'gmail', 'outlook', 'manual'
  synced_at TIMESTAMPTZ
);

CREATE INDEX idx_communications_prospect ON communications(prospect_id);
CREATE INDEX idx_communications_email_id ON communications(email_message_id);
```

### email_sync_config table (new)
```sql
CREATE TABLE email_sync_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL, -- or however you track users
  provider TEXT CHECK (provider IN ('gmail', 'outlook', 'imap')),

  -- OAuth tokens (encrypted)
  access_token TEXT,
  refresh_token TEXT,
  token_expiry TIMESTAMPTZ,

  -- IMAP config (if using IMAP)
  imap_host TEXT,
  imap_port INTEGER,
  imap_username TEXT,
  imap_password_encrypted TEXT,

  -- Sync settings
  last_sync_at TIMESTAMPTZ,
  sync_enabled BOOLEAN DEFAULT true,
  auto_sync_interval INTEGER DEFAULT 15, -- minutes

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Settings Page Additions

### Email Sync Configuration Section
```typescript
<Card>
  <CardHeader>
    <CardTitle>Email Integration</CardTitle>
    <CardDescription>
      Connect your email to automatically import conversations with prospects
    </CardDescription>
  </CardHeader>
  <CardContent>
    <div className="space-y-4">
      {/* Provider Selection */}
      <div>
        <Label>Email Provider</Label>
        <Select value={provider} onValueChange={setProvider}>
          <SelectItem value="gmail">Gmail</SelectItem>
          <SelectItem value="outlook">Outlook / Microsoft 365</SelectItem>
          <SelectItem value="imap">Other (IMAP)</SelectItem>
        </Select>
      </div>

      {/* Connect Button */}
      <Button onClick={connectEmail}>
        {connected ? (
          <>
            <Check className="mr-2" />
            Connected as {email}
          </>
        ) : (
          <>
            <Mail className="mr-2" />
            Connect Email
          </>
        )}
      </Button>

      {/* Sync Settings */}
      <div>
        <Label>Auto-sync interval</Label>
        <Select value={syncInterval} onValueChange={setSyncInterval}>
          <SelectItem value="5">Every 5 minutes</SelectItem>
          <SelectItem value="15">Every 15 minutes</SelectItem>
          <SelectItem value="30">Every 30 minutes</SelectItem>
          <SelectItem value="60">Every hour</SelectItem>
        </Select>
      </div>

      {/* Last Sync Info */}
      <p className="text-sm text-muted-foreground">
        Last synced: {lastSyncAt ? formatDistance(lastSyncAt, new Date()) : 'Never'}
      </p>

      {/* Manual Sync Button */}
      <Button variant="outline" onClick={manualSync}>
        <RefreshCw className="mr-2" />
        Sync Now
      </Button>
    </div>
  </CardContent>
</Card>
```

---

## UI/UX in Prospect Detail Page

### Communication Log Component
```typescript
<Card>
  <CardHeader>
    <div className="flex items-center justify-between">
      <CardTitle>Communication History</CardTitle>
      <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={() => syncEmails(prospect.email)}>
          <Mail className="h-4 w-4 mr-2" />
          Import Emails
        </Button>
        <Button size="sm" onClick={() => setShowAddCommunication(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Note
        </Button>
      </div>
    </div>
  </CardHeader>
  <CardContent>
    <div className="space-y-4">
      {communications.map((comm) => (
        <div key={comm.id} className="border-l-2 border-blue-500 pl-4 py-2">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <CommunicationIcon type={comm.type} />
              <div>
                <p className="font-medium">{comm.subject || `${comm.type} communication`}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(comm.createdAt))} ago
                  {comm.direction && ` • ${comm.direction}`}
                </p>
              </div>
            </div>
          </div>

          {comm.aiSummary && (
            <div className="mt-2 p-2 bg-blue-50 rounded text-sm">
              <p className="text-blue-900">{comm.aiSummary}</p>
            </div>
          )}

          <details className="mt-2">
            <summary className="text-sm cursor-pointer text-muted-foreground hover:text-foreground">
              View full content
            </summary>
            <div className="mt-2 text-sm whitespace-pre-wrap">
              {comm.content}
            </div>
          </details>
        </div>
      ))}
    </div>
  </CardContent>
</Card>
```

---

## Cost Estimation

### Gmail API
- **Free tier:** 1 billion quota units/day
- **Cost:** Free for most use cases
- **Overage:** Unlikely for CRM use

### Microsoft Graph API
- **Free tier:** Included with Microsoft 365
- **Cost:** Free if users have M365 licenses

### Nylas
- **Free tier:** 5 users
- **Paid:** $9/user/month
- **Cost for 10 users:** $90/month

### IMAP
- **Cost:** Free
- **Infrastructure:** May need background job runner (e.g., Vercel Cron or external worker)

---

## Security Considerations

1. **Token Storage**
   - Encrypt OAuth tokens at rest
   - Use environment variables for sensitive data
   - Implement token refresh logic

2. **Email Privacy**
   - Only sync emails to/from known prospects
   - Don't store personal/unrelated emails
   - Provide email deletion capability

3. **Access Control**
   - User-level email sync (not shared across team)
   - Option to disconnect email anytime
   - Clear data retention policies

4. **Compliance**
   - GDPR: Right to delete email data
   - Data minimization: Only store necessary content
   - Consent: Explicit user opt-in for email sync

---

## Success Metrics

1. **Sync Performance**
   - Email import time < 5 seconds
   - AI summary generation < 2 seconds
   - 99%+ email matching accuracy

2. **User Adoption**
   - % of users who connect email
   - Average emails synced per prospect
   - User satisfaction score

3. **AI Quality**
   - Summary accuracy rating
   - Actionable insights per email
   - Time saved vs manual entry

---

## Next Steps

**Week 1: MVP**
- [ ] Create Communication Log UI component
- [ ] Add manual email paste functionality
- [ ] Implement Gemini AI summarization
- [ ] Test with real email data

**Week 2: Gmail Integration**
- [ ] Set up Google Cloud Project
- [ ] Implement OAuth flow
- [ ] Build email sync API route
- [ ] Add Settings page email config section
- [ ] Test end-to-end flow

**Week 3: Polish & Advanced Features**
- [ ] Add real-time sync (Pub/Sub)
- [ ] Implement email threading
- [ ] Add sentiment analysis
- [ ] Create analytics dashboard for communications

---

## Alternative: Browser Extension (Bonus Idea)

### Zlatko Gmail Extension
- Chrome/Firefox extension
- One-click "Save to Zlatko" button in Gmail
- Auto-match email to prospect
- Generate summary inline in Gmail
- Works without backend changes

**Pros:**
- ✅ No OAuth complexity
- ✅ Works in user's existing Gmail workflow
- ✅ Instant context

**Cons:**
- ❌ Requires browser extension development
- ❌ Manual action required (not fully automated)
- ❌ Chrome/Firefox only

---

## Conclusion

**Recommended Path:** Start with **Phase 1 (Manual Import)** to validate value, then implement **Phase 2 (Gmail API)** for automation. This provides immediate functionality while building toward a fully automated solution.

The Gmail API approach balances:
- ✅ Automation
- ✅ Security
- ✅ Reliability
- ✅ Cost-effectiveness
- ✅ Scalability

Once proven, expand to Outlook/IMAP for broader email provider support.
