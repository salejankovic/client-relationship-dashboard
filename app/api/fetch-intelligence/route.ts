import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import type { IntelligenceType, IntelligenceSourceType } from "@/lib/types";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

interface IntelligenceResult {
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
}

interface NewsArticle {
  title: string;
  link: string;
  pubDate: string;
  source: string;
  snippet: string;
}

/**
 * Clean HTML entities and tags from text
 */
function cleanHtml(text: string): string {
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

/**
 * Get locale settings based on country
 */
function getLocaleForCountry(country?: string): { hl: string; gl: string; ceid: string } {
  const localeMap: Record<string, { hl: string; gl: string; ceid: string }> = {
    "Serbia": { hl: "sr", gl: "RS", ceid: "RS:sr" },
    "Croatia": { hl: "hr", gl: "HR", ceid: "HR:hr" },
    "Slovenia": { hl: "sl", gl: "SI", ceid: "SI:sl" },
    "Bosnia and Herzegovina": { hl: "bs", gl: "BA", ceid: "BA:bs" },
    "Montenegro": { hl: "sr", gl: "ME", ceid: "ME:sr" },
    "North Macedonia": { hl: "mk", gl: "MK", ceid: "MK:mk" },
    "Greece": { hl: "el", gl: "GR", ceid: "GR:el" },
    "Belgium": { hl: "nl", gl: "BE", ceid: "BE:nl" },
    "Georgia": { hl: "ka", gl: "GE", ceid: "GE:ka" },
    "Germany": { hl: "de", gl: "DE", ceid: "DE:de" },
    "France": { hl: "fr", gl: "FR", ceid: "FR:fr" },
    "Italy": { hl: "it", gl: "IT", ceid: "IT:it" },
    "Spain": { hl: "es", gl: "ES", ceid: "ES:es" },
    "UK": { hl: "en", gl: "GB", ceid: "GB:en" },
    "United Kingdom": { hl: "en", gl: "GB", ceid: "GB:en" },
  };
  return localeMap[country || ""] || { hl: "en", gl: "US", ceid: "US:en" };
}

/**
 * Build search query with company context
 */
function buildSearchQuery(companyName: string, country?: string, prospectType?: string): string {
  const parts = [companyName];

  // Add country context for disambiguation
  if (country) {
    parts.push(country);
  }

  // Add type context for better results
  if (prospectType === "Media") {
    parts.push("media company news");
  } else if (prospectType === "Sports Club") {
    parts.push("club");
  } else if (prospectType === "Sports League") {
    parts.push("league");
  }

  return parts.join(" ");
}

/**
 * Fetch news from Google News RSS
 */
async function fetchGoogleNews(companyName: string, country?: string, prospectType?: string): Promise<NewsArticle[]> {
  try {
    const query = buildSearchQuery(companyName, country, prospectType);
    const searchQuery = encodeURIComponent(query);
    const locale = getLocaleForCountry(country);
    const rssUrl = `https://news.google.com/rss/search?q=${searchQuery}&hl=${locale.hl}&gl=${locale.gl}&ceid=${locale.ceid}`;

    console.log(`Fetching Google News RSS: ${rssUrl}`);

    const response = await fetch(rssUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "application/rss+xml, application/xml, text/xml, */*",
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

    // Parse RSS XML
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;

    while ((match = itemRegex.exec(xml)) !== null && articles.length < 10) {
      const itemXml = match[1];

      const titleMatch = itemXml.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>|<title>([\s\S]*?)<\/title>/);
      const linkMatch = itemXml.match(/<link>([\s\S]*?)<\/link>/);
      const pubDateMatch = itemXml.match(/<pubDate>([\s\S]*?)<\/pubDate>/);
      const sourceMatch = itemXml.match(/<source[^>]*>([\s\S]*?)<\/source>/);
      const descMatch = itemXml.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>|<description>([\s\S]*?)<\/description>/);

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

/**
 * Get company-type-specific filtering instructions
 */
function getCompanyTypeInstructions(prospectType?: string): string {
  if (prospectType === "Media") {
    return `
CRITICAL - MEDIA COMPANY RULES:
This is a MEDIA/PUBLISHING company. They publish news articles as their core business.
- ONLY include news where ${prospectType} IS THE SUBJECT of the article, not the publisher
- Look for: "${prospectType} announces", "${prospectType} acquires", leadership changes AT the company, financial results, partnerships, layoffs, restructuring
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

/**
 * Get sales-focused relevance scoring criteria
 */
function getSalesRelevanceCriteria(): string {
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

/**
 * Try Gemini with Google Search Retrieval grounding
 */
async function tryGeminiWithGrounding(
  companyName: string,
  website?: string,
  prospectType?: string,
  country?: string
): Promise<IntelligenceResult[] | null> {
  try {
    const searchContext = [
      `Company: ${companyName}`,
      website ? `Website: ${website}` : null,
      prospectType ? `Type: ${prospectType}` : null,
      country ? `Country: ${country}` : null,
    ].filter(Boolean).join("\n");

    const companyTypeInstructions = getCompanyTypeInstructions(prospectType);
    const relevanceCriteria = getSalesRelevanceCriteria();

    const verificationNote = country || website
      ? `\nCRITICAL - COMPANY VERIFICATION:
Only include news that is DEFINITELY about "${companyName}" ${country ? `based in ${country}` : ""}${website ? ` (website: ${website})` : ""}.
If there are multiple companies with similar names, only include results about THIS specific company.
If you're not sure if an article is about the right company, EXCLUDE it.`
      : "";

    const prompt = `Search for recent news and updates about this company for B2B SALES purposes:

${searchContext}
${verificationNote}

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

    // Try with googleSearch tool for grounding
    const model = genAI.getGenerativeModel({
      model: "gemini-3.0-flash",
      tools: [{ googleSearch: {} }],
    } as any);

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

    console.log("Gemini grounding response:", text.substring(0, 500));

    // Parse JSON
    text = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      text = jsonMatch[0];
    }

    const data = JSON.parse(text);
    const items = data.items || [];

    if (items.length === 0) {
      console.log("Gemini grounding returned empty items array");
      return null; // Trigger fallback
    }

    const typeToSource: Record<string, IntelligenceSourceType> = {
      news: "news",
      company_update: "other",
      job_change: "job-change",
      funding: "funding",
      match_result: "sports",
    };

    return items.map((item: any) => ({
      id: `intel-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: item.title || "News Update",
      description: item.summary,
      sourceType: typeToSource[item.intelligenceType] || "news",
      intelligenceType: item.intelligenceType || "news",
      url: item.sourceUrl,
      publishedAt: item.publishedDate ? new Date(item.publishedDate).toISOString() : new Date().toISOString(),
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
    return null; // Trigger fallback
  }
}

/**
 * Fallback: Fetch news via RSS and analyze with Gemini
 */
async function fetchWithRSSFallback(
  companyName: string,
  website?: string,
  prospectType?: string,
  country?: string
): Promise<IntelligenceResult[]> {
  // Fetch news from Google News RSS with country context
  const articles = await fetchGoogleNews(companyName, country, prospectType);

  if (articles.length === 0) {
    console.log("No articles found in Google News for:", companyName);
    return [];
  }

  console.log(`Found ${articles.length} articles for ${companyName}, analyzing with Gemini...`);

  // Use Gemini to analyze and structure the news
  const model = genAI.getGenerativeModel({ model: "gemini-3.0-flash" });

  const articlesContext = articles.map((a, i) =>
    `${i + 1}. "${a.title}" - ${a.source} (${a.pubDate})\n   ${a.snippet}\n   URL: ${a.link}`
  ).join("\n\n");

  const companyTypeInstructions = getCompanyTypeInstructions(prospectType);
  const relevanceCriteria = getSalesRelevanceCriteria();

  const verificationNote = country || website
    ? `\nCRITICAL - COMPANY VERIFICATION:
Only include articles that are DEFINITELY about "${companyName}" ${country ? `based in ${country}` : ""}${website ? ` (website: ${website})` : ""}.
If an article is about a DIFFERENT company with a similar name, set relevanceScore to 0 and EXCLUDE it.
For example, if searching for "NIN" (Serbian magazine) but find "NIN" (National Institute of Nutrition in India), EXCLUDE it.`
    : "";

  const prompt = `Analyze these news articles about "${companyName}" and identify the most relevant ones for B2B SALES outreach.

Company context:
- Name: ${companyName}
${website ? `- Website: ${website}` : ""}
${prospectType ? `- Type: ${prospectType}` : ""}
${country ? `- Country: ${country}` : ""}
${verificationNote}

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
    let text = response.text();

    text = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      text = jsonMatch[0];
    }

    const data = JSON.parse(text);
    const analyzedItems = data.items || [];

    const typeToSource: Record<string, IntelligenceSourceType> = {
      news: "news",
      company_update: "other",
      job_change: "job-change",
      funding: "funding",
      match_result: "sports",
    };

    return analyzedItems.map((item: any) => {
      const originalArticle = articles[item.originalIndex - 1] || articles[0];

      return {
        id: `intel-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        title: item.title,
        description: item.summary,
        sourceType: typeToSource[item.intelligenceType] || "news",
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

/**
 * Final fallback: Ask Gemini for known information about the company
 */
async function fetchWithGeminiKnowledge(
  companyName: string,
  website?: string,
  prospectType?: string,
  country?: string
): Promise<IntelligenceResult[]> {
  try {
    console.log(`Using Gemini knowledge fallback for: ${companyName}`);

    const model = genAI.getGenerativeModel({ model: "gemini-3.0-flash" });

    const searchContext = [
      `Company: ${companyName}`,
      website ? `Website: ${website}` : null,
      prospectType ? `Type: ${prospectType}` : null,
      country ? `Country: ${country}` : null,
    ].filter(Boolean).join("\n");

    const prompt = `Based on your knowledge, provide information about this company for B2B sales purposes:

${searchContext}

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
    let text = response.text();

    text = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      text = jsonMatch[0];
    }

    const data = JSON.parse(text);
    const items = data.items || [];

    const typeToSource: Record<string, IntelligenceSourceType> = {
      news: "news",
      company_update: "other",
      job_change: "job-change",
      funding: "funding",
    };

    return items.map((item: any) => ({
      id: `intel-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: item.title || "Company Information",
      description: item.summary,
      sourceType: typeToSource[item.intelligenceType] || "other",
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

/**
 * Main function: Try grounding first, fallback to RSS, then Gemini knowledge
 */
async function fetchIntelligenceWithGemini(
  companyName: string,
  website?: string,
  prospectType?: string,
  country?: string
): Promise<IntelligenceResult[]> {
  // Try Gemini with Google Search grounding first
  console.log(`Trying Gemini grounding for: ${companyName}${country ? ` (${country})` : ""}`);
  const groundingResults = await tryGeminiWithGrounding(companyName, website, prospectType, country);

  if (groundingResults && groundingResults.length > 0) {
    console.log(`Gemini grounding returned ${groundingResults.length} items`);
    return groundingResults;
  }

  // Fallback to RSS + Gemini analysis
  console.log(`Falling back to RSS for: ${companyName}`);
  const rssResults = await fetchWithRSSFallback(companyName, website, prospectType, country);

  if (rssResults && rssResults.length > 0) {
    console.log(`RSS fallback returned ${rssResults.length} items`);
    return rssResults;
  }

  // Final fallback: Use Gemini's knowledge base
  console.log(`Falling back to Gemini knowledge for: ${companyName}`);
  return fetchWithGeminiKnowledge(companyName, website, prospectType, country);
}

export async function POST(request: NextRequest) {
  try {
    const {
      companyName,
      prospectId,
      website,
      prospectType,
      country,
      saveToDB = true,
    } = await request.json();

    if (!companyName) {
      return NextResponse.json(
        { error: "Company name is required" },
        { status: 400 }
      );
    }

    console.log(`Fetching intelligence for: ${companyName}${country ? ` (${country})` : ""}`);

    // Fetch intelligence using Gemini with web search
    const intelligenceItems = await fetchIntelligenceWithGemini(companyName, website, prospectType, country);

    if (intelligenceItems.length === 0) {
      return NextResponse.json({
        message: "No recent news found for this company",
        items: [],
        newItemsCount: 0,
      });
    }

    // Sort by relevance
    intelligenceItems.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));

    console.log(`Found ${intelligenceItems.length} items for ${companyName}`);

    // Save to database
    let savedCount = 0;
    if (saveToDB && intelligenceItems.length > 0 && prospectId) {
      // Check for duplicates
      const { data: existingItems } = await supabase
        .from("intelligence_items")
        .select("url, title")
        .eq("prospect_id", prospectId);

      const existingUrls = new Set((existingItems || []).filter(i => i.url).map(i => i.url));
      const existingTitles = new Set((existingItems || []).map(i => i.title));

      const newItems = intelligenceItems.filter(item => {
        if (item.url && existingUrls.has(item.url)) return false;
        if (existingTitles.has(item.title)) return false;
        return true;
      });

      if (newItems.length > 0) {
        const { error } = await supabase
          .from("intelligence_items")
          .insert(
            newItems.map(item => ({
              id: item.id,
              prospect_id: prospectId,
              title: item.title,
              description: item.description,
              source_type: item.sourceType,
              intelligence_type: item.intelligenceType,
              url: item.url,
              published_at: item.publishedAt,
              ai_tip: item.aiTip,
              relevance_score: item.relevanceScore,
              company_name: item.companyName,
              source_name: item.sourceName,
              content_quote: item.contentQuote,
              match_home_team: item.matchHomeTeam,
              match_away_team: item.matchAwayTeam,
              match_home_score: item.matchHomeScore,
              match_away_score: item.matchAwayScore,
              match_league: item.matchLeague,
              dismissed: false,
            }))
          );

        if (!error) {
          savedCount = newItems.length;
        } else {
          console.error("Insert error:", error);
        }
      }

      // Update refresh log
      await supabase
        .from("intelligence_refresh_log")
        .upsert({
          id: `refresh-${prospectId}-gemini`,
          prospect_id: prospectId,
          source: "gemini_search",
          last_refresh_at: new Date().toISOString(),
          status: "success",
          items_found: savedCount,
        }, { onConflict: "id" });
    }

    return NextResponse.json({
      message: savedCount > 0
        ? `Saved ${savedCount} new intelligence items`
        : intelligenceItems.length > 0
        ? `Found ${intelligenceItems.length} items (already saved)`
        : "No relevant news found",
      items: intelligenceItems,
      newItemsCount: savedCount,
    });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch intelligence" },
      { status: 500 }
    );
  }
}
