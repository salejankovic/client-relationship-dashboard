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
        authTimeout: 30000,
        connTimeout: 30000,
        tlsOptions: {
          rejectUnauthorized: false, // Allow self-signed certificates
          servername: imapHost, // SNI support
        },
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
      const msg = error.message.toLowerCase()
      const isGmail = imapHost.toLowerCase().includes("gmail")

      if (msg.includes("authenticationfailed") || msg.includes("invalid credentials") || msg.includes("application-specific password")) {
        if (isGmail) {
          errorMessage = "Gmail authentication failed. You must:\n\n1. Enable 2-Step Verification on your Google account\n2. Generate an App Password at: myaccount.google.com/apppasswords\n3. Use the App Password (not your regular Gmail password)\n\nRegular Gmail passwords don't work with IMAP."
        } else {
          errorMessage = "Authentication failed. Please check your username and password."
        }
      } else if (msg.includes("etimedout") || msg.includes("timeout")) {
        if (isGmail) {
          errorMessage = "Connection timed out. This usually means:\n\n1. You're using your regular Gmail password instead of an App Password\n2. 2-Step Verification is not enabled on your Google account\n3. IMAP access is disabled in Gmail settings\n\nPlease enable 2-Step Verification and create an App Password."
        } else {
          errorMessage = "Connection timed out. Please check:\n- Host and port are correct\n- Your firewall allows IMAP connections\n- The email server is accessible"
        }
      } else if (msg.includes("econnrefused")) {
        errorMessage = "Connection refused. Please verify:\n- IMAP host: " + imapHost + "\n- IMAP port: " + imapPort + "\n- SSL/TLS setting"
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
