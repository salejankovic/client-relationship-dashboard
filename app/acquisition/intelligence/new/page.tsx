"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useIntelligence } from "@/hooks/use-intelligence"
import { useProspects } from "@/hooks/use-prospects"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Loader2, Save } from "lucide-react"
import Link from "next/link"
import type { IntelligenceSourceType } from "@/lib/types"

export default function NewIntelligencePage() {
  const router = useRouter()
  const { addIntelligenceItem } = useIntelligence()
  const { prospects } = useProspects()
  const [isSaving, setIsSaving] = useState(false)

  const [formData, setFormData] = useState({
    prospectId: "",
    title: "",
    description: "",
    sourceType: "news" as IntelligenceSourceType,
    url: "",
    imageUrl: "",
    publishedAt: "",
    aiTip: "",
    relevanceScore: 50,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      await addIntelligenceItem({
        prospectId: formData.prospectId || undefined,
        title: formData.title,
        description: formData.description || undefined,
        sourceType: formData.sourceType,
        url: formData.url || undefined,
        imageUrl: formData.imageUrl || undefined,
        publishedAt: formData.publishedAt || undefined,
        aiTip: formData.aiTip || undefined,
        relevanceScore: formData.relevanceScore || undefined,
      })

      router.push("/acquisition/intelligence")
    } catch (error) {
      console.error("Error adding intelligence item:", error)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="p-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/acquisition/intelligence">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Add Intelligence Item</h1>
          <p className="text-muted-foreground mt-1">Add news, updates, or insights about prospects</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Intelligence Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Prospect */}
            <div className="space-y-2">
              <Label htmlFor="prospect">Related Prospect (Optional)</Label>
              <Select
                value={formData.prospectId}
                onValueChange={(value) => setFormData({ ...formData, prospectId: value })}
              >
                <SelectTrigger id="prospect">
                  <SelectValue placeholder="Select a prospect..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No prospect (General intelligence)</SelectItem>
                  {prospects.filter(p => !p.archived).map((prospect) => (
                    <SelectItem key={prospect.id} value={prospect.id}>
                      {prospect.company}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Source Type */}
            <div className="space-y-2">
              <Label htmlFor="sourceType">Source Type *</Label>
              <Select
                value={formData.sourceType}
                onValueChange={(value) => setFormData({ ...formData, sourceType: value as IntelligenceSourceType })}
              >
                <SelectTrigger id="sourceType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="linkedin">💼 LinkedIn</SelectItem>
                  <SelectItem value="news">📰 News</SelectItem>
                  <SelectItem value="sports">⚽ Sports</SelectItem>
                  <SelectItem value="job-change">👔 Job Change</SelectItem>
                  <SelectItem value="funding">💰 Funding</SelectItem>
                  <SelectItem value="other">📌 Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Company announces major digital transformation"
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Add details about this intelligence item..."
                rows={4}
              />
            </div>

            {/* URL */}
            <div className="space-y-2">
              <Label htmlFor="url">Source URL</Label>
              <Input
                id="url"
                type="url"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                placeholder="https://example.com/article"
              />
            </div>

            {/* Image URL */}
            <div className="space-y-2">
              <Label htmlFor="imageUrl">Image URL (Optional)</Label>
              <Input
                id="imageUrl"
                type="url"
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                placeholder="https://example.com/image.jpg"
              />
            </div>

            {/* Published Date */}
            <div className="space-y-2">
              <Label htmlFor="publishedAt">Published Date</Label>
              <Input
                id="publishedAt"
                type="date"
                value={formData.publishedAt}
                onChange={(e) => setFormData({ ...formData, publishedAt: e.target.value })}
              />
            </div>

            {/* Relevance Score */}
            <div className="space-y-2">
              <Label htmlFor="relevanceScore">Relevance Score (0-100)</Label>
              <div className="flex items-center gap-4">
                <Input
                  id="relevanceScore"
                  type="range"
                  min="0"
                  max="100"
                  value={formData.relevanceScore}
                  onChange={(e) => setFormData({ ...formData, relevanceScore: parseInt(e.target.value) })}
                  className="flex-1"
                />
                <span className="text-sm font-medium w-12 text-right">{formData.relevanceScore}%</span>
              </div>
            </div>

            {/* AI Tip */}
            <div className="space-y-2">
              <Label htmlFor="aiTip">AI Engagement Tip (Optional)</Label>
              <Textarea
                id="aiTip"
                value={formData.aiTip}
                onChange={(e) => setFormData({ ...formData, aiTip: e.target.value })}
                placeholder="Suggest how to use this intelligence in sales conversations..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-2 mt-6">
          <Link href="/acquisition/intelligence">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={isSaving || !formData.title}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Intelligence
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
