import { NextRequest, NextResponse } from "next/server"
import imapSimple from "imap-simple"

export async function POST(request: NextRequest) {
  try {
    const { imapHost, imapPort, imapUsername, imapPassword, useSsl } = await request.json()

    if (!imapHost || !imapPort || !imapUsername || !imapPassword) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // IMAP configuration
    const config = {
      imap: {
        user: imapUsername,
        password: imapPassword,
        host: imapHost,
        port: imapPort,
        tls: useSsl,
        authTimeout: 10000,
      },
    }

    // Try to connect
    const connection = await imapSimple.connect(config)

    // Try to open INBOX to verify connection works
    await connection.openBox("INBOX")

    // Close connection
    await connection.end()

    return NextResponse.json({
      success: true,
      message: "Connection successful! Your IMAP settings are correct.",
    })
  } catch (error) {
    console.error("IMAP connection test failed:", error)

    let errorMessage = "Connection failed. Please check your settings."

    if (error instanceof Error) {
      if (error.message.includes("AUTHENTICATIONFAILED")) {
        errorMessage = "Authentication failed. Please check your username and password."
      } else if (error.message.includes("ETIMEDOUT") || error.message.includes("ECONNREFUSED")) {
        errorMessage = "Cannot connect to server. Please check host and port."
      } else if (error.message.includes("Invalid credentials")) {
        errorMessage = "Invalid credentials. For Gmail, you may need an App Password."
      } else {
        errorMessage = error.message
      }
    }

    return NextResponse.json(
      {
        error: errorMessage,
      },
      { status: 400 }
    )
  }
}
