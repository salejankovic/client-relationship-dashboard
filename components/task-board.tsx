"use client"

import { useState, useRef, useEffect } from "react"
import { CheckCircle2, Circle, Plus, ListTodo, ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { Client, TodoItem, ActivityLog } from "@/lib/types"
import { cn } from "@/lib/utils"
import { playCompletionSound, fireConfetti } from "@/lib/celebrations"

interface TaskBoardProps {
  clients: Client[]
  onUpdateClient: (client: Client) => Promise<void>
  onSelectClient?: (client: Client) => void
}

interface TaskWithClient {
  todo: TodoItem
  client: Client
}

export function TaskBoard({ clients, onUpdateClient, onSelectClient }: TaskBoardProps) {
  const [newTaskText, setNewTaskText] = useState("")
  const [selectedClientId, setSelectedClientId] = useState<string>("")
  const [showAddForm, setShowAddForm] = useState(false)
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
      playCompletionSound()
      fireConfetti()
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
                <button
                  onClick={() => onSelectClient?.(client)}
                  className="flex-1 min-w-0 text-left hover:opacity-80 transition-opacity"
                >
                  <p className="text-foreground">{todo.text}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {client.logoUrl ? (
                      <img src={client.logoUrl} alt="" className="h-6 w-6 rounded-sm object-cover" />
                    ) : (
                      <div className="h-6 w-6 rounded-sm bg-primary text-primary-foreground flex items-center justify-center text-[9px] font-bold">
                        {client.name.substring(0, 2).toUpperCase()}
                      </div>
                    )}
                    <p className="text-sm text-muted-foreground">{client.name}</p>
                  </div>
                </button>
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
                    <button
                      onClick={() => onSelectClient?.(client)}
                      className="flex-1 min-w-0 text-left hover:opacity-80 transition-opacity"
                    >
                      <p className="text-foreground line-through">{todo.text}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {client.logoUrl ? (
                          <img src={client.logoUrl} alt="" className="h-6 w-6 rounded-sm object-cover" />
                        ) : (
                          <div className="h-6 w-6 rounded-sm bg-primary text-primary-foreground flex items-center justify-center text-[9px] font-bold">
                            {client.name.substring(0, 2).toUpperCase()}
                          </div>
                        )}
                        <p className="text-sm text-muted-foreground">{client.name}</p>
                      </div>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  )
}
