"use client";

import { useState, useEffect } from "react";
import type { Prospect } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  X,
  Sparkles,
  Copy,
  Check,
  Mail,
  Lightbulb,
  Loader2,
  ExternalLink,
} from "lucide-react";

interface EmailComposerModalProps {
  prospect: Prospect | null;
  isOpen: boolean;
  onClose: () => void;
}

type Tone = "formal" | "casual" | "shorter" | "urgent" | "english";
type Goal = "check-in" | "schedule-call" | "share-update" | "re-introduce" | "close-deal";

function generateEmailContent(prospect: Prospect, tone: Tone, goal: Goal): { subject: string; body: string } {
  const contactFirstName = prospect.contactPerson.split(" ")[0].split(",")[0];
  const isEnglish = tone === "english" || prospect.country === "Ghana" || prospect.country === "Azerbaijan";
  
  const lastComment = prospect.comments[0]?.text || "";
  
  if (isEnglish) {
    const subjects: Record<Goal, string> = {
      "check-in": `Following up - ${prospect.company} ${prospect.product} project`,
      "schedule-call": `Quick call to discuss ${prospect.product}?`,
      "share-update": `Update for ${prospect.company}`,
      "re-introduce": `Reconnecting - ${prospect.product} opportunity`,
      "close-deal": `Next steps for ${prospect.company} partnership`,
    };

    const bodies: Record<Goal, string> = {
      "check-in": `Dear ${contactFirstName},

I hope this email finds you well. I wanted to follow up on our previous conversation about the ${prospect.product.toLowerCase()} project.

Have you had a chance to review the materials I sent? I'd be happy to answer any questions or provide additional information that might help with your decision.

Looking forward to hearing from you.

Best regards,
Aleksandar
Appworks d.o.o.`,
      "schedule-call": `Dear ${contactFirstName},

I hope you're doing well. I wanted to reach out and see if you'd be available for a brief call this week to discuss the ${prospect.product.toLowerCase()} project.

I have some ideas I think would be valuable to share, and I'd love to hear your thoughts on how we can move forward together.

Would any of the following times work for you?
- Tuesday or Thursday, morning
- Wednesday afternoon

Best regards,
Aleksandar
Appworks d.o.o.`,
      "share-update": `Dear ${contactFirstName},

I wanted to share a quick update that I thought might be relevant to your project.

We've recently completed a similar ${prospect.product.toLowerCase()} for another ${prospect.type.toLowerCase()} organization, and the results have been excellent. I'd love to share some insights from that project with you.

Let me know if you'd like to schedule a brief call to discuss.

Best regards,
Aleksandar
Appworks d.o.o.`,
      "re-introduce": `Dear ${contactFirstName},

It's been a while since we last connected, and I wanted to reach out to see how things are going at ${prospect.company}.

I understand priorities can shift, and I wanted to check if the ${prospect.product.toLowerCase()} project might be back on your radar. We've made some exciting improvements to our offering that I think would be valuable for your organization.

Would you be open to a brief conversation to explore the possibilities?

Best regards,
Aleksandar
Appworks d.o.o.`,
      "close-deal": `Dear ${contactFirstName},

Thank you for the productive discussions we've had about the ${prospect.product.toLowerCase()} project. I believe we're well-aligned on the scope and approach.

I'd like to propose we move forward with the next steps. I can prepare the final proposal and timeline for your review this week.

What would be the best way to proceed on your end?

Best regards,
Aleksandar
Appworks d.o.o.`,
    };

    return { subject: subjects[goal], body: bodies[goal] || bodies["check-in"] };
  }

  // Croatian/Serbian
  const isCroatian = prospect.country === "Croatia";
  
  const subjects: Record<Goal, string> = {
    "check-in": `${prospect.company} - nastavak razgovora o ${prospect.product === "Mobile app" ? "mobilnoj aplikaciji" : prospect.product.toLowerCase()}`,
    "schedule-call": `Kratki poziv - ${prospect.company}`,
    "share-update": `Novosti za ${prospect.company}`,
    "re-introduce": `Ponovno se javljamo - ${prospect.company}`,
    "close-deal": `Sljedeći koraci - ${prospect.company}`,
  };

  const greeting = tone === "formal" ? `Poštovani ${contactFirstName}` : `Zdravo ${contactFirstName}`;
  const closing = tone === "formal" 
    ? `Srdačan pozdrav,\nAleksandar\nAppworks d.o.o.` 
    : `Pozdrav,\nAleksandar`;

  const bodies: Record<Goal, string> = {
    "check-in": `${greeting},

${tone === "formal" ? "Nadam se da ste dobro." : "Nadam se da si dobro."} ${isCroatian ? "Želio bih" : "Želeo bih"} se nadovezati na naš prethodni razgovor o ${prospect.product === "Mobile app" ? "mobilnoj aplikaciji" : prospect.product.toLowerCase()}.

${tone === "formal" ? "Jeste li imali prilike" : "Jesi li imao/la prilike"} pogledati materijale koje sam ${tone === "formal" ? "Vam" : "ti"} poslao? Rado bih zakazao kratak poziv da ${tone === "formal" ? "prođemo" : "prođemo"} kroz eventualna pitanja.

${closing}`,
    "schedule-call": `${greeting},

${tone === "formal" ? "Javljam se s pitanjem biste li" : "Javljam se da vidim bi li"} ${tone === "formal" ? "bili" : "bio/la"} dostupni za kratak poziv ove ${isCroatian ? "tjedne" : "nedelje"}?

Imam nekoliko ideja za projekt koje bih ${tone === "formal" ? "Vam" : "ti"} rado predstavio.

${tone === "formal" ? "Koji termin Vam odgovara" : "Koji termin ti odgovara"}?

${closing}`,
    "share-update": `${greeting},

${tone === "formal" ? "Želio bih Vam" : "Hteo bih da ti"} podijeliti kratku novost koja bi mogla biti relevantna za ${tone === "formal" ? "Vaš" : "tvoj"} projekt.

Nedavno smo završili sličan projekt i postigli odlične rezultate. Rado bih ${tone === "formal" ? "Vam" : "ti"} ispričao više o tome.

${closing}`,
    "re-introduce": `${greeting},

Prošlo je neko vrijeme od našeg zadnjeg razgovora, pa se javljam da vidim kako ${tone === "formal" ? "ste" : "si"}.

${tone === "formal" ? "Razumijem" : "Razumem"} da prioriteti mogu da se promijene, ali ${tone === "formal" ? "želio bih" : "hteo bih"} provjeriti ${tone === "formal" ? "je li" : "da li je"} projekt ${prospect.product === "Mobile app" ? "mobilne aplikacije" : prospect.product.toLowerCase()} možda ponovo aktualan.

${tone === "formal" ? "Biste li bili" : "Bi li bio/la"} otvoreni za kratak razgovor?

${closing}`,
    "close-deal": `${greeting},

${tone === "formal" ? "Zahvaljujem Vam" : "Hvala ti"} na produktivnim razgovorima koje smo imali. ${tone === "formal" ? "Vjerujem" : "Verujem"} da smo usklađeni oko opsega i pristupa projektu.

${tone === "formal" ? "Predlažem" : "Predlažem"} da krenemo sa sljedećim koracima. Mogu pripremiti finalnu ponudu i vremenski plan za ${tone === "formal" ? "Vaš" : "tvoj"} pregled.

Koji bi bio najbolji način da nastavimo?

${closing}`,
  };

  return { subject: subjects[goal], body: bodies[goal] };
}

