"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { useCommunications } from "@/hooks/use-communications"
import type { CommunicationType } from "@/lib/types"
import { Plus, Mail, Phone, Video, FileText, Linkedin, Trash2, Sparkles } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

const COMMUNICATION_ICONS: Record<CommunicationType, React.ReactNode> = {
  email: <Mail className="h-4 w-4" />,
  call: <Phone className="h-4 w-4" />,
  meeting: <Video className="h-4 w-4" />,
  note: <FileText className="h-4 w-4" />,
  linkedin: <Linkedin className="h-4 w-4" />,
}

const COMMUNICATION_COLORS: Record<CommunicationType, string> = {
  email: "border-blue-500",
  call: "border-green-500",
  meeting: "border-purple-500",
  note: "border-gray-500",
  linkedin: "border-sky-500",
}

interface CommunicationLogProps {
  prospectId: string
  prospectEmail?: string
}

export function CommunicationLog({ prospectId, prospectEmail }: CommunicationLogProps) {
  const { communications, addCommunication, deleteCommunication } = useCommunications(prospectId)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [formData, setFormData] = useState({
    type: "note" as CommunicationType,
    subject: "",
    content: "",
    direction: "outbound" as "inbound" | "outbound",
    duration: "",
  })

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      await addCommunication({
        prospectId,
        type: formData.type,
        subject: formData.subject || undefined,
        content: formData.content,
        direction: formData.direction,
        duration: formData.duration ? parseInt(formData.duration) : undefined,
        author: "Aleksandar", // TODO: Get from auth context
      })

      // Reset form
      setFormData({
        type: "note",
        subject: "",
        content: "",
        direction: "outbound",
        duration: "",
      })
      setShowAddDialog(false)
    } catch (error) {
      console.error("Error adding communication:", error)
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this communication?")) {
      await deleteCommunication(id)
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Communication History</CardTitle>
            <div className="flex gap-2">
              {prospectEmail && (
                <Button size="sm" variant="outline" disabled>
                  <Mail className="h-4 w-4 mr-2" />
                  Import Emails
                </Button>
              )}
              <Button size="sm" onClick={() => setShowAddDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Entry
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {communications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p>No communication history yet</p>
              <p className="text-sm mt-1">Add your first entry to start tracking interactions</p>
            </div>
          ) : (
            <div className="space-y-4">
              {communications.map((comm) => (
                <div
                  key={comm.id}
                  className={`border-l-2 ${COMMUNICATION_COLORS[comm.type]} pl-4 py-3 relative group`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="mt-1">{COMMUNICATION_ICONS[comm.type]}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs">
                            {comm.type}
                          </Badge>
                          {comm.direction && (
                            <Badge variant="secondary" className="text-xs">
                              {comm.direction === "inbound" ? "↓ Inbound" : "↑ Outbound"}
                            </Badge>
                          )}
                          {comm.duration && (
                            <span className="text-xs text-muted-foreground">
                              {comm.duration} min
                            </span>
                          )}
                        </div>
                        {comm.subject && (
                          <p className="font-medium text-sm mb-1">{comm.subject}</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(comm.createdAt), { addSuffix: true })}
                          {comm.author && ` • ${comm.author}`}
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleDelete(comm.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  {comm.aiSummary && (
                    <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <div className="flex items-start gap-2">
                        <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-blue-900 dark:text-blue-100">{comm.aiSummary}</p>
                      </div>
                    </div>
                  )}

                  <details className="mt-3">
                    <summary className="text-sm cursor-pointer text-muted-foreground hover:text-foreground transition-colors">
                      View full content
                    </summary>
                    <div className="mt-2 p-3 bg-muted/50 rounded text-sm whitespace-pre-wrap">
                      {comm.content}
                    </div>
                  </details>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Communication Entry</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Type *</Label>
                <Select value={formData.type} onValueChange={(v) => handleChange("type", v as CommunicationType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Email
                      </div>
                    </SelectItem>
                    <SelectItem value="call">
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        Phone Call
                      </div>
                    </SelectItem>
                    <SelectItem value="meeting">
                      <div className="flex items-center gap-2">
                        <Video className="h-4 w-4" />
                        Meeting
                      </div>
                    </SelectItem>
                    <SelectItem value="note">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Note
                      </div>
                    </SelectItem>
                    <SelectItem value="linkedin">
                      <div className="flex items-center gap-2">
                        <Linkedin className="h-4 w-4" />
                        LinkedIn
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="direction">Direction *</Label>
                <Select value={formData.direction} onValueChange={(v) => handleChange("direction", v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="outbound">↑ Outbound (you contacted them)</SelectItem>
                    <SelectItem value="inbound">↓ Inbound (they contacted you)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {(formData.type === "email" || formData.type === "meeting") && (
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  value={formData.subject}
                  onChange={(e) => handleChange("subject", e.target.value)}
                  placeholder={formData.type === "email" ? "Email subject..." : "Meeting title..."}
                />
              </div>
            )}

            {(formData.type === "call" || formData.type === "meeting") && (
              <div className="space-y-2">
                <Label htmlFor="duration">Duration (minutes)</Label>
                <Input
                  id="duration"
                  type="number"
                  value={formData.duration}
                  onChange={(e) => handleChange("duration", e.target.value)}
                  placeholder="e.g., 30"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="content">Content *</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => handleChange("content", e.target.value)}
                placeholder={
                  formData.type === "email"
                    ? "Paste email content here..."
                    : formData.type === "call"
                    ? "Call notes and key points..."
                    : formData.type === "meeting"
                    ? "Meeting notes, attendees, action items..."
                    : "Add your notes here..."
                }
                rows={8}
                required
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={!formData.content.trim()}>
                Save Communication
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
