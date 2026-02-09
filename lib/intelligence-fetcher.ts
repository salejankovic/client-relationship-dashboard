import { GoogleGenerativeAI } from "@google/generative-ai";
import type { IntelligenceType, IntelligenceSourceType } from "@/lib/types";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// ============================================================
// TYPES
// ============================================================

export interface IntelligenceResult {
  id: string;
  prospectId?: string;
  title: string;
  description?: string;
  sourceType: IntelligenceSourceType;
  intelligenceType: IntelligenceType;
  url?: string;
  publishedAt?: string;
  aiTip?: string;
  relevanceScore?: number;
  companyName?: string;
  sourceName?: string;
  contentQuote?: string;
  matchHomeTeam?: string;
  matchAwayTeam?: string;
  matchHomeScore?: number;
  matchAwayScore?: number;
  matchLeague?: string;
  personName?: string;
  personPosition?: string;
  personLinkedinUrl?: string;
}

export interface NewsArticle {
  title: string;
  link: string;
  pubDate: string;
  source: string;
  snippet: string;
}

export interface ProspectForFetch {
  company: string;
  website?: string;
  prospectType?: string;
  country?: string;
  linkedinUrl?: string;
}

// ============================================================
// INDUSTRY SOURCES CONFIG
// ============================================================

const INDUSTRY_SOURCES: Record<string, { searchTerms: string[]; publications: string[] }> = {
  Media: {
    searchTerms: [
      "digital media industry news",
      "publishing industry trends",
      "media company acquisitions mergers",
    ],
    publications: ["Digiday", "Press Gazette", "Adweek", "NiemanLab"],
  },
  "Sports Club": {
    searchTerms: [
      "sports business news sponsorship",
      "sports technology deals",
      "stadium naming rights partnership",
    ],
    publications: ["SportsPro", "SportBusiness", "The Athletic"],
  },
  "Sports League": {
    searchTerms: [
      "sports league broadcasting rights",
      "sports governance business",
      "league sponsorship deals",
    ],
    publications: ["SportsPro", "SportBusiness"],
  },
};

// ============================================================
// UTILITY HELPERS
// ============================================================

