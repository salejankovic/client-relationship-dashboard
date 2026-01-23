import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { GoogleGenerativeAI } from "@google/generative-ai"
import imapSimple from "imap-simple"
import { simpleParser } from "mailparser"

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

    // Get all active email accounts
    const { data: accounts, error: accountsError } = await supabase
      .from("email_accounts")
      .select("*")
      .eq("is_active", true)

    if (accountsError) {
      console.error("Error fetching email accounts:", accountsError)
      return NextResponse.json({ error: "Failed to fetch email accounts" }, { status: 500 })
    }

    if (!accounts || accounts.length === 0) {
      return NextResponse.json({ error: "No email accounts configured. Please add an email account in Settings." }, { status: 400 })
    }

    let totalImported = 0
    let totalSkipped = 0
    let totalMessages = 0
    const errors: string[] = []

    // Sync emails from each account
    for (const account of accounts) {
      try {
        console.log(`Syncing from ${account.account_name} (${account.email_address})...`)

        // IMAP configuration
        const config = {
          imap: {
            user: account.imap_username,
            password: account.imap_password,
            host: account.imap_host,
            port: account.imap_port,
            tls: account.use_ssl,
            authTimeout: 10000,
            tlsOptions: {
              rejectUnauthorized: false, // Allow self-signed certificates
              servername: account.imap_host, // SNI support
            },
          },
        }

        // Connect to IMAP server
        const connection = await imapSimple.connect(config)

        // Open INBOX
        await connection.openBox("INBOX")

        // Search for emails to/from prospect
        // Search criteria: OR (FROM prospectEmail, TO prospectEmail)
        const searchCriteria = [
          "ALL",
          ["OR", ["FROM", prospectEmail], ["TO", prospectEmail]],
        ]

        const fetchOptions = {
          bodies: ["HEADER", "TEXT", ""],
          markSeen: false,
        }

        const messages = await connection.search(searchCriteria, fetchOptions)
        totalMessages += messages.length

        console.log(`Found ${messages.length} messages in ${account.account_name}`)

        for (const item of messages) {
          try {
            // Get the email body
            const all = item.parts.find((part: any) => part.which === "")
            if (!all) continue

            // Parse email
            const parsed = await simpleParser(all.body)

            const subject = parsed.subject || "(No Subject)"
            const from = parsed.from?.text || ""
            const to = parsed.to?.text || ""
            const date = parsed.date || new Date()
            const body = parsed.text || parsed.html || ""

            // Extract message ID for deduplication
            const messageId = parsed.messageId || `${account.id}-${item.attributes.uid}`

            // Check if already imported
            const { data: existing } = await supabase
              .from("communications")
              .select("id")
              .eq("email_message_id", messageId)
              .single()

            if (existing) {
              totalSkipped++
              continue
            }

            // Determine direction
            const fromEmail = extractEmailAddress(from)
            const direction = fromEmail.toLowerCase().includes(prospectEmail.toLowerCase()) ? "inbound" : "outbound"

            // Generate AI summary
            const aiSummary = await generateEmailSummary(subject, body)

            // Store in communications table
            await supabase.from("communications").insert({
              prospect_id: prospectId,
              type: "email",
              subject,
              content: body,
              direction,
              author: direction === "outbound" ? account.email_address : from,
              created_at: date.toISOString(),
              ai_summary: aiSummary,
              email_message_id: messageId,
              email_account_id: account.id,
              synced_from: "imap",
              synced_at: new Date().toISOString(),
            })

            totalImported++
          } catch (emailError) {
            console.error("Error processing email:", emailError)
            // Continue with next email
          }
        }

        // Close connection
        await connection.end()

        // Update last sync timestamp
        await supabase
          .from("email_accounts")
          .update({
            last_sync_at: new Date().toISOString(),
            last_sync_status: "success",
            last_sync_error: null,
          })
          .eq("id", account.id)

      } catch (accountError) {
        console.error(`Error syncing account ${account.account_name}:`, accountError)
        errors.push(`${account.account_name}: ${accountError instanceof Error ? accountError.message : "Unknown error"}`)

        // Update account with error
        await supabase
          .from("email_accounts")
          .update({
            last_sync_status: "error",
            last_sync_error: accountError instanceof Error ? accountError.message : "Unknown error",
          })
          .eq("id", account.id)
      }
    }

    return NextResponse.json({
      success: true,
      imported: totalImported,
      skipped: totalSkipped,
      total: totalMessages,
      accounts: accounts.length,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error) {
    console.error("Error syncing emails:", error)
    return NextResponse.json(
      {
        error: "Failed to sync emails",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
