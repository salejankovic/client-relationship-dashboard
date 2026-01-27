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
 * Fetch news from Google News RSS
 */
async function fetchGoogleNews(query: string): Promise<NewsArticle[]> {
  try {
    const searchQuery = encodeURIComponent(query);
    const rssUrl = `https://news.google.com/rss/search?q=${searchQuery}&hl=en&gl=US&ceid=US:en`;

    const response = await fetch(rssUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; ZlatkoCRM/1.0)",
      },
    });

    if (!response.ok) {
      console.error("Google News RSS failed:", response.status);
      return [];
    }

    const xml = await response.text();
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

    return articles;
  } catch (error) {
    console.error("Error fetching Google News:", error);
    return [];
  }
}

/**
 * Try Gemini with Google Search Retrieval grounding
 */
async function tryGeminiWithGrounding(
  companyName: string,
  website?: string,
  prospectType?: string
): Promise<IntelligenceResult[] | null> {
  try {
    const searchContext = [
      `Company: ${companyName}`,
      website ? `Website: ${website}` : null,
      prospectType ? `Type: ${prospectType}` : null,
    ].filter(Boolean).join("\n");

    const prompt = `Search for recent news and updates about this company:

${searchContext}

Find information from the last 30-60 days including:
- News articles and press releases
- Company announcements, partnerships, product launches
- Leadership changes or new hires
- Funding rounds or acquisitions
${prospectType === "Sports Club" ? "- Recent match results and sports news" : ""}

For each piece of news found, return JSON with this structure:
{
  "items": [
    {
      "title": "Clear headline (max 100 chars)",
      "summary": "1-2 sentence description",
      "intelligenceType": "news|company_update|match_result|job_change|funding",
      "sourceUrl": "https://source-url.com",
      "sourceName": "Publication Name",
      "publishedDate": "2026-01-15",
      "aiTip": "Sales tip (max 80 chars)",
      "keyFact": "Key fact (max 80 chars)",
      "relevanceScore": 85
    }
  ]
}

Only include items with relevanceScore >= 50. If no news found, return {"items": []}`;

    // Try with googleSearch (requires paid plan for grounding)
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      tools: [{ googleSearch: {} }],
    } as any);

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

    console.log("Gemini grounding response:", text.substring(0, 300));

    // Parse JSON
    text = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      text = jsonMatch[0];
    }

    const data = JSON.parse(text);
    const items = data.items || [];

    if (items.length === 0) {
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
    console.log("Gemini grounding not available:", error.message);
    return null; // Trigger fallback
  }
}

/**
 * Fallback: Fetch news via RSS and analyze with Gemini
 */
async function fetchWithRSSFallback(
  companyName: string,
  website?: string,
  prospectType?: string
): Promise<IntelligenceResult[]> {
  // Fetch news from Google News RSS
  const articles = await fetchGoogleNews(companyName);

  if (articles.length === 0) {
    console.log("No articles found in Google News for:", companyName);
    return [];
  }

  console.log(`Found ${articles.length} articles for ${companyName}, analyzing with Gemini...`);

  // Use Gemini to analyze and structure the news
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const articlesContext = articles.map((a, i) =>
    `${i + 1}. "${a.title}" - ${a.source} (${a.pubDate})\n   ${a.snippet}\n   URL: ${a.link}`
  ).join("\n\n");

  const prompt = `Analyze these news articles about "${companyName}" and identify the most relevant ones for B2B sales outreach.

Company context:
- Name: ${companyName}
${website ? `- Website: ${website}` : ""}
${prospectType ? `- Type: ${prospectType}` : ""}

Articles found:
${articlesContext}

For each relevant article (max 5), provide:
1. A clean, professional title (rewrite if needed)
2. A 1-2 sentence summary in plain English
3. Type: news, company_update, job_change, funding, or match_result
4. A specific sales tip (how to use this in outreach)
5. One key fact or quote from the article
6. Relevance score (0-100) for B2B sales

Return JSON:
{
  "items": [
    {
      "originalIndex": 1,
      "title": "Clean headline",
      "summary": "Clear summary without HTML",
      "intelligenceType": "news",
      "aiTip": "Actionable sales tip",
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
 * Main function: Try grounding first, fallback to RSS
 */
async function fetchIntelligenceWithGemini(
  companyName: string,
  website?: string,
  prospectType?: string
): Promise<IntelligenceResult[]> {
  // Try Gemini with Google Search grounding first
  console.log(`Trying Gemini grounding for: ${companyName}`);
  const groundingResults = await tryGeminiWithGrounding(companyName, website, prospectType);

  if (groundingResults && groundingResults.length > 0) {
    console.log(`Gemini grounding returned ${groundingResults.length} items`);
    return groundingResults;
  }

  // Fallback to RSS + Gemini analysis
  console.log(`Falling back to RSS for: ${companyName}`);
  return fetchWithRSSFallback(companyName, website, prospectType);
}

export async function POST(request: NextRequest) {
  try {
    const {
      companyName,
      prospectId,
      website,
      prospectType,
      saveToDB = true,
    } = await request.json();

    if (!companyName) {
      return NextResponse.json(
        { error: "Company name is required" },
        { status: 400 }
      );
    }

    console.log(`Fetching intelligence for: ${companyName}`);

    // Fetch intelligence using Gemini with web search
    const intelligenceItems = await fetchIntelligenceWithGemini(companyName, website, prospectType);

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
