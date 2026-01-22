import { google } from "googleapis"
import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { GoogleGenerativeAI } from "@google/generative-ai"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "")

async function generateEmailSummary(subject: string, body: string): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" })

    const prompt = `Summarize this email in 2-3 concise sentences, focusing on key action items, decisions, and important information:

Subject: ${subject}

Body: ${body.substring(0, 2000)}

Provide a brief summary:`

    const result = await model.generateContent(prompt)
    const response = await result.response
    return response.text().trim()
  } catch (error) {
    console.error("Error generating summary:", error)
    return ""
  }
}

function decodeEmailBody(payload: any): string {
  try {
    if (payload.parts) {
      // Multi-part email
      for (const part of payload.parts) {
        if (part.mimeType === "text/plain" || part.mimeType === "text/html") {
          if (part.body.data) {
            return Buffer.from(part.body.data, "base64").toString("utf-8")
          }
        }
        // Recursive for nested parts
        if (part.parts) {
          const nested = decodeEmailBody(part)
          if (nested) return nested
        }
      }
    } else if (payload.body && payload.body.data) {
      // Single-part email
      return Buffer.from(payload.body.data, "base64").toString("utf-8")
    }
    return ""
  } catch (error) {
    console.error("Error decoding email body:", error)
    return ""
  }
}

function extractEmailAddress(header: string): string {
  const match = header.match(/<(.+?)>/)
  return match ? match[1] : header
}

export async function POST(request: NextRequest) {
  try {
    const { prospectId, prospectEmail } = await request.json()

    if (!prospectId || !prospectEmail) {
      return NextResponse.json({ error: "Missing prospectId or prospectEmail" }, { status: 400 })
    }

    // Get OAuth tokens from database
    const userId = "aleksandar" // TODO: Replace with actual user ID from auth
    const { data: config, error: configError } = await supabase
      .from("email_sync_config")
      .select("*")
      .eq("user_id", userId)
      .eq("provider", "gmail")
      .single()

    if (configError || !config) {
      return NextResponse.json({ error: "Gmail not connected" }, { status: 401 })
    }

    // Set up OAuth client
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.NEXTAUTH_URL}/api/auth/gmail/callback`
    )

    oauth2Client.setCredentials({
      access_token: config.access_token,
      refresh_token: config.refresh_token,
      expiry_date: config.token_expiry ? new Date(config.token_expiry).getTime() : undefined,
    })

    // If token is expired, refresh it
    if (oauth2Client.credentials.expiry_date && oauth2Client.credentials.expiry_date < Date.now()) {
      const { credentials } = await oauth2Client.refreshAccessToken()
      oauth2Client.setCredentials(credentials)

      // Update tokens in database
      await supabase
        .from("email_sync_config")
        .update({
          access_token: credentials.access_token,
          token_expiry: credentials.expiry_date ? new Date(credentials.expiry_date).toISOString() : null,
        })
        .eq("id", config.id)
    }

    const gmail = google.gmail({ version: "v1", auth: oauth2Client })

    // Search for emails to/from prospect
    const query = `{from:${prospectEmail} OR to:${prospectEmail}}`
    const response = await gmail.users.messages.list({
      userId: "me",
      q: query,
      maxResults: 50, // Limit initial sync to 50 emails
    })

    const messages = response.data.messages || []
    let importedCount = 0
    let skippedCount = 0

    for (const message of messages) {
      if (!message.id) continue

      // Check if this email is already imported
      const { data: existing } = await supabase
        .from("communications")
        .select("id")
        .eq("email_message_id", message.id)
        .single()

      if (existing) {
        skippedCount++
        continue
      }

      // Get full message details
      const fullMessage = await gmail.users.messages.get({
        userId: "me",
        id: message.id,
        format: "full",
      })

      const headers = fullMessage.data.payload?.headers || []
      const subject = headers.find((h) => h.name === "Subject")?.value || "(No Subject)"
      const from = headers.find((h) => h.name === "From")?.value || ""
      const to = headers.find((h) => h.name === "To")?.value || ""
      const date = headers.find((h) => h.name === "Date")?.value || ""

      const fromEmail = extractEmailAddress(from)
      const direction = fromEmail.toLowerCase().includes(prospectEmail.toLowerCase()) ? "inbound" : "outbound"

      const body = decodeEmailBody(fullMessage.data.payload)

      // Generate AI summary
      const aiSummary = await generateEmailSummary(subject, body)

      // Store in communications table
      await supabase.from("communications").insert({
        prospect_id: prospectId,
        type: "email",
        subject,
        content: body,
        direction,
        author: direction === "outbound" ? "Aleksandar" : from,
        created_at: date ? new Date(date).toISOString() : new Date().toISOString(),
        ai_summary: aiSummary,
        email_message_id: message.id,
        email_thread_id: fullMessage.data.threadId,
        synced_from: "gmail",
        synced_at: new Date().toISOString(),
      })

      importedCount++
    }

    // Update last sync time
    await supabase
      .from("email_sync_config")
      .update({
        last_sync_at: new Date().toISOString(),
      })
      .eq("id", config.id)

    return NextResponse.json({
      success: true,
      imported: importedCount,
      skipped: skippedCount,
      total: messages.length,
    })
  } catch (error) {
    console.error("Error syncing emails:", error)
    return NextResponse.json(
      { error: "Failed to sync emails", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
