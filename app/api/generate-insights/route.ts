import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(request: NextRequest) {
  try {
    const { company, daysSinceContact, status, dealValue, productType, nextAction, lastActivity } = await request.json();

    // Determine health status
    let health = "Active";
    if (daysSinceContact > 60) health = "Frozen";
    else if (daysSinceContact > 30) health = "Cold";
    else if (daysSinceContact > 14) health = "Cooling";

    const prompt = `You are a B2B sales AI assistant analyzing prospect engagement.

Prospect Details:
- Company: ${company}
- Days Since Last Contact: ${daysSinceContact}
- Health Status: ${health}
- Deal Status: ${status}
- Deal Value: ${dealValue ? `€${dealValue.toLocaleString()}` : "Not specified"}
- Product Interest: ${productType || "Not specified"}
- Next Planned Action: ${nextAction || "None"}
- Last Activity: ${lastActivity || "No recent activity"}

Provide a brief analysis (2-3 sentences) covering:
1. Current engagement level and risk assessment
2. Recommended next action
3. Best approach or talking points

Keep it concise and actionable. Write in a professional but friendly tone.`;

    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const insights = response.text();

    // Extract risk level based on health
    let riskLevel: "low" | "medium" | "high" = "low";
    if (health === "Frozen" || health === "Cold") riskLevel = "high";
    else if (health === "Cooling") riskLevel = "medium";

    // Extract sentiment from the response
    const lowerInsights = insights.toLowerCase();
    let sentiment: "positive" | "neutral" | "negative" = "neutral";
    if (lowerInsights.includes("engaged") || lowerInsights.includes("strong") || lowerInsights.includes("positive")) {
      sentiment = "positive";
    } else if (lowerInsights.includes("risk") || lowerInsights.includes("concern") || lowerInsights.includes("declining")) {
      sentiment = "negative";
    }

    return NextResponse.json({
      insights,
      sentiment,
      riskLevel,
      engagementScore: Math.max(0, 100 - daysSinceContact * 2), // Simple score based on recency
      recommendedAction: nextAction || "Schedule follow-up call",
    });
  } catch (error) {
    console.error("Error generating insights:", error);
    return NextResponse.json(
      { error: "Failed to generate insights" },
      { status: 500 }
    );
  }
}