function generateId(): string {
  return `intel-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function cleanHtml(text: string): string {
  return text
    .replace(/<[^>]*>/g, "")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .trim();
}

function parseGeminiJson(text: string): any {
  let cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    cleaned = jsonMatch[0];
  }
  return JSON.parse(cleaned);
}

const TYPE_TO_SOURCE: Record<string, IntelligenceSourceType> = {
  news: "news",
  company_update: "other",
  job_change: "job-change",
  funding: "funding",
  match_result: "sports",
  linkedin_post: "linkedin",
};

// ============================================================
// COMPANY DISAMBIGUATION (Phase 4.2)
// ============================================================

export function isCommonName(name: string): boolean {
  const commonPatterns = [
    "NIN", "MAX", "ONE", "SPORT", "NEWS", "MEDIA", "NET", "GO", "PRO",
    "TOP", "BIG", "RED", "BLUE", "STAR", "PLUS", "LIVE", "NOW",
  ];
  return name.length <= 4 || commonPatterns.some((p) => name.toUpperCase() === p);
}

export function buildDisambiguationContext(
  companyName: string,
  website?: string,
  country?: string,
  prospectType?: string
): string {
  const parts: string[] = [];

  parts.push(`Company: "${companyName}"`);

  if (website) {
    try {
      const domain = new URL(website).hostname.replace("www.", "");
      parts.push(`Official website: ${website} (domain: ${domain})`);
    } catch {
      parts.push(`Website: ${website}`);
    }
  }

  if (country) {
    parts.push(`Headquartered in: ${country}`);
  }

  if (prospectType) {
    parts.push(`Industry/Type: ${prospectType}`);
  }

  if (isCommonName(companyName)) {
    parts.push(
      `\nWARNING: "${companyName}" is a common/short name. Be VERY careful to only include results about the SPECIFIC company described above. Cross-reference with the website domain and country to verify each result.`
    );
  }

  return parts.join("\n");
}

// ============================================================
// LOCALE & SEARCH QUERY
// ============================================================

export function getLocaleForCountry(country?: string): { hl: string; gl: string; ceid: string } {
  const localeMap: Record<string, { hl: string; gl: string; ceid: string }> = {
    Serbia: { hl: "sr", gl: "RS", ceid: "RS:sr" },
    Croatia: { hl: "hr", gl: "HR", ceid: "HR:hr" },
    Slovenia: { hl: "sl", gl: "SI", ceid: "SI:sl" },
    "Bosnia and Herzegovina": { hl: "bs", gl: "BA", ceid: "BA:bs" },
    Montenegro: { hl: "sr", gl: "ME", ceid: "ME:sr" },
    "North Macedonia": { hl: "mk", gl: "MK", ceid: "MK:mk" },
    Greece: { hl: "el", gl: "GR", ceid: "GR:el" },
    Belgium: { hl: "nl", gl: "BE", ceid: "BE:nl" },
    Georgia: { hl: "ka", gl: "GE", ceid: "GE:ka" },
    Germany: { hl: "de", gl: "DE", ceid: "DE:de" },
    France: { hl: "fr", gl: "FR", ceid: "FR:fr" },
    Italy: { hl: "it", gl: "IT", ceid: "IT:it" },
    Spain: { hl: "es", gl: "ES", ceid: "ES:es" },
    UK: { hl: "en", gl: "GB", ceid: "GB:en" },
    "United Kingdom": { hl: "en", gl: "GB", ceid: "GB:en" },
  };
  return localeMap[country || ""] || { hl: "en", gl: "US", ceid: "US:en" };
}

export function buildSearchQuery(
  companyName: string,
  country?: string,
  prospectType?: string,
  website?: string
): string {
  const parts = [companyName];

  // For short/ambiguous names, add domain context
  if (website && isCommonName(companyName)) {
    try {
      const domain = new URL(website).hostname.replace("www.", "");
      parts.push(domain);
    } catch {}
  }

  if (country) {
    parts.push(country);
  }

  if (prospectType === "Media") {
    parts.push("media company news");
  } else if (prospectType === "Sports Club") {
    parts.push("club");
  } else if (prospectType === "Sports League") {
    parts.push("league");
  }

  return parts.join(" ");
}

// ============================================================
// GOOGLE NEWS RSS
// ============================================================

export async function fetchGoogleNews(
  companyName: string,
  country?: string,
  prospectType?: string,
  website?: string
): Promise<NewsArticle[]> {
  try {
    const query = buildSearchQuery(companyName, country, prospectType, website);
    const searchQuery = encodeURIComponent(query);
    const locale = getLocaleForCountry(country);
    const rssUrl = `https://news.google.com/rss/search?q=${searchQuery}&hl=${locale.hl}&gl=${locale.gl}&ceid=${locale.ceid}`;

    console.log(`Fetching Google News RSS: ${rssUrl}`);

    const response = await fetch(rssUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "application/rss+xml, application/xml, text/xml, */*",
      },
    });

    if (!response.ok) {
      console.error("Google News RSS failed:", response.status, response.statusText);
      return [];
    }

    const xml = await response.text();
    console.log(`RSS response length: ${xml.length} chars`);

    if (xml.length < 100) {
      console.error("RSS response too short:", xml);
      return [];
    }

    const articles: NewsArticle[] = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;

    while ((match = itemRegex.exec(xml)) !== null && articles.length < 10) {
      const itemXml = match[1];
      const titleMatch = itemXml.match(
        /<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>|<title>([\s\S]*?)<\/title>/
      );
      const linkMatch = itemXml.match(/<link>([\s\S]*?)<\/link>/);
      const pubDateMatch = itemXml.match(/<pubDate>([\s\S]*?)<\/pubDate>/);
      const sourceMatch = itemXml.match(/<source[^>]*>([\s\S]*?)<\/source>/);
      const descMatch = itemXml.match(
        /<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>|<description>([\s\S]*?)<\/description>/
      );

      if (titleMatch && linkMatch) {
        articles.push({
          title: cleanHtml(titleMatch[1] || titleMatch[2] || ""),
          link: linkMatch[1],
          pubDate: pubDateMatch ? pubDateMatch[1] : new Date().toISOString(),
          source: sourceMatch ? cleanHtml(sourceMatch[1]) : "News",
          snippet: descMatch ? cleanHtml(descMatch[1] || descMatch[2] || "") : "",
        });
      }
    }

    console.log(`Parsed ${articles.length} articles from RSS`);
    return articles;
  } catch (error: any) {
    console.error("Error fetching Google News:", error.message);
    return [];
  }
}

