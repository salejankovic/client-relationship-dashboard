import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(request: NextRequest) {
  try {
    const {
      existingSubject,
      existingBody,
      refineInstructions,
      prospectCompany,
      contactPerson,
      languageName,
      promptInstruction,
    } = await request.json();

    const prompt = `You are Aleksandar, a B2B sales professional at Appworks.

You wrote the following email to ${contactPerson || "the team"} at ${prospectCompany}:

SUBJECT: ${existingSubject}

BODY:
${existingBody}

---

Please refine the email based on these instructions:
${refineInstructions}

Keep the same sender (Aleksandar / Appworks) and recipient. Maintain the core message unless instructed otherwise.
${promptInstruction || `Write in ${languageName || "English"}.`}

Format your response as JSON:
{
  "subject": "Refined subject line",
  "alternativeSubjects": ["Subject option 2", "Subject option 3", "Subject option 4"],
  "body": "Refined email body"
}`;

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

    try {
      text = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const emailData = JSON.parse(text);
      return NextResponse.json({
        subject: emailData.subject,
        alternativeSubjects: emailData.alternativeSubjects ?? [],
        body: emailData.body,
      });
    } catch {
      return NextResponse.json({
        subject: existingSubject,
        alternativeSubjects: [],
        body: text,
      });
    }
  } catch (error) {
    console.error("Error refining email:", error);
    return NextResponse.json(
      { error: "Failed to refine email" },
      { status: 500 }
    );
  }
}
