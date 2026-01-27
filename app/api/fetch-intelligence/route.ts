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

/**
 * Fetch intelligence using Gemini with Google Search grounding
 */
async function fetchIntelligenceWithGemini(
  companyName: string,
  website?: string,
  prospectType?: string
): Promise<IntelligenceResult[]> {
  try {
    const searchContext = [
      `Company: ${companyName}`,
      website ? `Website: ${website}` : null,
      prospectType ? `Type: ${prospectType}` : null,
    ].filter(Boolean).join("\n");

    const prompt = `Search the web for recent news and updates about this company:

${searchContext}

Find information from the last 30-60 days including:
- News articles and press releases
- Company announcements, partnerships, product launches
- Leadership changes or new hires
- Funding rounds or acquisitions
${prospectType === "Sports Club" ? "- Recent match results and sports news" : ""}

For each piece of news found, provide:
1. title: Clear headline (max 100 chars)
2. summary: 1-2 sentence description in plain text
3. intelligenceType: One of [news, company_update, match_result, job_change, funding]
4. sourceUrl: The URL where you found this information
5. sourceName: Name of the publication/website
6. publishedDate: Date in YYYY-MM-DD format (estimate if not exact)
7. aiTip: Specific, actionable tip (max 80 chars) for using this in sales outreach
8. keyFact: One specific fact or quote (max 80 chars)
9. relevanceScore: 0-100 based on how useful for B2B sales outreach
${prospectType === "Sports Club" ? "10. For matches: homeTeam, awayTeam, homeScore, awayScore, league" : ""}

Return as JSON:
{
  "items": [
    {
      "title": "Company X announces partnership with Y",
      "summary": "Company X has partnered with Y to expand their services in the European market.",
      "intelligenceType": "company_update",
      "sourceUrl": "https://example.com/article",
      "sourceName": "Tech News Daily",
      "publishedDate": "2026-01-15",
      "aiTip": "Congratulate them on the partnership",
      "keyFact": "Expanding to 3 new European markets",
      "relevanceScore": 85
    }
  ]
}

Only include items with relevanceScore >= 50. If no relevant news found, return {"items": []}`;

    // Use Gemini with Google Search grounding
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      tools: [{ googleSearch: {} }],
    } as any);

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

    console.log("Gemini response:", text.substring(0, 500));

    // Parse JSON from response
    text = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      text = jsonMatch[0];
    }

    const data = JSON.parse(text);
    const items = data.items || [];

    // Map intelligence type to source type
    const typeToSource: Record<string, IntelligenceSourceType> = {
      news: "news",
      company_update: "other",
      job_change: "job-change",
      funding: "funding",
      match_result: "sports",
    };

    return items.map((item: any) => {
      const id = `intel-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      return {
        id,
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
      };
    });
  } catch (error) {
    console.error("Error with Gemini search:", error);
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