// ============================================================
// PROMPT HELPERS
// ============================================================

export function getCompanyTypeInstructions(prospectType?: string): string {
  if (prospectType === "Media") {
    return `
CRITICAL - MEDIA COMPANY RULES:
This is a MEDIA/PUBLISHING company. They publish news articles as their core business.
- ONLY include news where the company IS THE SUBJECT of the article, not the publisher
- Look for: company announces, acquires, leadership changes AT the company, financial results, partnerships, layoffs, restructuring
- EXCLUDE: Articles that this company published about other topics (politics, sports, entertainment, etc.)
- EXCLUDE: Editorial content, opinion pieces, or news coverage they produce
- If the source name matches the company name, it's likely THEIR content - exclude it unless it's about the company itself`;
  }

  if (prospectType === "Sports Club" || prospectType === "Sports League") {
    return `
SPORTS ORGANIZATION RULES:
This is a sports organization. Focus on business-relevant news, not match operations.
INCLUDE:
- Sponsorship deals and partnerships (very valuable for B2B sales!)
- Stadium/arena developments, renovations, naming rights
- Leadership/management changes (new CEO, President, Commercial Director)
- Financial news (investments, revenue reports, ownership changes)
- Major player signings that made headlines (conversation starters)
- Significant match results from important games (derbies, finals, championships)
- Broadcasting deals, media rights

EXCLUDE:
- Player injuries and medical updates
- Match-by-match results for regular season games
- Training camp news
- Player statistics and performance analysis
- Fantasy sports content`;
  }

  return "";
}

export function getSalesRelevanceCriteria(): string {
  return `
RELEVANCE SCORING (0-100) - Focus on B2B SALES VALUE:
Score 80-100 (High Priority):
- New leadership (CEO, CTO, CDO, CMO) = opportunity to introduce solutions
- Funding round or investment = they have budget
- Expansion or new office = growing, may need services
- Technology adoption news = investing in tech
- Partnership announcements = open to new vendors
- Sponsorship deals (for sports) = marketing budget available

Score 60-79 (Medium Priority):
- Financial results (positive) = healthy company
- Product launches = active company
- Awards or recognition = conversation starter
- Major player signings (sports) = conversation starter
- Significant match wins (finals, derbies)

Score 40-59 (Low Priority):
- General company mentions
- Industry news that mentions them
- Minor operational updates

Score 0-39 (EXCLUDE):
- Articles PUBLISHED BY the company (for media companies)
- Player injuries/medical updates
- Routine match results
- Operational noise with no sales angle
- Content where the company is just mentioned in passing`;
}

// ============================================================
// TIER 1: GEMINI WITH GOOGLE SEARCH GROUNDING
// ============================================================

