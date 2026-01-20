"use client";

import { useState, useEffect } from "react";
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

interface AIInsightsCardProps {
  prospect: Prospect;
  compact?: boolean;
}

function generateInsight(prospect: Prospect): AIInsight {
  const commentCount = prospect.comments.length;
  const daysSince = prospect.daysSinceContact;
  const lastComment = prospect.comments[0]?.text.toLowerCase() || "";

  // Sentiment analysis simulation
  const positiveWords = ["thanks", "great", "interested", "available", "sure", "yes", "hvala", "super", "odlično", "ideja"];
  const negativeWords = ["unfortunately", "busy", "later", "can't", "no", "nažalost", "ne možemo", "zauzetosti", "prioritet"];

  let sentimentScore = 0;
  for (const word of positiveWords) {
    if (lastComment.includes(word)) sentimentScore += 1;
  }
  for (const word of negativeWords) {
    if (lastComment.includes(word)) sentimentScore -= 1;
  }

  const sentiment: "positive" | "neutral" | "negative" =
    sentimentScore > 0 ? "positive" : sentimentScore < 0 ? "negative" : "neutral";

  // Engagement score calculation
  let engagementScore = 50;
  engagementScore += Math.min(commentCount * 8, 30);
  engagementScore -= Math.min(daysSince * 0.5, 30);
  if (prospect.status === "Hot") engagementScore += 15;
  if (prospect.status === "Cold") engagementScore -= 15;
  engagementScore = Math.max(0, Math.min(100, engagementScore));

  // Risk level
  const riskLevel: "low" | "medium" | "high" =
    daysSince > 60 || sentiment === "negative"
      ? "high"
      : daysSince > 30 || sentiment === "neutral"
        ? "medium"
        : "low";

  // Recommended actions based on analysis
  const actions = {
    high_risk_negative: "Send a value-add email with industry insights or case study to re-engage",
    high_risk_neutral: "Schedule a check-in call to understand current priorities",
    medium_risk: "Send a brief follow-up with new product updates or relevant news",
    low_risk_positive: "Strike while hot - propose next concrete step (demo, meeting)",
    low_risk_neutral: "Continue nurturing with valuable content",
  };

  let recommendedAction: string;
  if (riskLevel === "high" && sentiment === "negative") {
    recommendedAction = actions.high_risk_negative;
  } else if (riskLevel === "high") {
    recommendedAction = actions.high_risk_neutral;
  } else if (riskLevel === "medium") {
    recommendedAction = actions.medium_risk;
  } else if (sentiment === "positive") {
    recommendedAction = actions.low_risk_positive;
  } else {
    recommendedAction = actions.low_risk_neutral;
  }

  // Key topics extraction
  const topics: string[] = [];
  if (prospect.product === "Mobile app") topics.push("Mobile Development");
  if (lastComment.includes("sastanak") || lastComment.includes("meeting")) topics.push("Meeting Scheduled");
  if (lastComment.includes("ponuda") || lastComment.includes("proposal")) topics.push("Proposal Sent");
  if (lastComment.includes("demo")) topics.push("Demo Interest");
  if (lastComment.includes("budget") || lastComment.includes("prioritet")) topics.push("Budget Discussion");
  if (topics.length === 0) topics.push("General Inquiry");

  // Best time to reach out
  const now = new Date();
  const dayOfWeek = now.getDay();
  const nextBestTime =
    dayOfWeek >= 1 && dayOfWeek <= 3
      ? "Today between 10:00-11:00 or 14:00-15:00"
      : "Tuesday or Wednesday morning (10:00-11:00)";

  return {
    sentiment,
    engagementScore: Math.round(engagementScore),
    recommendedAction,
    keyTopics: topics,
    riskLevel,
    nextBestTime,
  };
}

export function AIInsightsCard({ prospect, compact = false }: AIInsightsCardProps) {
  const [insight, setInsight] = useState<AIInsight | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);

  const generateInsights = () => {
    setIsLoading(true);
    setTimeout(() => {
      setInsight(generateInsight(prospect));
      setIsLoading(false);
      setHasGenerated(true);
    }, 1500);
  };

  useEffect(() => {
    if (!hasGenerated) {
      generateInsights();
    }
  }, [prospect.id]);

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
          ) : insight ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Brain className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium">AI Analysis</span>
                </div>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={generateInsights}>
                  <RefreshCw className="w-3 h-3" />
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
          </span>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={generateInsights} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-8 space-y-3">
            <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
            <p className="text-sm text-muted-foreground">Analyzing communication patterns...</p>
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
              <p className="text-sm">{insight.nextBestTime}</p>
            </div>

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
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}
