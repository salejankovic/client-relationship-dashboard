import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import type { IntelligenceItem } from "@/lib/types"

export function useIntelligence(prospectId?: string) {
  const [intelligenceItems, setIntelligenceItems] = useState<IntelligenceItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  // Fetch intelligence items from Supabase
  const fetchIntelligence = async () => {
    try {
      setLoading(true)

      let query = supabase
        .from("intelligence_items")
        .select("*")
        .order("published_at", { ascending: false })

      // Filter by prospect if prospectId provided
      if (prospectId) {
        query = query.eq("prospect_id", prospectId)
      }

      const { data, error } = await query

      if (error) throw error

      // Transform database format to IntelligenceItem format
      const transformedItems: IntelligenceItem[] = (data || []).map((row: any) => ({
        id: row.id,
        prospectId: row.prospect_id || undefined,
        title: row.title,
        description: row.description || undefined,
        sourceType: row.source_type,
        intelligenceType: row.intelligence_type || undefined,
        url: row.url || undefined,
        imageUrl: row.image_url || undefined,
        publishedAt: row.published_at || undefined,
        createdAt: row.created_at,
        dismissed: row.dismissed || false,
        aiTip: row.ai_tip || undefined,
        relevanceScore: row.relevance_score || undefined,
        // Person fields
        personName: row.person_name || undefined,
        personPosition: row.person_position || undefined,
        personLinkedinUrl: row.person_linkedin_url || undefined,
        personAvatarUrl: row.person_avatar_url || undefined,
        // Company/source fields
        companyName: row.company_name || undefined,
        sourceName: row.source_name || undefined,
        contentQuote: row.content_quote || undefined,
        // Match fields
        matchHomeTeam: row.match_home_team || undefined,
        matchAwayTeam: row.match_away_team || undefined,
        matchHomeScore: row.match_home_score ?? undefined,
        matchAwayScore: row.match_away_score ?? undefined,
        matchScorers: row.match_scorers || undefined,
        matchLeague: row.match_league || undefined,
        // Job change fields
        previousPosition: row.previous_position || undefined,
        previousCompany: row.previous_company || undefined,
        // Country
        countryCode: row.country_code || undefined,
      }))

      setIntelligenceItems(transformedItems)
      setError(null)
    } catch (err) {
      setError(err as Error)
      console.error("Error fetching intelligence:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchIntelligence()

    // Subscribe to real-time changes
    const channelName = prospectId ? `intelligence-${prospectId}` : "intelligence-all"
    const subscription = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "intelligence_items",
          ...(prospectId && { filter: `prospect_id=eq.${prospectId}` }),
        },
        () => {
          fetchIntelligence()
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [prospectId])

  // Add intelligence item
  const addIntelligenceItem = async (item: Omit<IntelligenceItem, 'id' | 'createdAt' | 'dismissed'>) => {
    try {
      const newItem: IntelligenceItem = {
        ...item,
        id: `intel-${Date.now()}`,
        createdAt: new Date().toISOString(),
        dismissed: false,
      }

      // Optimistic update
      setIntelligenceItems((prev) => [newItem, ...prev])

      const { error } = await supabase.from("intelligence_items").insert([{
        id: newItem.id,
        prospect_id: newItem.prospectId,
        title: newItem.title,
        description: newItem.description,
        source_type: newItem.sourceType,
        intelligence_type: newItem.intelligenceType,
        url: newItem.url,
        image_url: newItem.imageUrl,
        published_at: newItem.publishedAt,
        ai_tip: newItem.aiTip,
        relevance_score: newItem.relevanceScore,
        // Person fields
        person_name: newItem.personName,
        person_position: newItem.personPosition,
        person_linkedin_url: newItem.personLinkedinUrl,
        person_avatar_url: newItem.personAvatarUrl,
        // Company/source fields
        company_name: newItem.companyName,
        source_name: newItem.sourceName,
        content_quote: newItem.contentQuote,
        // Match fields
        match_home_team: newItem.matchHomeTeam,
        match_away_team: newItem.matchAwayTeam,
        match_home_score: newItem.matchHomeScore,
        match_away_score: newItem.matchAwayScore,
        match_scorers: newItem.matchScorers,
        match_league: newItem.matchLeague,
        // Job change fields
        previous_position: newItem.previousPosition,
        previous_company: newItem.previousCompany,
        // Country
        country_code: newItem.countryCode,
      }])

      if (error) {
        await fetchIntelligence()
        throw error
      }
    } catch (err) {
      console.error("Error adding intelligence item:", err)
      throw err
    }
  }

  // Dismiss intelligence item
  const dismissItem = async (itemId: string) => {
    try {
      // Optimistic update
      setIntelligenceItems((prev) =>
        prev.map((item) => (item.id === itemId ? { ...item, dismissed: true } : item))
      )

      const { error } = await supabase
        .from("intelligence_items")
        .update({ dismissed: true })
        .eq("id", itemId)

      if (error) {
        await fetchIntelligence()
        throw error
      }
    } catch (err) {
      console.error("Error dismissing item:", err)
      throw err
    }
  }

  // Undismiss intelligence item
  const undismissItem = async (itemId: string) => {
    try {
      // Optimistic update
      setIntelligenceItems((prev) =>
        prev.map((item) => (item.id === itemId ? { ...item, dismissed: false } : item))
      )

      const { error } = await supabase
        .from("intelligence_items")
        .update({ dismissed: false })
        .eq("id", itemId)

      if (error) {
        await fetchIntelligence()
        throw error
      }
    } catch (err) {
      console.error("Error undismissing item:", err)
      throw err
    }
  }

  // Delete intelligence item
  const deleteItem = async (itemId: string) => {
    try {
      // Optimistic update
      setIntelligenceItems((prev) => prev.filter((item) => item.id !== itemId))

      const { error } = await supabase.from("intelligence_items").delete().eq("id", itemId)

      if (error) {
        await fetchIntelligence()
        throw error
      }
    } catch (err) {
      console.error("Error deleting item:", err)
      throw err
    }
  }

  return {
    intelligenceItems,
    loading,
    error,
    addIntelligenceItem,
    dismissItem,
    undismissItem,
    deleteItem,
    refetch: fetchIntelligence,
  }
}
