"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface NextActionFieldProps {
  nextAction: string
  nextActionDate: string
  onNextActionChange: (value: string) => void
  onNextActionDateChange: (value: string) => void
  className?: string
}

export function NextActionField({
  nextAction,
  nextActionDate,
  onNextActionChange,
  onNextActionDateChange,
  className = ""
}: NextActionFieldProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg">Next Action</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2">
          <Label htmlFor="next-action">What's next?</Label>
          <Input
            id="next-action"
            value={nextAction}
            onChange={(e) => onNextActionChange(e.target.value)}
            placeholder="Consider archiving"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="next-action-date">Due Date</Label>
          <Input
            id="next-action-date"
            type="date"
            value={nextActionDate}
            onChange={(e) => onNextActionDateChange(e.target.value)}
          />
        </div>
      </CardContent>
    </Card>
  )
}
