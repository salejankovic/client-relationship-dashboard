"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { Prospect, AIInsight } from "@/lib/types";
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw,
  Loader2,
  Brain,
  Target,
  Lightbulb,
} from "lucide-react";

const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

function getCacheKey(prospectId: string): string {
  return `ai-insights-${prospectId}`;
}

function getCachedInsight(prospectId: string): AIInsight | null {
  try {
    const cached = localStorage.getItem(getCacheKey(prospectId));
    if (!cached) return null;

    const insight: AIInsight = JSON.parse(cached);
    return insight;
  } catch {
    return null;
  }
}

function setCachedInsight(prospectId: string, insight: AIInsight): void {
  try {
    localStorage.setItem(getCacheKey(prospectId), JSON.stringify(insight));
  } catch {
    // localStorage might be full or disabled
  }
}

function isInsightStale(insight: AIInsight): boolean {
  if (!insight.generatedAt) return true;
  const generatedTime = new Date(insight.generatedAt).getTime();
  const now = Date.now();
  return now - generatedTime > CACHE_DURATION_MS;
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

interface AIInsightsCardProps {
  prospect: Prospect;
  compact?: boolean;
}

interface AIInsightsResponse {
  insights: string;
  sentiment: "positive" | "neutral" | "negative";
  riskLevel: "low" | "medium" | "high";
  engagementScore: number;
  recommendedAction: string;
}

async function fetchAIInsights(prospect: Prospect): Promise<AIInsight> {
  try {
    const response = await fetch("/api/generate-insights", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        company: prospect.company,
        daysSinceContact: prospect.daysSinceContact ?? 0,
        status: prospect.status,
        dealValue: prospect.dealValue,
        productType: prospect.productType,
        nextAction: prospect.nextAction,
        lastActivity: prospect.lastContactDate,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to generate insights");
    }

    const data: AIInsightsResponse = await response.json();

    // Extract key topics from the AI insights text
    const topics: string[] = [];
    const insightsLower = data.insights.toLowerCase();
    if (prospect.productType) topics.push(prospect.productType);
    if (insightsLower.includes("meeting") || insightsLower.includes("sastanak")) topics.push("Meeting");
    if (insightsLower.includes("demo")) topics.push("Demo");
    if (insightsLower.includes("proposal") || insightsLower.includes("ponuda")) topics.push("Proposal");
    if (insightsLower.includes("follow-up") || insightsLower.includes("check-in")) topics.push("Follow-up");
    if (topics.length === 0) topics.push("General Inquiry");

    // Determine best time to reach out
    const now = new Date();
    const dayOfWeek = now.getDay();
    const nextBestTime =
      dayOfWeek >= 1 && dayOfWeek <= 3
        ? "Today between 10:00-11:00 or 14:00-15:00"
        : "Tuesday or Wednesday morning (10:00-11:00)";

    return {
      id: `ai-${Date.now()}`,
      prospectId: prospect.id,
      sentiment: data.sentiment,
      engagementScore: data.engagementScore,
      recommendedAction: data.recommendedAction,
      keyTopics: topics,
      riskLevel: data.riskLevel,
      bestTimeToReach: nextBestTime,
      generatedAt: new Date().toISOString(),
      aiModel: "gemini-2.5-flash",
    };
  } catch (error) {
    console.error("Error fetching AI insights:", error);
    throw error;
  }
}

export function AIInsightsCard({ prospect, compact = false }: AIInsightsCardProps) {
  const [insight, setInsight] = useState<AIInsight | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateInsights = useCallback(async (force = false) => {
    // Check cache first (unless forcing refresh)
    if (!force) {
      const cached = getCachedInsight(prospect.id);
      if (cached && !isInsightStale(cached)) {
        setInsight(cached);
        return;
      }
    }

    setIsLoading(true);
    setError(null);
    try {
      const insights = await fetchAIInsights(prospect);
      setInsight(insights);
      setCachedInsight(prospect.id, insights);
    } catch (err) {
      console.error("Error generating insights:", err);
      setError("Failed to generate insights. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [prospect]);

  // Initial load - check cache or generate if stale/missing
  useEffect(() => {
    const cached = getCachedInsight(prospect.id);
    if (cached) {
      setInsight(cached);
      // If stale, refresh in background
      if (isInsightStale(cached)) {
        generateInsights(true);
      }
    } else {
      generateInsights(false);
    }
  }, [prospect.id, generateInsights]);

  const SentimentIcon = insight?.sentiment === "positive" ? TrendingUp : insight?.sentiment === "negative" ? TrendingDown : Minus;
  const sentimentColor = insight?.sentiment === "positive" ? "text-green-600" : insight?.sentiment === "negative" ? "text-red-600" : "text-yellow-600";

  if (compact) {
    return (
      <Card className="border-blue-200 bg-gradient-to-br from-blue-50/50 to-indigo-50/50">
        <CardContent className="p-4">
          {isLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
              Analyzing prospect...
            </div>
          ) : error ? (
            <div className="text-center py-2">
              <p className="text-xs text-red-600 mb-2">{error}</p>
              <Button size="sm" variant="outline" onClick={() => generateInsights(true)}>
                Retry
              </Button>
            </div>
          ) : insight ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Brain className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium">AI Analysis</span>
                  {insight.generatedAt && (
                    <span className="text-xs text-muted-foreground">
                      {formatTimeAgo(insight.generatedAt)}
                    </span>
                  )}
                </div>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => generateInsights(true)} disabled={isLoading}>
                  <RefreshCw className={`w-3 h-3 ${isLoading ? "animate-spin" : ""}`} />
                </Button>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <SentimentIcon className={`w-4 h-4 ${sentimentColor}`} />
                  <span className="text-xs capitalize">{insight.sentiment}</span>
                </div>
                <div className="flex-1">
                  <Progress value={insight.engagementScore} className="h-1.5" />
                </div>
                <span className="text-xs font-medium">{insight.engagementScore}%</span>
              </div>
              <p className="text-xs text-muted-foreground">{insight.recommendedAction}</p>
            </div>
          ) : null}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-blue-200 bg-gradient-to-br from-blue-50/50 to-indigo-50/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-600" />
            AI Insights
            {insight?.generatedAt && (
              <span className="text-xs font-normal text-muted-foreground">
                Updated {formatTimeAgo(insight.generatedAt)}
              </span>
            )}
          </span>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => generateInsights(true)} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-8 space-y-3">
            <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
            <p className="text-sm text-muted-foreground">Analyzing communication patterns with AI...</p>
          </div>
        ) : error ? (
          <div className="text-center py-6">
            <p className="text-sm text-red-600 mb-3">{error}</p>
            <Button size="sm" onClick={() => generateInsights(true)}>
              Try Again
            </Button>
          </div>
        ) : insight ? (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-white/60 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <SentimentIcon className={`w-4 h-4 ${sentimentColor}`} />
                  <span className="text-xs text-muted-foreground">Sentiment</span>
                </div>
                <p className="font-medium capitalize">{insight.sentiment}</p>
              </div>
              <div className="p-3 bg-white/60 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Target className="w-4 h-4 text-blue-600" />
                  <span className="text-xs text-muted-foreground">Engagement</span>
                </div>
                <div className="flex items-center gap-2">
                  <Progress value={insight.engagementScore} className="h-2 flex-1" />
                  <span className="text-sm font-medium">{insight.engagementScore}%</span>
                </div>
              </div>
            </div>

            <div className="p-3 bg-white/60 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                {insight.riskLevel === "high" ? (
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                ) : insight.riskLevel === "medium" ? (
                  <Clock className="w-4 h-4 text-yellow-600" />
                ) : (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                )}
                <span className="text-xs text-muted-foreground">Risk Level</span>
                <Badge
                  variant="outline"
                  className={
                    insight.riskLevel === "high"
                      ? "border-red-200 text-red-700 bg-red-50"
                      : insight.riskLevel === "medium"
                        ? "border-yellow-200 text-yellow-700 bg-yellow-50"
                        : "border-green-200 text-green-700 bg-green-50"
                  }
                >
                  {insight.riskLevel}
                </Badge>
              </div>
            </div>

            <div className="p-3 bg-white/60 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb className="w-4 h-4 text-amber-500" />
                <span className="text-xs text-muted-foreground">Recommended Action</span>
              </div>
              <p className="text-sm">{insight.recommendedAction}</p>
            </div>

            <div className="p-3 bg-white/60 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-blue-600" />
                <span className="text-xs text-muted-foreground">Best Time to Reach Out</span>
              </div>
              <p className="text-sm">{insight.bestTimeToReach}</p>
            </div>

            {insight.keyTopics && insight.keyTopics.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-2">Key Topics Identified</p>
                <div className="flex flex-wrap gap-1">
                  {insight.keyTopics.map((topic, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      {topic}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}
