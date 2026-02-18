"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Loader2, Wand2, Copy, Check } from "lucide-react"
import { generateEmailContent } from "@/hooks/use-email-drafts"
import type { EmailTone, EmailGoal, EmailLanguage, EmailDraft, IntelligenceItem, ProspectStatus, ProspectType } from "@/lib/types"

interface EmailComposerModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  prospectCompany: string
  prospectId: string
  onSave: (draft: Omit<EmailDraft, "id" | "createdAt">) => Promise<void>
  // Enriched context
  contactPerson?: string
  contactPosition?: string
  prospectType?: ProspectType
  daysSinceContact?: number
  lastContactDate?: string
  status?: ProspectStatus
  intelligenceItems?: IntelligenceItem[]
}

export function EmailComposerModal({
  open,
  onOpenChange,
  prospectCompany,
  prospectId,
  onSave,
  contactPerson,
  contactPosition,
  prospectType,
  daysSinceContact,
  lastContactDate,
  status,
  intelligenceItems,
}: EmailComposerModalProps) {
  const [tone, setTone] = useState<EmailTone>("formal")
  const [goal, setGoal] = useState<EmailGoal>("check-in")
  const [language, setLanguage] = useState<EmailLanguage>("english")
  const [context, setContext] = useState("")
  const [subject, setSubject] = useState("")
  const [body, setBody] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [hasGenerated, setHasGenerated] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleGenerate = async () => {
    setIsGenerating(true)

    try {
      const topIntelligence = intelligenceItems
        ?.filter(i => !i.dismissed)
        .slice(0, 3)
        .map(i => ({ title: i.title, description: i.description, aiTip: i.aiTip }))

      const response = await fetch("/api/generate-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prospectCompany,
          contactPerson,
          contactPosition,
          prospectType,
          daysSinceContact,
          lastContactDate,
          status,
          intelligenceItems: topIntelligence,
          tone,
          goal,
          language,
          context,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate email")
      }

      const { subject: generatedSubject, body: generatedBody } = await response.json()

      setSubject(generatedSubject)
      setBody(generatedBody)
      setHasGenerated(true)
    } catch (error) {
      console.error("Error generating email:", error)
      // Fallback to template generation
      const { subject: generatedSubject, body: generatedBody } = generateEmailContent(
        prospectCompany,
        tone,
        goal,
        language,
        context
      )
      setSubject(generatedSubject)
      setBody(generatedBody)
      setHasGenerated(true)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await onSave({
        prospectId,
        subject,
        body,
        tone,
        goal,
        language,
        aiModel: "gemini-pro",
      })

      // Reset form
      setSubject("")
      setBody("")
      setContext("")
      setHasGenerated(false)
      onOpenChange(false)
    } catch (error) {
      console.error("Error saving draft:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCopy = async () => {
    const emailText = `Subject: ${subject}\n\n${body}`
    await navigator.clipboard.writeText(emailText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleClose = () => {
    setSubject("")
    setBody("")
    setContext("")
    setHasGenerated(false)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>AI Email Composer</DialogTitle>
          <DialogDescription>
            Generate a personalized email for {prospectCompany}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Configuration */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tone">Tone</Label>
              <Select value={tone} onValueChange={(value) => setTone(value as EmailTone)}>
                <SelectTrigger id="tone">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="formal">Formal</SelectItem>
                  <SelectItem value="casual">Casual</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="english">English (Professional)</SelectItem>
                  <SelectItem value="shorter">Shorter</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="goal">Goal</Label>
              <Select value={goal} onValueChange={(value) => setGoal(value as EmailGoal)}>
                <SelectTrigger id="goal">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="check-in">Check-in</SelectItem>
                  <SelectItem value="schedule-call">Schedule Call</SelectItem>
                  <SelectItem value="share-update">Share Update</SelectItem>
                  <SelectItem value="re-introduce">Re-introduce</SelectItem>
                  <SelectItem value="close-deal">Close Deal</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="language">Language</Label>
              <Select value={language} onValueChange={(value) => setLanguage(value as EmailLanguage)}>
                <SelectTrigger id="language">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="english">English</SelectItem>
                  <SelectItem value="croatian">Croatian</SelectItem>
                  <SelectItem value="serbian">Serbian</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Context */}
          <div className="space-y-2">
            <Label htmlFor="context">Additional Context (Optional)</Label>
            <Textarea
              id="context"
              placeholder="Add any specific details you want included in the email..."
              value={context}
              onChange={(e) => setContext(e.target.value)}
              rows={3}
            />
          </div>

          {/* Generate Button */}
          <Button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full"
            size="lg"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Wand2 className="mr-2 h-4 w-4" />
                {hasGenerated ? "Regenerate Email" : "Generate Email"}
              </>
            )}
          </Button>

          {/* Generated Email */}
          {hasGenerated && (
            <div className="space-y-4 border-t pt-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Generated Email</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopy}
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </>
                  )}
                </Button>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Email subject"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="body">Body</Label>
                <Textarea
                  id="body"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={12}
                  className="font-mono text-sm"
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={isSaving || !subject || !body}>
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Draft"
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
