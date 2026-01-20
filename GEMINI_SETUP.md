# Gemini AI Integration Setup

## Environment Variables

Add the following environment variable to your Vercel project:

### Vercel Dashboard Setup:
1. Go to your Vercel project: https://vercel.com/salejankovic/client-relationship-dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add the following variable:

```
GEMINI_API_KEY=your_gemini_api_key_here
```

4. Make sure to add it for **Production**, **Preview**, and **Development** environments
5. Redeploy your application for changes to take effect

## Features Using Gemini AI

### 1. Email Generation (`/api/generate-email`)
- AI-powered email composer
- Multi-language support (Croatian, Serbian, English)
- Context-aware personalization
- Multiple tones and goals

### 2. AI Insights (`/api/generate-insights`)
- Prospect engagement analysis
- Risk assessment
- Recommended next actions
- Smart talking points

## Usage

### Email Generation:
```typescript
const response = await fetch("/api/generate-email", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    prospectCompany: "Company Name",
    contactPerson: "John Doe",
    tone: "formal",
    goal: "schedule-call",
    language: "english",
    context: "Follow up after demo",
  }),
});
const { subject, body } = await response.json();
```

### AI Insights:
```typescript
const response = await fetch("/api/generate-insights", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    company: "Company Name",
    daysSinceContact: 15,
    status: "Warm",
    dealValue: 50000,
    productType: "Mobile app",
  }),
});
const { insights, sentiment, riskLevel, engagementScore } = await response.json();
```

## Model Information

- **Model**: Gemini Pro
- **Provider**: Google AI
- **Cost**: Very affordable for production use
- **Latency**: ~1-3 seconds per request

## Security Notes

- Never commit `.env.local` to git
- API key is server-side only (not exposed to client)
- All AI requests are processed through Next.js API routes
