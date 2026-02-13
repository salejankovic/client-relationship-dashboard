import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST() {
  try {
    // 1. Fetch all non-archived prospects
    const { data: prospects, error: prospectError } = await supabase
      .from("prospects")
      .select("id, company, last_contact_date")
      .eq("archived", false);

    if (prospectError || !prospects) {
      return NextResponse.json({ error: "Failed to fetch prospects" }, { status: 500 });
    }

    let updated = 0;
    let skipped = 0;

    for (const prospect of prospects) {
      // 2. Find the most recent communication for this prospect
      const { data: latestComm } = await supabase
        .from("communications")
        .select("created_at")
        .eq("prospect_id", prospect.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (!latestComm?.created_at) {
        skipped++;
        continue;
      }

      const newDate = new Date(latestComm.created_at).toISOString().split("T")[0];
      const currentDate = prospect.last_contact_date
        ? new Date(prospect.last_contact_date).toISOString().split("T")[0]
        : null;

      // Only update if the communication date is more recent (or if no date set)
      if (!currentDate || newDate > currentDate) {
        const { error: updateError } = await supabase
          .from("prospects")
          .update({ last_contact_date: newDate })
          .eq("id", prospect.id);

        if (!updateError) {
          updated++;
          console.log(`Updated ${prospect.company}: ${currentDate ?? "none"} → ${newDate}`);
        }
      } else {
        skipped++;
      }
    }

    return NextResponse.json({
      message: `Done. Updated ${updated} prospects, skipped ${skipped}.`,
      updated,
      skipped,
      total: prospects.length,
    });
  } catch (error) {
    console.error("fix-last-contact error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
