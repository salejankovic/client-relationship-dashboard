import { google } from "googleapis"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.NEXTAUTH_URL}/api/auth/gmail/callback`
    )

    // Generate the OAuth URL with required scopes
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: "offline", // Gets refresh token
      scope: [
        "https://www.googleapis.com/auth/gmail.readonly",
        "https://www.googleapis.com/auth/gmail.send",
        "https://www.googleapis.com/auth/userinfo.email",
      ],
      prompt: "consent", // Force to get refresh token
    })

    return NextResponse.json({ url: authUrl })
  } catch (error) {
    console.error("Error generating OAuth URL:", error)
    return NextResponse.json({ error: "Failed to generate OAuth URL" }, { status: 500 })
  }
}
