import { google } from "googleapis"
import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get("code")
    const error = searchParams.get("error")

    if (error) {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/settings?error=${error}`)
    }

    if (!code) {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/settings?error=no_code`)
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.NEXTAUTH_URL}/api/auth/gmail/callback`
    )

    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code)
    oauth2Client.setCredentials(tokens)

    // Get user's email address
    const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client })
    const userInfo = await oauth2.userinfo.get()
    const emailAddress = userInfo.data.email

    // Store tokens in database
    // For now, using a hardcoded user_id. In production, this should come from your auth system
    const userId = "aleksandar" // TODO: Replace with actual user ID from auth

    // Check if config already exists
    const { data: existingConfig } = await supabase
      .from("email_sync_config")
      .select("*")
      .eq("user_id", userId)
      .eq("provider", "gmail")
      .single()

    if (existingConfig) {
      // Update existing config
      await supabase
        .from("email_sync_config")
        .update({
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token || existingConfig.refresh_token,
          token_expiry: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : null,
          email_address: emailAddress,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingConfig.id)
    } else {
      // Create new config
      await supabase.from("email_sync_config").insert({
        user_id: userId,
        provider: "gmail",
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_expiry: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : null,
        email_address: emailAddress,
        sync_enabled: true,
      })
    }

    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/settings?gmail_connected=true`)
  } catch (error) {
    console.error("Error in Gmail OAuth callback:", error)
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/settings?error=callback_failed`)
  }
}