export async function tryGeminiWithGrounding(
  companyName: string,
  website?: string,
  prospectType?: string,
  country?: string
): Promise<IntelligenceResult[] | null> {
  try {
    const disambiguationContext = buildDisambiguationContext(companyName, website, country, prospectType);
    const companyTypeInstructions = getCompanyTypeInstructions(prospectType);
    const relevanceCriteria = getSalesRelevanceCriteria();

    const prompt = `Search for recent news and updates about this company for B2B SALES purposes:

${disambiguationContext}

CRITICAL: Only include news that is DEFINITELY about this specific company. If unsure, EXCLUDE it.

${companyTypeInstructions}

Find information from the last 30-60 days including:
- Company announcements, partnerships, product launches
- Leadership changes or new hires (especially C-level)
- Funding rounds, acquisitions, or investments
- Expansion news (new offices, markets, products)
${prospectType === "Sports Club" || prospectType === "Sports League" ? "- Sponsorship deals, stadium news, major match results (finals, derbies only)" : ""}

${relevanceCriteria}

AI TIP GUIDELINES - Make tips ACTIONABLE and SPECIFIC for sales:
- For new leadership: "Reach out to introduce your solutions to the new CEO/CTO"
- For funding: "Good time to pitch - they have fresh budget"
- For tech adoption: "They're investing in tech - pitch digital solutions"
- For sponsorship deals: "Marketing budget confirmed - pitch advertising services"
- For expansion: "Growing company - propose scalable solutions"
- Do NOT use brackets like [role] or [product] - write specific tips
- Do NOT generate generic tips like "Monitor this" or "Track updates"

For each piece of news found, return JSON with this structure:
{
  "items": [
    {
      "title": "Clear headline (max 100 chars)",
      "summary": "2-3 sentence description with key details and context",
      "intelligenceType": "news|company_update|match_result|job_change|funding",
      "sourceUrl": "https://source-url.com",
      "sourceName": "Publication Name",
      "publishedDate": "2026-01-15",
      "aiTip": "Actionable sales tip (max 80 chars)",
      "keyFact": "Key fact (max 80 chars)",
      "relevanceScore": 85
    }
  ]
}

Only include items with relevanceScore >= 50. If no relevant news found, return {"items": []}`;

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      tools: [{ googleSearch: {} }],
    } as any);

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    console.log("Gemini grounding response:", text.substring(0, 500));

    const data = parseGeminiJson(text);
    const items = data.items || [];

    if (items.length === 0) {
      console.log("Gemini grounding returned empty items array");
      return null;
    }

    return items.map((item: any) => ({
      id: generateId(),
      title: item.title || "News Update",
      description: item.summary,
      sourceType: TYPE_TO_SOURCE[item.intelligenceType] || "news",
      intelligenceType: item.intelligenceType || "news",
      url: item.sourceUrl,
      publishedAt: item.publishedDate
        ? new Date(item.publishedDate).toISOString()
        : new Date().toISOString(),
      aiTip: item.aiTip,
      relevanceScore: item.relevanceScore || 60,
      companyName,
      sourceName: item.sourceName,
      contentQuote: item.keyFact,
      matchHomeTeam: item.homeTeam,
      matchAwayTeam: item.awayTeam,
      matchHomeScore: item.homeScore,
      matchAwayScore: item.awayScore,
      matchLeague: item.league,
    }));
  } catch (error: any) {
    console.error("Gemini grounding error:", error.message, error.stack?.substring(0, 200));
    return null;
  }
}

// ============================================================
// TIER 2: GOOGLE NEWS RSS + GEMINI ANALYSIS
// ============================================================

export async function fetchWithRSSFallback(
  companyName: string,
  website?: string,
  prospectType?: string,
  country?: string
): Promise<IntelligenceResult[]> {
  const articles = await fetchGoogleNews(companyName, country, prospectType, website);

  if (articles.length === 0) {
    console.log("No articles found in Google News for:", companyName);
    return [];
  }

  console.log(`Found ${articles.length} articles for ${companyName}, analyzing with Gemini...`);

  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  const disambiguationContext = buildDisambiguationContext(companyName, website, country, prospectType);

  const articlesContext = articles
    .map(
      (a, i) =>
        `${i + 1}. "${a.title}" - ${a.source} (${a.pubDate})\n   ${a.snippet}\n   URL: ${a.link}`
    )
    .join("\n\n");

  const companyTypeInstructions = getCompanyTypeInstructions(prospectType);
  const relevanceCriteria = getSalesRelevanceCriteria();

  const prompt = `Analyze these news articles and identify the most relevant ones for B2B SALES outreach.

${disambiguationContext}

CRITICAL: Only include articles that are DEFINITELY about this specific company. If an article is about a DIFFERENT company with a similar name, set relevanceScore to 0 and EXCLUDE it.

${companyTypeInstructions}

Articles found:
${articlesContext}

${relevanceCriteria}

AI TIP GUIDELINES - Make tips ACTIONABLE and SPECIFIC for sales:
- For new leadership: "Reach out to introduce your solutions to the new CEO/CTO"
- For funding: "Good time to pitch - they have fresh budget"
- For tech adoption: "They're investing in tech - pitch digital solutions"
- For sponsorship deals: "Marketing budget confirmed - pitch advertising services"
- For expansion: "Growing company - propose scalable solutions"
- Do NOT use brackets like [role] or [product] - write specific, concrete tips
- Do NOT generate generic tips like "Monitor this" or "Track updates" or "Keep an eye on"

For each relevant article (max 5), provide:
1. A clean, professional title (rewrite if needed)
2. A 2-3 sentence summary with key details, context, and why it matters
3. Type: news, company_update, job_change, funding, or match_result
4. A SPECIFIC, ACTIONABLE sales tip (how to use this in outreach) - NO brackets or placeholders
5. One key fact or quote from the article
6. Relevance score (0-100) based on B2B sales value

Return JSON:
{
  "items": [
    {
      "originalIndex": 1,
      "title": "Clean headline",
      "summary": "2-3 sentence summary with context",
      "intelligenceType": "news",
      "aiTip": "Specific actionable sales tip",
      "keyFact": "Key fact or quote",
      "relevanceScore": 85
    }
  ]
}

Only include articles with relevanceScore >= 50. If none are relevant, return {"items": []}`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const data = parseGeminiJson(response.text());
    const analyzedItems = data.items || [];

    return analyzedItems.map((item: any) => {
      const originalArticle = articles[item.originalIndex - 1] || articles[0];
      return {
        id: generateId(),
        title: item.title,
        description: item.summary,
        sourceType: TYPE_TO_SOURCE[item.intelligenceType] || "news",
        intelligenceType: item.intelligenceType || "news",
        url: originalArticle.link,
        publishedAt: new Date(originalArticle.pubDate).toISOString(),
        aiTip: item.aiTip,
        relevanceScore: item.relevanceScore || 60,
        companyName,
        sourceName: originalArticle.source,
        contentQuote: item.keyFact,
      };
    });
  } catch (error) {
    console.error("Error analyzing with Gemini:", error);
    return [];
  }
}

