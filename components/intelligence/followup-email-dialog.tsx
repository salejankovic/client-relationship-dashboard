"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Copy, Check, Send, RefreshCw } from "lucide-react"
import type { IntelligenceItem, Prospect, EmailTone, EmailLanguage } from "@/lib/types"

interface FollowupEmailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  item: IntelligenceItem
  prospect?: Prospect
}

export function FollowupEmailDialog({
  open,
  onOpenChange,
  item,
  prospect,
}: FollowupEmailDialogProps) {
  const [loading, setLoading] = useState(false)
  const [subject, setSubject] = useState("")
  const [body, setBody] = useState("")
  const [tone, setTone] = useState<EmailTone>("casual")
  const [language, setLanguage] = useState<EmailLanguage>("english")
  const [copied, setCopied] = useState(false)
  const [generated, setGenerated] = useState(false)

  const handleGenerate = async () => {
    if (!prospect) return

    setLoading(true)
    try {
      const response = await fetch("/api/intelligence/generate-followup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          intelligenceId: item.id,
          prospectId: prospect.id,
          tone,
          language,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate email")
      }

      const data = await response.json()
      setSubject(data.subject)
      setBody(data.body)
      setGenerated(true)
    } catch (error) {
      console.error("Error generating email:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = async () => {
    const emailText = `Subject: ${subject}\n\n${body}`
    await navigator.clipboard.writeText(emailText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSendViaGmail = () => {
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(prospect?.email || "")}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    window.open(gmailUrl, "_blank")
  }

  const handleClose = () => {
    onOpenChange(false)
    // Reset state after closing
    setTimeout(() => {
      setSubject("")
      setBody("")
      setGenerated(false)
    }, 200)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Generate Follow-up Email</DialogTitle>
          <DialogDescription>
            Create a personalized email based on this intelligence about {prospect?.company || "the prospect"}
          </DialogDescription>
        </DialogHeader>

        {/* Intelligence Context */}
        <div className="rounded-lg bg-muted/50 p-3 text-sm">
          <div className="font-medium mb-1">Using intelligence:</div>
          <div className="text-muted-foreground">{item.title}</div>
          {item.aiTip && (
            <div className="mt-2 text-xs text-muted-foreground italic">
              Tip: {item.aiTip}
            </div>
          )}
        </div>

        {/* Settings */}
        {!generated && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Tone</Label>
              <Select value={tone} onValueChange={(v) => setTone(v as EmailTone)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="casual">Casual</SelectItem>
                  <SelectItem value="formal">Formal</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Language</Label>
              <Select value={language} onValueChange={(v) => setLanguage(v as EmailLanguage)}>
                <SelectTrigger>
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
        )}

        {/* Generated Email */}
        {generated && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Subject</Label>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Email subject"
              />
            </div>
            <div className="space-y-2">
              <Label>Body</Label>
              <Textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Email body"
                rows={10}
                className="font-mono text-sm"
              />
            </div>
          </div>
        )}

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {!generated ? (
            <Button onClick={handleGenerate} disabled={loading || !prospect}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                "Generate Email"
              )}
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={handleGenerate}
                disabled={loading}
                className="sm:mr-auto"
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                Regenerate
              </Button>
              <Button variant="outline" onClick={handleCopy}>
                {copied ? (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy
                  </>
                )}
              </Button>
              <Button onClick={handleSendViaGmail}>
                <Send className="mr-2 h-4 w-4" />
                Open in Gmail
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
