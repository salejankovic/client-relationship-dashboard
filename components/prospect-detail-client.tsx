"use client";

import { useState } from "react";
import Link from "next/link";
import { AppSidebar } from "@/components/app-sidebar";
import { MobileNav } from "@/components/mobile-nav";
import { ProductBadge } from "@/components/product-badge";
import { EmailComposerModal } from "@/components/email-composer-modal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { prospects } from "@/lib/data";
import { COUNTRY_FLAGS, getHealthStatus, HEALTH_STATUS_CONFIG, type Prospect } from "@/lib/types";
import {
  ArrowLeft,
  Mail,
  Phone,
  Copy,
  Check,
  Calendar,
  Sparkles,
  Plus,
  CheckCircle2,
  ThermometerSun,
  Snowflake,
  Pause,
  Clock,
  FileText,
  MessageSquare,
  Video,
} from "lucide-react";

interface ProspectDetailClientProps {
  id: string;
}

function HealthBadge({ daysSinceContact }: { daysSinceContact: number }) {
  const health = getHealthStatus(daysSinceContact);
  const config = HEALTH_STATUS_CONFIG[health];
  
  const Icon = health === "Active" ? CheckCircle2 :
    health === "Cooling" ? ThermometerSun :
    health === "Cold" ? Snowflake : Pause;
  
  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-medium ${config.bgColor} text-white`}>
      <Icon className="w-3.5 h-3.5" />
      {config.label}
    </div>
  );
}

function getActivityIcon(text: string) {
  const lower = text.toLowerCase();
  // Email related
  if (lower.includes("mail") || lower.includes("email") || lower.includes("poslat") || lower.includes("odgovor")) {
    return { icon: <Mail className="w-4 h-4" />, color: "bg-blue-100 text-blue-600" };
  }
  // Call related
  if (lower.includes("call") || lower.includes("poziv") || lower.includes("telefon") || lower.includes("razgovor")) {
    return { icon: <Phone className="w-4 h-4" />, color: "bg-green-100 text-green-600" };
  }
  // Meeting related
  if (lower.includes("sastanak") || lower.includes("meeting") || lower.includes("video") || lower.includes("zoom") || lower.includes("teams")) {
    return { icon: <Video className="w-4 h-4" />, color: "bg-purple-100 text-purple-600" };
  }
  // Document related
  if (lower.includes("dokument") || lower.includes("figma") || lower.includes("proposal") || lower.includes("ponuda") || lower.includes("contract") || lower.includes("ugovor")) {
    return { icon: <FileText className="w-4 h-4" />, color: "bg-orange-100 text-orange-600" };
  }
  // Scheduled/Calendar related
  if (lower.includes("scheduled") || lower.includes("zakazan") || lower.includes("planirano") || lower.includes("reminder")) {
    return { icon: <Calendar className="w-4 h-4" />, color: "bg-amber-100 text-amber-600" };
  }
  // Default - note/comment
  return { icon: <MessageSquare className="w-4 h-4" />, color: "bg-slate-100 text-slate-600" };
}

function getAIAnalysis(prospect: Prospect) {
  const health = getHealthStatus(prospect.daysSinceContact);
  const lastComment = prospect.comments[0]?.text || "";
  
  let summary = "";
  let approach = "";
  const bestTime = "Tue-Thu, morning";
  const language = prospect.country === "Croatia" ? "Croatian" : 
    prospect.country === "Serbia" ? "Serbian" : "English";

  if (health === "Cooling") {
    summary = `${prospect.company} has been evaluating your proposal for ${Math.ceil(prospect.daysSinceContact / 7)} weeks. `;
    if (lastComment.toLowerCase().includes("busy") || lastComment.toLowerCase().includes("zauzetost")) {
      summary += "They cited internal busy period.";
      approach = "Send a gentle follow-up asking if they had time to review. Offer to schedule a short call to walk through any questions.";
    } else {
      summary += "Last interaction was you sending documents.";
      approach = "Check in on their progress and offer additional support.";
    }
  } else if (health === "Cold") {
    summary = `${prospect.company} has gone quiet after ${prospect.daysSinceContact} days. `;
    if (lastComment.toLowerCase().includes("priorit")) {
      summary += "They mentioned other priorities.";
      approach = "Consider re-introduction with ROI-focused messaging when their priorities shift.";
    } else {
      summary += "This pattern often means they're comparing options.";
      approach = "Send a case study of similar organization to re-engage.";
    }
  } else if (health === "Frozen") {
    summary = `Very long silence from ${prospect.company} (${prospect.daysSinceContact} days). `;
    summary += "May need a completely fresh approach.";
    approach = "Try different contact person or present new angle/value proposition.";
  } else {
    summary = `${prospect.company} is actively engaged. Last contact ${prospect.daysSinceContact} days ago.`;
    approach = "Keep the conversation momentum going. Don't let it cool.";
  }

  return { summary, approach, bestTime, language, health };
}

export function ProspectDetailClient({ id }: ProspectDetailClientProps) {
  const [copied, setCopied] = useState<string | null>(null);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [emailTone, setEmailTone] = useState("formal");
  const [emailGoal, setEmailGoal] = useState("check-in");

  const prospect = prospects.find((p) => p.id === Number.parseInt(id));

  if (!prospect) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold mb-2">Prospect not found</h1>
          <Link href="/prospects">
            <Button variant="outline" className="bg-transparent">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Prospects
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const handleCopy = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(null), 2000);
  };

  const analysis = getAIAnalysis(prospect);

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />
      <MobileNav />
      
      <main className="lg:pl-64 pb-20 lg:pb-0">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Back Link */}
          <Link 
            href="/prospects" 
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Prospects
          </Link>

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
            <div>
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <h1 className="text-2xl font-semibold text-foreground">{prospect.company}</h1>
                <HealthBadge daysSinceContact={prospect.daysSinceContact} />
                {prospect.dealValue && (
                  <span className="text-lg font-medium text-muted-foreground">
                    {new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(prospect.dealValue)}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <ProductBadge product={prospect.product} />
                <span>{prospect.type}</span>
                <span>{COUNTRY_FLAGS[prospect.country]} {prospect.country}</span>
                <span>Owner: {prospect.owner}</span>
              </div>
            </div>
          </div>

          {/* Two Column Layout */}
          <div className="grid lg:grid-cols-[1fr,380px] gap-6">
            {/* Left Column - 60% */}
            <div className="space-y-6">
              {/* Contacts */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-medium flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-slate-100 flex items-center justify-center">
                      <span className="text-xs font-semibold text-slate-600">
                        {prospect.contactPerson.charAt(0)}
                      </span>
                    </div>
                    Contacts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <p className="font-medium text-foreground mb-2">{prospect.contactPerson}</p>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground flex items-center gap-2">
                          <Mail className="w-4 h-4" />
                          {prospect.email}
                        </span>
                        <div className="flex items-center gap-1">
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-7 text-xs"
                            onClick={() => window.open(`mailto:${prospect.email}`)}
                          >
                            Email
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-7 px-2"
                            onClick={() => handleCopy(prospect.email, "email")}
                          >
                            {copied === "email" ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                          </Button>
                        </div>
                      </div>
                      {prospect.telephone && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground flex items-center gap-2">
                            <Phone className="w-4 h-4" />
                            {prospect.telephone}
                          </span>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-7 px-2"
                            onClick={() => handleCopy(prospect.telephone, "phone")}
                          >
                            {copied === "phone" ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Activity Timeline */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-medium">Activity Timeline</CardTitle>
                    <Button size="sm" variant="outline" className="h-8 text-xs bg-transparent">
                      <Plus className="w-3 h-3 mr-1.5" />
                      Add Note
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {prospect.comments.map((comment, index) => {
                      const activity = getActivityIcon(comment.text);
                      return (
                        <div key={index} className="flex gap-3">
                          <div className="flex flex-col items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${activity.color}`}>
                              {activity.icon}
                            </div>
                            {index < prospect.comments.length - 1 && (
                              <div className="w-px h-full bg-border mt-2" />
                            )}
                          </div>
                          <div className="flex-1 pb-4">
                            <p className="text-sm font-medium text-muted-foreground mb-1">
                              {new Date(comment.date).toLocaleDateString("en-US", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </p>
                            <p className="text-sm text-foreground">{comment.text}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {prospect.comments.length > 5 && (
                    <Button variant="ghost" className="w-full text-sm text-muted-foreground mt-2">
                      Load more...
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Column - 40% */}
            <div className="space-y-6">
              {/* AI Analysis */}
              <Card className="border-blue-200 bg-blue-50/30">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-medium flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-blue-600" />
                    AI Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                      Relationship Health
                    </p>
                    <HealthBadge daysSinceContact={prospect.daysSinceContact} />
                  </div>
                  
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                      Summary
                    </p>
                    <p className="text-sm text-foreground">{analysis.summary}</p>
                  </div>

                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                      Suggested approach
                    </p>
                    <p className="text-sm text-foreground italic">"{analysis.approach}"</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2 border-t">
                    <div>
                      <p className="text-xs text-muted-foreground">Best time to reach</p>
                      <p className="text-sm font-medium">{analysis.bestTime}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Language</p>
                      <p className="text-sm font-medium">{analysis.language} preferred</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Generate Follow-up */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-medium flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    Generate Follow-up
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button 
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    onClick={() => setIsEmailModalOpen(true)}
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Email
                  </Button>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-muted-foreground block mb-1.5">Tone</label>
                      <Select value={emailTone} onValueChange={setEmailTone}>
                        <SelectTrigger className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="formal">Formal</SelectItem>
                          <SelectItem value="casual">Casual</SelectItem>
                          <SelectItem value="urgent">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground block mb-1.5">Language</label>
                      <Select defaultValue={analysis.language.toLowerCase()}>
                        <SelectTrigger className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="croatian">Croatian</SelectItem>
                          <SelectItem value="serbian">Serbian</SelectItem>
                          <SelectItem value="english">English</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1.5">Goal</label>
                    <Select value={emailGoal} onValueChange={setEmailGoal}>
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="check-in">Check in</SelectItem>
                        <SelectItem value="schedule-call">Schedule call</SelectItem>
                        <SelectItem value="share-update">Share update</SelectItem>
                        <SelectItem value="re-introduce">Re-introduce</SelectItem>
                        <SelectItem value="close-deal">Close deal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Next Action */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-medium flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Next Action
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {prospect.next && prospect.next !== "/" ? (
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span>{prospect.next}</span>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm text-muted-foreground mb-3">No next action set</p>
                      <Button variant="outline" size="sm" className="w-full bg-transparent">
                        Set follow-up reminder...
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <EmailComposerModal
        prospect={prospect}
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
      />
    </div>
  );
}
