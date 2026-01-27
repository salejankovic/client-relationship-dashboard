import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import type { IntelligenceType, IntelligenceSourceType } from "@/lib/types";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

interface NewsArticle {
  title: string;
  link: string;
  pubDate: string;
  description?: string;
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
 * Fetch news from Google News RSS
 */
async function fetchGoogleNews(companyName: string, website?: string): Promise<NewsArticle[]> {
  try {
    // Build search query
    const searchTerms = [companyName];
    if (website) {
      const domain = website.replace(/^https?:\/\//, "").replace(/\/$/, "").split("/")[0];
      searchTerms.push(domain);
    }

    const query = encodeURIComponent(searchTerms.join(" OR "));
    const rssUrl = `https://news.google.com/rss/search?q=${query}&hl=en-US&gl=US&ceid=US:en`;

    console.log(`Fetching news for: ${companyName}, URL: ${rssUrl}`);

    const response = await fetch(rssUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; NewsBot/1.0)",
      },
    });

    if (!response.ok) {
      console.error(`Google News fetch failed: ${response.status}`);
      return [];
    }

    const xmlText = await response.text();

    // Parse RSS XML
    const articles: NewsArticle[] = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    const titleRegex = /<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/;
    const linkRegex = /<link>(.*?)<\/link>/;
    const pubDateRegex = /<pubDate>(.*?)<\/pubDate>/;
    const descRegex = /<description>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/;
    const sourceRegex = /<source[^>]*>(.*?)<\/source>/;

    let match;
    while ((match = itemRegex.exec(xmlText)) !== null && articles.length < 10) {
      const item = match[1];

      const titleMatch = titleRegex.exec(item);
      const linkMatch = linkRegex.exec(item);
      const pubDateMatch = pubDateRegex.exec(item);
      const descMatch = descRegex.exec(item);
      const sourceMatch = sourceRegex.exec(item);

      if (titleMatch && linkMatch) {
        articles.push({
          title: titleMatch[1].trim(),
          link: linkMatch[1].trim(),
          pubDate: pubDateMatch ? pubDateMatch[1].trim() : new Date().toISOString(),
          description: descMatch ? descMatch[1].trim().substring(0, 500) : undefined,
          sourceName: sourceMatch ? sourceMatch[1].trim() : undefined,
        });
      }
    }

    console.log(`Found ${articles.length} articles for ${companyName}`);
    return articles.slice(0, 5);
  } catch (error) {
    console.error("Error fetching Google News:", error);
    return [];
  }
}

/**
 * Analyze article with Gemini and generate sales tip
 */
async function analyzeArticle(
  article: NewsArticle,
  companyName: string,
  prospectType?: string
): Promise<{
  relevanceScore: number;
  aiTip: string;
  intelligenceType: IntelligenceType;
  contentQuote?: string;
}> {
  try {
    const prompt = `Analyze this news article for B2B sales intelligence.

Company we're selling to: ${companyName}
${prospectType ? `Company type: ${prospectType}` : ""}

Article Title: ${article.title}
Article Description: ${article.description || "No description available"}
Source: ${article.sourceName || "Unknown"}

Provide analysis in JSON format:
{
  "relevanceScore": <0-100, how useful is this for sales outreach to this company>,
  "intelligenceType": "<news|company_update|job_change|funding|match_result|other>",
  "aiTip": "<One short actionable tip (max 80 chars) for using this in a follow-up email>",
  "contentQuote": "<Most relevant quote or fact from the article (max 100 chars)>"
}

Be generous with relevance scores - if the article mentions the company, score at least 60.
For sports clubs, match results are highly relevant (score 80+).`;

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

    // Clean and parse JSON
    text = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      text = jsonMatch[0];
    }

    const analysis = JSON.parse(text);

    return {
      relevanceScore: Math.max(0, Math.min(100, analysis.relevanceScore || 60)),
      aiTip: analysis.aiTip || "Review this article for conversation starters",
      intelligenceType: analysis.intelligenceType || "news",
      contentQuote: analysis.contentQuote,
    };
  } catch (error) {
    console.error("Error analyzing article:", error);
    return {
      relevanceScore: 60,
      aiTip: "Review this recent news for conversation starters",
      intelligenceType: "news",
    };
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

    console.log(`Fetching intelligence for: ${companyName}`);

    // 1. Fetch news from Google News RSS
    const articles = await fetchGoogleNews(companyName, website);

    if (articles.length === 0) {
      console.log(`No articles found for ${companyName}`);
      return NextResponse.json({
        message: "No recent intelligence found for this company",
        items: [],
        newItemsCount: 0,
      });
    }

    // 2. Analyze each article with Gemini
    const intelligenceItems: IntelligenceResult[] = [];

    for (const article of articles) {
      const analysis = await analyzeArticle(article, companyName, prospectType);

      // Map intelligence type to source type
      const typeToSource: Record<string, IntelligenceSourceType> = {
        news: "news",
        company_update: "other",
        job_change: "job-change",
        funding: "funding",
        match_result: "sports",
        other: "other",
      };

      const id = `intel-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      intelligenceItems.push({
        id,
        prospectId: prospectId || undefined,
        title: article.title,
        description: article.description,
        sourceType: typeToSource[analysis.intelligenceType] || "news",
        intelligenceType: analysis.intelligenceType,
        url: article.link,
        publishedAt: new Date(article.pubDate).toISOString(),
        aiTip: analysis.aiTip,
        relevanceScore: analysis.relevanceScore,
        companyName,
        sourceName: article.sourceName,
        contentQuote: analysis.contentQuote,
      });
    }

    // Sort by relevance
    intelligenceItems.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));

    // Filter by relevance (lowered threshold to 40)
    const relevantItems = intelligenceItems.filter(item => (item.relevanceScore || 0) >= 40);

    console.log(`Found ${relevantItems.length} relevant items for ${companyName}`);

    // 3. Save to database
    let savedCount = 0;
    if (saveToDB && relevantItems.length > 0 && prospectId) {
      // Check for existing items
      const { data: existingItems } = await supabase
        .from("intelligence_items")
        .select("url, title")
        .eq("prospect_id", prospectId);

      const existingUrls = new Set((existingItems || []).filter(i => i.url).map(i => i.url));
      const existingTitles = new Set((existingItems || []).map(i => i.title));

      // Filter duplicates
      const newItems = relevantItems.filter(item => {
        if (item.url && existingUrls.has(item.url)) return false;
        if (existingTitles.has(item.title)) return false;
        return true;
      });

      if (newItems.length > 0) {
        const { error: insertError } = await supabase
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
              dismissed: false,
            }))
          );

        if (insertError) {
          console.error("Error inserting intelligence:", insertError);
        } else {
          savedCount = newItems.length;
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
        ? `Found ${relevantItems.length} items, saved ${savedCount} new`
        : relevantItems.length > 0
        ? `Found ${relevantItems.length} items (already in database)`
        : "No recent intelligence found",
      items: relevantItems,
      newItemsCount: savedCount,
    });
  } catch (error) {
    console.error("Error fetching intelligence:", error);
    return NextResponse.json(
      { error: "Failed to fetch intelligence" },
      { status: 500 }
    );
  }
}
