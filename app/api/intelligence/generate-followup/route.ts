import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import type { EmailTone, EmailLanguage } from "@/lib/types";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

interface GenerateFollowupRequest {
  intelligenceId: string;
  prospectId: string;
  tone?: EmailTone;
  language?: EmailLanguage;
  additionalContext?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: GenerateFollowupRequest = await request.json();
    const {
      intelligenceId,
      prospectId,
      tone = "casual",
      language = "english",
      additionalContext,
    } = body;

    if (!intelligenceId || !prospectId) {
      return NextResponse.json(
        { error: "Intelligence ID and Prospect ID are required" },
        { status: 400 }
      );
    }

    // Fetch intelligence item
    const { data: intelligenceItem, error: intellError } = await supabase
      .from("intelligence_items")
      .select("*")
      .eq("id", intelligenceId)
      .single();

    if (intellError || !intelligenceItem) {
      return NextResponse.json(
        { error: "Intelligence item not found" },
        { status: 404 }
      );
    }

    // Fetch prospect details
    const { data: prospect, error: prospectError } = await supabase
      .from("prospects")
      .select("*")
      .eq("id", prospectId)
      .single();

    if (prospectError || !prospect) {
      return NextResponse.json(
        { error: "Prospect not found" },
        { status: 404 }
      );
    }

    // Build context for the email
    const intelligenceContext = buildIntelligenceContext(intelligenceItem);
    const prospectContext = buildProspectContext(prospect);

    // Generate email using Gemini
    const prompt = `You are a B2B sales professional writing a personalized follow-up email.

PROSPECT INFORMATION:
${prospectContext}

INTELLIGENCE TO USE (base your email around this):
${intelligenceContext}

${additionalContext ? `ADDITIONAL CONTEXT:\n${additionalContext}\n` : ""}

REQUIREMENTS:
- Tone: ${tone}
- Language: ${getLanguageInstructions(language)}
- The email should naturally reference the intelligence item
- Keep it short and conversational (100-150 words max)
- Include a clear but soft call-to-action
- Do NOT be overly salesy or pushy
- Sound like a genuine human, not a sales template

Write the email in this JSON format:
{
  "subject": "Email subject line (short, personalized, NOT clickbait)",
  "body": "Full email body with proper greeting and signature"
}`;

    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

    // Parse JSON response
    try {
      text = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const emailData = JSON.parse(text);

      return NextResponse.json({
        subject: emailData.subject,
        body: emailData.body,
        intelligenceUsed: {
          id: intelligenceItem.id,
          title: intelligenceItem.title,
          type: intelligenceItem.intelligence_type,
        },
      });
    } catch {
      // Try to extract manually if JSON parsing fails
      const subjectMatch = text.match(/"subject":\s*"([^"]+)"/);
      const bodyMatch = text.match(/"body":\s*"([\s\S]*?)"/);

      if (subjectMatch && bodyMatch) {
        return NextResponse.json({
          subject: subjectMatch[1],
          body: bodyMatch[1].replace(/\\n/g, "\n"),
          intelligenceUsed: {
            id: intelligenceItem.id,
            title: intelligenceItem.title,
            type: intelligenceItem.intelligence_type,
          },
        });
      }

      // Fallback
      return NextResponse.json({
        subject: `Quick note about ${prospect.company}`,
        body: text,
        intelligenceUsed: {
          id: intelligenceItem.id,
          title: intelligenceItem.title,
          type: intelligenceItem.intelligence_type,
        },
      });
    }
  } catch (error) {
    console.error("Error generating follow-up email:", error);
    return NextResponse.json(
      { error: "Failed to generate email" },
      { status: 500 }
    );
  }
}

function buildIntelligenceContext(item: any): string {
  const parts: string[] = [];

  parts.push(`Type: ${item.intelligence_type || item.source_type}`);
  parts.push(`Title: ${item.title}`);

  if (item.description) {
    parts.push(`Details: ${item.description}`);
  }

  if (item.content_quote) {
    parts.push(`Key Quote: "${item.content_quote}"`);
  }

  if (item.ai_tip) {
    parts.push(`Suggested angle: ${item.ai_tip}`);
  }

  // Match result specific
  if (item.match_home_team && item.match_away_team) {
    const score = `${item.match_home_score ?? "?"} - ${item.match_away_score ?? "?"}`;
    parts.push(`Match: ${item.match_home_team} vs ${item.match_away_team} (${score})`);
    if (item.match_scorers) {
      parts.push(`Scorers: ${item.match_scorers}`);
    }
  }

  // LinkedIn post specific
  if (item.person_name) {
    parts.push(`Person: ${item.person_name}${item.person_position ? ` (${item.person_position})` : ""}`);
  }

  // Job change specific
  if (item.previous_position || item.previous_company) {
    parts.push(`Previous role: ${item.previous_position || "Unknown"} at ${item.previous_company || "Unknown"}`);
  }

  return parts.join("\n");
}

function buildProspectContext(prospect: any): string {
  const parts: string[] = [];

  parts.push(`Company: ${prospect.company}`);

  if (prospect.contact_person) {
    parts.push(`Contact: ${prospect.contact_person}${prospect.contact_position ? ` (${prospect.contact_position})` : ""}`);
  }

  if (prospect.product_type) {
    parts.push(`Product interest: ${prospect.product_type}`);
  }

  if (prospect.prospect_type) {
    parts.push(`Industry: ${prospect.prospect_type}`);
  }

  if (prospect.status) {
    parts.push(`Status: ${prospect.status}`);
  }

  if (prospect.last_contact_date) {
    const lastContact = new Date(prospect.last_contact_date);
    const daysSince = Math.floor((Date.now() - lastContact.getTime()) / (1000 * 60 * 60 * 24));
    parts.push(`Last contact: ${daysSince} days ago`);
  }

  return parts.join("\n");
}

function getLanguageInstructions(language: EmailLanguage): string {
  switch (language) {
    case "croatian":
      return "Write the email in Croatian language. Use formal 'Vi' form unless the tone is very casual.";
    case "serbian":
      return "Write the email in Serbian language (Latin script). Use formal 'Vi' form unless the tone is very casual.";
    case "english":
    default:
      return "Write the email in English.";
  }
}
