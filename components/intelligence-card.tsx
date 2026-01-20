"use client";

import React from "react"

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Linkedin,
  Building2,
  Newspaper,
  Trophy,
  Briefcase,
  Lightbulb,
  ExternalLink,
  Sparkles,
  X,
  UserPlus,
  Check,
} from "lucide-react";
import type { IntelligenceItem, IntelligenceType } from "@/lib/intelligence-data";
import { TYPE_CONFIG } from "@/lib/intelligence-data";
import Link from "next/link";

interface IntelligenceCardProps {
  item: IntelligenceItem;
  onUseInFollowUp?: (item: IntelligenceItem) => void;
  onDismiss?: (item: IntelligenceItem) => void;
  onAddContact?: (item: IntelligenceItem) => void;
  isDismissed?: boolean;
}

const typeIcons: Record<IntelligenceType, React.ReactNode> = {
  linkedin_post: <Linkedin className="w-4 h-4" />,
  company_update: <Building2 className="w-4 h-4" />,
  news: <Newspaper className="w-4 h-4" />,
  sports_result: <Trophy className="w-4 h-4" />,
  job_change: <Briefcase className="w-4 h-4" />,
};

function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffHours < 1) return "Just now";
  if (diffHours < 24) return `${diffHours} hours ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString();
}

function getSportsResultColor(result: "win" | "loss" | "draw"): string {
  switch (result) {
    case "win":
      return "bg-green-50 border-green-200";
    case "loss":
      return "bg-red-50 border-red-200";
    default:
      return "bg-gray-50 border-gray-200";
  }
}

export function IntelligenceCard({ 
  item, 
  onUseInFollowUp, 
  onDismiss,
  onAddContact,
  isDismissed = false,
}: IntelligenceCardProps) {
  const config = TYPE_CONFIG[item.type];
  const isSportsResult = item.type === "sports_result" && typeof item.content === "object";
  const isJobChange = item.type === "job_change";

  if (isDismissed) {
    return (
      <Card className="overflow-hidden bg-muted/30 opacity-60">
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Check className="w-4 h-4 text-green-600" />
              <span>Dismissed: {item.prospect.company}</span>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-7 text-xs"
              onClick={() => onDismiss?.(item)}
            >
              Undo
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <Badge variant="secondary" className={`${config.bgColor} ${config.color} border-0 gap-1.5`}>
            {typeIcons[item.type]}
            {config.label.toUpperCase()}
          </Badge>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {formatTimestamp(item.timestamp)}
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
              onClick={() => onDismiss?.(item)}
              title="Dismiss"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Prospect/Contact Info */}
        <div className="mb-3">
          {item.contact ? (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-sm">
                {item.contact.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
              </div>
              <div>
                <div className="font-medium">{item.contact.name}</div>
                <div className="text-sm text-muted-foreground">
                  {item.contact.role || item.contact.newRole} at {item.prospect.company} <span className="ml-1">{item.prospect.flag}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-semibold text-sm">
                {item.prospect.company.split(" ").map(n => n[0]).join("").slice(0, 2)}
              </div>
              <div>
                <div className="font-medium">{item.prospect.company} <span className="ml-1">{item.prospect.flag}</span></div>
                {item.source && (
                  <div className="text-sm text-muted-foreground">
                    {isSportsResult && typeof item.content === "object" 
                      ? item.content.competition 
                      : `Source: ${item.source}`}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        {isSportsResult && typeof item.content === "object" ? (
          <div className={`rounded-lg border p-3 mb-3 ${getSportsResultColor(item.content.result)}`}>
            <div className="flex items-center justify-center gap-4 text-lg font-semibold">
              <span className={item.content.result === "win" ? "text-green-700" : ""}>
                {item.content.homeTeam}
              </span>
              <span className="text-xl font-bold">
                {item.content.homeScore} - {item.content.awayScore}
              </span>
              <span className={item.content.result === "loss" ? "text-red-700" : ""}>
                {item.content.awayTeam}
              </span>
            </div>
            {item.content.scorers.length > 0 && (
              <div className="text-center text-xs text-muted-foreground mt-2">
                {item.content.scorers.join(" | ")}
              </div>
            )}
          </div>
        ) : item.type === "job_change" && item.contact ? (
          <div className="text-sm text-foreground mb-3">
            <p>
              <span className="font-medium">{item.contact.name}</span> joined as{" "}
              <span className="font-medium">{item.contact.newRole}</span>
            </p>
            {item.contact.previousRole && (
              <p className="text-muted-foreground text-xs mt-1">
                Previously: {item.contact.previousRole}
              </p>
            )}
          </div>
        ) : (
          <p className="text-sm text-foreground mb-3 line-clamp-3">
            "{typeof item.content === "string" ? item.content : ""}"
          </p>
        )}

        {/* AI Tip */}
        <div className="bg-yellow-50 border-l-3 border-yellow-500 rounded-r-md p-3 mb-3">
          <div className="flex gap-2">
            <Lightbulb className="w-4 h-4 text-yellow-600 shrink-0 mt-0.5" />
            <p className="text-sm text-yellow-900">{item.aiTip}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          {item.articleUrl && (
            <Button variant="outline" size="sm" asChild>
              <a href={item.articleUrl} target="_blank" rel="noopener noreferrer">
                Read Article
                <ExternalLink className="w-3 h-3 ml-1" />
              </a>
            </Button>
          )}
          {(item.linkedinUrl || item.contact?.linkedinUrl) && (
            <Button variant="outline" size="sm" asChild>
              <a 
                href={item.linkedinUrl || item.contact?.linkedinUrl} 
                target="_blank" 
                rel="noopener noreferrer"
              >
                View on LinkedIn
                <ExternalLink className="w-3 h-3 ml-1" />
              </a>
            </Button>
          )}
          {item.prospect.id && (
            <Button variant="outline" size="sm" asChild>
              <Link href={`/prospects/${item.prospect.id}`}>
                View Prospect
              </Link>
            </Button>
          )}
          {isJobChange && item.contact && (
            <Button 
              variant="outline" 
              size="sm"
              className="text-green-600 border-green-200 hover:bg-green-50 bg-transparent"
              onClick={() => onAddContact?.(item)}
            >
              <UserPlus className="w-3 h-3 mr-1" />
              Add as Contact
            </Button>
          )}
          <Button 
            size="sm" 
            className="ml-auto"
            onClick={() => onUseInFollowUp?.(item)}
          >
            <Sparkles className="w-3 h-3 mr-1" />
            Use in Follow-up
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
