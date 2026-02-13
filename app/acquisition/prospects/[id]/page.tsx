"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useProspects } from "@/hooks/use-prospects"
import { useEmailDrafts } from "@/hooks/use-email-drafts"
import { useIntelligence } from "@/hooks/use-intelligence"
import { useCountries } from "@/hooks/use-countries"
import { useProspectContacts } from "@/hooks/use-prospect-contacts"
import { useProducts } from "@/hooks/use-products"
import { useProspectTypes } from "@/hooks/use-prospect-types"
import { useTeamMembers } from "@/hooks/use-team-members"
import { EmailComposerModal } from "@/components/email-composer-modal"
import { IntelligenceCard, FollowupEmailDialog } from "@/components/intelligence"
import type { IntelligenceItem } from "@/lib/types"
import { ArchiveProspectDialog } from "@/components/archive-prospect-dialog"
import { ProspectContactsManager } from "@/components/prospect-contacts-manager"
import { ActivityLog, type ActivityItem } from "@/components/activity-log"
import { NextActionField } from "@/components/next-action-field"
import { useCommunications } from "@/hooks/use-communications"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ArrowLeft, Loader2, Save, Trash2, Mail, ExternalLink, Lightbulb } from "lucide-react"
import Link from "next/link"
import { CountryFlag } from "@/components/country-flag"
import type { Prospect, ProspectStatus, ProductType, ProspectType, ActivityType, CommunicationType } from "@/lib/types"

