"use client"

import { useState, useRef, useEffect } from "react"
import confetti from "canvas-confetti"
import { CheckCircle2, Circle, Plus, ListTodo, ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import type { Client, TodoItem, ActivityLog } from "@/lib/types"
import { cn } from "@/lib/utils"

interface TaskBoardProps {
  clients: Client[]
  onUpdateClient: (client: Client) => Promise<void>
}

interface TaskWithClient {
  todo: TodoItem
  client: Client
}

// Completion sound using Web Audio API
function playCompletionSound() {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()

    // Create a pleasant "ding" sound
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)

    oscillator.frequency.setValueAtTime(880, audioContext.currentTime) // A5 note
    oscillator.frequency.setValueAtTime(1108.73, audioContext.currentTime + 0.1) // C#6 note

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)

    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + 0.5)
  } catch (error) {
    console.log("Audio not supported")
  }
}

// Fire confetti animation
function fireConfetti() {
  const count = 200
  const defaults = {
    origin: { y: 0.7 },
    zIndex: 9999,
  }

  function fire(particleRatio: number, opts: confetti.Options) {
    confetti({
      ...defaults,
      ...opts,
      particleCount: Math.floor(count * particleRatio),
    })
  }

  fire(0.25, {
    spread: 26,
    startVelocity: 55,
  })
  fire(0.2, {
    spread: 60,
  })
  fire(0.35, {
    spread: 100,
    decay: 0.91,
    scalar: 0.8,
  })
  fire(0.1, {
    spread: 120,
    startVelocity: 25,
    decay: 0.92,
    scalar: 1.2,
  })
  fire(0.1, {
    spread: 120,
    startVelocity: 45,
  })
}

