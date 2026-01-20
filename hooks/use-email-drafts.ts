import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import type { EmailDraft, EmailTone, EmailGoal, EmailLanguage } from "@/lib/types"

export function useEmailDrafts(prospectId: string) {
  const [drafts, setDrafts] = useState<EmailDraft[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  // Fetch email drafts from Supabase
  const fetchDrafts = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("email_drafts")
        .select("*")
        .eq("prospect_id", prospectId)
        .order("created_at", { ascending: false })

      if (error) throw error

      // Transform database format to EmailDraft format
      const transformedDrafts: EmailDraft[] = (data || []).map((row: any) => ({
        id: row.id,
        prospectId: row.prospect_id,
        subject: row.subject,
        body: row.body,
        tone: row.tone || undefined,
        goal: row.goal || undefined,
        language: row.language || undefined,
        sentAt: row.sent_at || undefined,
        openedAt: row.opened_at || undefined,
        repliedAt: row.replied_at || undefined,
        aiModel: row.ai_model || undefined,
        createdAt: row.created_at,
      }))

      setDrafts(transformedDrafts)
      setError(null)
    } catch (err) {
      setError(err as Error)
      console.error("Error fetching email drafts:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (prospectId) {
      fetchDrafts()

      // Subscribe to real-time changes
      const subscription = supabase
        .channel(`drafts-${prospectId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "email_drafts",
            filter: `prospect_id=eq.${prospectId}`,
          },
          () => {
            fetchDrafts()
          }
        )
        .subscribe()

      return () => {
        subscription.unsubscribe()
      }
    }
  }, [prospectId])

  // Save draft to database
  const saveDraft = async (
    subject: string,
    body: string,
    tone?: EmailTone,
    goal?: EmailGoal,
    language?: EmailLanguage
  ) => {
    try {
      const newDraft: EmailDraft = {
        id: `draft-${Date.now()}`,
        prospectId,
        subject,
        body,
        tone,
        goal,
        language,
        aiModel: "mock", // Will be updated when real AI is integrated
        createdAt: new Date().toISOString(),
      }

      // Optimistic update
      setDrafts((prev) => [newDraft, ...prev])

      const { error } = await supabase.from("email_drafts").insert([{
        id: newDraft.id,
        prospect_id: newDraft.prospectId,
        subject: newDraft.subject,
        body: newDraft.body,
        tone: newDraft.tone,
        goal: newDraft.goal,
        language: newDraft.language,
        ai_model: newDraft.aiModel,
      }])

      if (error) {
        await fetchDrafts()
        throw error
      }

      return newDraft
    } catch (err) {
      console.error("Error saving draft:", err)
      throw err
    }
  }

  // Delete draft
  const deleteDraft = async (draftId: string) => {
    try {
      // Optimistic update
      setDrafts((prev) => prev.filter((d) => d.id !== draftId))

      const { error } = await supabase.from("email_drafts").delete().eq("id", draftId)

      if (error) {
        await fetchDrafts()
        throw error
      }
    } catch (err) {
      console.error("Error deleting draft:", err)
      throw err
    }
  }

  // Mark draft as sent
  const markAsSent = async (draftId: string) => {
    try {
      // Optimistic update
      const now = new Date().toISOString()
      setDrafts((prev) =>
        prev.map((d) => (d.id === draftId ? { ...d, sentAt: now } : d))
      )

      const { error } = await supabase
        .from("email_drafts")
        .update({ sent_at: now })
        .eq("id", draftId)

      if (error) {
        await fetchDrafts()
        throw error
      }
    } catch (err) {
      console.error("Error marking as sent:", err)
      throw err
    }
  }

  return {
    drafts,
    loading,
    error,
    saveDraft,
    deleteDraft,
    markAsSent,
    refetch: fetchDrafts,
  }
}

// Generate email content (mock implementation for Phase 1)
// In Phase 5, this will call Claude API
export function generateEmailContent(
  prospectCompany: string,
  tone: EmailTone,
  goal: EmailGoal,
  language: EmailLanguage,
  context?: string
): { subject: string; body: string } {
  const lang = language || "english"

  // Mock email templates
  const templates = {
    english: {
      "check-in": {
        subject: `Checking in - ${prospectCompany}`,
        body: `Hi,\n\nI hope this email finds you well. I wanted to check in and see how things are progressing at ${prospectCompany}.\n\n${context || "Our solution could help streamline your operations and improve efficiency."}\n\nWould you be available for a quick call this week to discuss?\n\nBest regards`,
      },
      "schedule-call": {
        subject: `Let's schedule a call - ${prospectCompany}`,
        body: `Hi,\n\nI'd love to schedule a call to discuss how we can help ${prospectCompany} achieve its goals.\n\n${context || "We've helped similar organizations improve their digital presence significantly."}\n\nAre you available next week for a 30-minute call?\n\nLooking forward to speaking with you.`,
      },
      "share-update": {
        subject: `Update: New features for ${prospectCompany}`,
        body: `Hi,\n\nI wanted to share some exciting updates that might be relevant to ${prospectCompany}.\n\n${context || "We've recently launched new features that could benefit your operations."}\n\nWould you like to learn more?\n\nBest regards`,
      },
      "re-introduce": {
        subject: `Following up - ${prospectCompany}`,
        body: `Hi,\n\nIt's been a while since we last connected. I wanted to re-introduce our services and see if there might be an opportunity to work together.\n\n${context || "We've had great success helping companies in your industry."}\n\nWould you be open to a conversation?\n\nBest regards`,
      },
      "close-deal": {
        subject: `Next steps for ${prospectCompany}`,
        body: `Hi,\n\nThank you for considering our solution. I'm excited about the potential partnership with ${prospectCompany}.\n\n${context || "Based on our discussions, I believe we can deliver significant value."}\n\nShall we move forward with the proposal?\n\nLooking forward to your response.`,
      },
    },
    croatian: {
      "check-in": {
        subject: `Javljam se - ${prospectCompany}`,
        body: `Pozdrav,\n\nNadam se da ste dobro. Želio bih provjeriti kako napreduju stvari u ${prospectCompany}.\n\n${context || "Naše rješenje bi moglo pomoći u optimizaciji vaših operacija i povećanju učinkovitosti."}\n\nBiste li bili dostupni za kratki poziv ovaj tjedan?\n\nSrdačan pozdrav`,
      },
      "schedule-call": {
        subject: `Zakažimo poziv - ${prospectCompany}`,
        body: `Pozdrav,\n\nVolio bih zakazati poziv kako bismo razgovarali o tome kako možemo pomoći ${prospectCompany} u postizanju ciljeva.\n\n${context || "Pomogli smo sličnim organizacijama značajno poboljšati njihovu digitalnu prisutnost."}\n\nJeste li dostupni sljedeći tjedan za 30-minutni razgovor?\n\nVeselim se razgovoru.`,
      },
      "share-update": {
        subject: `Obavijest: Nove mogućnosti za ${prospectCompany}`,
        body: `Pozdrav,\n\nŽelio bih podijeliti neke uzbudljive novosti koje bi mogle biti relevantne za ${prospectCompany}.\n\n${context || "Nedavno smo lansirali nove značajke koje bi mogle koristiti vašim operacijama."}\n\nŽelite li saznati više?\n\nSrdačan pozdrav`,
      },
      "re-introduce": {
        subject: `Nastavak - ${prospectCompany}`,
        body: `Pozdrav,\n\nProšlo je neko vrijeme od našeg posljednjeg kontakta. Želio bih ponovno predstaviti naše usluge i vidjeti postoji li prilika za suradnju.\n\n${context || "Imali smo veliki uspjeh u pomoći tvrtkama u vašoj industriji."}\n\nBiste li bili otvoreni za razgovor?\n\nSrdačan pozdrav`,
      },
      "close-deal": {
        subject: `Sljedeći koraci za ${prospectCompany}`,
        body: `Pozdrav,\n\nHvala što razmatrate naše rješenje. Uzbuđen sam zbog potencijalnog partnerstva s ${prospectCompany}.\n\n${context || "Na temelju naših razgovora, vjerujem da možemo pružiti značajnu vrijednost."}\n\nNastavimo s prijedlogom?\n\nVeselim se vašem odgovoru.`,
      },
    },
    serbian: {
      "check-in": {
        subject: `Javljam se - ${prospectCompany}`,
        body: `Pozdrav,\n\nNadam se da ste dobro. Želeo bih da proverim kako napreduju stvari u ${prospectCompany}.\n\n${context || "Naše rešenje bi moglo pomoći u optimizaciji vaših operacija i povećanju efikasnosti."}\n\nDa li biste bili dostupni za kratak poziv ove nedelje?\n\nSrdačan pozdrav`,
      },
      "schedule-call": {
        subject: `Zakažimo poziv - ${prospectCompany}`,
        body: `Pozdrav,\n\nVoleo bih da zakažem poziv kako bismo razgovarali o tome kako možemo pomoći ${prospectCompany} u postizanju ciljeva.\n\n${context || "Pomogli smo sličnim organizacijama da značajno poboljšaju njihovu digitalnu prisutnost."}\n\nDa li ste dostupni sledeće nedelje za 30-minutni razgovor?\n\nRadujem se razgovoru.`,
      },
      "share-update": {
        subject: `Obaveštenje: Nove mogućnosti za ${prospectCompany}`,
        body: `Pozdrav,\n\nŽeleo bih da podelim neke uzbudljive novosti koje bi mogle biti relevantne za ${prospectCompany}.\n\n${context || "Nedavno smo lansirali nove mogućnosti koje bi mogle koristiti vašim operacijama."}\n\nŽelite li da saznate više?\n\nSrdačan pozdrav`,
      },
      "re-introduce": {
        subject: `Nastavak - ${prospectCompany}`,
        body: `Pozdrav,\n\nProšlo je neko vreme od našeg poslednjeg kontakta. Želeo bih ponovo da predstavim naše usluge i da vidim da li postoji prilika za saradnju.\n\n${context || "Imali smo veliki uspeh u pomoći kompanijama u vašoj industriji."}\n\nDa li biste bili otvoreni za razgovor?\n\nSrdačan pozdrav`,
      },
      "close-deal": {
        subject: `Sledeći koraci za ${prospectCompany}`,
        body: `Pozdrav,\n\nHvala što razmatrate naše rešenje. Uzbuđen sam zbog potencijalnog partnerstva sa ${prospectCompany}.\n\n${context || "Na osnovu naših razgovora, verujem da možemo pružiti značajnu vrednost."}\n\nNastavimo sa predlogom?\n\nRadujem se vašem odgovoru.`,
      },
    },
  }

  const template = templates[lang]?.[goal] || templates.english[goal]

  return {
    subject: template.subject,
    body: template.body,
  }
}