export default function ProspectDetailPage() {
  const params = useParams()
  const router = useRouter()
  const prospectId = params?.id as string
  const { prospects, loading, updateProspect, deleteProspect, archiveProspect } = useProspects()
  const { drafts, loading: draftsLoading, addDraft, deleteDraft } = useEmailDrafts(prospectId)
  const { intelligenceItems, loading: intelligenceLoading, dismissItem, addIntelligenceItem } = useIntelligence(prospectId)
  const { countries } = useCountries()
  const { contacts } = useProspectContacts(prospectId)
  const { communications, addCommunication, deleteCommunication } = useCommunications(prospectId)
  const { products, getProductConfig } = useProducts()
  const { prospectTypes } = useProspectTypes()
  const { teamMembers } = useTeamMembers()

  const [prospect, setProspect] = useState<Prospect | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [showEmailComposer, setShowEmailComposer] = useState(false)
  const [showArchiveDialog, setShowArchiveDialog] = useState(false)
  const [isFetchingNews, setIsFetchingNews] = useState(false)
  const [isFetchingEmails, setIsFetchingEmails] = useState(false)
  const [emailsToShow, setEmailsToShow] = useState(3)
  const [intelligenceToShow, setIntelligenceToShow] = useState(3)
  const [expandedEmails, setExpandedEmails] = useState<Set<string>>(new Set())
  const [emailFilter, setEmailFilter] = useState<'all' | 'sent' | 'received'>('all')
  const [followupDialogOpen, setFollowupDialogOpen] = useState(false)
  const [selectedIntelligence, setSelectedIntelligence] = useState<IntelligenceItem | null>(null)

  useEffect(() => {
    const found = prospects.find((p) => p.id === prospectId)
    if (found) {
      setProspect(found)
    }
  }, [prospects, prospectId])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="text-muted-foreground">Loading prospect...</span>
        </div>
      </div>
    )
  }

  if (!prospect) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2">Prospect not found</h2>
          <Link href="/acquisition/prospects">
            <Button>Back to Prospects</Button>
          </Link>
        </div>
      </div>
    )
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await updateProspect(prospect)
    } catch (error) {
      console.error("Error saving prospect:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (confirm(`Are you sure you want to delete ${prospect.company}?`)) {
      await deleteProspect(prospect.id)
      router.push("/acquisition/prospects")
    }
  }

  const handleArchive = async (reason: string, notes?: string) => {
    const finalReason = notes ? `${reason}\n\nNotes: ${notes}` : reason
    await archiveProspect(prospect.id, finalReason)
    router.push("/acquisition/prospects")
  }

  const handleFetchNews = async () => {
    setIsFetchingNews(true)
    try {
      // Get primary contact name if available
      const primaryContact = contacts.find(c => c.isPrimary) || contacts[0]

      const response = await fetch("/api/fetch-intelligence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: prospect.company,
          prospectId: prospect.id,
          website: prospect.website,
          prospectType: prospect.prospectType,
          country: prospect.country,
          linkedinUrl: prospect.linkedinUrl,
          contactName: primaryContact?.name,
          saveToDB: true,
        }),
      })

      const data = await response.json()

      if (data.newItemsCount > 0) {
        alert(`Successfully saved ${data.newItemsCount} new intelligence items!`)
      } else if (data.items && data.items.length > 0) {
        alert(`Found ${data.items.length} items, but they were already in the database.`)
      } else {
        alert("No recent intelligence found for this company.")
      }
    } catch (error) {
      console.error("Error fetching intelligence:", error)
      alert("Failed to fetch intelligence. Please try again.")
    } finally {
      setIsFetchingNews(false)
    }
  }

  const handleUseInFollowUp = (item: IntelligenceItem) => {
    setSelectedIntelligence(item)
    setFollowupDialogOpen(true)
  }

  const handleFetchEmails = async () => {
    // Get primary contact email
    const primaryContact = contacts.find(c => c.isPrimary) || contacts[0]
    if (!primaryContact || !primaryContact.email) {
      alert("No contact email found. Please add a contact with an email address first.")
      return
    }

    setIsFetchingEmails(true)
    try {
      const response = await fetch("/api/imap/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prospectId: prospect.id,
          prospectEmail: primaryContact.email,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to sync emails")
      }

      if (data.imported > 0) {
        const accountsText = data.accounts > 1 ? `from ${data.accounts} accounts` : ""
        alert(`Successfully imported ${data.imported} email(s) ${accountsText}! ${data.skipped} were already imported.`)
      } else if (data.skipped > 0) {
        alert(`All ${data.skipped} emails were already imported.`)
      } else {
        alert("No emails found for this contact.")
      }

      if (data.errors && data.errors.length > 0) {
        console.error("Some accounts had errors:", data.errors)
        alert(`Note: Some email accounts had errors:\n${data.errors.join("\n")}`)
      }
    } catch (error) {
      console.error("Error fetching emails:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to fetch emails"

      if (errorMessage.includes("No email accounts configured")) {
        alert("No email accounts configured.\n\nPlease go to Settings and add an email account to enable email sync.")
      } else {
        alert(errorMessage)
      }
    } finally {
      setIsFetchingEmails(false)
    }
  }

  // Transform communications to activity items and sort by date descending
  // Include all activity types except emails (emails are shown in Previous Communication section)
  const activityTypes: CommunicationType[] = ['note', 'call', 'meeting', 'online_call', 'sms_whatsapp', 'linkedin', 'email_reply', 'followup_sent']
  const activities: ActivityItem[] = communications
    .filter((comm) => activityTypes.includes(comm.type))
    .map((comm) => ({
      id: comm.id,
      comment: comm.content,
      date: comm.createdAt.split('T')[0], // Get date part only
      createdAt: comm.createdAt,
      activityType: comm.type as ActivityType,
    }))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const handleAddActivity = async (comment: string, date: string, activityType: ActivityType) => {
    // Use the provided date instead of current timestamp
    const activityDate = new Date(date).toISOString()

    await addCommunication({
      prospectId,
      type: activityType,
      content: comment,
      direction: 'outbound',
      author: prospect.owner || 'Unknown',
      createdAt: activityDate, // Pass the custom date
    })

    // Update last contact date
    await updateProspect({
      ...prospect,
      lastContactDate: activityDate,
    })
  }

  const handleEditActivity = async (id: string, comment: string, date: string, activityType: ActivityType) => {
    // Delete and recreate with the new content and date
    const activityDate = new Date(date).toISOString()

    await deleteCommunication(id)
    await addCommunication({
      prospectId,
      type: activityType,
      content: comment,
      direction: 'outbound',
      author: prospect.owner || 'Unknown',
      createdAt: activityDate, // Pass the custom date
    })
  }

  const handleDeleteActivity = async (id: string) => {
    if (confirm("Are you sure you want to delete this activity?")) {
      await deleteCommunication(id)
    }
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link href="/acquisition/prospects">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-foreground">{prospect.company}</h1>
            <p className="text-muted-foreground">{prospect.contactPerson || "No contact person"}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowEmailComposer(true)}>
            <Mail className="h-4 w-4 mr-2" />
            Email
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Save
          </Button>
          <Button variant="outline" onClick={() => setShowArchiveDialog(true)}>
            Archive
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium block mb-2">Company Name</label>
              <Input
                value={prospect.company}
                onChange={(e) => setProspect({ ...prospect, company: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium block mb-2">Country</label>
              <Select
                value={prospect.country || ""}
                onValueChange={(value) => setProspect({ ...prospect, country: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  {countries.map((country) => (
                    <SelectItem key={country.id} value={country.name}>
                      <span className="flex items-center gap-2">
                        {country.flagEmoji && <CountryFlag code={country.flagEmoji} className="w-4 h-3" />}
                        {country.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium block mb-2">Website</label>
              <Input
                type="url"
                value={prospect.website || ""}
                onChange={(e) => setProspect({ ...prospect, website: e.target.value })}
                placeholder="https://company.com"
              />
            </div>
            <div>
              <label className="text-sm font-medium block mb-2">Company LinkedIn</label>
              <Input
                type="url"
                value={prospect.linkedinUrl || ""}
                onChange={(e) => setProspect({ ...prospect, linkedinUrl: e.target.value })}
                placeholder="https://linkedin.com/company/..."
              />
            </div>
            <div>
              <label className="text-sm font-medium block mb-2">Status</label>
              <Select
                value={prospect.status}
                onValueChange={(value: ProspectStatus) => setProspect({ ...prospect, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Not contacted yet">✉️ Not contacted yet</SelectItem>
                  <SelectItem value="Hot">🔥 Hot</SelectItem>
                  <SelectItem value="Warm">☀️ Warm</SelectItem>
                  <SelectItem value="Cold">❄️ Cold</SelectItem>
                  <SelectItem value="Lost">Lost</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium block mb-2">Product Type</label>
              <Select
                value={prospect.productType || ""}
                onValueChange={(value: ProductType) => setProspect({ ...prospect, productType: value })}
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
            <div>
              <label className="text-sm font-medium block mb-2">Deal Value</label>
              <Input
                type="text"
                value={prospect.dealValue || ""}
                onChange={(e) => setProspect({ ...prospect, dealValue: e.target.value || undefined })}
                placeholder="e.g., 385€ monthly + 1,500€ one time"
              />
            </div>
            <div>
              <label className="text-sm font-medium block mb-2">Prospect Type</label>
              <Select
                value={prospect.prospectType || ""}
                onValueChange={(value: ProspectType) => setProspect({ ...prospect, prospectType: value })}
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
          </CardContent>
        </Card>

        {/* Main Contact Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Main Contact Info</CardTitle>
          </CardHeader>
          <CardContent>
            {contacts.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No contacts added yet. Add contacts below to see main contact information here.
              </p>
            ) : (
              <div className="space-y-4">
                {(() => {
                  const primaryContact = contacts.find(c => c.isPrimary) || contacts[0]
                  return (
                    <>
                      <div>
                        <label className="text-sm font-medium block mb-2">Name</label>
                        <div className="text-base font-medium">{primaryContact.name}</div>
                      </div>
                      {primaryContact.position && (
                        <div>
                          <label className="text-sm font-medium block mb-2">Position</label>
                          <div className="text-base">{primaryContact.position}</div>
                        </div>
                      )}
                      {primaryContact.email && (
                        <div>
                          <label className="text-sm font-medium block mb-2">Email</label>
                          <a
                            href={`mailto:${primaryContact.email}`}
                            className="text-base text-blue-600 hover:underline"
                          >
                            {primaryContact.email}
                          </a>
                        </div>
                      )}
                      {primaryContact.telephone && (
                        <div>
                          <label className="text-sm font-medium block mb-2">Phone</label>
                          <a
                            href={`tel:${primaryContact.telephone}`}
                            className="text-base text-blue-600 hover:underline"
                          >
                            {primaryContact.telephone}
                          </a>
                        </div>
                      )}
                      {primaryContact.linkedinUrl && (
                        <div>
                          <label className="text-sm font-medium block mb-2">LinkedIn</label>
                          <a
                            href={primaryContact.linkedinUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-base text-blue-600 hover:underline break-all"
                          >
                            View Profile
                          </a>
                        </div>
                      )}
                      {primaryContact.isPrimary && (
                        <div className="pt-2 border-t">
                          <Badge variant="default" className="bg-blue-600">
                            Primary Contact
                          </Badge>
                        </div>
                      )}
                    </>
                  )
                })()}
              </div>
            )}
          </CardContent>
        </Card>
        {/* Owner & Label */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Owner & Label</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium block mb-2">Owner</label>
              <Select
                value={prospect.owner || ""}
                onValueChange={(value: string) => setProspect({ ...prospect, owner: value })}
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
            <div>
              <label className="text-sm font-medium block mb-2">Custom Label</label>
              <Input
                type="text"
                value={prospect.customLabel || ""}
                onChange={(e) => setProspect({ ...prospect, customLabel: e.target.value || undefined })}
                placeholder="e.g., Athens trip March 2026"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Intelligence Feed */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5" />
              Intelligence
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleFetchNews}
                disabled={isFetchingNews}
                className="bg-blue-50 hover:bg-blue-100 text-blue-600 border-blue-200"
              >
                {isFetchingNews ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Fetching...
                  </>
                ) : (
                  <>
                    <Lightbulb className="h-4 w-4 mr-2" />
                    Fetch Intelligence
                  </>
                )}
              </Button>
              <Link href="/acquisition/intelligence">
                <Button size="sm" variant="outline">
                  View All
                </Button>
              </Link>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {intelligenceLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : intelligenceItems.filter(i => !i.dismissed).length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No intelligence items for this prospect yet. Click "Fetch News" to gather intelligence.
            </p>
          ) : (
            <div className="space-y-4">
              {intelligenceItems.filter(i => !i.dismissed).slice(0, intelligenceToShow).map((item) => (
                <IntelligenceCard
                  key={item.id}
                  item={item}
                  prospect={prospect}
                  onDismiss={dismissItem}
                  onUseInFollowUp={handleUseInFollowUp}
                />
              ))}
              {intelligenceItems.filter(i => !i.dismissed).length > intelligenceToShow && (
                <div className="text-center pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIntelligenceToShow(prev => prev + 5)}
                  >
                    Show more ({intelligenceItems.filter(i => !i.dismissed).length - intelligenceToShow} remaining)
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Contacts + Next Action side by side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <ProspectContactsManager prospectId={prospectId} />
        <NextActionField
          nextAction={prospect.nextAction || ""}
          nextActionDate={prospect.nextActionDate || ""}
          onNextActionChange={(value) => setProspect(prev => prev ? { ...prev, nextAction: value || undefined } : prev)}
          onNextActionDateChange={(value) => setProspect(prev => prev ? { ...prev, nextActionDate: value || undefined } : prev)}
          onComplete={async () => {
            // Auto-save when Complete is clicked
            const clearedProspect: Prospect = {
              ...prospect,
              nextAction: undefined,
              nextActionDate: undefined,
            }
            setProspect(clearedProspect)
            await updateProspect(clearedProspect)
          }}
        />
      </div>

      {/* Activity Log */}
      <div className="mb-6">
        <ActivityLog
          activities={activities}
          onAdd={handleAddActivity}
          onEdit={handleEditActivity}
          onDelete={handleDeleteActivity}
        />
      </div>

      {/* Previous Communication (Emails) */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Previous Communication
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={handleFetchEmails}
              disabled={isFetchingEmails}
              className="bg-green-50 hover:bg-green-100 text-green-600 border-green-200"
            >
              {isFetchingEmails ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Fetching...
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4 mr-2" />
                  Fetch Emails
                </>
              )}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {(() => {
            const allEmailCommunications = communications
              .filter(c => c.type === 'email')
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

            const emailCommunications = allEmailCommunications.filter(email => {
              if (emailFilter === 'all') return true
              if (emailFilter === 'sent') return email.direction === 'outbound'
              if (emailFilter === 'received') return email.direction === 'inbound'
              return true
            })

            const sentCount = allEmailCommunications.filter(e => e.direction === 'outbound').length
            const receivedCount = allEmailCommunications.filter(e => e.direction === 'inbound').length

            if (allEmailCommunications.length === 0) {
              return (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No emails synced yet. Click "Fetch Emails" to import emails from your configured email accounts.
                </p>
              )
            }

            const visibleEmails = emailCommunications.slice(0, emailsToShow)
            const hasMore = emailCommunications.length > emailsToShow

            return (
              <div className="space-y-3">
                {/* Filter buttons */}
                <div className="flex items-center gap-2 pb-2 border-b">
                  <Button
                    size="sm"
                    variant={emailFilter === 'all' ? 'default' : 'outline'}
                    onClick={() => setEmailFilter('all')}
                    className="h-8"
                  >
                    All ({allEmailCommunications.length})
                  </Button>
                  <Button
                    size="sm"
                    variant={emailFilter === 'sent' ? 'default' : 'outline'}
                    onClick={() => setEmailFilter('sent')}
                    className="h-8"
                  >
                    Sent ({sentCount})
                  </Button>
                  <Button
                    size="sm"
                    variant={emailFilter === 'received' ? 'default' : 'outline'}
                    onClick={() => setEmailFilter('received')}
                    className="h-8"
                  >
                    Received ({receivedCount})
                  </Button>
                </div>
                {visibleEmails.map((email) => {
                  const isExpanded = expandedEmails.has(email.id)
                  return (
                    <div key={email.id} className="border rounded-lg p-4 space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant={email.direction === 'inbound' ? 'default' : 'secondary'}>
                              {email.direction === 'inbound' ? '📥 Received' : '📤 Sent'}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {new Date(email.createdAt).toLocaleDateString()} {new Date(email.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <h4 className="font-medium text-sm">{email.subject || '(No Subject)'}</h4>
                          {email.aiSummary && (
                            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mt-2">
                              <div className="flex items-start gap-2">
                                <Lightbulb className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                                <p className="text-sm text-blue-800 dark:text-blue-200">{email.aiSummary}</p>
                              </div>
                            </div>
                          )}
                          {email.content && (
                            <p className={`text-sm text-muted-foreground mt-2 whitespace-pre-wrap ${!isExpanded ? 'line-clamp-3' : ''}`}>
                              {email.content}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                        <span>From: {email.author}</span>
                        {email.content && email.content.length > 200 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setExpandedEmails(prev => {
                                const next = new Set(prev)
                                if (next.has(email.id)) {
                                  next.delete(email.id)
                                } else {
                                  next.add(email.id)
                                }
                                return next
                              })
                            }}
                            className="h-auto py-1 text-blue-600 hover:text-blue-700"
                          >
                            {isExpanded ? 'Show less' : 'View full message'}
                          </Button>
                        )}
                      </div>
                    </div>
                  )
                })}
                {hasMore && (
                  <div className="text-center pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEmailsToShow(prev => prev + 10)}
                    >
                      Load More ({emailCommunications.length - emailsToShow} remaining)
                    </Button>
                  </div>
                )}
              </div>
            )
          })()}
        </CardContent>
      </Card>

      {/* Email Drafts */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Email Drafts
            </div>
            <Button size="sm" onClick={() => setShowEmailComposer(true)}>
              <Mail className="h-4 w-4 mr-2" />
              Compose
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {draftsLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : drafts.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No email drafts yet. Click "Compose" to generate an AI email.
            </p>
          ) : (
            <div className="space-y-3">
              {drafts.map((draft) => (
                <div key={draft.id} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{draft.subject}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        {draft.tone && (
                          <span className="text-xs bg-secondary px-2 py-0.5 rounded">
                            {draft.tone}
                          </span>
                        )}
                        {draft.goal && (
                          <span className="text-xs bg-secondary px-2 py-0.5 rounded">
                            {draft.goal}
                          </span>
                        )}
                        {draft.language && (
                          <span className="text-xs bg-secondary px-2 py-0.5 rounded">
                            {draft.language}
                          </span>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteDraft(draft.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {draft.body}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>Created {new Date(draft.createdAt).toLocaleDateString()}</span>
                    {draft.sentAt && (
                      <>
                        <span>•</span>
                        <span className="text-green-600">Sent</span>
                      </>
                    )}
                    {draft.openedAt && (
                      <>
                        <span>•</span>
                        <span className="text-blue-600">Opened</span>
                      </>
                    )}
                    {draft.repliedAt && (
                      <>
                        <span>•</span>
                        <span className="text-purple-600">Replied</span>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Email Composer Modal */}
      <EmailComposerModal
        open={showEmailComposer}
        onOpenChange={setShowEmailComposer}
        prospectCompany={prospect.company}
        prospectId={prospect.id}
        onSave={addDraft}
      />

      {/* Archive Prospect Dialog */}
      <ArchiveProspectDialog
        open={showArchiveDialog}
        onOpenChange={setShowArchiveDialog}
        prospectName={prospect.company}
        onConfirm={handleArchive}
      />

      {/* Follow-up Email Dialog */}
      {selectedIntelligence && (
        <FollowupEmailDialog
          open={followupDialogOpen}
          onOpenChange={setFollowupDialogOpen}
          item={selectedIntelligence}
          prospect={prospect}
        />
      )}
    </div>
  )
}