// ============================================================
// TIER 3: GEMINI KNOWLEDGE BASE FALLBACK
// ============================================================

export async function fetchWithGeminiKnowledge(
  companyName: string,
  website?: string,
  prospectType?: string,
  country?: string
): Promise<IntelligenceResult[]> {
  try {
    console.log(`Using Gemini knowledge fallback for: ${companyName}`);

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const disambiguationContext = buildDisambiguationContext(companyName, website, country, prospectType);

    const prompt = `Based on your knowledge, provide information about this company for B2B sales purposes:

${disambiguationContext}

Provide 1-3 pieces of relevant information such as:
- Company overview and what they do
- Recent developments you know about (leadership, products, expansion)
- Industry position and competitors
- Any notable facts useful for sales outreach

Return JSON:
{
  "items": [
    {
      "title": "Headline about the company",
      "summary": "2-3 sentence description",
      "intelligenceType": "company_update",
      "aiTip": "Actionable sales tip",
      "keyFact": "Key fact",
      "relevanceScore": 65
    }
  ]
}

If you don't have reliable information about this company, return {"items": []}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const data = parseGeminiJson(response.text());
    const items = data.items || [];

    return items.map((item: any) => ({
      id: generateId(),
      title: item.title || "Company Information",
      description: item.summary,
      sourceType: TYPE_TO_SOURCE[item.intelligenceType] || ("other" as IntelligenceSourceType),
      intelligenceType: item.intelligenceType || "company_update",
      url: website,
      publishedAt: new Date().toISOString(),
      aiTip: item.aiTip,
      relevanceScore: item.relevanceScore || 60,
      companyName,
      sourceName: "AI Knowledge Base",
      contentQuote: item.keyFact,
    }));
  } catch (error: any) {
    console.error("Gemini knowledge fallback error:", error.message);
    return [];
  }
}

// ============================================================
// NEWS 3-TIER ORCHESTRATOR (existing logic)
// ============================================================

export async function fetchIntelligenceWithGemini(
  companyName: string,
  website?: string,
  prospectType?: string,
  country?: string
): Promise<IntelligenceResult[]> {
  console.log(`Trying Gemini grounding for: ${companyName}${country ? ` (${country})` : ""}`);
  const groundingResults = await tryGeminiWithGrounding(companyName, website, prospectType, country);

  if (groundingResults && groundingResults.length > 0) {
    console.log(`Gemini grounding returned ${groundingResults.length} items`);
    return groundingResults;
  }

  console.log(`Falling back to RSS for: ${companyName}`);
  const rssResults = await fetchWithRSSFallback(companyName, website, prospectType, country);

  if (rssResults && rssResults.length > 0) {
    console.log(`RSS fallback returned ${rssResults.length} items`);
    return rssResults;
  }

  console.log(`Falling back to Gemini knowledge for: ${companyName}`);
  return fetchWithGeminiKnowledge(companyName, website, prospectType, country);
}

// ============================================================
// LINKEDIN COMPANY PAGE INTELLIGENCE (Phase 3.1)
// ============================================================

export async function fetchLinkedInCompanyIntelligence(
  companyName: string,
  linkedinUrl: string,
  country?: string
): Promise<IntelligenceResult[]> {
  try {
    console.log(`Fetching LinkedIn intelligence for: ${companyName} (${linkedinUrl})`);

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      tools: [{ googleSearch: {} }],
    } as any);

    const prompt = `Search for recent LinkedIn activity and posts from "${companyName}" (LinkedIn page: ${linkedinUrl}).

Look for information from the last 30-60 days:
- Company page posts and announcements
- Key employee posts (CEO, CTO, CMO, etc.) about the company
- Job postings or hiring announcements that indicate growth
- Company milestones or achievements shared on LinkedIn
- Product or service announcements
- Events or conferences they're attending/speaking at
${country ? `\nThis company is based in ${country}.` : ""}

For each piece of LinkedIn activity found, return JSON:
{
  "items": [
    {
      "title": "Clear headline (max 100 chars)",
      "summary": "2-3 sentence description of the LinkedIn post/activity",
      "intelligenceType": "linkedin_post|company_update|job_change",
      "personName": "Name of person who posted (if applicable)",
      "personPosition": "Their role at the company (if applicable)",
      "aiTip": "Actionable sales tip based on this activity",
      "keyFact": "Key fact from the post",
      "relevanceScore": 75
    }
  ]
}

Only include items with relevanceScore >= 50. If no LinkedIn activity found, return {"items": []}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const data = parseGeminiJson(response.text());
    const items = data.items || [];

    return items.map((item: any) => ({
      id: generateId(),
      title: item.title || "LinkedIn Update",
      description: item.summary,
      sourceType: "linkedin" as IntelligenceSourceType,
      intelligenceType: item.intelligenceType || "linkedin_post",
      url: linkedinUrl,
      publishedAt: new Date().toISOString(),
      aiTip: item.aiTip,
      relevanceScore: item.relevanceScore || 60,
      companyName,
      sourceName: "LinkedIn",
      contentQuote: item.keyFact,
      personName: item.personName,
      personPosition: item.personPosition,
      personLinkedinUrl: linkedinUrl,
    }));
  } catch (error: any) {
    console.error("LinkedIn intelligence error:", error.message);
    return [];
  }
}

