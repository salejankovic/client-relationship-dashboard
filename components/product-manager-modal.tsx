"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Plus, X } from "lucide-react"
import type { Product } from "@/lib/types"

interface ProductManagerModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  products: Product[]
  onUpdateProducts: (products: Product[]) => void
}

export function ProductManagerModal({ open, onOpenChange, products, onUpdateProducts }: ProductManagerModalProps) {
  const [localProducts, setLocalProducts] = useState<Product[]>(products)
  const [newProduct, setNewProduct] = useState("")

  // Sync local state with props when modal opens
  useEffect(() => {
    if (open) {
      setLocalProducts(products)
    }
  }, [open, products])

  const addProduct = () => {
    if (newProduct.trim() && !localProducts.includes(newProduct.trim() as Product)) {
      setLocalProducts([...localProducts, newProduct.trim() as Product])
      setNewProduct("")
    }
  }

  const removeProduct = (product: Product) => {
    setLocalProducts(localProducts.filter((p) => p !== product))
  }

  const handleSave = () => {
    onUpdateProducts(localProducts)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Manage Products</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Current Products</Label>
            <div className="flex flex-wrap gap-2">
              {localProducts.map((product) => (
                <Badge key={product} variant="secondary" className="pl-3 pr-1 py-1">
                  {product}
                  <button
                    onClick={() => removeProduct(product)}
                    className="ml-2 hover:bg-muted rounded-full p-0.5 transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="newProduct">Add New Product</Label>
            <div className="flex gap-2">
              <Input
                id="newProduct"
                value={newProduct}
                onChange={(e) => setNewProduct(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addProduct()}
                placeholder="Enter product name"
              />
              <Button onClick={addProduct} size="icon">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            Note: Changes will be saved to localStorage. Removing a product won't remove it from existing clients.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
