import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { fetchAllIntelligenceForProspect } from "@/lib/intelligence-fetcher";

export async function POST(request: NextRequest) {
  try {
    const {
      companyName,
      prospectId,
      website,
      prospectType,
      country,
      linkedinUrl,
      saveToDB = true,
    } = await request.json();

    if (!companyName) {
      return NextResponse.json(
        { error: "Company name is required" },
        { status: 400 }
      );
    }

    console.log(`Fetching intelligence for: ${companyName}${country ? ` (${country})` : ""}`);

    // Fetch intelligence using all available sources
    const intelligenceItems = await fetchAllIntelligenceForProspect({
      company: companyName,
      website,
      prospectType,
      country,
      linkedinUrl,
    });

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

      const existingUrls = new Set(
        (existingItems || []).filter((i) => i.url).map((i) => i.url)
      );
      const existingTitles = new Set(
        (existingItems || []).map((i) => i.title)
      );

      const newItems = intelligenceItems.filter((item) => {
        if (item.url && existingUrls.has(item.url)) return false;
        if (existingTitles.has(item.title)) return false;
        return true;
      });

      if (newItems.length > 0) {
        const { error } = await supabase.from("intelligence_items").insert(
          newItems.map((item) => ({
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
            person_name: item.personName,
            person_position: item.personPosition,
            person_linkedin_url: item.personLinkedinUrl,
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
        .upsert(
          {
            id: `refresh-${prospectId}-gemini`,
            prospect_id: prospectId,
            source: "gemini_search",
            last_refresh_at: new Date().toISOString(),
            status: "success",
            items_found: savedCount,
          },
          { onConflict: "id" }
        );
    }

    return NextResponse.json({
      message:
        savedCount > 0
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
