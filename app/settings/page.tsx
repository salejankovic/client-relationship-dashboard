"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Plus, Trash2, ArrowLeft, Check } from "lucide-react"
import { useRouter } from "next/navigation"
import { useProducts } from "@/hooks/use-products"
import { useTeamMembers } from "@/hooks/use-team-members"
import { useProspectTypes } from "@/hooks/use-prospect-types"
import { useEmailAccounts } from "@/hooks/use-email-accounts"
import { useCountries } from "@/hooks/use-countries"
import { MainNav } from "@/components/main-nav"
import { AppSidebar } from "@/components/app-sidebar"
import { MobileNav } from "@/components/mobile-nav"

export default function SettingsPage() {
  const router = useRouter()
  const { products, productConfigs, loading: productsLoading, addProduct: addProductToDb, deleteProduct, updateProductColors } = useProducts()
  const { teamMembers, loading: teamMembersLoading, addTeamMember: addTeamMemberToDb, deleteTeamMember } = useTeamMembers()
  const { prospectTypes, addProspectType, deleteProspectType } = useProspectTypes()
  const { accounts: emailAccounts, addAccount, deleteAccount, testConnection } = useEmailAccounts()
  const { countries, addCountry, deleteCountry } = useCountries()

  const [newProduct, setNewProduct] = useState("")
  const [newProductBgColor, setNewProductBgColor] = useState("#3b82f6")
  const [newProductTextColor, setNewProductTextColor] = useState("#ffffff")
  const [editingProduct, setEditingProduct] = useState<string | null>(null)
  const [editBgColor, setEditBgColor] = useState("")
  const [editTextColor, setEditTextColor] = useState("")
  const [newTeamMember, setNewTeamMember] = useState("")
  const [newProspectType, setNewProspectType] = useState("")
  const [newCountryName, setNewCountryName] = useState("")
  const [newCountryFlag, setNewCountryFlag] = useState("")
  const [showAddEmailAccount, setShowAddEmailAccount] = useState(false)
  const [newEmailAccount, setNewEmailAccount] = useState({
    accountName: "",
    emailAddress: "",
    imapHost: "",
    imapPort: 993,
    imapUsername: "",
    imapPassword: "",
    useSsl: true,
  })
  const [isTestingConnection, setIsTestingConnection] = useState(false)
  const [isSavingAccount, setIsSavingAccount] = useState(false)

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

  const addBranch = async () => {
    if (newProspectType.trim() && !prospectTypes.includes(newProspectType.trim() as any)) {
      await addProspectType(newProspectType.trim())
      setNewProspectType("")
    }
  }

  const removeBranch = async (type: string) => {
    await deleteProspectType(type)
  }

  const addCountryHandler = async () => {
    if (newCountryName.trim()) {
      await addCountry(newCountryName.trim(), newCountryFlag.trim() || undefined)
      setNewCountryName("")
      setNewCountryFlag("")
    }
  }

  const removeCountry = async (countryId: string) => {
    await deleteCountry(countryId)
  }

  const handleTestConnection = async () => {
    setIsTestingConnection(true)
    try {
      await testConnection({ ...newEmailAccount, isActive: true })
      alert("Connection successful! Your IMAP settings are correct.")
    } catch (error) {
      alert(error instanceof Error ? error.message : "Connection test failed")
    } finally {
      setIsTestingConnection(false)
    }
  }

  const handleSaveEmailAccount = async () => {
    if (!newEmailAccount.accountName || !newEmailAccount.emailAddress || !newEmailAccount.imapHost || !newEmailAccount.imapUsername || !newEmailAccount.imapPassword) {
      alert("Please fill in all required fields")
      return
    }

    setIsSavingAccount(true)
    try {
      await addAccount({
        ...newEmailAccount,
        isActive: true,
      })

      // Reset form
      setNewEmailAccount({
        accountName: "",
        emailAddress: "",
        imapHost: "",
        imapPort: 993,
        imapUsername: "",
        imapPassword: "",
        useSsl: true,
      })
      setShowAddEmailAccount(false)
      alert("Email account added successfully!")
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to add email account")
    } finally {
      setIsSavingAccount(false)
    }
  }

  const handleDeleteEmailAccount = async (accountId: string) => {
    if (confirm("Are you sure you want to delete this email account?")) {
      await deleteAccount(accountId)
    }
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
            <CardTitle>Prospect Types (Branches)</CardTitle>
            <CardDescription>Categories for organizing potential clients</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {prospectTypes.map((type) => (
                <Badge key={type} variant="secondary" className="text-sm pl-3 pr-1 py-1">
                  {type}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 ml-2 hover:bg-destructive/20"
                    onClick={() => removeBranch(type)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="New prospect type..."
                value={newProspectType}
                onChange={(e) => setNewProspectType(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addBranch()}
                className="bg-background border-border"
              />
              <Button onClick={addBranch}>
                <Plus className="h-4 w-4 mr-2" />
                Add
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Countries</CardTitle>
            <CardDescription>Manage countries for prospects with flag emojis</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {countries.map((country) => (
                <Badge key={country.id} variant="secondary" className="text-sm pl-3 pr-1 py-1">
                  {country.flagEmoji && <span className="mr-1">{country.flagEmoji}</span>}
                  {country.name}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 ml-2 hover:bg-destructive/20"
                    onClick={() => removeCountry(country.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  placeholder="Country name..."
                  value={newCountryName}
                  onChange={(e) => setNewCountryName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addCountryHandler()}
                  className="flex-1 bg-background border-border"
                />
                <Input
                  placeholder="Flag emoji (e.g. 🇺🇸)"
                  value={newCountryFlag}
                  onChange={(e) => setNewCountryFlag(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addCountryHandler()}
                  className="w-32 bg-background border-border"
                />
                <Button onClick={addCountryHandler} disabled={!newCountryName.trim()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Tip: Copy flag emojis from{" "}
                <a
                  href="https://emojipedia.org/flags"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Emojipedia
                </a>
              </p>
            </div>
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
            <CardTitle>Email Accounts (IMAP)</CardTitle>
            <CardDescription>Connect multiple email accounts for automatic email sync</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Existing Accounts */}
            {emailAccounts.length > 0 && (
              <div className="space-y-3">
                {emailAccounts.map((account) => (
                  <div key={account.id} className="border border-border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium">{account.accountName}</p>
                          <Badge variant={account.isActive ? "default" : "secondary"}>
                            {account.isActive ? "Active" : "Inactive"}
                          </Badge>
                          {account.lastSyncStatus === "success" && (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              <Check className="h-3 w-3 mr-1" />
                              Synced
                            </Badge>
                          )}
                          {account.lastSyncStatus === "error" && (
                            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                              Error
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{account.emailAddress}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {account.imapHost}:{account.imapPort} {account.useSsl ? "(SSL)" : "(TLS)"}
                        </p>
                        {account.lastSyncAt && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Last synced: {new Date(account.lastSyncAt).toLocaleString()}
                          </p>
                        )}
                        {account.lastSyncError && (
                          <p className="text-xs text-red-600 mt-1">Error: {account.lastSyncError}</p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="hover:bg-destructive/20"
                        onClick={() => handleDeleteEmailAccount(account.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add New Account Form */}
            {showAddEmailAccount ? (
              <div className="border border-border rounded-lg p-4 space-y-4">
                <h4 className="font-medium">Add Email Account</h4>

                {/* Gmail Warning */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 space-y-2">
                  <p className="text-sm font-medium text-yellow-900">⚠️ Important for Gmail Users</p>
                  <p className="text-xs text-yellow-800">
                    Gmail requires special setup:
                  </p>
                  <ol className="text-xs text-yellow-800 space-y-1 ml-4 list-decimal">
                    <li>Enable 2-Step Verification on your Google account</li>
                    <li>Generate an App Password at: <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer" className="underline">myaccount.google.com/apppasswords</a></li>
                    <li>Use the 16-character App Password (not your Gmail password)</li>
                    <li>Enable IMAP in Gmail settings if not already enabled</li>
                  </ol>
                  <p className="text-xs text-yellow-800 font-medium mt-2">
                    Without these steps, connection will fail or timeout.
                  </p>
                </div>

                <div>
                  <Label htmlFor="accountName">Account Name *</Label>
                  <Input
                    id="accountName"
                    placeholder="e.g., Work Gmail, Sales Email"
                    value={newEmailAccount.accountName}
                    onChange={(e) => setNewEmailAccount({ ...newEmailAccount, accountName: e.target.value })}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="emailAddress">Email Address *</Label>
                  <Input
                    id="emailAddress"
                    type="email"
                    placeholder="your@email.com"
                    value={newEmailAccount.emailAddress}
                    onChange={(e) => setNewEmailAccount({ ...newEmailAccount, emailAddress: e.target.value })}
                    className="mt-1"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="imapHost">IMAP Host *</Label>
                    <Input
                      id="imapHost"
                      placeholder="imap.gmail.com"
                      value={newEmailAccount.imapHost}
                      onChange={(e) => setNewEmailAccount({ ...newEmailAccount, imapHost: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="imapPort">IMAP Port *</Label>
                    <Input
                      id="imapPort"
                      type="number"
                      value={newEmailAccount.imapPort}
                      onChange={(e) => setNewEmailAccount({ ...newEmailAccount, imapPort: parseInt(e.target.value) })}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="imapUsername">Username *</Label>
                  <Input
                    id="imapUsername"
                    placeholder="Usually same as email address"
                    value={newEmailAccount.imapUsername}
                    onChange={(e) => setNewEmailAccount({ ...newEmailAccount, imapUsername: e.target.value })}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="imapPassword">Password *</Label>
                  <Input
                    id="imapPassword"
                    type="password"
                    placeholder="For Gmail, use App Password"
                    value={newEmailAccount.imapPassword}
                    onChange={(e) => setNewEmailAccount({ ...newEmailAccount, imapPassword: e.target.value })}
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Gmail users: Create an App Password at{" "}
                    <a
                      href="https://myaccount.google.com/apppasswords"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      myaccount.google.com/apppasswords
                    </a>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="useSsl"
                    checked={newEmailAccount.useSsl}
                    onChange={(e) => setNewEmailAccount({ ...newEmailAccount, useSsl: e.target.checked })}
                    className="rounded"
                  />
                  <Label htmlFor="useSsl">Use SSL (recommended)</Label>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={handleTestConnection}
                    disabled={isTestingConnection}
                  >
                    {isTestingConnection ? "Testing..." : "Test Connection"}
                  </Button>
                  <Button
                    onClick={handleSaveEmailAccount}
                    disabled={isSavingAccount}
                    className="flex-1"
                  >
                    {isSavingAccount ? "Saving..." : "Save Account"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowAddEmailAccount(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <Button onClick={() => setShowAddEmailAccount(true)} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add Email Account
              </Button>
            )}

            <div className="text-xs text-muted-foreground space-y-1 pt-4 border-t">
              <p>• Works with Gmail, Outlook, and any IMAP server</p>
              <p>• Add multiple accounts from different providers</p>
              <p>• AI summaries generated for all emails</p>
              <p>• Emails matched to prospects automatically</p>
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