function getAISuggestions(prospect: Prospect): string[] {
  const suggestions: string[] = [];
  const lastComment = prospect.comments[0]?.text || "";
  
  if (lastComment.toLowerCase().includes("figma") || lastComment.toLowerCase().includes("predlog")) {
    suggestions.push("Consider mentioning the Figma proposal specifically");
  }
  if (prospect.daysSinceContact > 30) {
    suggestions.push("Add a specific time suggestion for the call");
  }
  if (prospect.type === "Sports League" || prospect.type === "Sports Club") {
    suggestions.push("Reference a similar sports organization you've worked with");
  }
  if (lastComment.toLowerCase().includes("busy") || lastComment.toLowerCase().includes("zauzetost")) {
    suggestions.push("Acknowledge their busy schedule and offer flexibility");
  }
  
  return suggestions.length > 0 ? suggestions : ["Email looks good - consider adding a personal touch"];
}

export function EmailComposerModal({ prospect, isOpen, onClose }: EmailComposerModalProps) {
  const [tone, setTone] = useState<Tone>("formal");
  const [goal, setGoal] = useState<Goal>("check-in");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [suggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(true);

  useEffect(() => {
    if (prospect && isOpen) {
      setIsGenerating(true);
      // Simulate AI generation delay
      const timer = setTimeout(() => {
        const { subject: newSubject, body: newBody } = generateEmailContent(prospect, tone, goal);
        setSubject(newSubject);
        setBody(newBody);
        setIsGenerating(false);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [prospect, isOpen, tone, goal]);

  const handleCopy = async () => {
    const fullEmail = `Subject: ${subject}\n\n${body}`;
    await navigator.clipboard.writeText(fullEmail);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenGmail = () => {
    if (!prospect) return;
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(prospect.email)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(gmailUrl, "_blank");
  };

  const aiSuggestions = prospect ? getAISuggestions(prospect) : [];

  if (!prospect) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Compose Follow-up
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* To field */}
          <div className="space-y-1.5">
            <Label className="text-sm text-muted-foreground">To</Label>
            <Input value={prospect.email} disabled className="bg-muted" />
          </div>

          {/* Subject */}
          <div className="space-y-1.5">
            <Label className="text-sm text-muted-foreground">Subject</Label>
            <Input 
              value={subject} 
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Email subject..."
            />
          </div>

          {/* Body */}
          <div className="space-y-1.5">
            <Label className="text-sm text-muted-foreground">Message</Label>
            <div className="relative">
              {isGenerating ? (
                <div className="h-64 border rounded-md flex items-center justify-center bg-muted/30">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Generating email...</span>
                  </div>
                </div>
              ) : (
                <Textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className="min-h-64 font-mono text-sm"
                  placeholder="Email body..."
                />
              )}
            </div>
          </div>

          {/* AI Variations */}
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">AI Variations</Label>
            <div className="flex flex-wrap gap-2">
              {(["formal", "casual", "shorter", "urgent", "english"] as Tone[]).map((t) => (
                <Button
                  key={t}
                  size="sm"
                  variant={tone === t ? "default" : "outline"}
                  onClick={() => setTone(t)}
                  className="text-xs capitalize"
                >
                  {t}
                  {tone === t && <Check className="w-3 h-3 ml-1" />}
                </Button>
              ))}
            </div>
          </div>

          {/* Goal Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-sm text-muted-foreground">Tone</Label>
              <Select value={tone} onValueChange={(v) => setTone(v as Tone)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="formal">Formal</SelectItem>
                  <SelectItem value="casual">Casual</SelectItem>
                  <SelectItem value="urgent">More urgent</SelectItem>
                  <SelectItem value="english">English</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm text-muted-foreground">Goal</Label>
              <Select value={goal} onValueChange={(v) => setGoal(v as Goal)}>
                <SelectTrigger>
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
          </div>

          {/* AI Suggestions */}
          {showSuggestions && aiSuggestions.length > 0 && (
            <div className="border border-amber-200 rounded-lg bg-amber-50/50 p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-amber-700">
                  <Lightbulb className="w-4 h-4" />
                  <span className="text-sm font-medium">AI Suggestions</span>
                </div>
                <button 
                  onClick={() => setShowSuggestions(false)}
                  className="text-amber-600 hover:text-amber-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <ul className="space-y-1">
                {aiSuggestions.map((suggestion, i) => (
                  <li key={i} className="text-sm text-amber-800 flex items-start gap-2">
                    <span className="text-amber-500">•</span>
                    {suggestion}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={handleCopy}>
                {copied ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy to Clipboard
                  </>
                )}
              </Button>
              <Button onClick={handleOpenGmail} className="bg-blue-600 hover:bg-blue-700">
                <ExternalLink className="w-4 h-4 mr-2" />
                Open in Gmail
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
