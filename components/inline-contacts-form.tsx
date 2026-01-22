"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Trash2, Mail, Phone, Linkedin, Star, User } from "lucide-react"

export interface ContactFormData {
  id: string
  name: string
  position?: string
  email?: string
  telephone?: string
  linkedinUrl?: string
  isPrimary: boolean
}

interface InlineContactsFormProps {
  contacts: ContactFormData[]
  onChange: (contacts: ContactFormData[]) => void
}

export function InlineContactsForm({ contacts, onChange }: InlineContactsFormProps) {
  const [formData, setFormData] = useState<Omit<ContactFormData, "id">>({
    name: "",
    position: "",
    email: "",
    telephone: "",
    linkedinUrl: "",
    isPrimary: contacts.length === 0,
  })

  const handleChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleAddContact = () => {
    if (!formData.name.trim()) {
      alert("Name is required")
      return
    }

    const newContact: ContactFormData = {
      id: `temp-contact-${Date.now()}`,
      name: formData.name.trim(),
      position: formData.position?.trim() || undefined,
      email: formData.email?.trim() || undefined,
      telephone: formData.telephone?.trim() || undefined,
      linkedinUrl: formData.linkedinUrl?.trim() || undefined,
      isPrimary: formData.isPrimary,
    }

    // If this is marked as primary, unmark all others
    const updatedContacts = formData.isPrimary
      ? contacts.map(c => ({ ...c, isPrimary: false }))
      : contacts

    onChange([...updatedContacts, newContact])

    // Reset form
    setFormData({
      name: "",
      position: "",
      email: "",
      telephone: "",
      linkedinUrl: "",
      isPrimary: false,
    })
  }

  const handleRemoveContact = (id: string) => {
    onChange(contacts.filter(c => c.id !== id))
  }

  const handleSetPrimary = (id: string) => {
    onChange(contacts.map(c => ({ ...c, isPrimary: c.id === id })))
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <User className="h-5 w-5" />
          Contacts (Optional)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Existing Contacts */}
        {contacts.length > 0 && (
          <div className="space-y-2 mb-4">
            {contacts.map((contact) => (
              <div
                key={contact.id}
                className="border rounded-lg p-3 space-y-2 bg-muted/30"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-sm">{contact.name}</h4>
                      {contact.isPrimary && (
                        <Badge variant="default" className="text-xs bg-blue-600">
                          <Star className="h-3 w-3 mr-1" />
                          Primary
                        </Badge>
                      )}
                    </div>
                    {contact.position && (
                      <p className="text-xs text-muted-foreground mt-0.5">{contact.position}</p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    {!contact.isPrimary && (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => handleSetPrimary(contact.id)}
                        title="Set as primary"
                        className="h-7 w-7 p-0"
                      >
                        <Star className="h-3 w-3" />
                      </Button>
                    )}
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRemoveContact(contact.id)}
                      className="h-7 w-7 p-0 hover:bg-destructive/20"
                      title="Remove contact"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-1 text-xs">
                  {contact.email && (
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Mail className="h-3 w-3" />
                      <span className="truncate">{contact.email}</span>
                    </div>
                  )}
                  {contact.telephone && (
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Phone className="h-3 w-3" />
                      <span>{contact.telephone}</span>
                    </div>
                  )}
                  {contact.linkedinUrl && (
                    <div className="flex items-center gap-1.5 text-muted-foreground col-span-2">
                      <Linkedin className="h-3 w-3" />
                      <span className="truncate">{contact.linkedinUrl}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add Contact Form */}
        <div className="space-y-3 border-t pt-4">
          <h4 className="text-sm font-medium">Add Contact</h4>

          <div className="grid gap-3">
            <div className="grid gap-2">
              <Label htmlFor="new-contact-name" className="text-xs">Name *</Label>
              <Input
                id="new-contact-name"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="e.g., Ana Petrović"
                className="h-9"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="new-contact-position" className="text-xs">Position</Label>
              <Input
                id="new-contact-position"
                value={formData.position}
                onChange={(e) => handleChange("position", e.target.value)}
                placeholder="e.g., Marketing Director"
                className="h-9"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="new-contact-email" className="text-xs">Email</Label>
                <Input
                  id="new-contact-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  placeholder="ana@company.com"
                  className="h-9"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="new-contact-telephone" className="text-xs">Telephone</Label>
                <Input
                  id="new-contact-telephone"
                  value={formData.telephone}
                  onChange={(e) => handleChange("telephone", e.target.value)}
                  placeholder="+381 11 123 4567"
                  className="h-9"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="new-contact-linkedin" className="text-xs">LinkedIn URL</Label>
              <Input
                id="new-contact-linkedin"
                type="url"
                value={formData.linkedinUrl}
                onChange={(e) => handleChange("linkedinUrl", e.target.value)}
                placeholder="https://linkedin.com/in/..."
                className="h-9"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="new-contact-primary"
                checked={formData.isPrimary}
                onChange={(e) => handleChange("isPrimary", e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="new-contact-primary" className="cursor-pointer text-xs">
                Set as primary contact
              </Label>
            </div>

            <Button
              type="button"
              onClick={handleAddContact}
              disabled={!formData.name.trim()}
              variant="outline"
              className="w-full"
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Contact
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
