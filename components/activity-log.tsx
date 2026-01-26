"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Plus, Edit, Trash2, FileText, Phone, Users, Video, MessageCircle, Linkedin, Reply } from "lucide-react"
import { format } from "date-fns"
import { type ActivityType, ACTIVITY_TYPE_CONFIG } from "@/lib/types"

export interface ActivityItem {
  id: string
  comment: string
  date: string
  createdAt?: string
  activityType?: ActivityType
}

const ActivityIcon = ({ type }: { type: ActivityType }) => {
  const iconClass = "h-4 w-4"
  switch (type) {
    case 'call':
      return <Phone className={iconClass} />
    case 'meeting':
      return <Users className={iconClass} />
    case 'online_call':
      return <Video className={iconClass} />
    case 'sms_whatsapp':
      return <MessageCircle className={iconClass} />
    case 'linkedin':
      return <Linkedin className={iconClass} />
    case 'email_reply':
      return <Reply className={iconClass} />
    case 'note':
    default:
      return <FileText className={iconClass} />
  }
}

interface ActivityLogProps {
  title?: string
  activities: ActivityItem[]
  onAdd: (comment: string, date: string, activityType: ActivityType) => void
  onEdit?: (id: string, comment: string, date: string, activityType: ActivityType) => void
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
  const [newActivityType, setNewActivityType] = useState<ActivityType>("note")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editComment, setEditComment] = useState("")
  const [editDate, setEditDate] = useState("")
  const [editActivityType, setEditActivityType] = useState<ActivityType>("note")

  const handleAdd = () => {
    if (!newComment.trim()) {
      alert("Please enter a comment")
      return
    }

    onAdd(newComment.trim(), newDate, newActivityType)
    setNewComment("")
    setNewDate(format(new Date(), "yyyy-MM-dd"))
    setNewActivityType("note")
  }

  const handleEdit = (activity: ActivityItem) => {
    setEditingId(activity.id)
    setEditComment(activity.comment)
    setEditDate(activity.date)
    setEditActivityType(activity.activityType || "note")
  }

  const handleSaveEdit = () => {
    if (editingId && onEdit && editComment.trim()) {
      onEdit(editingId, editComment.trim(), editDate, editActivityType)
      setEditingId(null)
      setEditComment("")
      setEditDate("")
      setEditActivityType("note")
    }
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditComment("")
    setEditDate("")
    setEditActivityType("note")
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
        <div className="flex flex-wrap gap-2">
          <Select value={newActivityType} onValueChange={(v) => setNewActivityType(v as ActivityType)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(ACTIVITY_TYPE_CONFIG).map(([key, config]) => (
                <SelectItem key={key} value={key}>
                  <div className="flex items-center gap-2">
                    <ActivityIcon type={key as ActivityType} />
                    {config.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
            className="flex-1 min-w-[200px]"
          />
          <Input
            type="date"
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
            className="w-40"
          />
          <Button type="button" onClick={handleAdd} size="icon" className="shrink-0">
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
                    <Select value={editActivityType} onValueChange={(v) => setEditActivityType(v as ActivityType)}>
                      <SelectTrigger className="w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(ACTIVITY_TYPE_CONFIG).map(([key, config]) => (
                          <SelectItem key={key} value={key}>
                            <div className="flex items-center gap-2">
                              <ActivityIcon type={key as ActivityType} />
                              {config.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="mt-0.5 text-muted-foreground">
                        <ActivityIcon type={activity.activityType || "note"} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium px-2 py-0.5 bg-secondary rounded">
                            {ACTIVITY_TYPE_CONFIG[activity.activityType || "note"].label}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatDisplayDate(activity.date)}
                          </span>
                        </div>
                        <p className="text-sm break-words">{activity.comment}</p>
                      </div>
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
