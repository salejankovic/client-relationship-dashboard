import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import type { IntelligenceType, IntelligenceSourceType } from "@/lib/types";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

interface NewsArticle {
  title: string;
  link: string;
  pubDate: string;
  rawDescription?: string;
  sourceName?: string;
}

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

/**
 * Strip HTML tags and decode HTML entities
 */
function cleanHtml(html: string): string {
  if (!html) return "";

  // Decode HTML entities
  let text = html
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");

  // Remove HTML tags
  text = text.replace(/<[^>]*>/g, "");

  // Clean up whitespace
  text = text.replace(/\s+/g, " ").trim();

  return text;
}

/**
 * Fetch news from Google News RSS
 */
async function fetchGoogleNews(companyName: string, website?: string): Promise<NewsArticle[]> {
  try {
    const searchTerms = [companyName];
    if (website) {
      const domain = website.replace(/^https?:\/\//, "").replace(/\/$/, "").split("/")[0];
      searchTerms.push(domain);
    }

    const query = encodeURIComponent(searchTerms.join(" OR "));
    const rssUrl = `https://news.google.com/rss/search?q=${query}&hl=en-US&gl=US&ceid=US:en`;

    const response = await fetch(rssUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; NewsBot/1.0)" },
    });

    if (!response.ok) return [];

    const xmlText = await response.text();
    const articles: NewsArticle[] = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    const titleRegex = /<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/;
    const linkRegex = /<link>(.*?)<\/link>/;
    const pubDateRegex = /<pubDate>(.*?)<\/pubDate>/;
    const descRegex = /<description>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/;
    const sourceRegex = /<source[^>]*>(.*?)<\/source>/;

    let match;
    while ((match = itemRegex.exec(xmlText)) !== null && articles.length < 8) {
      const item = match[1];
      const titleMatch = titleRegex.exec(item);
      const linkMatch = linkRegex.exec(item);
      const pubDateMatch = pubDateRegex.exec(item);
      const descMatch = descRegex.exec(item);
      const sourceMatch = sourceRegex.exec(item);

      if (titleMatch && linkMatch) {
        articles.push({
          title: cleanHtml(titleMatch[1]),
          link: linkMatch[1].trim(),
          pubDate: pubDateMatch ? pubDateMatch[1].trim() : new Date().toISOString(),
          rawDescription: descMatch ? cleanHtml(descMatch[1]) : undefined,
          sourceName: sourceMatch ? cleanHtml(sourceMatch[1]) : undefined,
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
 * Use Gemini to analyze and summarize articles for the company
 */
async function analyzeArticlesWithGemini(
  articles: NewsArticle[],
  companyName: string,
  prospectType?: string
): Promise<IntelligenceResult[]> {
  if (articles.length === 0) return [];

  try {
    const articlesText = articles.map((a, i) =>
      `Article ${i + 1}:
Title: ${a.title}
Source: ${a.sourceName || "Unknown"}
Date: ${a.pubDate}
Raw content: ${a.rawDescription || "No description"}`
    ).join("\n\n");

    const prompt = `You are a B2B sales intelligence assistant. Analyze these news articles about "${companyName}" ${prospectType ? `(a ${prospectType})` : ""}.

${articlesText}

For EACH article that is actually relevant to ${companyName}, create a clean intelligence item:

1. **summary**: Write a clear, human-readable 1-2 sentence summary of what happened. NO HTML, NO URLs in the text. Just plain text explaining the news.

2. **intelligenceType**: Categorize as one of:
   - "news" - General news coverage
   - "company_update" - Partnerships, product launches, business developments
   - "match_result" - Sports match results (for sports clubs)
   - "job_change" - Leadership changes, new hires
   - "funding" - Investments, funding rounds

3. **aiTip**: Write a SPECIFIC, actionable tip (max 80 chars) for how a salesperson could use this in outreach. Be concrete, e.g., "Congratulate them on the new signing" or "Ask about their expansion plans"

4. **relevanceScore**: 0-100 based on how directly this relates to ${companyName}

5. **keyFact**: One specific fact or quote from the article (max 80 chars)

${prospectType === "Sports Club" ? `6. For match results, also include: homeTeam, awayTeam, homeScore, awayScore, league` : ""}

Return JSON:
{
  "items": [
    {
      "articleIndex": 0,
      "summary": "BAXI Manresa signed Danish forward Gustav Knudsen for the upcoming season, strengthening their roster.",
      "intelligenceType": "company_update",
      "aiTip": "Congratulate them on the new signing",
      "relevanceScore": 85,
      "keyFact": "Signed Gustav Knudsen as new forward"
    }
  ]
}

Only include articles with relevanceScore >= 50. Skip irrelevant articles entirely.`;

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

    // Parse JSON
    text = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      text = jsonMatch[0];
    }

    const data = JSON.parse(text);
    const items = data.items || [];

    // Map to IntelligenceResult
    const typeToSource: Record<string, IntelligenceSourceType> = {
      news: "news",
      company_update: "other",
      job_change: "job-change",
      funding: "funding",
      match_result: "sports",
    };

    return items.map((item: any) => {
      const articleIndex = item.articleIndex ?? 0;
      const article = articles[articleIndex] || articles[0];
      const id = `intel-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      return {
        id,
        title: article.title,
        description: item.summary,
        sourceType: typeToSource[item.intelligenceType] || "news",
        intelligenceType: item.intelligenceType || "news",
        url: article.link,
        publishedAt: new Date(article.pubDate).toISOString(),
        aiTip: item.aiTip,
        relevanceScore: item.relevanceScore || 60,
        companyName,
        sourceName: article.sourceName,
        contentQuote: item.keyFact,
        // Match result fields
        matchHomeTeam: item.homeTeam,
        matchAwayTeam: item.awayTeam,
        matchHomeScore: item.homeScore,
        matchAwayScore: item.awayScore,
        matchLeague: item.league,
      };
    });
  } catch (error) {
    console.error("Error analyzing with Gemini:", error);

    // Fallback: return basic cleaned items
    return articles.slice(0, 3).map(article => {
      const id = `intel-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      return {
        id,
        title: article.title,
        description: article.rawDescription?.substring(0, 200) || "News article about " + companyName,
        sourceType: "news" as IntelligenceSourceType,
        intelligenceType: "news" as IntelligenceType,
        url: article.link,
        publishedAt: new Date(article.pubDate).toISOString(),
        aiTip: "Review this article for conversation topics",
        relevanceScore: 60,
        companyName,
        sourceName: article.sourceName,
      };
    });
  }
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

    // 1. Fetch news articles
    const articles = await fetchGoogleNews(companyName, website);

    if (articles.length === 0) {
      return NextResponse.json({
        message: "No recent news found for this company",
        items: [],
        newItemsCount: 0,
      });
    }

    // 2. Have Gemini analyze and summarize
    const intelligenceItems = await analyzeArticlesWithGemini(articles, companyName, prospectType);

    // Sort by relevance
    intelligenceItems.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));

    // 3. Save to database
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
        // Add prospectId to items
        const itemsToInsert = newItems.map(item => ({
          ...item,
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
        }));

        const { error } = await supabase
          .from("intelligence_items")
          .insert(itemsToInsert);

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
          id: `refresh-${prospectId}-news`,
          prospect_id: prospectId,
          source: "news",
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
