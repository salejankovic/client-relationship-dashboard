import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(request: NextRequest) {
  try {
    const {
      prospectCompany,
      contactPerson,
      contactPosition,
      prospectType,
      daysSinceContact,
      lastContactDate,
      status,
      intelligenceItems,
      tone,
      goal,
      languageName,
      promptInstruction,
      context,
    } = await request.json();

    // Build contact line
    const contactLine = contactPerson
      ? `${contactPerson}${contactPosition ? `, ${contactPosition}` : ""}`
      : "the team";

    // Build last contact context
    let lastContactLine = "No previous contact recorded.";
    if (daysSinceContact != null) {
      if (daysSinceContact === 0) lastContactLine = "Last contact was today.";
      else if (daysSinceContact === 1) lastContactLine = "Last contact was yesterday.";
      else lastContactLine = `Last contact was ${daysSinceContact} days ago (${lastContactDate || "unknown date"}).`;
    }

    // Build intelligence context
    let intelligenceSection = "";
    if (intelligenceItems && intelligenceItems.length > 0) {
      const items = intelligenceItems
        .map((item: { title: string; description?: string; aiTip?: string }, i: number) =>
          `  ${i + 1}. "${item.title}"${item.description ? ` — ${item.description}` : ""}${item.aiTip ? ` (Suggested angle: ${item.aiTip})` : ""}`)
        .join("\n");
      intelligenceSection = `\nRecent intelligence about ${prospectCompany} (optionally reference one naturally):\n${items}\n`;
    }

    // Build the prompt
    const prompt = `You are Aleksandar, a B2B sales professional at Appworks, writing an email to a prospect.

SENDER: Aleksandar, Appworks
RECIPIENT: ${contactLine} at ${prospectCompany}
PROSPECT TYPE: ${prospectType || "Unknown"}
PROSPECT STATUS: ${status || "Unknown"}
LAST CONTACT: ${lastContactLine}
EMAIL GOAL: ${goal}
TONE: ${tone}
${intelligenceSection}
${context ? `ADDITIONAL CONTEXT FROM SENDER:\n${context}\n` : ""}
Write a ${tone} ${languageName} sales email FROM Aleksandar at Appworks TO ${contactLine} at ${prospectCompany}.

Guidelines:
- Greeting should address ${contactPerson || "the team"} directly
- Naturally reflect the last-contact timing in the opening (e.g. acknowledge it's been a while if daysSinceContact is high)
- If intelligence items are provided, you may weave in one relevant reference naturally — do NOT force it
- Keep it concise (110-140 words), human, and specific — avoid generic sales language
- End with a clear, low-pressure call to action matching the goal
- Sign off as: Aleksandar / Appworks
- ${promptInstruction || `Write in ${languageName}.`}

Format your response as JSON:
{
  "subject": "Primary email subject line",
  "alternativeSubjects": ["Subject option 2", "Subject option 3", "Subject option 4"],
  "body": "Full email body"
}

The 3 alternativeSubjects should be meaningfully different from the primary subject — vary the angle, specificity, or hook.`;

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

    // Try to extract JSON from the response
    try {
      // Remove markdown code blocks if present
      text = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const emailData = JSON.parse(text);

      return NextResponse.json({
        subject: emailData.subject,
        alternativeSubjects: emailData.alternativeSubjects ?? [],
        body: emailData.body,
      });
    } catch (parseError) {
      // If JSON parsing fails, try to extract subject and body manually
      const subjectMatch = text.match(/"subject":\s*"([^"]+)"/);
      const bodyMatch = text.match(/"body":\s*"([^"]+)"/);

      if (subjectMatch && bodyMatch) {
        return NextResponse.json({
          subject: subjectMatch[1],
          alternativeSubjects: [],
          body: bodyMatch[1].replace(/\\n/g, "\n"),
        });
      }

      // Fallback: return raw text
      return NextResponse.json({
        subject: `Re: ${prospectCompany}`,
        alternativeSubjects: [],
        body: text,
      });
    }
  } catch (error) {
    console.error("Error generating email:", error);
    return NextResponse.json(
      { error: "Failed to generate email" },
      { status: 500 }
    );
  }
}