// ============================================================
// INDUSTRY NEWS (Phase 3.2)
// ============================================================

export async function fetchIndustryNews(
  prospectType: string,
  country?: string
): Promise<IntelligenceResult[]> {
  const config = INDUSTRY_SOURCES[prospectType];
  if (!config) return [];

  try {
    console.log(`Fetching industry news for type: ${prospectType}`);

    // Pick one search term to avoid too many requests
    const searchTerm = config.searchTerms[Math.floor(Math.random() * config.searchTerms.length)];
    const query = country ? `${searchTerm} ${country}` : searchTerm;

    const articles = await fetchGoogleNews(query, country);

    if (articles.length === 0) return [];

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const articlesContext = articles
      .slice(0, 8)
      .map(
        (a, i) =>
          `${i + 1}. "${a.title}" - ${a.source} (${a.pubDate})\n   ${a.snippet}\n   URL: ${a.link}`
      )
      .join("\n\n");

    const prompt = `Analyze these industry news articles and identify the most relevant ones for a B2B sales team targeting ${prospectType} organizations${country ? ` in ${country}` : ""}.

Relevant publications to prioritize: ${config.publications.join(", ")}

Articles found:
${articlesContext}

Select the top 3 most useful articles for a sales team. Focus on:
- Industry trends that affect buying decisions
- Major deals or partnerships in the industry
- Technology adoption trends
- Regulatory changes

Return JSON:
{
  "items": [
    {
      "originalIndex": 1,
      "title": "Clean headline",
      "summary": "2-3 sentence summary explaining why this matters for sales",
      "intelligenceType": "news",
      "aiTip": "How to use this in sales conversations",
      "keyFact": "Key fact or statistic",
      "relevanceScore": 70
    }
  ]
}

Only include articles with relevanceScore >= 50. If none are relevant, return {"items": []}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const data = parseGeminiJson(response.text());
    const analyzedItems = data.items || [];

    return analyzedItems.map((item: any) => {
      const originalArticle = articles[item.originalIndex - 1] || articles[0];
      return {
        id: generateId(),
        title: item.title,
        description: item.summary,
        sourceType: "news" as IntelligenceSourceType,
        intelligenceType: "news" as IntelligenceType,
        url: originalArticle.link,
        publishedAt: new Date(originalArticle.pubDate).toISOString(),
        aiTip: item.aiTip,
        relevanceScore: item.relevanceScore || 60,
        companyName: `${prospectType} Industry`,
        sourceName: originalArticle.source,
        contentQuote: item.keyFact,
      };
    });
  } catch (error: any) {
    console.error("Industry news error:", error.message);
    return [];
  }
}

// ============================================================
// MULTI-STEP VERIFICATION (Phase 4.1)
// ============================================================

export async function verifyIntelligenceResults(
  results: IntelligenceResult[],
  companyName: string,
  website?: string,
  country?: string
): Promise<IntelligenceResult[]> {
  if (results.length < 3) return results;

  try {
    console.log(`Verifying ${results.length} intelligence results for: ${companyName}`);

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const itemsList = results
      .map(
        (r, i) =>
          `${i}. [${r.sourceType}] "${r.title}" - ${r.sourceName || "Unknown source"}\n   ${r.description?.substring(0, 150) || "No description"}`
      )
      .join("\n\n");

    const disambiguationContext = buildDisambiguationContext(companyName, website, country);

    const prompt = `You are verifying intelligence results about a company. Check each item for accuracy.

${disambiguationContext}

Here are ${results.length} intelligence items gathered from multiple sources:
${itemsList}

For each item, verify:
1. Is this DEFINITELY about the correct company described above?
2. Does the information seem factually plausible and consistent?
3. Are there items covering the same event from different sources? (These are MORE reliable)

Return JSON:
{
  "verified": [
    { "index": 0, "keep": true, "relevanceBoost": 0, "reason": "Confirmed about correct company" },
    { "index": 1, "keep": false, "reason": "This appears to be about a different company" },
    { "index": 2, "keep": true, "relevanceBoost": 10, "reason": "Confirmed by multiple sources" }
  ]
}

Set "keep": false for items that are NOT about the correct company.
Set "relevanceBoost": 10 for items confirmed by multiple sources.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const data = parseGeminiJson(response.text());
    const verified = data.verified || [];

    const verifiedResults: IntelligenceResult[] = [];

    for (const v of verified) {
      if (v.keep && v.index >= 0 && v.index < results.length) {
        const item = { ...results[v.index] };
        if (v.relevanceBoost) {
          item.relevanceScore = Math.min(100, (item.relevanceScore || 60) + v.relevanceBoost);
        }
        verifiedResults.push(item);
      }
    }

    console.log(`Verification: ${verifiedResults.length}/${results.length} items kept`);
    return verifiedResults;
  } catch (error: any) {
    console.error("Verification error:", error.message);
    return results; // On error, return unverified results
  }
}

