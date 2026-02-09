import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { fetchAllIntelligenceForProspect } from "@/lib/intelligence-fetcher";

export const maxDuration = 60;

const STATUS_PRIORITY: Record<string, number> = {
  Hot: 1,
  Warm: 2,
  "Not contacted yet": 3,
  Cold: 4,
  Lost: 5,
};

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  console.log("Starting scheduled intelligence refresh...");

  try {
    // 1. Fetch all non-archived prospects
    const { data: prospects, error: prospectError } = await supabase
      .from("prospects")
      .select("*")
      .eq("archived", false);

    if (prospectError || !prospects) {
      console.error("Failed to fetch prospects:", prospectError);
      return NextResponse.json(
        { error: "Failed to fetch prospects" },
        { status: 500 }
      );
    }

    // 2. Get refresh log to find stalest prospects
    const { data: refreshLog } = await supabase
      .from("intelligence_refresh_log")
      .select("prospect_id, last_refresh_at");

    const lastRefreshMap = new Map<string, string>();
    for (const entry of refreshLog || []) {
      const existing = lastRefreshMap.get(entry.prospect_id);
      if (!existing || entry.last_refresh_at > existing) {
        lastRefreshMap.set(entry.prospect_id, entry.last_refresh_at);
      }
    }

    // 3. Filter out prospects refreshed in the last 24 hours
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const staleProspects = prospects.filter((p) => {
      const lastRefresh = lastRefreshMap.get(p.id);
      if (!lastRefresh) return true; // Never refreshed
      return new Date(lastRefresh) < twentyFourHoursAgo;
    });

    // 4. Sort by priority (Hot first) then by staleness (oldest refresh first)
    staleProspects.sort((a, b) => {
      const priorityA = STATUS_PRIORITY[a.status] || 99;
      const priorityB = STATUS_PRIORITY[b.status] || 99;
      if (priorityA !== priorityB) return priorityA - priorityB;

      const lastA = lastRefreshMap.get(a.id) || "1970-01-01";
      const lastB = lastRefreshMap.get(b.id) || "1970-01-01";
      return lastA.localeCompare(lastB);
    });

    // 5. Take top 10 to fit within timeout
    const batch = staleProspects.slice(0, 10);

    console.log(
      `Processing ${batch.length} of ${staleProspects.length} stale prospects (${prospects.length} total)`
    );

    let totalNewItems = 0;
    let totalErrors = 0;

    // 6. Process each prospect
    for (const prospect of batch) {
      const companyName = prospect.company;
      console.log(`Scanning: ${companyName}`);

      try {
        const items = await fetchAllIntelligenceForProspect({
          company: companyName,
          website: prospect.website || undefined,
          prospectType: prospect.prospect_type || undefined,
          country: prospect.country || undefined,
          linkedinUrl: prospect.linkedin_url || undefined,
        });

        if (items.length > 0) {
          items.sort(
            (a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0)
          );

          // Deduplicate
          const { data: existingItems } = await supabase
            .from("intelligence_items")
            .select("url, title")
            .eq("prospect_id", prospect.id);

          const existingUrls = new Set(
            (existingItems || []).filter((i) => i.url).map((i) => i.url)
          );
          const existingTitles = new Set(
            (existingItems || []).map((i) => i.title)
          );

          const newItems = items.filter((item) => {
            if (item.url && existingUrls.has(item.url)) return false;
            if (existingTitles.has(item.title)) return false;
            return true;
          });

          if (newItems.length > 0) {
            const { error } = await supabase.from("intelligence_items").insert(
              newItems.map((item) => ({
                id: item.id,
                prospect_id: prospect.id,
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
              totalNewItems += newItems.length;
            } else {
              console.error(`Insert error for ${companyName}:`, error);
            }
          }
        }

        // Update refresh log
        await supabase.from("intelligence_refresh_log").upsert(
          {
            id: `refresh-${prospect.id}-cron`,
            prospect_id: prospect.id,
            source: "cron_daily",
            last_refresh_at: new Date().toISOString(),
            status: "success",
            items_found: items.length,
          },
          { onConflict: "id" }
        );
      } catch (error: any) {
        totalErrors++;
        console.error(`Error scanning ${companyName}:`, error.message);

        await supabase.from("intelligence_refresh_log").upsert(
          {
            id: `refresh-${prospect.id}-cron`,
            prospect_id: prospect.id,
            source: "cron_daily",
            last_refresh_at: new Date().toISOString(),
            status: "error",
            error_message: error.message,
            items_found: 0,
          },
          { onConflict: "id" }
        );
      }

      // 3-second delay between prospects for rate limiting
      await new Promise((r) => setTimeout(r, 3000));
    }

    const summary = {
      totalProspects: prospects.length,
      staleProspects: staleProspects.length,
      batchSize: batch.length,
      newItems: totalNewItems,
      errors: totalErrors,
      timestamp: new Date().toISOString(),
    };

    console.log("Cron refresh complete:", summary);

    return NextResponse.json({
      message: `Scanned ${batch.length} prospects, found ${totalNewItems} new items`,
      ...summary,
    });
  } catch (error) {
    console.error("Cron refresh error:", error);
    return NextResponse.json(
      { error: "Cron refresh failed" },
      { status: 500 }
    );
  }
}
