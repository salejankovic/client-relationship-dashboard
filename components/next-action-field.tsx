"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Check, X } from "lucide-react"

interface NextActionFieldProps {
  nextAction: string
  nextActionDate: string
  onNextActionChange: (value: string) => void
  onNextActionDateChange: (value: string) => void
  onComplete?: () => Promise<void>
  className?: string
}

export function NextActionField({
  nextAction,
  nextActionDate,
  onNextActionChange,
  onNextActionDateChange,
  onComplete,
  className = ""
}: NextActionFieldProps) {
  const hasContent = nextAction.trim() || nextActionDate

  const handleComplete = async () => {
    onNextActionChange("")
    onNextActionDateChange("")
    if (onComplete) {
      await onComplete()
    }
  }

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg">Next Action</CardTitle>
        {hasContent && (
          <Button
            size="sm"
            onClick={handleComplete}
            className="h-8 text-xs bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200"
          >
            <Check className="h-3 w-3 mr-1" />
            Complete
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2">
          <Label htmlFor="next-action">What's next?</Label>
          <div className="relative">
            <Input
              id="next-action"
              value={nextAction}
              onChange={(e) => onNextActionChange(e.target.value)}
              placeholder="e.g., Schedule demo call"
              className={nextAction ? "pr-8" : ""}
            />
            {nextAction && (
              <button
                type="button"
                onClick={() => onNextActionChange("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="next-action-date">Due Date</Label>
          <div className="relative">
            <Input
              id="next-action-date"
              type="date"
              value={nextActionDate}
              onChange={(e) => onNextActionDateChange(e.target.value)}
              className={nextActionDate ? "pr-8" : ""}
            />
            {nextActionDate && (
              <button
                type="button"
                onClick={() => onNextActionDateChange("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
