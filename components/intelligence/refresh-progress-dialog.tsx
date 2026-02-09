"use client"

import { useEffect, useRef, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { CheckCircle2, XCircle, Loader2, Square } from "lucide-react"
import type { Prospect } from "@/lib/types"

export interface ProspectResult {
  company: string
  status: "pending" | "scanning" | "success" | "error"
  newItems: number
  error?: string
}

interface RefreshProgressDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  prospects: Prospect[]
  onComplete: () => void
}

export function RefreshProgressDialog({
  open,
  onOpenChange,
  prospects,
  onComplete,
}: RefreshProgressDialogProps) {
  const [results, setResults] = useState<ProspectResult[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [isDone, setIsDone] = useState(false)
  const abortRef = useRef<AbortController | null>(null)
  const scrollEndRef = useRef<HTMLDivElement>(null)

  const totalScanned = results.filter(
    (r) => r.status === "success" || r.status === "error"
  ).length
  const totalNewItems = results.reduce((sum, r) => sum + r.newItems, 0)
  const totalErrors = results.filter((r) => r.status === "error").length
  const currentProspect = results.find((r) => r.status === "scanning")
  const progressPercent =
    prospects.length > 0 ? (totalScanned / prospects.length) * 100 : 0

  // Auto-scroll to bottom as results come in
  useEffect(() => {
    scrollEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [results])

  // Start scanning when dialog opens
  useEffect(() => {
    if (open && !isRunning && !isDone) {
      startScan()
    }
  }, [open])

  const startScan = async () => {
    setIsRunning(true)
    setIsDone(false)
    setResults([])

    const controller = new AbortController()
    abortRef.current = controller

    const nonArchived = prospects.filter((p) => !p.archived)

    for (let i = 0; i < nonArchived.length; i++) {
      if (controller.signal.aborted) break

      const prospect = nonArchived[i]

      // Mark as scanning
      setResults((prev) => [
        ...prev.filter((r) => r.status !== "scanning"),
        {
          company: prospect.company,
          status: "scanning",
          newItems: 0,
        },
      ])

      try {
        const response = await fetch("/api/fetch-intelligence", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            companyName: prospect.company,
            prospectId: prospect.id,
            website: prospect.website,
            prospectType: prospect.prospectType,
            country: prospect.country,
            linkedinUrl: prospect.linkedinUrl,
            saveToDB: true,
          }),
          signal: controller.signal,
        })

        const data = await response.json()

        setResults((prev) =>
          prev.map((r) =>
            r.company === prospect.company && r.status === "scanning"
              ? {
                  ...r,
                  status: "success" as const,
                  newItems: data.newItemsCount || 0,
                }
              : r
          )
        )
      } catch (error: any) {
        if (error.name === "AbortError") break

        setResults((prev) =>
          prev.map((r) =>
            r.company === prospect.company && r.status === "scanning"
              ? {
                  ...r,
                  status: "error" as const,
                  error: error.message || "Failed to fetch",
                }
              : r
          )
        )
      }

      // Rate limiting delay between prospects (2 seconds)
      if (i < nonArchived.length - 1 && !controller.signal.aborted) {
        await new Promise((resolve) => setTimeout(resolve, 2000))
      }
    }

    setIsRunning(false)
    setIsDone(true)
  }

  const handleCancel = () => {
    abortRef.current?.abort()
    setIsRunning(false)
    setIsDone(true)
  }

  const handleClose = () => {
    if (isRunning) {
      handleCancel()
    }
    onComplete()
    onOpenChange(false)
    // Reset state for next time
    setTimeout(() => {
      setResults([])
      setIsDone(false)
    }, 300)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent showCloseButton={false} className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isDone ? "Scan Complete" : "Scanning Prospects"}
          </DialogTitle>
          <DialogDescription>
            {isDone
              ? `Scanned ${totalScanned} prospects. Found ${totalNewItems} new intelligence items.`
              : currentProspect
              ? `Scanning ${currentProspect.company}... (${totalScanned + 1} of ${prospects.filter((p) => !p.archived).length})`
              : "Preparing scan..."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Progress bar */}
          <div className="space-y-2">
            <Progress value={progressPercent} />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>
                {totalScanned} of {prospects.filter((p) => !p.archived).length}{" "}
                prospects
              </span>
              <span>{totalNewItems} new items found</span>
            </div>
          </div>

          {/* Results list */}
          <ScrollArea className="h-[300px] rounded-md border p-3">
            <div className="space-y-1.5">
              {results.map((result, idx) => (
                <div
                  key={`${result.company}-${idx}`}
                  className="flex items-center gap-2 text-sm py-1"
                >
                  {result.status === "scanning" && (
                    <Loader2 className="h-4 w-4 animate-spin text-blue-500 flex-shrink-0" />
                  )}
                  {result.status === "success" && (
                    <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                  )}
                  {result.status === "error" && (
                    <XCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                  )}
                  {result.status === "pending" && (
                    <Square className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  )}
                  <span className="flex-1 truncate">{result.company}</span>
                  {result.status === "success" && result.newItems > 0 && (
                    <span className="text-xs text-green-600 font-medium flex-shrink-0">
                      +{result.newItems} new
                    </span>
                  )}
                  {result.status === "success" && result.newItems === 0 && (
                    <span className="text-xs text-muted-foreground flex-shrink-0">
                      up to date
                    </span>
                  )}
                  {result.status === "error" && (
                    <span className="text-xs text-red-500 flex-shrink-0">
                      failed
                    </span>
                  )}
                </div>
              ))}
              <div ref={scrollEndRef} />
            </div>
          </ScrollArea>

          {/* Summary when done */}
          {isDone && (
            <div className="rounded-md bg-muted p-3 text-sm space-y-1">
              <p className="font-medium">Summary</p>
              <p>
                Prospects scanned: {totalScanned}
              </p>
              <p>
                New intelligence items: {totalNewItems}
              </p>
              {totalErrors > 0 && (
                <p className="text-red-500">
                  Errors: {totalErrors}
                </p>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          {isRunning ? (
            <Button variant="destructive" onClick={handleCancel}>
              Cancel Scan
            </Button>
          ) : (
            <Button onClick={handleClose}>Close</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
