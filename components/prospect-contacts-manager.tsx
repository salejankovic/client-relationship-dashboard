"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { useProspectContacts } from "@/hooks/use-prospect-contacts"
import { Plus, Trash2, Mail, Phone, Linkedin, Star, Edit, User } from "lucide-react"
import type { ProspectContact } from "@/lib/types"

interface ProspectContactsManagerProps {
  prospectId: string
}

export function ProspectContactsManager({ prospectId }: ProspectContactsManagerProps) {
  const { contacts, addContact, updateContact, deleteContact, setPrimaryContact } = useProspectContacts(prospectId)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [editingContact, setEditingContact] = useState<ProspectContact | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    position: "",
    email: "",
    telephone: "",
    linkedinUrl: "",
    isPrimary: false,
  })

  const handleChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const resetForm = () => {
    setFormData({
      name: "",
      position: "",
      email: "",
      telephone: "",
      linkedinUrl: "",
      isPrimary: false,
    })
    setEditingContact(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      alert("Name is required")
      return
    }

    try {
      if (editingContact) {
        await updateContact({
          ...editingContact,
          name: formData.name.trim(),
          position: formData.position.trim() || undefined,
          email: formData.email.trim() || undefined,
          telephone: formData.telephone.trim() || undefined,
          linkedinUrl: formData.linkedinUrl.trim() || undefined,
          isPrimary: formData.isPrimary,
        })
      } else {
        await addContact({
          prospectId,
          name: formData.name.trim(),
          position: formData.position.trim() || undefined,
          email: formData.email.trim() || undefined,
          telephone: formData.telephone.trim() || undefined,
          linkedinUrl: formData.linkedinUrl.trim() || undefined,
          isPrimary: formData.isPrimary,
        })
      }

      resetForm()
      setShowAddDialog(false)
    } catch (error) {
      console.error("Error saving contact:", error)
      alert("Failed to save contact. Please try again.")
    }
  }

  const handleEdit = (contact: ProspectContact) => {
    setEditingContact(contact)
    setFormData({
      name: contact.name,
      position: contact.position || "",
      email: contact.email || "",
      telephone: contact.telephone || "",
      linkedinUrl: contact.linkedinUrl || "",
      isPrimary: contact.isPrimary,
    })
    setShowAddDialog(true)
  }

  const handleDelete = async (contactId: string) => {
    if (confirm("Are you sure you want to delete this contact?")) {
      await deleteContact(contactId)
    }
  }

  const handleSetPrimary = async (contactId: string) => {
    await setPrimaryContact(contactId)
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Contacts
            </div>
            <Button
              size="sm"
              onClick={() => {
                resetForm()
                setShowAddDialog(true)
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Contact
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {contacts.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No contacts added yet. Click "Add Contact" to add a person.
            </p>
          ) : (
            <div className="space-y-3">
              {contacts.map((contact) => (
                <div
                  key={contact.id}
                  className="border rounded-lg p-4 space-y-3 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{contact.name}</h4>
                        {contact.isPrimary && (
                          <Badge variant="default" className="text-xs bg-blue-600">
                            <Star className="h-3 w-3 mr-1" />
                            Primary
                          </Badge>
                        )}
                      </div>
                      {contact.position && (
                        <p className="text-sm text-muted-foreground mt-1">{contact.position}</p>
                      )}
                    </div>
                    <div className="flex gap-1">
                      {!contact.isPrimary && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleSetPrimary(contact.id)}
                          title="Set as primary contact"
                        >
                          <Star className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEdit(contact)}
                        title="Edit contact"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(contact.id)}
                        className="hover:bg-destructive/20"
                        title="Delete contact"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                    {contact.email && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="h-3 w-3" />
                        <a
                          href={`mailto:${contact.email}`}
                          className="hover:text-blue-600 hover:underline"
                        >
                          {contact.email}
                        </a>
                      </div>
                    )}
                    {contact.telephone && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="h-3 w-3" />
                        <a
                          href={`tel:${contact.telephone}`}
                          className="hover:text-blue-600 hover:underline"
                        >
                          {contact.telephone}
                        </a>
                      </div>
                    )}
                    {contact.linkedinUrl && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Linkedin className="h-3 w-3" />
                        <a
                          href={contact.linkedinUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-blue-600 hover:underline truncate"
                        >
                          LinkedIn Profile
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Contact Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingContact ? "Edit Contact" : "Add New Contact"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="contact-name">Name *</Label>
              <Input
                id="contact-name"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="e.g., Ana Petrović"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact-position">Position</Label>
              <Input
                id="contact-position"
                value={formData.position}
                onChange={(e) => handleChange("position", e.target.value)}
                placeholder="e.g., Marketing Director"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact-email">Email</Label>
              <Input
                id="contact-email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                placeholder="ana@company.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact-telephone">Telephone</Label>
              <Input
                id="contact-telephone"
                value={formData.telephone}
                onChange={(e) => handleChange("telephone", e.target.value)}
                placeholder="+381 11 123 4567"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact-linkedin">LinkedIn URL</Label>
              <Input
                id="contact-linkedin"
                type="url"
                value={formData.linkedinUrl}
                onChange={(e) => handleChange("linkedinUrl", e.target.value)}
                placeholder="https://linkedin.com/in/..."
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="contact-primary"
                checked={formData.isPrimary}
                onChange={(e) => handleChange("isPrimary", e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="contact-primary" className="cursor-pointer">
                Set as primary contact
              </Label>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  resetForm()
                  setShowAddDialog(false)
                }}
              >
                Cancel
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                {editingContact ? "Update" : "Add"} Contact
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
