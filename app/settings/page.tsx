"use client"

import { cn } from "@/lib/utils"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Plus, Trash2, ArrowLeft, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import type { ClientCategory } from "@/lib/types"
import { useProducts } from "@/hooks/use-products"
import { useTeamMembers } from "@/hooks/use-team-members"

export default function SettingsPage() {
  const router = useRouter()
  const { products, loading: productsLoading, addProduct: addProductToDb, deleteProduct } = useProducts()
  const { teamMembers, loading: teamMembersLoading, addTeamMember: addTeamMemberToDb, deleteTeamMember } = useTeamMembers()

  const [newProduct, setNewProduct] = useState("")
  const [branches] = useState<ClientCategory[]>(["Media", "Sport"])
  const [newTeamMember, setNewTeamMember] = useState("")

  const loading = productsLoading || teamMembersLoading

  const addProduct = async () => {
    if (newProduct.trim() && !products.includes(newProduct.trim() as any)) {
      await addProductToDb(newProduct.trim())
      setNewProduct("")
    }
  }

  const removeProduct = async (product: string) => {
    await deleteProduct(product)
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
      <header className="border-b border-border bg-card px-6 py-3">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold text-foreground">Settings</h1>
        </div>
      </header>

      <div className="p-8 max-w-4xl mx-auto space-y-6">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Products</CardTitle>
            <CardDescription>Manage the products you offer to clients</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {products.map((product) => (
                <Badge key={product} variant="secondary" className="text-sm pl-3 pr-1 py-1">
                  {product}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 ml-2 hover:bg-destructive/20"
                    onClick={() => removeProduct(product)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="New product name..."
                value={newProduct}
                onChange={(e) => setNewProduct(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addProduct()}
                className="bg-background border-border"
              />
              <Button onClick={addProduct}>
                <Plus className="h-4 w-4 mr-2" />
                Add
              </Button>
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
    </div>
  )
}
