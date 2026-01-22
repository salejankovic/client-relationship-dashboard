"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Edit, Trash2 } from "lucide-react"
import { format } from "date-fns"

export interface ActivityItem {
  id: string
  comment: string
  date: string
  createdAt?: string
}

interface ActivityLogProps {
  title?: string
  activities: ActivityItem[]
  onAdd: (comment: string, date: string) => void
  onEdit?: (id: string, comment: string, date: string) => void
  onDelete?: (id: string) => void
}

export function ActivityLog({
  title = "Activity Log",
  activities,
  onAdd,
  onEdit,
  onDelete
}: ActivityLogProps) {
  const [newComment, setNewComment] = useState("")
  const [newDate, setNewDate] = useState(format(new Date(), "yyyy-MM-dd"))
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editComment, setEditComment] = useState("")
  const [editDate, setEditDate] = useState("")

  const handleAdd = () => {
    if (!newComment.trim()) {
      alert("Please enter a comment")
      return
    }

    onAdd(newComment.trim(), newDate)
    setNewComment("")
    setNewDate(format(new Date(), "yyyy-MM-dd"))
  }

  const handleEdit = (activity: ActivityItem) => {
    setEditingId(activity.id)
    setEditComment(activity.comment)
    setEditDate(activity.date)
  }

  const handleSaveEdit = () => {
    if (editingId && onEdit && editComment.trim()) {
      onEdit(editingId, editComment.trim(), editDate)
      setEditingId(null)
      setEditComment("")
      setEditDate("")
    }
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditComment("")
    setEditDate("")
  }

  const formatDisplayDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return format(date, "MMM d, yyyy")
    } catch {
      return dateString
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add New Activity */}
        <div className="flex gap-2">
          <Input
            placeholder="Add a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                handleAdd()
              }
            }}
            className="flex-1"
          />
          <Input
            type="date"
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
            className="w-40"
          />
          <Button onClick={handleAdd} size="icon" className="shrink-0">
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Activity List */}
        {activities.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No activity recorded yet. Add your first entry above.
          </p>
        ) : (
          <div className="space-y-3">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className="border rounded-lg p-3 hover:bg-muted/30 transition-colors"
              >
                {editingId === activity.id ? (
                  <div className="space-y-2">
                    <Input
                      value={editComment}
                      onChange={(e) => setEditComment(e.target.value)}
                      className="mb-2"
                    />
                    <Input
                      type="date"
                      value={editDate}
                      onChange={(e) => setEditDate(e.target.value)}
                      className="mb-2"
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleSaveEdit}>
                        Save
                      </Button>
                      <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm break-words">{activity.comment}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDisplayDate(activity.date)}
                      </p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      {onEdit && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(activity)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                      )}
                      {onDelete && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onDelete(activity.id)}
                          className="h-8 w-8 p-0 hover:bg-destructive/20"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
