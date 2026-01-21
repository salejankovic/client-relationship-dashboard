"use client"

import { cn } from "@/lib/utils"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Plus, Trash2, ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"
import type { ClientCategory } from "@/lib/types"
import { useProducts } from "@/hooks/use-products"
import { useTeamMembers } from "@/hooks/use-team-members"
import { MainNav } from "@/components/main-nav"
import { AppSidebar } from "@/components/app-sidebar"
import { MobileNav } from "@/components/mobile-nav"

export default function SettingsPage() {
  const router = useRouter()
  const { products, productConfigs, loading: productsLoading, addProduct: addProductToDb, deleteProduct, updateProductColors } = useProducts()
  const { teamMembers, loading: teamMembersLoading, addTeamMember: addTeamMemberToDb, deleteTeamMember } = useTeamMembers()

  const [newProduct, setNewProduct] = useState("")
  const [newProductBgColor, setNewProductBgColor] = useState("#3b82f6")
  const [newProductTextColor, setNewProductTextColor] = useState("#ffffff")
  const [editingProduct, setEditingProduct] = useState<string | null>(null)
  const [editBgColor, setEditBgColor] = useState("")
  const [editTextColor, setEditTextColor] = useState("")
  const [branches] = useState<ClientCategory[]>(["Media", "Sport"])
  const [newTeamMember, setNewTeamMember] = useState("")

  const loading = productsLoading || teamMembersLoading

  const addProduct = async () => {
    if (newProduct.trim() && !products.includes(newProduct.trim() as any)) {
      await addProductToDb(newProduct.trim(), newProductBgColor, newProductTextColor)
      setNewProduct("")
      setNewProductBgColor("#3b82f6")
      setNewProductTextColor("#ffffff")
    }
  }

  const removeProduct = async (product: string) => {
    await deleteProduct(product)
  }

  const startEditingProduct = (productName: string) => {
    const config = productConfigs.find(c => c.name === productName)
    if (config) {
      setEditingProduct(productName)
      setEditBgColor(config.bgColor)
      setEditTextColor(config.textColor)
    }
  }

  const saveProductColors = async () => {
    if (editingProduct) {
      await updateProductColors(editingProduct, editBgColor, editTextColor)
      setEditingProduct(null)
    }
  }

  const addTeamMember = async () => {
    if (newTeamMember.trim() && !teamMembers.includes(newTeamMember.trim())) {
      await addTeamMemberToDb(newTeamMember.trim())
      setNewTeamMember("")
    }
  }

  const removeTeamMember = async (member: string) => {
    await deleteTeamMember(member)
  }

  return (
    <div className="min-h-screen bg-background">
      <MainNav />
      <AppSidebar />
      <MobileNav />
      <main className="lg:pl-64 pb-20 lg:pb-0 pt-16">
        <div className="p-8 max-w-4xl mx-auto space-y-6">
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" size="icon" onClick={() => router.push("/acquisition")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          </div>
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Products</CardTitle>
            <CardDescription>Manage the products you offer to clients with custom colors</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {productConfigs.map((config) => (
                <div key={config.name} className="flex items-center gap-3 p-3 border border-border rounded-lg">
                  {editingProduct === config.name ? (
                    <>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <Label className="w-32">Product Name:</Label>
                          <span className="font-medium">{config.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Label className="w-32" htmlFor="edit-bg-color">Background:</Label>
                          <Input
                            id="edit-bg-color"
                            type="color"
                            value={editBgColor}
                            onChange={(e) => setEditBgColor(e.target.value)}
                            className="w-20 h-10 p-1 cursor-pointer"
                          />
                          <Input
                            value={editBgColor}
                            onChange={(e) => setEditBgColor(e.target.value)}
                            className="flex-1 font-mono text-sm"
                            placeholder="#3b82f6"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <Label className="w-32" htmlFor="edit-text-color">Text Color:</Label>
                          <Input
                            id="edit-text-color"
                            type="color"
                            value={editTextColor}
                            onChange={(e) => setEditTextColor(e.target.value)}
                            className="w-20 h-10 p-1 cursor-pointer"
                          />
                          <Input
                            value={editTextColor}
                            onChange={(e) => setEditTextColor(e.target.value)}
                            className="flex-1 font-mono text-sm"
                            placeholder="#ffffff"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <Label className="w-32">Preview:</Label>
                          <Badge style={{ backgroundColor: editBgColor, color: editTextColor }}>
                            {config.name}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={saveProductColors}>Save</Button>
                        <Button size="sm" variant="outline" onClick={() => setEditingProduct(null)}>Cancel</Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <Badge
                        style={{ backgroundColor: config.bgColor, color: config.textColor }}
                        className="text-sm px-3 py-1"
                      >
                        {config.name}
                      </Badge>
                      <div className="flex-1 flex items-center gap-2 text-xs text-muted-foreground">
                        <span>BG: {config.bgColor}</span>
                        <span>•</span>
                        <span>Text: {config.textColor}</span>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => startEditingProduct(config.name)}
                        >
                          Edit Colors
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="hover:bg-destructive/20"
                          onClick={() => removeProduct(config.name)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>

            <div className="border-t border-border pt-4 mt-4">
              <h4 className="text-sm font-medium mb-3">Add New Product</h4>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    placeholder="Product name..."
                    value={newProduct}
                    onChange={(e) => setNewProduct(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addProduct()}
                    className="flex-1"
                  />
                </div>
                <div className="flex gap-3">
                  <div className="flex-1 space-y-2">
                    <Label htmlFor="new-bg-color">Background Color</Label>
                    <div className="flex gap-2">
                      <Input
                        id="new-bg-color"
                        type="color"
                        value={newProductBgColor}
                        onChange={(e) => setNewProductBgColor(e.target.value)}
                        className="w-20 h-10 p-1 cursor-pointer"
                      />
                      <Input
                        value={newProductBgColor}
                        onChange={(e) => setNewProductBgColor(e.target.value)}
                        className="flex-1 font-mono text-sm"
                        placeholder="#3b82f6"
                      />
                    </div>
                  </div>
                  <div className="flex-1 space-y-2">
                    <Label htmlFor="new-text-color">Text Color</Label>
                    <div className="flex gap-2">
                      <Input
                        id="new-text-color"
                        type="color"
                        value={newProductTextColor}
                        onChange={(e) => setNewProductTextColor(e.target.value)}
                        className="w-20 h-10 p-1 cursor-pointer"
                      />
                      <Input
                        value={newProductTextColor}
                        onChange={(e) => setNewProductTextColor(e.target.value)}
                        className="flex-1 font-mono text-sm"
                        placeholder="#ffffff"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Label>Preview:</Label>
                  <Badge style={{ backgroundColor: newProductBgColor, color: newProductTextColor }}>
                    {newProduct || "Product Name"}
                  </Badge>
                </div>
                <Button onClick={addProduct} disabled={!newProduct.trim()} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Product
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Branches</CardTitle>
            <CardDescription>Client categories for organization</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {branches.map((branch) => (
                <Badge
                  key={branch}
                  variant="outline"
                  className={cn(
                    "text-sm",
                    branch === "Media" && "border-blue-500 text-blue-500",
                    branch === "Sport" && "border-orange-500 text-orange-500",
                  )}
                >
                  {branch}
                </Badge>
              ))}
            </div>
            <p className="text-sm text-muted-foreground mt-3">
              Branch categories are pre-defined. Contact support to add custom categories.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Team Members</CardTitle>
            <CardDescription>People who can be assigned to clients</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {teamMembers.map((member) => (
                <Badge key={member} variant="secondary" className="text-sm pl-3 pr-1 py-1">
                  {member}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 ml-2 hover:bg-destructive/20"
                    onClick={() => removeTeamMember(member)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Team member name..."
                value={newTeamMember}
                onChange={(e) => setNewTeamMember(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addTeamMember()}
                className="bg-background border-border"
              />
              <Button onClick={addTeamMember}>
                <Plus className="h-4 w-4 mr-2" />
                Add
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Client Fields</CardTitle>
            <CardDescription>Configure custom fields for client profiles</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Logo</Label>
                <Badge variant="outline">Enabled</Badge>
              </div>
              <div className="flex items-center justify-between">
                <Label>Assigned To</Label>
                <Badge variant="outline">Enabled</Badge>
              </div>
              <div className="flex items-center justify-between">
                <Label>Products</Label>
                <Badge variant="outline">Enabled</Badge>
              </div>
              <div className="flex items-center justify-between">
                <Label>Contacts</Label>
                <Badge variant="outline">Enabled</Badge>
              </div>
              <div className="flex items-center justify-between">
                <Label>Action Items</Label>
                <Badge variant="outline">Enabled</Badge>
              </div>
              <div className="flex items-center justify-between">
                <Label>Notes</Label>
                <Badge variant="outline">Enabled</Badge>
              </div>
              <div className="flex items-center justify-between">
                <Label>Activity Log</Label>
                <Badge variant="outline">Enabled</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
        </div>
      </main>
    </div>
  )
}
