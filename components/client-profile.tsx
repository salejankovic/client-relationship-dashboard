"use client"

import { useState, useEffect } from "react"
import { ExternalLink, Plus, Check, User, Trash2, Pencil, X, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import type { Client, Product, ProductConfig } from "@/lib/types"

interface ClientProfileProps {
  client: Client
  onUpdate: (client: Client) => void
  onDelete: (clientId: string) => void
  teamMembers: string[]
  availableProducts: Product[]
  productConfigs: ProductConfig[]
}

export function ClientProfile({ client, onUpdate, onDelete, teamMembers, availableProducts, productConfigs }: ClientProfileProps) {
  const [nextAction, setNextAction] = useState(client.nextAction || "")
  const [nextActionDate, setNextActionDate] = useState(client.nextActionDate || "")
  const [notes, setNotes] = useState(client.notes || "")
  const [assignedTo, setAssignedTo] = useState(client.assignedTo || "")
  const [city, setCity] = useState(client.city || "")
  const [country, setCountry] = useState(client.country || "")
  const [newContact, setNewContact] = useState({ name: "", email: "", role: "" })
  const [editingContact, setEditingContact] = useState<string | null>(null)
  const [editContact, setEditContact] = useState({ name: "", email: "", role: "" })
  const [newTodo, setNewTodo] = useState("")
  const [newComment, setNewComment] = useState("")
  const [newCommentDate, setNewCommentDate] = useState(new Date().toISOString().split("T")[0])
  const [editingActivity, setEditingActivity] = useState<string | null>(null)
  const [editActivity, setEditActivity] = useState({ comment: "", date: "" })
  const [showAddContact, setShowAddContact] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showLocationDialog, setShowLocationDialog] = useState(false)
  const [logoFile, setLogoFile] = useState<File | null>(null)

  // Sync local state when client changes
  useEffect(() => {
    setNextAction(client.nextAction || "")
    setNextActionDate(client.nextActionDate || "")
    setNotes(client.notes || "")
    setAssignedTo(client.assignedTo || "")
    setCity(client.city || "")
    setCountry(client.country || "")
  }, [client.id, client.nextAction, client.nextActionDate, client.notes, client.assignedTo, client.city, client.country])

  const toggleProduct = (product: Product) => {
    const products = client.products.includes(product)
      ? client.products.filter((p) => p !== product)
      : [...client.products, product]
    onUpdate({ ...client, products })
  }

  const addContact = () => {
    if (newContact.name && newContact.email) {
      const contacts = [...client.contacts, { ...newContact, id: Date.now().toString() }]
      onUpdate({ ...client, contacts })
      setNewContact({ name: "", email: "", role: "" })
      setShowAddContact(false)
    }
  }

  const deleteContact = (contactId: string) => {
    const contacts = client.contacts.filter((c) => c.id !== contactId)
    onUpdate({ ...client, contacts })
  }

  const startEditContact = (contact: any) => {
    setEditingContact(contact.id)
    setEditContact({ name: contact.name, email: contact.email, role: contact.role || "" })
  }

  const saveEditContact = (contactId: string) => {
    const contacts = client.contacts.map((c) =>
      c.id === contactId ? { ...c, name: editContact.name, email: editContact.email, role: editContact.role } : c
    )
    onUpdate({ ...client, contacts })
    setEditingContact(null)
    setEditContact({ name: "", email: "", role: "" })
  }

  const cancelEditContact = () => {
    setEditingContact(null)
    setEditContact({ name: "", email: "", role: "" })
  }

  const addTodo = () => {
    if (newTodo.trim()) {
      const todos = [...client.todos, { id: Date.now().toString(), text: newTodo, completed: false }]
      onUpdate({ ...client, todos })
      setNewTodo("")
    }
  }

  const toggleTodo = (id: string) => {
    const todos = client.todos.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    onUpdate({ ...client, todos })
  }

  const addComment = () => {
    if (newComment.trim()) {
      const activity = [
        { id: Date.now().toString(), comment: newComment, date: new Date(newCommentDate).toISOString() },
        ...client.activity,
      ]
      onUpdate({ ...client, activity })
      setNewComment("")
      setNewCommentDate(new Date().toISOString().split("T")[0])
    }
  }

  const startEditActivity = (activity: any) => {
    setEditingActivity(activity.id)
    setEditActivity({
      comment: activity.comment,
      date: new Date(activity.date).toISOString().split("T")[0],
    })
  }

  const saveEditActivity = (activityId: string) => {
    const activity = client.activity.map((a) =>
      a.id === activityId
        ? { ...a, comment: editActivity.comment, date: new Date(editActivity.date).toISOString() }
        : a
    )
    onUpdate({ ...client, activity })
    setEditingActivity(null)
    setEditActivity({ comment: "", date: "" })
  }

  const cancelEditActivity = () => {
    setEditingActivity(null)
    setEditActivity({ comment: "", date: "" })
  }

  const deleteActivity = (activityId: string) => {
    const activity = client.activity.filter((a) => a.id !== activityId)
    onUpdate({ ...client, activity })
  }

  const saveNextAction = () => {
    onUpdate({ ...client, nextAction, nextActionDate })
  }

  const saveNotes = () => {
    onUpdate({ ...client, notes })
  }

  const saveAssignedTo = () => {
    onUpdate({ ...client, assignedTo })
  }

  const saveLocation = () => {
    onUpdate({ ...client, city, country })
  }

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      console.log('File selected:', file.name, file.type, file.size)
      // Convert to base64 for storage
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64String = reader.result as string
        console.log('Base64 string created, length:', base64String.length)
        console.log('Base64 preview:', base64String.substring(0, 100))
        onUpdate({ ...client, logoUrl: base64String })
        console.log('onUpdate called with logoUrl')
      }
      reader.onerror = (error) => {
        console.error('FileReader error:', error)
      }
      reader.readAsDataURL(file)
    }
  }

  const toggleUpsellProduct = (product: Product) => {
    const upsellStrategy = client.upsellStrategy || []
    const updated = upsellStrategy.includes(product)
      ? upsellStrategy.filter((p) => p !== product)
      : [...upsellStrategy, product]
    onUpdate({ ...client, upsellStrategy: updated })
  }

  const availableUpsellProducts = availableProducts.filter((p) => !client.products.includes(p))

  const getProductColor = (product: Product) => {
    const config = productConfigs.find((c) => c.name === product)
    if (!config) return { bgColor: "#3b82f6", textColor: "#ffffff" }
    return { bgColor: config.bgColor, textColor: config.textColor }
  }

  const handleDelete = () => {
    onDelete(client.id)
    setShowDeleteDialog(false)
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-4">
            <div className="relative group">
              {client.logoUrl ? (
                <div className="h-16 w-16 rounded-lg overflow-hidden bg-muted">
                  <img
                    src={client.logoUrl}
                    alt={client.name}
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : (
                <div className="h-16 w-16 rounded-lg bg-primary text-primary-foreground flex items-center justify-center text-lg font-bold">
                  {client.name.substring(0, 2).toUpperCase()}
                </div>
              )}
              <label
                htmlFor="logo-upload"
                className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-lg"
              >
                <span className="text-white text-xs font-medium">Change</span>
              </label>
              <input
                id="logo-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleLogoUpload}
              />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">{client.name}</h1>
              <div className="flex items-center gap-3 mb-2">
                <Badge
                  variant="outline"
                  className={cn(
                    client.category === "Media" && "border-blue-500 text-blue-500",
                    client.category === "Sport" && "border-orange-500 text-orange-500",
                  )}
                >
                  {client.category}
                </Badge>
                {client.website && (
                  <a
                    href={client.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}
              </div>
              <button
                onClick={() => setShowLocationDialog(true)}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <MapPin className="h-3.5 w-3.5" />
                <span>
                  {(city || country) ? (city && country ? `${city}, ${country}` : city || country) : "Add location"}
                </span>
              </button>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <Select value={assignedTo} onValueChange={(value) => {
                setAssignedTo(value)
                onUpdate({ ...client, assignedTo: value })
              }}>
                <SelectTrigger className="w-[180px] h-8">
                  <SelectValue placeholder="Assign to..." />
                </SelectTrigger>
                <SelectContent>
                  {teamMembers.map((member) => (
                    <SelectItem key={member} value={member}>
                      {member}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button variant="destructive" size="sm" onClick={() => setShowDeleteDialog(true)}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Client
            </Button>
          </div>
        </div>

        <Card className="bg-card border-border mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Products</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Current Products */}
                {client.products.length > 0 && (
                  <div>
                    <div className="text-xs font-semibold text-muted-foreground mb-2">CURRENT PRODUCTS</div>
                    <div className="flex flex-wrap gap-2">
                      {availableProducts
                        .filter((product) => client.products.includes(product))
                        .map((product) => {
                          const colors = getProductColor(product)
                          return (
                            <button
                              key={product}
                              onClick={() => toggleProduct(product)}
                              style={{ backgroundColor: colors.bgColor, color: colors.textColor }}
                              className="px-2.5 py-1 rounded-md text-xs font-medium transition-all"
                            >
                              {product}
                            </button>
                          )
                        })}
                    </div>
                  </div>
                )}

                {/* Available Products */}
                {availableProducts.some((p) => !client.products.includes(p)) && (
                  <div>
                    <div className="text-xs font-semibold text-muted-foreground mb-2">AVAILABLE PRODUCTS</div>
                    <div className="flex flex-wrap gap-2">
                      {availableProducts
                        .filter((product) => !client.products.includes(product))
                        .map((product) => (
                          <button
                            key={product}
                            onClick={() => toggleProduct(product)}
                            className="px-2.5 py-1 rounded-md text-xs font-medium transition-all bg-secondary text-secondary-foreground hover:bg-secondary/80"
                          >
                            {product}
                          </button>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 mb-6">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg">Action Items</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Next Action</label>
              <Input
                placeholder="What's the next step?"
                value={nextAction}
                onChange={(e) => setNextAction(e.target.value)}
                onBlur={saveNextAction}
                className="bg-background border-border mb-2"
              />
              <Input
                type="date"
                value={nextActionDate}
                onChange={(e) => setNextActionDate(e.target.value)}
                onBlur={saveNextAction}
                className="bg-background border-border"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">To-Do</label>
              <div className="space-y-2 mb-3">
                {client.todos.map((todo) => (
                  <div key={todo.id} className="flex items-center gap-2">
                    <button
                      onClick={() => toggleTodo(todo.id)}
                      className={cn(
                        "h-5 w-5 rounded border flex items-center justify-center",
                        todo.completed ? "bg-primary border-primary" : "border-border bg-background",
                      )}
                    >
                      {todo.completed && <Check className="h-3 w-3 text-primary-foreground" />}
                    </button>
                    <span
                      className={cn(
                        "text-sm flex-1",
                        todo.completed ? "line-through text-muted-foreground" : "text-foreground",
                      )}
                    >
                      {todo.text}
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Add new task..."
                  value={newTodo}
                  onChange={(e) => setNewTodo(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addTodo()}
                  className="bg-background border-border"
                />
                <Button onClick={addTodo} size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg">Contacts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {client.contacts.map((contact) => (
              <div key={contact.id} className="pb-3 border-b border-border last:border-0 last:pb-0">
                {editingContact === contact.id ? (
                  <div className="space-y-2">
                    <Input
                      placeholder="Name"
                      value={editContact.name}
                      onChange={(e) => setEditContact({ ...editContact, name: e.target.value })}
                      className="bg-background border-border"
                    />
                    <Input
                      placeholder="Email"
                      type="email"
                      value={editContact.email}
                      onChange={(e) => setEditContact({ ...editContact, email: e.target.value })}
                      className="bg-background border-border"
                    />
                    <Input
                      placeholder="Role (optional)"
                      value={editContact.role}
                      onChange={(e) => setEditContact({ ...editContact, role: e.target.value })}
                      className="bg-background border-border"
                    />
                    <div className="flex gap-2">
                      <Button onClick={() => saveEditContact(contact.id)} size="sm" className="flex-1">
                        Save
                      </Button>
                      <Button onClick={cancelEditContact} size="sm" variant="outline" className="flex-1">
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{contact.name}</p>
                      <p className="text-sm text-muted-foreground">{contact.email}</p>
                      {contact.role && <p className="text-xs text-muted-foreground mt-1">{contact.role}</p>}
                    </div>
                    <div className="flex gap-1">
                      <Button
                        onClick={() => startEditContact(contact)}
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        onClick={() => deleteContact(contact.id)}
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
            {showAddContact ? (
              <div className="space-y-2 pt-2">
                <Input
                  placeholder="Name"
                  value={newContact.name}
                  onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                  className="bg-background border-border"
                />
                <Input
                  placeholder="Email"
                  type="email"
                  value={newContact.email}
                  onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                  className="bg-background border-border"
                />
                <Input
                  placeholder="Role (optional)"
                  value={newContact.role}
                  onChange={(e) => setNewContact({ ...newContact, role: e.target.value })}
                  className="bg-background border-border"
                />
                <div className="flex gap-2">
                  <Button onClick={addContact} size="sm" className="flex-1">
                    Add Contact
                  </Button>
                  <Button onClick={() => setShowAddContact(false)} size="sm" variant="outline" className="flex-1">
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <Button onClick={() => setShowAddContact(true)} size="sm" variant="outline" className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add Contact
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card border-border mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Strategy & Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Add notes about this client..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={saveNotes}
            className="min-h-32 bg-background border-border resize-none"
          />
        </CardContent>
      </Card>

      <Card className="bg-card border-border mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Upsell Strategy</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">
            Select products you want to sell to this client (products they don't currently have):
          </p>
          {availableUpsellProducts.length > 0 ? (
            <div className="space-y-4">
              {/* Selected Products */}
              {(client.upsellStrategy || []).some((p) => availableUpsellProducts.includes(p)) && (
                <div>
                  <div className="text-xs font-semibold text-muted-foreground mb-2">SELECTED FOR UPSELL</div>
                  <div className="flex flex-wrap gap-2">
                    {availableUpsellProducts
                      .filter((product) => (client.upsellStrategy || []).includes(product))
                      .map((product) => {
                        const colors = getProductColor(product)
                        return (
                          <button
                            key={product}
                            onClick={() => toggleUpsellProduct(product)}
                            style={{ backgroundColor: colors.bgColor, color: colors.textColor }}
                            className="px-2.5 py-1 rounded-md text-xs font-medium transition-all"
                          >
                            {product}
                          </button>
                        )
                      })}
                  </div>
                </div>
              )}

              {/* Unselected Products */}
              {availableUpsellProducts.some((p) => !(client.upsellStrategy || []).includes(p)) && (
                <div>
                  <div className="text-xs font-semibold text-muted-foreground mb-2">AVAILABLE PRODUCTS</div>
                  <div className="flex flex-wrap gap-2">
                    {availableUpsellProducts
                      .filter((product) => !(client.upsellStrategy || []).includes(product))
                      .map((product) => (
                        <button
                          key={product}
                          onClick={() => toggleUpsellProduct(product)}
                          className="px-2.5 py-1 rounded-md text-xs font-medium transition-all bg-secondary text-secondary-foreground hover:bg-secondary/80"
                        >
                          {product}
                        </button>
                      ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              This client already has all available products.
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg">Activity Log</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Add a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addComment()}
              className="bg-background border-border flex-1"
            />
            <Input
              type="date"
              value={newCommentDate}
              onChange={(e) => setNewCommentDate(e.target.value)}
              className="bg-background border-border w-36"
            />
            <Button onClick={addComment} size="sm">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="space-y-3">
            {client.activity.map((log) => (
              <div key={log.id} className="pb-3 border-b border-border last:border-0">
                {editingActivity === log.id ? (
                  <div className="space-y-2">
                    <Textarea
                      placeholder="Comment"
                      value={editActivity.comment}
                      onChange={(e) => setEditActivity({ ...editActivity, comment: e.target.value })}
                      className="bg-background border-border resize-none min-h-20"
                    />
                    <Input
                      type="date"
                      value={editActivity.date}
                      onChange={(e) => setEditActivity({ ...editActivity, date: e.target.value })}
                      className="bg-background border-border"
                    />
                    <div className="flex gap-2">
                      <Button onClick={() => saveEditActivity(log.id)} size="sm" className="flex-1">
                        Save
                      </Button>
                      <Button onClick={cancelEditActivity} size="sm" variant="outline" className="flex-1">
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm text-foreground">{log.comment}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(log.date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        onClick={() => startEditActivity(log)}
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        onClick={() => deleteActivity(log.id)}
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={showLocationDialog} onOpenChange={setShowLocationDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Location</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">City</label>
              <Input
                placeholder="Enter city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="bg-background border-border"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Country</label>
              <Input
                placeholder="Enter country"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="bg-background border-border"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLocationDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => {
              saveLocation()
              setShowLocationDialog(false)
            }}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {client.name} and all associated data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
