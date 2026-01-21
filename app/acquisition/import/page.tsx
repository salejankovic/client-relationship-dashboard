"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useProspects } from "@/hooks/use-prospects"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Upload, Loader2, Check, AlertCircle, Download } from "lucide-react"
import Link from "next/link"
import type { ProspectStatus, ProductType, ProspectType } from "@/lib/types"
import { MainNav } from "@/components/main-nav"
import { AppSidebar } from "@/components/app-sidebar"
import { MobileNav } from "@/components/mobile-nav"

interface CSVRow {
  [key: string]: string
}

interface FieldMapping {
  company: string
  contactPerson: string
  email: string
  telephone: string
  website: string
  productType: string
  prospectType: string
  country: string
  status: string
  owner: string
  dealValue: string
  nextAction: string
}

export default function ImportProspectsPage() {
  const router = useRouter()
  const { addProspect } = useProspects()

  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [csvData, setCSVData] = useState<CSVRow[]>([])
  const [headers, setHeaders] = useState<string[]>([])
  const [mapping, setMapping] = useState<FieldMapping>({
    company: "_skip",
    contactPerson: "_skip",
    email: "_skip",
    telephone: "_skip",
    website: "_skip",
    productType: "_skip",
    prospectType: "_skip",
    country: "_skip",
    status: "_skip",
    owner: "_skip",
    dealValue: "_skip",
    nextAction: "_skip",
  })
  const [importing, setImporting] = useState(false)
  const [importProgress, setImportProgress] = useState(0)
  const [importComplete, setImportComplete] = useState(false)
  const [errors, setErrors] = useState<string[]>([])

  // Parse CSV file
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      parseCSV(text)
    }
    reader.readAsText(file)
  }

  // Simple CSV parser (handles basic CSV format)
  const parseCSV = (text: string) => {
    const lines = text.split('\n').filter(line => line.trim())
    if (lines.length < 2) {
      setErrors(["CSV file must contain at least a header row and one data row"])
      return
    }

    // Parse headers
    const headerLine = lines[0]
    const parsedHeaders = headerLine.split(',').map(h => h.trim().replace(/^"|"$/g, ''))
    setHeaders(parsedHeaders)

    // Auto-detect common field mappings
    const autoMapping: Partial<FieldMapping> = {}
    parsedHeaders.forEach(header => {
      const lowerHeader = header.toLowerCase()
      if (lowerHeader.includes('company') || lowerHeader.includes('organization')) {
        autoMapping.company = header
      } else if (lowerHeader.includes('contact') || lowerHeader.includes('name') || lowerHeader.includes('person')) {
        autoMapping.contactPerson = header
      } else if (lowerHeader.includes('email') || lowerHeader.includes('mail')) {
        autoMapping.email = header
      } else if (lowerHeader.includes('phone') || lowerHeader.includes('telephone') || lowerHeader.includes('tel')) {
        autoMapping.telephone = header
      } else if (lowerHeader.includes('website') || lowerHeader.includes('url')) {
        autoMapping.website = header
      } else if (lowerHeader.includes('country')) {
        autoMapping.country = header
      } else if (lowerHeader.includes('status')) {
        autoMapping.status = header
      } else if (lowerHeader.includes('owner') || lowerHeader.includes('assigned')) {
        autoMapping.owner = header
      } else if (lowerHeader.includes('value') || lowerHeader.includes('deal')) {
        autoMapping.dealValue = header
      }
    })
    setMapping(prev => ({ ...prev, ...autoMapping }))

    // Parse data rows
    const dataRows: CSVRow[] = []
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue

      const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''))
      const row: CSVRow = {}
      parsedHeaders.forEach((header, index) => {
        row[header] = values[index] || ""
      })
      dataRows.push(row)
    }

    setCSVData(dataRows)
    setErrors([])
    setStep(2)
  }

  // Download sample CSV template
  const downloadTemplate = () => {
    const template = `Company,Contact Person,Email,Telephone,Website,Product Type,Prospect Type,Country,Status,Owner,Deal Value,Next Action
Example Corp,John Doe,john@example.com,+385 1 234 5678,https://example.com,Mobile app,Media,Croatia,Hot,Sales Rep,50000,Schedule demo call
Another Co,Jane Smith,jane@another.com,+385 1 987 6543,https://another.com,Website/CMS,Sports Club,Serbia,Warm,Sales Rep,25000,Send proposal`

    const blob = new Blob([template], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'prospects_import_template.csv'
    a.click()
    window.URL.revokeObjectURL(url)
  }

  // Validate and import prospects
  const handleImport = async () => {
    setImporting(true)
    setImportProgress(0)
    const newErrors: string[] = []

    // Validate required field mapping
    if (!mapping.company || mapping.company === "_skip") {
      newErrors.push("Company field mapping is required")
      setErrors(newErrors)
      setImporting(false)
      return
    }

    let successCount = 0
    for (let i = 0; i < csvData.length; i++) {
      const row = csvData[i]

      try {
        // Get company name (required)
        const company = row[mapping.company]
        if (!company || !company.trim()) {
          newErrors.push(`Row ${i + 2}: Company name is required`)
          continue
        }

        // Parse deal value
        let dealValue: number | undefined
        if (mapping.dealValue && mapping.dealValue !== "_skip" && row[mapping.dealValue]) {
          const parsed = parseFloat(row[mapping.dealValue].replace(/[^0-9.-]/g, ''))
          if (!isNaN(parsed)) dealValue = parsed
        }

        // Parse status
        let status: ProspectStatus = "Warm"
        if (mapping.status && mapping.status !== "_skip" && row[mapping.status]) {
          const statusValue = row[mapping.status].trim()
          if (['Hot', 'Warm', 'Cold', 'Lost'].includes(statusValue)) {
            status = statusValue as ProspectStatus
          }
        }

        // Create prospect
        await addProspect({
          id: `prospect-import-${Date.now()}-${i}`,
          company: company.trim(),
          contactPerson: mapping.contactPerson !== "_skip" ? row[mapping.contactPerson] : undefined,
          email: mapping.email !== "_skip" ? row[mapping.email] : undefined,
          telephone: mapping.telephone !== "_skip" ? row[mapping.telephone] : undefined,
          website: mapping.website !== "_skip" ? row[mapping.website] : undefined,
          productType: mapping.productType !== "_skip" ? row[mapping.productType] as ProductType : undefined,
          prospectType: mapping.prospectType !== "_skip" ? row[mapping.prospectType] as ProspectType : undefined,
          country: mapping.country !== "_skip" ? row[mapping.country] : undefined,
          status,
          owner: mapping.owner !== "_skip" ? row[mapping.owner] : undefined,
          dealValue,
          nextAction: mapping.nextAction !== "_skip" ? row[mapping.nextAction] : undefined,
          archived: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })

        successCount++
        setImportProgress(Math.round(((i + 1) / csvData.length) * 100))
      } catch (error) {
        newErrors.push(`Row ${i + 2}: Failed to import - ${error}`)
      }
    }

    setErrors(newErrors)
    setImporting(false)
    setImportComplete(true)
    setStep(3)
  }

  return (
    <div className="min-h-screen bg-background">
      <MainNav />
      <AppSidebar />
      <MobileNav />
      <main className="lg:pl-64 pb-20 lg:pb-0 pt-16">
        <div className="p-8 max-w-5xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
        <Link href="/acquisition">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Pipeline
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Import Prospects</h1>
          <p className="text-muted-foreground mt-1">Upload a CSV file to bulk import prospects</p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center gap-4 mb-8">
        <div className={`flex items-center gap-2 ${step >= 1 ? 'text-primary' : 'text-muted-foreground'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`}>
            {step > 1 ? <Check className="h-4 w-4" /> : '1'}
          </div>
          <span className="text-sm font-medium">Upload</span>
        </div>
        <div className="w-12 h-0.5 bg-border" />
        <div className={`flex items-center gap-2 ${step >= 2 ? 'text-primary' : 'text-muted-foreground'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`}>
            {step > 2 ? <Check className="h-4 w-4" /> : '2'}
          </div>
          <span className="text-sm font-medium">Map Fields</span>
        </div>
        <div className="w-12 h-0.5 bg-border" />
        <div className={`flex items-center gap-2 ${step >= 3 ? 'text-primary' : 'text-muted-foreground'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 3 ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`}>
            {importComplete ? <Check className="h-4 w-4" /> : '3'}
          </div>
          <span className="text-sm font-medium">Import</span>
        </div>
      </div>

      {/* Step 1: Upload CSV */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Upload CSV File</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="border-2 border-dashed rounded-lg p-12 text-center">
              <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-medium mb-2">Drop your CSV file here</p>
              <p className="text-sm text-muted-foreground mb-4">or click to browse</p>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
                id="csv-upload"
              />
              <label htmlFor="csv-upload">
                <Button asChild>
                  <span>Choose File</span>
                </Button>
              </label>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-2 text-sm">
                <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-blue-900 dark:text-blue-100">CSV Format Requirements:</p>
                  <ul className="list-disc list-inside text-muted-foreground mt-1 space-y-1">
                    <li>First row must contain column headers</li>
                    <li>Company name is required for each row</li>
                    <li>Use comma (,) as field separator</li>
                    <li>Enclose fields containing commas in quotes</li>
                  </ul>
                </div>
              </div>

              <Button variant="outline" onClick={downloadTemplate} className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Download Sample Template
              </Button>
            </div>

            {errors.length > 0 && (
              <div className="bg-destructive/10 border border-destructive rounded-lg p-4">
                <p className="font-medium text-destructive mb-2">Errors:</p>
                <ul className="list-disc list-inside text-sm text-destructive/80 space-y-1">
                  {errors.map((error, i) => (
                    <li key={i}>{error}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 2: Map Fields */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Map CSV Columns to Prospect Fields</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground mb-4">
              Found {csvData.length} rows. Map your CSV columns to prospect fields below. Company is required.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="map-company">Company * (Required)</Label>
                <Select value={mapping.company} onValueChange={(value) => setMapping({ ...mapping, company: value })}>
                  <SelectTrigger id="map-company">
                    <SelectValue placeholder="Select column..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_skip">Don't import</SelectItem>
                    {headers.map(header => (
                      <SelectItem key={header} value={header}>{header}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="map-contact">Contact Person</Label>
                <Select value={mapping.contactPerson} onValueChange={(value) => setMapping({ ...mapping, contactPerson: value })}>
                  <SelectTrigger id="map-contact">
                    <SelectValue placeholder="Select column..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_skip">Don't import</SelectItem>
                    {headers.map(header => (
                      <SelectItem key={header} value={header}>{header}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="map-email">Email</Label>
                <Select value={mapping.email} onValueChange={(value) => setMapping({ ...mapping, email: value })}>
                  <SelectTrigger id="map-email">
                    <SelectValue placeholder="Select column..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_skip">Don't import</SelectItem>
                    {headers.map(header => (
                      <SelectItem key={header} value={header}>{header}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="map-telephone">Telephone</Label>
                <Select value={mapping.telephone} onValueChange={(value) => setMapping({ ...mapping, telephone: value })}>
                  <SelectTrigger id="map-telephone">
                    <SelectValue placeholder="Select column..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_skip">Don't import</SelectItem>
                    {headers.map(header => (
                      <SelectItem key={header} value={header}>{header}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="map-country">Country</Label>
                <Select value={mapping.country} onValueChange={(value) => setMapping({ ...mapping, country: value })}>
                  <SelectTrigger id="map-country">
                    <SelectValue placeholder="Select column..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_skip">Don't import</SelectItem>
                    {headers.map(header => (
                      <SelectItem key={header} value={header}>{header}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="map-status">Status</Label>
                <Select value={mapping.status} onValueChange={(value) => setMapping({ ...mapping, status: value })}>
                  <SelectTrigger id="map-status">
                    <SelectValue placeholder="Select column..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_skip">Don't import</SelectItem>
                    {headers.map(header => (
                      <SelectItem key={header} value={header}>{header}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="map-owner">Owner</Label>
                <Select value={mapping.owner} onValueChange={(value) => setMapping({ ...mapping, owner: value })}>
                  <SelectTrigger id="map-owner">
                    <SelectValue placeholder="Select column..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_skip">Don't import</SelectItem>
                    {headers.map(header => (
                      <SelectItem key={header} value={header}>{header}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="map-dealValue">Deal Value</Label>
                <Select value={mapping.dealValue} onValueChange={(value) => setMapping({ ...mapping, dealValue: value })}>
                  <SelectTrigger id="map-dealValue">
                    <SelectValue placeholder="Select column..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_skip">Don't import</SelectItem>
                    {headers.map(header => (
                      <SelectItem key={header} value={header}>{header}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Preview */}
            <div className="border rounded-lg p-4 mt-6">
              <h3 className="font-medium mb-3">Preview (first 3 rows)</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Company</th>
                      <th className="text-left p-2">Contact</th>
                      <th className="text-left p-2">Email</th>
                      <th className="text-left p-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {csvData.slice(0, 3).map((row, i) => (
                      <tr key={i} className="border-b">
                        <td className="p-2">{mapping.company !== "_skip" ? row[mapping.company] : '-'}</td>
                        <td className="p-2">{mapping.contactPerson !== "_skip" ? row[mapping.contactPerson] : '-'}</td>
                        <td className="p-2">{mapping.email !== "_skip" ? row[mapping.email] : '-'}</td>
                        <td className="p-2">{mapping.status !== "_skip" ? row[mapping.status] : 'Warm'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button onClick={handleImport} disabled={!mapping.company || mapping.company === "_skip"}>
                Import {csvData.length} Prospects
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Import Progress */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Import {importComplete ? 'Complete' : 'In Progress'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {importing && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span>Importing prospects...</span>
                  <span>{importProgress}%</span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{ width: `${importProgress}%` }}
                  />
                </div>
              </div>
            )}

            {importComplete && (
              <div className="text-center py-8">
                <Check className="h-16 w-16 mx-auto mb-4 text-green-600" />
                <h3 className="text-2xl font-bold mb-2">Import Complete!</h3>
                <p className="text-muted-foreground">
                  Successfully imported {csvData.length - errors.length} of {csvData.length} prospects
                </p>
              </div>
            )}

            {errors.length > 0 && (
              <div className="bg-destructive/10 border border-destructive rounded-lg p-4">
                <p className="font-medium text-destructive mb-2">{errors.length} Errors:</p>
                <div className="max-h-48 overflow-y-auto">
                  <ul className="list-disc list-inside text-sm text-destructive/80 space-y-1">
                    {errors.map((error, i) => (
                      <li key={i}>{error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {importComplete && (
              <div className="flex justify-center gap-2">
                <Link href="/acquisition">
                  <Button>
                    View Prospects
                  </Button>
                </Link>
                <Button variant="outline" onClick={() => {
                  setStep(1)
                  setCSVData([])
                  setHeaders([])
                  setImportComplete(false)
                  setImportProgress(0)
                  setErrors([])
                }}>
                  Import Another File
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
        </div>
      </main>
    </div>
  )
}
