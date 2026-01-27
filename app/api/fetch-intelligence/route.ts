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
  personName?: string;
  personPosition?: string;
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
 * Fetch intelligence about a prospect using Gemini with web search grounding
 */
async function fetchIntelligenceWithGemini(
  companyName: string,
  website?: string,
  prospectType?: string,
  contactName?: string
): Promise<IntelligenceResult[]> {
  try {
    const searchContext = [
      `Company: ${companyName}`,
      website ? `Website: ${website}` : null,
      prospectType ? `Type: ${prospectType}` : null,
      contactName ? `Key contact: ${contactName}` : null,
    ].filter(Boolean).join("\n");

    const prompt = `You are a B2B sales intelligence assistant. Search for recent news, updates, and activities about this company:

${searchContext}

Find recent information (last 30-60 days) including:
1. News articles and press releases
2. Company announcements (partnerships, product launches, expansions)
3. Leadership changes or new hires
4. Funding rounds or acquisitions
5. Industry mentions or awards
${prospectType === "Sports Club" ? "6. Recent match results and sports news" : ""}

For EACH piece of intelligence found, provide:
- title: Clear headline (max 100 chars)
- description: Brief summary (max 200 chars)
- intelligenceType: One of [news, company_update, job_change, funding, match_result, other]
- url: Source URL if available
- publishedDate: Approximate date (YYYY-MM-DD format)
- relevanceScore: 0-100 based on how useful this is for sales outreach
- aiTip: One short actionable tip (max 80 chars) on how to use this in a follow-up email
- contentQuote: Key quote or fact from the source (max 100 chars)
${prospectType === "Sports Club" ? "- For match results: include homeTeam, awayTeam, homeScore, awayScore, league" : ""}

Return JSON array:
{
  "items": [
    {
      "title": "...",
      "description": "...",
      "intelligenceType": "news",
      "url": "https://...",
      "publishedDate": "2026-01-20",
      "relevanceScore": 85,
      "aiTip": "Mention their recent partnership as conversation starter",
      "contentQuote": "Company announced expansion to 3 new markets"
    }
  ]
}

If no relevant information is found, return: { "items": [] }
Only include items with relevanceScore > 50.`;

    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

    // Clean and parse JSON
    text = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    // Try to extract JSON if there's extra text
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      text = jsonMatch[0];
    }

    const data = JSON.parse(text);
    const items = data.items || [];

    // Transform to IntelligenceResult format
    return items.map((item: any) => {
      const id = `intel-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Map intelligenceType to sourceType
      const typeToSource: Record<string, IntelligenceSourceType> = {
        news: "news",
        company_update: "other",
        job_change: "job-change",
        funding: "funding",
        match_result: "sports",
        other: "other",
      };

      return {
        id,
        title: item.title || "Untitled",
        description: item.description,
        sourceType: typeToSource[item.intelligenceType] || "news",
        intelligenceType: item.intelligenceType || "news",
        url: item.url,
        publishedAt: item.publishedDate ? new Date(item.publishedDate).toISOString() : new Date().toISOString(),
        aiTip: item.aiTip,
        relevanceScore: Math.min(100, Math.max(0, item.relevanceScore || 50)),
        companyName,
        contentQuote: item.contentQuote,
        // Match result fields
        matchHomeTeam: item.homeTeam,
        matchAwayTeam: item.awayTeam,
        matchHomeScore: item.homeScore,
        matchAwayScore: item.awayScore,
        matchLeague: item.league,
      };
    });
  } catch (error) {
    console.error("Error fetching intelligence with Gemini:", error);
    return [];
  }
}

export async function POST(request: NextRequest) {
  try {
    const {
      companyName,
      prospectId,
      website,
      prospectType,
      contactName,
      saveToDB = true,
    } = await request.json();

    if (!companyName) {
      return NextResponse.json(
        { error: "Company name is required" },
        { status: 400 }
      );
    }

    // Fetch intelligence using Gemini
    const items = await fetchIntelligenceWithGemini(
      companyName,
      website,
      prospectType,
      contactName
    );

    // Filter by relevance
    const relevantItems = items.filter(item => (item.relevanceScore || 0) > 50);

    // Save to database if requested
    let savedCount = 0;
    if (saveToDB && relevantItems.length > 0 && prospectId) {
      // Check for existing items to avoid duplicates
      const { data: existingItems } = await supabase
        .from("intelligence_items")
        .select("url, title, published_at")
        .eq("prospect_id", prospectId);

      const existingUrls = new Set((existingItems || []).filter(i => i.url).map(item => item.url));
      const existingTitles = new Set((existingItems || []).map(item => `${item.title}|${item.published_at?.split('T')[0]}`));

      // Filter out duplicates
      const newItems = relevantItems.filter(item => {
        if (item.url && existingUrls.has(item.url)) return false;
        const titleKey = `${item.title}|${item.publishedAt?.split('T')[0]}`;
        if (existingTitles.has(titleKey)) return false;
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
              content_quote: item.contentQuote,
              match_home_team: item.matchHomeTeam,
              match_away_team: item.matchAwayTeam,
              match_home_score: item.matchHomeScore,
              match_away_score: item.matchAwayScore,
              match_league: item.matchLeague,
              dismissed: false,
            }))
          );

        if (insertError) {
          console.error("Error inserting intelligence items:", insertError);
        } else {
          savedCount = newItems.length;
        }
      }

      // Update refresh log
      await supabase
        .from("intelligence_refresh_log")
        .upsert({
          id: `refresh-${prospectId}-gemini`,
          prospect_id: prospectId,
          source: "gemini",
          last_refresh_at: new Date().toISOString(),
          status: "success",
          items_found: savedCount,
        }, { onConflict: "id" });
    }

    return NextResponse.json({
      message: savedCount > 0
        ? `Found ${relevantItems.length} intelligence items, saved ${savedCount} new items`
        : `Found ${relevantItems.length} intelligence items`,
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
