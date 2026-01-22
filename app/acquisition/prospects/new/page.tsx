"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useProspects } from "@/hooks/use-prospects"
import { useProducts } from "@/hooks/use-products"
import { useTeamMembers } from "@/hooks/use-team-members"
import { useProspectTypes } from "@/hooks/use-prospect-types"
import { useCountries } from "@/hooks/use-countries"
import type { ProductType, ProspectType, ProspectStatus } from "@/lib/types"
import { ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"
import { MainNav } from "@/components/main-nav"
import { AppSidebar } from "@/components/app-sidebar"
import { MobileNav } from "@/components/mobile-nav"
import { supabase } from "@/lib/supabase"

const STATUSES: ProspectStatus[] = ["Hot", "Warm", "Cold", "Lost"]

export default function NewProspectPage() {
  const router = useRouter()
  const { addProspect } = useProspects()
  const { products, getProductConfig } = useProducts()
  const { teamMembers } = useTeamMembers()
  const { prospectTypes } = useProspectTypes()
  const { countries } = useCountries()

  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState({
    company: "",
    productType: "" as ProductType | "",
    owner: teamMembers[0] || "Aleksandar",
    prospectType: "" as ProspectType | "",
    country: "",
    status: "Warm" as ProspectStatus,
    contactPerson: "",
    email: "",
    telephone: "",
    website: "",
    linkedinUrl: "",
    dealValue: "",
    nextAction: "",
    comment: "",
  })

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate required fields
    if (!formData.company.trim()) {
      alert('Company name is required')
      return
    }

    setIsSaving(true)

    try {
      const now = new Date().toISOString()
      const prospectId = `prospect-${Date.now()}`

      await addProspect({
        id: prospectId,
        company: formData.company.trim(),
        productType: formData.productType || undefined,
        owner: formData.owner || undefined,
        prospectType: formData.prospectType || undefined,
        country: formData.country || undefined,
        status: formData.status,
        contactPerson: formData.contactPerson || undefined,
        email: formData.email || undefined,
        telephone: formData.telephone || undefined,
        website: formData.website || undefined,
        linkedinUrl: formData.linkedinUrl || undefined,
        dealValue: formData.dealValue ? parseFloat(formData.dealValue) : undefined,
        nextAction: formData.nextAction || undefined,
        lastContactDate: new Date().toISOString().split('T')[0],
        daysSinceContact: 0,
        archived: false,
        createdAt: now,
        updatedAt: now,
      })

      // Add initial communication if comment is provided
      if (formData.comment.trim()) {
        await supabase.from("communications").insert({
          id: `comm-${Date.now()}`,
          prospect_id: prospectId,
          type: 'note',
          content: formData.comment.trim(),
          direction: 'outbound',
          author: formData.owner || 'Unknown',
          created_at: now,
        })
      }

      // Show success message before redirecting
      alert('Prospect saved successfully!')
      router.push("/acquisition/prospects")
    } catch (error) {
      console.error("Error adding prospect:", error)
      alert(`Failed to save prospect: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <MainNav />
      <AppSidebar />
      <MobileNav />
      <main className="lg:pl-64 pb-20 lg:pb-0 pt-16">
        <div className="p-8 max-w-3xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Link href="/acquisition/prospects">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Prospects
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Add New Prospect</h1>
              <p className="text-muted-foreground mt-1">Create a new potential client</p>
            </div>
          </div>

          {/* Form Card */}
          <Card>
            <CardHeader>
              <CardTitle>Prospect Information</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Info */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-muted-foreground">Basic Info</h3>
                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="company">Company *</Label>
                      <Input
                        id="company"
                        value={formData.company}
                        onChange={(e) => handleChange("company", e.target.value)}
                        required
                        placeholder="Company name"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="productType">Product</Label>
                        <Select
                          value={formData.productType}
                          onValueChange={(v) => handleChange("productType", v)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select product" />
                          </SelectTrigger>
                          <SelectContent>
                            {products.map((p) => {
                              const config = getProductConfig(p as any)
                              return (
                                <SelectItem key={p} value={p}>
                                  <div className="flex items-center gap-2">
                                    <Badge
                                      style={{ backgroundColor: config.bgColor, color: config.textColor }}
                                      className="text-xs px-2 py-0.5"
                                    >
                                      {p}
                                    </Badge>
                                  </div>
                                </SelectItem>
                              )
                            })}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="status">Status</Label>
                        <Select
                          value={formData.status}
                          onValueChange={(v) => handleChange("status", v)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {STATUSES.map((s) => (
                              <SelectItem key={s} value={s}>
                                {s}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="prospectType">Type</Label>
                        <Select
                          value={formData.prospectType}
                          onValueChange={(v) => handleChange("prospectType", v)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            {prospectTypes.map((t) => (
                              <SelectItem key={t} value={t}>
                                {t}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="country">Country</Label>
                        <Select
                          value={formData.country}
                          onValueChange={(v) => handleChange("country", v)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select country" />
                          </SelectTrigger>
                          <SelectContent>
                            {countries.map((country) => (
                              <SelectItem key={country.id} value={country.name}>
                                {country.flagEmoji && <span className="mr-2">{country.flagEmoji}</span>}
                                {country.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="dealValue">Deal Value (€)</Label>
                        <Input
                          id="dealValue"
                          type="number"
                          value={formData.dealValue}
                          onChange={(e) => handleChange("dealValue", e.target.value)}
                          placeholder="e.g., 45000"
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="owner">Owner</Label>
                        <Select
                          value={formData.owner}
                          onValueChange={(v) => handleChange("owner", v)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select owner" />
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
                    </div>
                  </div>
                </div>

                {/* Contact Info */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-muted-foreground">Contact Info</h3>
                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="contactPerson">Contact Person</Label>
                      <Input
                        id="contactPerson"
                        value={formData.contactPerson}
                        onChange={(e) => handleChange("contactPerson", e.target.value)}
                        placeholder="e.g., Ana Petrović"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => handleChange("email", e.target.value)}
                          placeholder="contact@company.com"
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="telephone">Telephone</Label>
                        <Input
                          id="telephone"
                          value={formData.telephone}
                          onChange={(e) => handleChange("telephone", e.target.value)}
                          placeholder="+381 11 123 4567"
                        />
                      </div>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="website">Website</Label>
                      <Input
                        id="website"
                        type="url"
                        value={formData.website}
                        onChange={(e) => handleChange("website", e.target.value)}
                        placeholder="https://company.com"
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="linkedinUrl">Company LinkedIn URL</Label>
                      <Input
                        id="linkedinUrl"
                        type="url"
                        value={formData.linkedinUrl}
                        onChange={(e) => handleChange("linkedinUrl", e.target.value)}
                        placeholder="https://linkedin.com/company/..."
                      />
                    </div>
                  </div>
                </div>

                {/* Next Steps */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-muted-foreground">Next Steps</h3>
                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="nextAction">Next Action</Label>
                      <Input
                        id="nextAction"
                        value={formData.nextAction}
                        onChange={(e) => handleChange("nextAction", e.target.value)}
                        placeholder="e.g., Schedule demo call, Send proposal"
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="comment">Initial Note</Label>
                      <Textarea
                        id="comment"
                        value={formData.comment}
                        onChange={(e) => handleChange("comment", e.target.value)}
                        placeholder="Add initial comment or note..."
                        rows={3}
                      />
                    </div>
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push("/acquisition/prospects")}
                    disabled={isSaving}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Prospect"
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