export function TaskBoard({ clients, onUpdateClient }: TaskBoardProps) {
  const [newTaskText, setNewTaskText] = useState("")
  const [selectedClientId, setSelectedClientId] = useState<string>("")
  const [showAddForm, setShowAddForm] = useState(false)
  const [completedTask, setCompletedTask] = useState<TaskWithClient | null>(null)
  const [showNoteDialog, setShowNoteDialog] = useState(false)
  const [noteText, setNoteText] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showCompleted, setShowCompleted] = useState(false)

  // Get all tasks with their client info
  const allTasks: TaskWithClient[] = clients.flatMap((client) =>
    client.todos.map((todo) => ({ todo, client }))
  )

  const activeTasks = allTasks.filter((t) => !t.todo.completed)
  const completedTasks = allTasks.filter((t) => t.todo.completed)

  // Sort by client name
  activeTasks.sort((a, b) => a.client.name.localeCompare(b.client.name))
  completedTasks.sort((a, b) => a.client.name.localeCompare(b.client.name))

  const handleToggleTask = async (taskWithClient: TaskWithClient) => {
    const { todo, client } = taskWithClient
    const wasCompleted = todo.completed

    // Update the todo
    const updatedTodos = client.todos.map((t) =>
      t.id === todo.id ? { ...t, completed: !t.completed } : t
    )
    const updatedClient = { ...client, todos: updatedTodos }

    await onUpdateClient(updatedClient)

    // If task was just completed (not uncompleted)
    if (!wasCompleted) {
      // Play sound and show confetti
      playCompletionSound()
      fireConfetti()

      // Set the completed task and show note dialog
      setCompletedTask({ todo: { ...todo, completed: true }, client: updatedClient })
      setShowNoteDialog(true)
    }
  }

  const handleAddTask = async () => {
    if (!newTaskText.trim() || !selectedClientId) return

    const client = clients.find((c) => c.id === selectedClientId)
    if (!client) return

    const newTodo: TodoItem = {
      id: Date.now().toString(),
      text: newTaskText.trim(),
      completed: false,
    }

    const updatedClient = {
      ...client,
      todos: [...client.todos, newTodo],
    }

    await onUpdateClient(updatedClient)
    setNewTaskText("")
    setSelectedClientId("")
    setShowAddForm(false)
  }

  const handleAddNote = async () => {
    if (!completedTask || !noteText.trim()) {
      setShowNoteDialog(false)
      setCompletedTask(null)
      setNoteText("")
      return
    }

    setIsSubmitting(true)

    const client = clients.find((c) => c.id === completedTask.client.id)
    if (!client) {
      setIsSubmitting(false)
      return
    }

    const newActivity: ActivityLog = {
      id: Date.now().toString(),
      comment: noteText.trim(),
      date: new Date().toISOString().split("T")[0],
    }

    const updatedClient = {
      ...client,
      activity: [...(client.activity || []), newActivity],
    }

    await onUpdateClient(updatedClient)

    setIsSubmitting(false)
    setShowNoteDialog(false)
    setCompletedTask(null)
    setNoteText("")
  }

  const handleSkipNote = () => {
    setShowNoteDialog(false)
    setCompletedTask(null)
    setNoteText("")
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <ListTodo className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-foreground">Task Board</h3>
          <span className="text-sm text-muted-foreground">
            ({activeTasks.length} active)
          </span>
        </div>
        <Button
          size="sm"
          variant={showAddForm ? "secondary" : "default"}
          onClick={() => setShowAddForm(!showAddForm)}
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Task
        </Button>
      </div>

      {/* Add Task Form */}
      {showAddForm && (
        <div className="p-4 border-b border-border bg-muted/30 space-y-3">
          <div className="flex gap-2">
            <Input
              placeholder="What needs to be done?"
              value={newTaskText}
              onChange={(e) => setNewTaskText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddTask()}
              className="flex-1"
            />
          </div>
          <div className="flex gap-2">
            <Select value={selectedClientId} onValueChange={setSelectedClientId}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Select a client..." />
              </SelectTrigger>
              <SelectContent>
                {clients
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <Button onClick={handleAddTask} disabled={!newTaskText.trim() || !selectedClientId}>
              Add
            </Button>
            <Button variant="ghost" onClick={() => setShowAddForm(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Task List */}
      <div className="flex-1 overflow-auto">
        {activeTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <CheckCircle2 className="h-12 w-12 text-green-500 mb-4" />
            <h3 className="text-lg font-semibold text-foreground">All done!</h3>
            <p className="text-muted-foreground mt-1">No active tasks. Great job!</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {activeTasks.map(({ todo, client }) => (
              <div
                key={`${client.id}-${todo.id}`}
                className="flex items-start gap-3 p-4 hover:bg-muted/50 transition-colors group"
              >
                <button
                  onClick={() => handleToggleTask({ todo, client })}
                  className="mt-0.5 flex-shrink-0 text-muted-foreground hover:text-primary transition-colors"
                >
                  <Circle className="h-5 w-5" />
                </button>
                <div className="flex-1 min-w-0">
                  <p className="text-foreground">{todo.text}</p>
                  <p className="text-sm text-muted-foreground mt-0.5">{client.name}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Completed Tasks Section */}
        {completedTasks.length > 0 && (
          <div className="border-t border-border">
            <button
              onClick={() => setShowCompleted(!showCompleted)}
              className="flex items-center justify-between w-full p-4 text-muted-foreground hover:bg-muted/50 transition-colors"
            >
              <span className="text-sm font-medium">
                Completed ({completedTasks.length})
              </span>
              {showCompleted ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>
            {showCompleted && (
              <div className="divide-y divide-border">
                {completedTasks.map(({ todo, client }) => (
                  <div
                    key={`${client.id}-${todo.id}`}
                    className="flex items-start gap-3 p-4 hover:bg-muted/50 transition-colors opacity-60"
                  >
                    <button
                      onClick={() => handleToggleTask({ todo, client })}
                      className="mt-0.5 flex-shrink-0 text-green-500 hover:text-muted-foreground transition-colors"
                    >
                      <CheckCircle2 className="h-5 w-5" />
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="text-foreground line-through">{todo.text}</p>
                      <p className="text-sm text-muted-foreground mt-0.5">{client.name}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Note Dialog */}
      <Dialog open={showNoteDialog} onOpenChange={setShowNoteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Task Completed!</DialogTitle>
            <DialogDescription>
              Would you like to add a note to {completedTask?.client.name}'s activity log?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground mb-2">
              Completed: <span className="text-foreground">{completedTask?.todo.text}</span>
            </p>
            <Textarea
              placeholder="Add a note about what was done... (optional)"
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={handleSkipNote}>
              Skip
            </Button>
            <Button onClick={handleAddNote} disabled={isSubmitting}>
              {noteText.trim() ? "Add Note" : "Skip"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
