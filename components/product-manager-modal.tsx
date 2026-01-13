"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Plus, X, Palette, Pencil } from "lucide-react"
import type { Product, ProductConfig } from "@/lib/types"

interface ProductManagerModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  productConfigs: ProductConfig[]
  onAddProduct: (name: string, bgColor: string, textColor: string) => void
  onDeleteProduct: (name: string) => void
  onUpdateColors: (name: string, bgColor: string, textColor: string) => void
  onUpdateName: (oldName: string, newName: string) => void
}

export function ProductManagerModal({
  open,
  onOpenChange,
  productConfigs,
  onAddProduct,
  onDeleteProduct,
  onUpdateColors,
  onUpdateName,
}: ProductManagerModalProps) {
  const [newProduct, setNewProduct] = useState("")
  const [newBgColor, setNewBgColor] = useState("#3b82f6")
  const [newTextColor, setNewTextColor] = useState("#ffffff")
  const [editingProduct, setEditingProduct] = useState<string | null>(null)
  const [editName, setEditName] = useState("")
  const [editBgColor, setEditBgColor] = useState("")
  const [editTextColor, setEditTextColor] = useState("")

  const addProduct = () => {
    if (newProduct.trim() && !productConfigs.find((p) => p.name === newProduct.trim())) {
      onAddProduct(newProduct.trim(), newBgColor, newTextColor)
      setNewProduct("")
      setNewBgColor("#3b82f6")
      setNewTextColor("#ffffff")
    }
  }

  const startEditing = (config: ProductConfig) => {
    setEditingProduct(config.name)
    setEditName(config.name)
    setEditBgColor(config.bgColor)
    setEditTextColor(config.textColor)
  }

  const saveChanges = () => {
    if (editingProduct) {
      // Update name if changed
      if (editName.trim() && editName !== editingProduct) {
        onUpdateName(editingProduct, editName.trim())
      }
      // Update colors
      onUpdateColors(editName.trim() || editingProduct, editBgColor, editTextColor)
      setEditingProduct(null)
    }
  }

  const cancelEdit = () => {
    setEditingProduct(null)
    setEditName("")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Products</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Current Products */}
          <div className="space-y-3">
            <Label>Current Products</Label>
            <div className="space-y-2">
              {productConfigs.map((config) => (
                <div key={config.name} className="flex items-center gap-3 p-3 border rounded-lg">
                  {editingProduct === config.name ? (
                    // Edit mode
                    <div className="flex-1 space-y-3">
                      <div className="space-y-2">
                        <Label htmlFor="editName" className="text-xs">Product Name</Label>
                        <Input
                          id="editName"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="font-medium"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label htmlFor={`edit-bg-${config.name}`} className="text-xs">
                            Background Color
                          </Label>
                          <div className="flex gap-2">
                            <Input
                              id={`edit-bg-${config.name}`}
                              type="color"
                              value={editBgColor}
                              onChange={(e) => setEditBgColor(e.target.value)}
                              className="w-16 h-10 p-1 cursor-pointer"
                            />
                            <Input
                              type="text"
                              value={editBgColor}
                              onChange={(e) => setEditBgColor(e.target.value)}
                              className="flex-1 font-mono text-sm"
                              placeholder="#000000"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`edit-text-${config.name}`} className="text-xs">
                            Text Color
                          </Label>
                          <div className="flex gap-2">
                            <Input
                              id={`edit-text-${config.name}`}
                              type="color"
                              value={editTextColor}
                              onChange={(e) => setEditTextColor(e.target.value)}
                              className="w-16 h-10 p-1 cursor-pointer"
                            />
                            <Input
                              type="text"
                              value={editTextColor}
                              onChange={(e) => setEditTextColor(e.target.value)}
                              className="flex-1 font-mono text-sm"
                              placeholder="#ffffff"
                            />
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={saveChanges}>
                          Save Changes
                        </Button>
                        <Button size="sm" variant="outline" onClick={cancelEdit}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    // View mode
                    <>
                      <Badge
                        style={{
                          backgroundColor: config.bgColor,
                          color: config.textColor,
                          borderColor: config.bgColor,
                        }}
                        className="px-3 py-1"
                      >
                        {config.name}
                      </Badge>
                      <div className="flex-1 text-sm text-muted-foreground font-mono">
                        BG: {config.bgColor} | Text: {config.textColor}
                      </div>
                      <Button size="sm" variant="ghost" onClick={() => startEditing(config)}>
                        <Pencil className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onDeleteProduct(config.name)}
                        className="text-destructive hover:text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Add New Product */}
          <div className="space-y-3 p-4 border rounded-lg bg-muted/50">
            <Label className="text-base">Add New Product</Label>
            <div className="space-y-3">
              <div>
                <Label htmlFor="newProduct" className="text-xs">
                  Product Name
                </Label>
                <Input
                  id="newProduct"
                  value={newProduct}
                  onChange={(e) => setNewProduct(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addProduct()}
                  placeholder="Enter product name"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="newBgColor" className="text-xs">
                    Background Color
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="newBgColor"
                      type="color"
                      value={newBgColor}
                      onChange={(e) => setNewBgColor(e.target.value)}
                      className="w-16 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      type="text"
                      value={newBgColor}
                      onChange={(e) => setNewBgColor(e.target.value)}
                      className="flex-1 font-mono text-sm"
                      placeholder="#000000"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newTextColor" className="text-xs">
                    Text Color
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="newTextColor"
                      type="color"
                      value={newTextColor}
                      onChange={(e) => setNewTextColor(e.target.value)}
                      className="w-16 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      type="text"
                      value={newTextColor}
                      onChange={(e) => setNewTextColor(e.target.value)}
                      className="flex-1 font-mono text-sm"
                      placeholder="#ffffff"
                    />
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  style={{
                    backgroundColor: newBgColor,
                    color: newTextColor,
                  }}
                  className="px-3 py-1"
                >
                  {newProduct || "Preview"}
                </Badge>
                <span className="text-xs text-muted-foreground">Preview</span>
              </div>
              <Button onClick={addProduct} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
