"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { Comment } from "@/lib/types";
import { Mail, Phone, Calendar, FileText, Plus } from "lucide-react";

interface ActivityTimelineProps {
  comments: Comment[];
}

function getActivityIcon(text: string) {
  const lowerText = text.toLowerCase();
  if (lowerText.includes("sastanak") || lowerText.includes("meeting") || lowerText.includes("call")) {
    return Calendar;
  }
  if (lowerText.includes("telefon") || lowerText.includes("phone") || lowerText.includes("zvao")) {
    return Phone;
  }
  return Mail;
}

export function ActivityTimeline({ comments }: ActivityTimelineProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newNote, setNewNote] = useState("");

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("sr-Latn", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const handleAddNote = () => {
    if (newNote.trim()) {
      // In a real app, this would save to a database
      console.log("New note:", newNote);
      setNewNote("");
      setIsAdding(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Activity Log</CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsAdding(!isAdding)}
          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
        >
          <Plus className="w-4 h-4 mr-1" />
          Add Note
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {isAdding && (
          <div className="space-y-2 p-3 bg-muted rounded-lg">
            <Textarea
              placeholder="Add a new note..."
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              rows={2}
            />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setIsAdding(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleAddNote} className="bg-blue-600 hover:bg-blue-700 text-white">
                Save Note
              </Button>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {comments.map((comment, index) => {
            const Icon = getActivityIcon(comment.text);
            return (
              <div key={index} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-muted-foreground" />
                  </div>
                  {index < comments.length - 1 && (
                    <div className="w-px h-full bg-border mt-2" />
                  )}
                </div>
                <div className="flex-1 pb-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-muted-foreground">
                      {formatDate(comment.date)}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed">{comment.text}</p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