// ============================================================
// UNIFIED ORCHESTRATOR (Phase 3.3)
// ============================================================

export async function fetchAllIntelligenceForProspect(
  prospect: ProspectForFetch
): Promise<IntelligenceResult[]> {
  const allResults: IntelligenceResult[] = [];

  // 1. Existing 3-tier news fetch
  const newsResults = await fetchIntelligenceWithGemini(
    prospect.company,
    prospect.website,
    prospect.prospectType,
    prospect.country
  );
  allResults.push(...newsResults);

  // 2. LinkedIn company page (if URL available)
  if (prospect.linkedinUrl) {
    try {
      const linkedinResults = await fetchLinkedInCompanyIntelligence(
        prospect.company,
        prospect.linkedinUrl,
        prospect.country
      );
      allResults.push(...linkedinResults);
    } catch (error) {
      console.error("LinkedIn fetch failed:", error);
    }
  }

  // 3. Industry news (if prospect type has config)
  if (prospect.prospectType && INDUSTRY_SOURCES[prospect.prospectType]) {
    try {
      const industryResults = await fetchIndustryNews(
        prospect.prospectType,
        prospect.country
      );
      allResults.push(...industryResults);
    } catch (error) {
      console.error("Industry news fetch failed:", error);
    }
  }

  // 4. Verify results if we have enough
  if (allResults.length >= 3) {
    return verifyIntelligenceResults(
      allResults,
      prospect.company,
      prospect.website,
      prospect.country
    );
  }

  return allResults;
}
