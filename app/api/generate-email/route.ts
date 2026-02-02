import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(request: NextRequest) {
  try {
    const { prospectCompany, contactPerson, tone, goal, language, context, dealValue, productType } = await request.json();

    // Build the prompt
    const prompt = `You are a B2B sales professional writing a ${language} email.

Context:
- Company: ${prospectCompany}
- Contact Person: ${contactPerson || "the team"}
- Product/Service: ${productType || "software solutions"}
- Deal Value: ${dealValue ? `€${dealValue.toLocaleString()}` : "not specified"}
- Email Goal: ${goal}
- Tone: ${tone}
- Additional Context: ${context || "Initial outreach"}

Write a professional ${language} sales email with:
1. A compelling subject line
2. Personal, warm greeting
3. Brief value proposition relevant to their industry
4. Clear call to action based on the goal: ${goal}
5. Professional signature

Keep it concise (150-200 words), personalized, and action-oriented.
${language === "croatian" ? "Write in Croatian language." : language === "serbian" ? "Write in Serbian language." : "Write in English."}

Format your response as JSON:
{
  "subject": "Email subject line",
  "body": "Full email body"
}`;

    const model = genAI.getGenerativeModel({ model: "gemini-3.0-flash" });
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
        body: emailData.body,
      });
    } catch (parseError) {
      // If JSON parsing fails, try to extract subject and body manually
      const subjectMatch = text.match(/"subject":\s*"([^"]+)"/);
      const bodyMatch = text.match(/"body":\s*"([^"]+)"/);

      if (subjectMatch && bodyMatch) {
        return NextResponse.json({
          subject: subjectMatch[1],
          body: bodyMatch[1].replace(/\\n/g, "\n"),
        });
      }

      // Fallback: return raw text
      return NextResponse.json({
        subject: `Re: ${prospectCompany}`,
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
