"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Archive, Loader2 } from "lucide-react"

interface ArchiveProspectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  prospectName: string
  onConfirm: (reason: string, notes?: string) => Promise<void>
}

const ARCHIVE_REASONS = [
  "Lost to competitor",
  "Budget constraints",
  "No longer interested",
  "Bad timing",
  "No response after multiple attempts",
  "Project cancelled",
  "Wrong fit",
  "Custom",
]

export function ArchiveProspectDialog({
  open,
  onOpenChange,
  prospectName,
  onConfirm,
}: ArchiveProspectDialogProps) {
  const [reason, setReason] = useState<string>("")
  const [customReason, setCustomReason] = useState("")
  const [notes, setNotes] = useState("")
  const [isArchiving, setIsArchiving] = useState(false)

  const handleArchive = async () => {
    if (!reason) return

    setIsArchiving(true)
    try {
      const finalReason = reason === "Custom" ? customReason : reason
      const finalNotes = notes.trim() || undefined

      await onConfirm(finalReason, finalNotes)

      // Reset form
      setReason("")
      setCustomReason("")
      setNotes("")
      onOpenChange(false)
    } catch (error) {
      console.error("Error archiving prospect:", error)
    } finally {
      setIsArchiving(false)
    }
  }

  const isValid = reason && (reason !== "Custom" || customReason.trim())

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Archive className="h-5 w-5" />
            Archive Prospect
          </DialogTitle>
          <DialogDescription>
            Archive <span className="font-semibold">{prospectName}</span> and move them to the archived prospects list.
            You can restore them later if needed.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Reason Selection */}
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for archiving *</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger id="reason">
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                {ARCHIVE_REASONS.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Custom Reason Input */}
          {reason === "Custom" && (
            <div className="space-y-2">
              <Label htmlFor="customReason">Custom reason *</Label>
              <Textarea
                id="customReason"
                placeholder="Enter your custom reason..."
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                rows={2}
              />
            </div>
          )}

          {/* Additional Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Additional notes (optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any additional context or notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
            <p className="text-xs text-blue-800 dark:text-blue-200">
              💡 Archived prospects can be restored at any time from the Archived page.
              They won't appear in your active prospects list or follow-up queue.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isArchiving}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleArchive}
            disabled={!isValid || isArchiving}
            className="bg-orange-600 hover:bg-orange-700"
          >
            {isArchiving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Archiving...
              </>
            ) : (
              <>
                <Archive className="mr-2 h-4 w-4" />
                Archive Prospect
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
