"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import type { Client, ClientCategory, ClientStatus, Product } from "@/lib/types"
import { cn } from "@/lib/utils"

interface AddClientModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddClient: (client: Client) => void
  availableProducts: Product[]
}

export function AddClientModal({ open, onOpenChange, onAddClient, availableProducts }: AddClientModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    category: "Media" as ClientCategory,
    status: "pending" as ClientStatus,
    website: "",
    nextAction: "",
    nextActionDate: "",
    notes: "",
    products: [] as Product[],
    contactName: "",
    contactEmail: "",
    contactRole: "",
  })

  const toggleProduct = (product: Product) => {
    setFormData((prev) => ({
      ...prev,
      products: prev.products.includes(product)
        ? prev.products.filter((p) => p !== product)
        : [...prev.products, product],
    }))
  }

  const handleSubmit = () => {
    if (!formData.name.trim()) return

    const newClient: Client = {
      id: Date.now().toString(),
      name: formData.name,
      category: formData.category,
      status: formData.status,
      products: formData.products,
      website: formData.website || undefined,
      nextAction: formData.nextAction || undefined,
      nextActionDate: formData.nextActionDate || undefined,
      notes: formData.notes || undefined,
      contacts:
        formData.contactName && formData.contactEmail
          ? [
              {
                id: "c1",
                name: formData.contactName,
                email: formData.contactEmail,
                role: formData.contactRole || undefined,
              },
            ]
          : [],
      todos: [],
      activity: [
        {
          id: "a1",
          comment: "Client created",
          date: new Date().toISOString(),
        },
      ],
    }

    onAddClient(newClient)
    setFormData({
      name: "",
      category: "Media",
      status: "pending",
      website: "",
      nextAction: "",
      nextActionDate: "",
      notes: "",
      products: [],
      contactName: "",
      contactEmail: "",
      contactRole: "",
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Client</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Client Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter client name"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Branch</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={formData.category === "Media" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFormData({ ...formData, category: "Media" })}
                  className="flex-1"
                >
                  Media
                </Button>
                <Button
                  type="button"
                  variant={formData.category === "Sport" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFormData({ ...formData, category: "Sport" })}
                  className="flex-1"
                >
                  Sport
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <div className="flex gap-2">
                {(["active", "pending", "inactive"] as ClientStatus[]).map((status) => (
                  <Button
                    key={status}
                    type="button"
                    variant={formData.status === status ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFormData({ ...formData, status })}
                    className="flex-1 capitalize"
                  >
                    {status}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              placeholder="https://example.com"
            />
          </div>

          <div className="space-y-2">
            <Label>Products</Label>
            <div className="flex flex-wrap gap-2">
              {availableProducts.map((product) => (
                <Badge
                  key={product}
                  variant={formData.products.includes(product) ? "default" : "outline"}
                  className={cn("cursor-pointer", formData.products.includes(product) && "bg-primary")}
                  onClick={() => toggleProduct(product)}
                >
                  {product}
                </Badge>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="nextAction">Next Action</Label>
            <Input
              id="nextAction"
              value={formData.nextAction}
              onChange={(e) => setFormData({ ...formData, nextAction: e.target.value })}
              placeholder="What's the next step?"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="nextActionDate">Next Action Date</Label>
            <Input
              id="nextActionDate"
              type="date"
              value={formData.nextActionDate}
              onChange={(e) => setFormData({ ...formData, nextActionDate: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Add notes about this client..."
              className="min-h-24 resize-none"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-base font-semibold">Primary Contact</Label>
            <div className="space-y-3 pl-2">
              <div className="space-y-2">
                <Label htmlFor="contactName">Contact Name</Label>
                <Input
                  id="contactName"
                  value={formData.contactName}
                  onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                  placeholder="John Doe"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactEmail">Contact Email</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                  placeholder="john@example.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactRole">Contact Role</Label>
                <Input
                  id="contactRole"
                  value={formData.contactRole}
                  onChange={(e) => setFormData({ ...formData, contactRole: e.target.value })}
                  placeholder="Product Manager"
                />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!formData.name.trim()}>
            Add Client
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
