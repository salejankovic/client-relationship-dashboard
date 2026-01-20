import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

interface NewsArticle {
  title: string;
  link: string;
  pubDate: string;
  description?: string;
}

// Parse RSS feed from Google News
async function fetchGoogleNews(companyName: string): Promise<NewsArticle[]> {
  try {
    // Google News RSS URL
    const query = encodeURIComponent(companyName);
    const rssUrl = `https://news.google.com/rss/search?q=${query}&hl=en-US&gl=US&ceid=US:en`;

    const response = await fetch(rssUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; NewsBot/1.0)",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch news: ${response.statusText}`);
    }

    const xmlText = await response.text();

    // Simple XML parsing (extract items)
    const articles: NewsArticle[] = [];
    const itemRegex = /<item>(.*?)<\/item>/gs;
    const titleRegex = /<title><!\[CDATA\[(.*?)\]\]><\/title>/s;
    const linkRegex = /<link>(.*?)<\/link>/s;
    const pubDateRegex = /<pubDate>(.*?)<\/pubDate>/s;
    const descRegex = /<description><!\[CDATA\[(.*?)\]\]><\/description>/s;

    let match;
    while ((match = itemRegex.exec(xmlText)) !== null && articles.length < 10) {
      const item = match[1];

      const titleMatch = titleRegex.exec(item);
      const linkMatch = linkRegex.exec(item);
      const pubDateMatch = pubDateRegex.exec(item);
      const descMatch = descRegex.exec(item);

      if (titleMatch && linkMatch) {
        articles.push({
          title: titleMatch[1].trim(),
          link: linkMatch[1].trim(),
          pubDate: pubDateMatch ? pubDateMatch[1].trim() : new Date().toISOString(),
          description: descMatch ? descMatch[1].trim().substring(0, 200) : undefined,
        });
      }
    }

    return articles.slice(0, 5); // Return top 5 articles
  } catch (error) {
    console.error("Error fetching Google News:", error);
    return [];
  }
}

// Analyze article relevance and generate AI tip
async function analyzeArticleRelevance(
  article: NewsArticle,
  companyName: string,
  productType?: string,
  dealValue?: number
): Promise<{
  relevanceScore: number;
  aiTip: string;
  category: string;
}> {
  try {
    const prompt = `You are analyzing a news article for sales intelligence.

Company: ${companyName}
Product Interest: ${productType || "Software solutions"}
Deal Value: ${dealValue ? `€${dealValue.toLocaleString()}` : "Not specified"}

Article Title: ${article.title}
Article Description: ${article.description || "No description"}

Analyze this article and provide:
1. Relevance Score (0-100): How relevant is this to our sales opportunity?
2. Category: One of [Funding, Expansion, Leadership, Product Launch, Partnership, Industry News, Other]
3. AI Sales Tip: One actionable sentence on how to use this information in sales conversation.

Format as JSON:
{
  "relevanceScore": 85,
  "category": "Expansion",
  "aiTip": "Mention their recent expansion as validation of growth trajectory and opportunity for scaling software needs."
}`;

    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

    // Clean and parse JSON
    text = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const analysis = JSON.parse(text);

    return {
      relevanceScore: Math.max(0, Math.min(100, analysis.relevanceScore || 50)),
      aiTip: analysis.aiTip || "Review this article for potential talking points.",
      category: analysis.category || "Other",
    };
  } catch (error) {
    console.error("Error analyzing article:", error);
    // Fallback analysis
    return {
      relevanceScore: 50,
      aiTip: "Review this recent news about the company for conversation starters.",
      category: "Other",
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    const { companyName, productType, dealValue, prospectId } = await request.json();

    if (!companyName) {
      return NextResponse.json(
        { error: "Company name is required" },
        { status: 400 }
      );
    }

    // Fetch news articles
    const articles = await fetchGoogleNews(companyName);

    if (articles.length === 0) {
      return NextResponse.json({
        message: "No recent news found for this company",
        items: [],
      });
    }

    // Analyze each article with AI
    const intelligenceItems = await Promise.all(
      articles.map(async (article) => {
        const analysis = await analyzeArticleRelevance(
          article,
          companyName,
          productType,
          dealValue
        );

        return {
          prospectId: prospectId || undefined,
          title: article.title,
          description: article.description,
          sourceType: analysis.category,
          url: article.link,
          publishedAt: new Date(article.pubDate).toISOString(),
          aiTip: analysis.aiTip,
          relevanceScore: analysis.relevanceScore,
        };
      })
    );

    // Sort by relevance score
    intelligenceItems.sort((a, b) => b.relevanceScore - a.relevanceScore);

    // Return only items with relevance > 40
    const relevantItems = intelligenceItems.filter(item => item.relevanceScore > 40);

    return NextResponse.json({
      message: `Found ${relevantItems.length} relevant articles`,
      items: relevantItems,
    });
  } catch (error) {
    console.error("Error fetching intelligence:", error);
    return NextResponse.json(
      { error: "Failed to fetch intelligence" },
      { status: 500 }
    );
  }
}
