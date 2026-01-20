"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { AppSidebar } from "@/components/app-sidebar";
import { MobileNav } from "@/components/mobile-nav";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useProspects } from "@/hooks/use-prospects";
import { ProductBadge } from "@/components/product-badge";
import { AIInsightsCard } from "@/components/ai-insights-card";
import type { Prospect } from "@/lib/types";
import {
  Sparkles,
  Users,
  Clock,
  Calendar,
  X,
  ChevronRight,
  Loader2,
} from "lucide-react";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function formatDate() {
  return new Date().toLocaleDateString("en-US", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

type HealthStatus = "Active" | "Cooling" | "Cold" | "Frozen";

function getHealthStatus(daysSinceContact: number): HealthStatus {
  if (daysSinceContact <= 7) return "Active";
  if (daysSinceContact <= 14) return "Cooling";
  if (daysSinceContact <= 60) return "Cold";
  return "Frozen";
}

function getAIBriefing(prospectsList: Prospect[]) {
  const needsFollowUp = prospectsList.filter((p) => (p.daysSinceContact ?? 0) > 14);
  const cooling = needsFollowUp.filter((p) => getHealthStatus(p.daysSinceContact ?? 0) === "Cooling");
  const cold = needsFollowUp.filter((p) => getHealthStatus(p.daysSinceContact ?? 0) === "Cold");
  const frozen = needsFollowUp.filter((p) => getHealthStatus(p.daysSinceContact ?? 0) === "Frozen");

  const priorityProspect = [...needsFollowUp].sort((a, b) => {
    const aHealth = getHealthStatus(a.daysSinceContact ?? 0);
    const bHealth = getHealthStatus(b.daysSinceContact ?? 0);
    const healthPriority: Record<string, number> = { Cooling: 1, Cold: 2, Frozen: 3, Active: 4 };
    if (healthPriority[aHealth] !== healthPriority[bHealth]) {
      return healthPriority[aHealth] - healthPriority[bHealth];
    }
    return (b.dealValue || 0) - (a.dealValue || 0);
  })[0];

  let briefing = "";
  if (cooling.length > 0 || cold.length > 0 || frozen.length > 0) {
    const parts = [];
    if (cooling.length > 0) parts.push(`${cooling.length} prospect${cooling.length > 1 ? "s" : ""} cooling off`);
    if (cold.length > 0) parts.push(`${cold.length} going cold`);
    if (frozen.length > 0) parts.push(`${frozen.length} frozen`);
    briefing = `You have ${parts.join(", ")}. `;

    if (priorityProspect) {
      briefing += `${priorityProspect.company} hasn't been contacted in ${priorityProspect.daysSinceContact} days`;
      if (priorityProspect.dealValue) {
        briefing += ` (${new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(priorityProspect.dealValue)} deal)`;
      }
      briefing += ". I'd prioritize them - they showed interest.";
    }
  } else {
    briefing = "All prospects are active and engaged. Great job keeping up with follow-ups!";
  }

  return { briefing, priorityProspect, needsFollowUp: needsFollowUp.length };
}

function getAISuggestion(prospect: Prospect): string {
  const health = getHealthStatus(prospect.daysSinceContact ?? 0);

  if (health === "Cooling") {
    return "Gentle follow-up to check on their progress";
  }
  if (health === "Cold") {
    return "Consider re-introduction email with value reminder";
  }
  if (health === "Frozen") {
    return "Very cold - maybe try different contact person or new angle";
  }
  return "Keep the conversation going";
}

function HealthIndicator({ daysSinceContact }: { daysSinceContact?: number }) {
  const health = getHealthStatus(daysSinceContact ?? 0);

  const statusConfig = {
    Active: { color: "bg-green-500", tooltip: "Active" },
    Cooling: { color: "bg-orange-500", tooltip: "Cooling" },
    Cold: { color: "bg-red-500", tooltip: "Cold" },
    Frozen: { color: "bg-blue-400", tooltip: "Frozen" },
  };

  const config = statusConfig[health];

  return (
    <div className="flex items-center" title={config.tooltip}>
      <div className={`w-3 h-3 rounded-full ${config.color}`} />
    </div>
  );
}

export default function DashboardPage() {
  const { prospects, loading } = useProspects();
  const [briefingDismissed, setBriefingDismissed] = useState(false);

  // Filter out archived prospects
  const activeProspects = useMemo(() =>
    prospects.filter(p => !p.archived),
    [prospects]
  );

  const { briefing, priorityProspect, needsFollowUp } = useMemo(() =>
    getAIBriefing(activeProspects),
    [activeProspects]
  );

  const followUpQueue = useMemo(() =>
    [...activeProspects]
      .filter((p) => (p.daysSinceContact ?? 0) > 7)
      .sort((a, b) => {
        const aHealth = getHealthStatus(a.daysSinceContact ?? 0);
        const bHealth = getHealthStatus(b.daysSinceContact ?? 0);
        const healthPriority: Record<string, number> = { Cooling: 1, Cold: 2, Frozen: 3, Active: 4 };
        if (healthPriority[aHealth] !== healthPriority[bHealth]) {
          return healthPriority[aHealth] - healthPriority[bHealth];
        }
        return (b.dealValue || 0) - (a.dealValue || 0);
      })
      .slice(0, 5),
    [activeProspects]
  );

  const scheduledThisWeek = useMemo(() =>
    activeProspects.filter((p) => p.nextAction && p.nextAction !== ""),
    [activeProspects]
  );

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="text-muted-foreground">Loading prospects...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />
      <MobileNav />

      <main className="lg:pl-64 pb-20 lg:pb-0">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">
                {getGreeting()}, Aleksandar
              </h1>
              <p className="text-sm text-muted-foreground mt-1">{formatDate()}</p>
            </div>
          </div>

          {/* AI Daily Briefing */}
          {!briefingDismissed && needsFollowUp > 0 && (
            <Card className="mb-6 border-blue-200 bg-blue-50/50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-blue-600 uppercase tracking-wide">Today's Focus</span>
                    </div>
                    <p className="text-sm text-foreground leading-relaxed">
                      "{briefing}"
                    </p>
                    <div className="flex flex-wrap items-center gap-2 mt-3">
                      {priorityProspect && (
                        <Link href={`/acquisition/prospects/${priorityProspect.id}`}>
                          <Button size="sm" variant="outline" className="h-8 text-xs bg-transparent">
                            View {priorityProspect.company}
                          </Button>
                        </Link>
                      )}
                      <Link href="/acquisition/prospects">
                        <Button
                          size="sm"
                          className="h-8 text-xs bg-blue-600 hover:bg-blue-700"
                        >
                          <Sparkles className="w-3 h-3 mr-1.5" />
                          View all prospects
                        </Button>
                      </Link>
                    </div>
                  </div>
                  <button
                    onClick={() => setBriefingDismissed(true)}
                    className="text-muted-foreground hover:text-foreground p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                    <Users className="w-5 h-5 text-slate-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-semibold">{activeProspects.length}</p>
                    <p className="text-xs text-muted-foreground">Prospects</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-semibold">{needsFollowUp}</p>
                    <p className="text-xs text-muted-foreground">Need Follow-up</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-semibold">{scheduledThisWeek.length}</p>
                    <p className="text-xs text-muted-foreground">Scheduled</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Follow-up Queue */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">Follow-up Queue</h2>
              <div className="flex items-center gap-2">
                <Link href="/acquisition/prospects">
                  <Button variant="ghost" size="sm" className="text-xs text-muted-foreground">
                    View all
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </div>
            </div>

            {followUpQueue.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground">No prospects need follow-up right now.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {followUpQueue.map((prospect) => (
                  <Card key={prospect.id} className="hover:shadow-sm transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <HealthIndicator daysSinceContact={prospect.daysSinceContact} />

                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-1">
                            <Link
                              href={`/acquisition/prospects/${prospect.id}`}
                              className="font-medium text-foreground hover:text-blue-600 transition-colors"
                            >
                              {prospect.company}
                            </Link>
                            {prospect.contactPerson && (
                              <span className="text-muted-foreground text-sm">
                                {prospect.contactPerson}
                              </span>
                            )}
                            <span className="text-sm text-muted-foreground">
                              {prospect.daysSinceContact}d ago
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                            {prospect.productType && <ProductBadge product={prospect.productType} />}
                            {prospect.country && <span>{prospect.country}</span>}
                          </div>
                          <div className="mt-2">
                            <AIInsightsCard prospect={prospect} compact={true} />
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Link href={`/acquisition/prospects/${prospect.id}`}>
                            <Button size="sm" variant="ghost" className="h-8 text-xs">
                              View
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Scheduled This Week */}
          {scheduledThisWeek.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-4">Scheduled Actions</h2>
              <Card>
                <CardContent className="p-4">
                  <ul className="space-y-2">
                    {scheduledThisWeek.map((prospect) => (
                      <li key={prospect.id} className="flex items-center gap-3 text-sm">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <Link
                          href={`/acquisition/prospects/${prospect.id}`}
                          className="font-medium hover:text-blue-600 transition-colors"
                        >
                          {prospect.company}
                        </Link>
                        <span className="text-muted-foreground">- {prospect.nextAction}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
