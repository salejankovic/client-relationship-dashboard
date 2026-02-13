"use client";

import { useState, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { MainNav } from "@/components/main-nav";
import { AppSidebar } from "@/components/app-sidebar";
import { MobileNav } from "@/components/mobile-nav";
import { ProductBadge } from "@/components/product-badge";
import { CountryFlag } from "@/components/country-flag";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useProspects } from "@/hooks/use-prospects";
import { useCountries } from "@/hooks/use-countries";
import type { Prospect } from "@/lib/types";
import { playCompletionSound, fireConfetti } from "@/lib/celebrations";
import {
  Search,
  Plus,
  Upload,
  Eye,
  Sparkles,
  CheckCircle2,
  Circle,
  ThermometerSun,
  Snowflake,
  Pause,
  AlertTriangle,
  Loader2,
  Trash2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  LayoutList,
  LayoutGrid,
} from "lucide-react";

type HealthStatus = "Active" | "Cooling" | "Cold" | "Frozen";
type SortColumn = "dealValue" | "lastContact" | "status" | "nextAction" | "company" | null;
type SortDirection = "asc" | "desc";
type ViewMode = "table" | "grid";

function getHealthStatus(daysSinceContact: number): HealthStatus {
  if (daysSinceContact <= 7) return "Active";
  if (daysSinceContact <= 14) return "Cooling";
  if (daysSinceContact <= 60) return "Cold";
  return "Frozen";
}

function HealthIndicator({ daysSinceContact }: { daysSinceContact?: number }) {
  const health = getHealthStatus(daysSinceContact ?? 0);

  const config = {
    Active: { Icon: CheckCircle2, color: "text-green-600" },
    Cooling: { Icon: ThermometerSun, color: "text-orange-500" },
    Cold: { Icon: Snowflake, color: "text-blue-500" },
    Frozen: { Icon: Pause, color: "text-slate-400" },
  };

  const { Icon, color } = config[health];

  return (
    <div className={`flex items-center gap-1.5 ${color}`} title={health}>
      <Icon className="w-4 h-4" />
    </div>
  );
}

function DaysIndicator({ days }: { days?: number }) {
  const dayCount = days ?? 0;
  let colorClass = "text-green-600";
  let icon = null;

  if (dayCount > 60) {
    colorClass = "text-slate-400";
    icon = <Pause className="w-3 h-3" />;
  } else if (dayCount > 30) {
    colorClass = "text-blue-500";
    icon = <Snowflake className="w-3 h-3" />;
  } else if (dayCount > 14) {
    colorClass = "text-orange-500";
    icon = <AlertTriangle className="w-3 h-3" />;
  }

  return (
    <span className={`flex items-center gap-1 ${colorClass}`}>
      {dayCount}d {icon}
    </span>
  );
}

function getComputedDaysSinceContact(prospect: Prospect): number {
  if (prospect.lastContactDate) {
    const last = new Date(prospect.lastContactDate);
    if (isNaN(last.getTime())) return prospect.daysSinceContact ?? 0;
    const lastMidnight = Date.UTC(last.getUTCFullYear(), last.getUTCMonth(), last.getUTCDate());
    const now = new Date();
    const nowMidnight = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
    return Math.max(0, Math.floor((nowMidnight - lastMidnight) / (1000 * 60 * 60 * 24)));
  }
  return prospect.daysSinceContact ?? 0;
}

function ProspectsContent() {
  const { prospects: allProspects, loading, deleteProspect, updateProspect } = useProspects();
  const { countries } = useCountries();
  const [search, setSearch] = useState("");
  const [productFilter, setProductFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [countryFilter, setCountryFilter] = useState<string>("all");
  const [ownerFilter, setOwnerFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [customLabelFilter, setCustomLabelFilter] = useState<string>("all");
  const [selectedProspects, setSelectedProspects] = useState<string[]>([]);
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null);
  const [sortColumn, setSortColumn] = useState<SortColumn>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [viewMode, setViewMode] = useState<ViewMode>("table");

  // Filter out archived prospects
  const prospects = useMemo(
    () => allProspects.filter((p) => !p.archived),
    [allProspects]
  );

  // Extract unique values for filters
  const { products, types, countryNames, owners, customLabels } = useMemo(() => {
    const productsSet = new Set<string>();
    const typesSet = new Set<string>();
    const countriesSet = new Set<string>();
    const ownersSet = new Set<string>();
    const customLabelsSet = new Set<string>();

    prospects.forEach((p) => {
      if (p.productType) productsSet.add(p.productType);
      if (p.prospectType) typesSet.add(p.prospectType);
      if (p.country) countriesSet.add(p.country);
      if (p.owner) ownersSet.add(p.owner);
      if (p.customLabel) customLabelsSet.add(p.customLabel);
    });

    return {
      products: Array.from(productsSet).sort(),
      types: Array.from(typesSet).sort(),
      countryNames: Array.from(countriesSet).sort(),
      owners: Array.from(ownersSet).sort(),
      customLabels: Array.from(customLabelsSet).sort(),
    };
  }, [prospects]);

  // Helper to parse deal value for sorting (extracts first number)
  const parseDealValue = (value: string | undefined): number => {
    if (!value) return 0;
    const match = value.match(/[\d,]+/);
    if (match) {
      return parseFloat(match[0].replace(/,/g, ''));
    }
    return 0;
  };

  // Helper for status priority (Hot > Warm > Cold > Not contacted > Lost)
  const getStatusPriority = (status: string): number => {
    const priorities: Record<string, number> = {
      'Hot': 5,
      'Warm': 4,
      'Cold': 3,
      'Not contacted yet': 2,
      'Lost': 1,
    };
    return priorities[status] ?? 0;
  };

  const filteredProspects = useMemo(() => {
    return prospects
      .filter((p) => {
        const searchLower = search.toLowerCase();
        const matchesSearch =
          !search ||
          p.company.toLowerCase().includes(searchLower) ||
          p.contactPerson?.toLowerCase().includes(searchLower) ||
          p.email?.toLowerCase().includes(searchLower);

        const matchesProduct = productFilter === "all" || p.productType === productFilter;
        const matchesType = typeFilter === "all" || p.prospectType === typeFilter;
        const matchesCountry = countryFilter === "all" || p.country === countryFilter;
        const matchesOwner = ownerFilter === "all" || p.owner === ownerFilter;
        const matchesStatus = statusFilter === "all" || p.status === statusFilter;
        const matchesCustomLabel = customLabelFilter === "all" || p.customLabel === customLabelFilter;

        return (
          matchesSearch &&
          matchesProduct &&
          matchesType &&
          matchesCountry &&
          matchesOwner &&
          matchesStatus &&
          matchesCustomLabel
        );
      })
      .sort((a, b) => {
        // Apply custom sorting if a column is selected
        if (sortColumn) {
          let comparison = 0;

          if (sortColumn === 'dealValue') {
            comparison = parseDealValue(a.dealValue) - parseDealValue(b.dealValue);
          } else if (sortColumn === 'lastContact') {
            comparison = getComputedDaysSinceContact(a) - getComputedDaysSinceContact(b);
          } else if (sortColumn === 'status') {
            comparison = getStatusPriority(a.status) - getStatusPriority(b.status);
          } else if (sortColumn === 'nextAction') {
            // Sort by next action date (no date = sort last)
            const dA = a.nextActionDate ? new Date(a.nextActionDate).getTime() : Infinity;
            const dB = b.nextActionDate ? new Date(b.nextActionDate).getTime() : Infinity;
            comparison = dA - dB;
          } else if (sortColumn === 'company') {
            comparison = a.company.toLowerCase().localeCompare(b.company.toLowerCase());
          }

          return sortDirection === 'asc' ? comparison : -comparison;
        }

        // Default sort by days since contact (descending)
        return getComputedDaysSinceContact(b) - getComputedDaysSinceContact(a);
      });
  }, [prospects, search, productFilter, typeFilter, countryFilter, ownerFilter, statusFilter, customLabelFilter, sortColumn, sortDirection]);

  const needsFollowUp = filteredProspects.filter((p) => getComputedDaysSinceContact(p) > 14);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedProspects(filteredProspects.map((p) => p.id));
    } else {
      setSelectedProspects([]);
    }
  };

  const handleSelectProspect = (id: string, checked: boolean, index: number, shiftKey: boolean = false) => {
    if (shiftKey && lastSelectedIndex !== null) {
      // Shift+click: select range
      const startIndex = Math.min(lastSelectedIndex, index);
      const endIndex = Math.max(lastSelectedIndex, index);
      const rangeIds = filteredProspects.slice(startIndex, endIndex + 1).map(p => p.id);

      setSelectedProspects(prev => {
        const newSelection = new Set(prev);
        rangeIds.forEach(rangeId => newSelection.add(rangeId));
        return Array.from(newSelection);
      });
      setLastSelectedIndex(index);
    } else {
      // Regular click
      if (checked) {
        setSelectedProspects([...selectedProspects, id]);
        setLastSelectedIndex(index);
      } else {
        setSelectedProspects(selectedProspects.filter((pid) => pid !== id));
        setLastSelectedIndex(null);
      }
    }
  };

  const handleSelectNeedingFollowUp = () => {
    setSelectedProspects(needsFollowUp.map((p) => p.id));
  };

  const handleDeleteSelected = async () => {
    if (selectedProspects.length === 0) return;

    const confirmMessage = `Are you sure you want to delete ${selectedProspects.length} prospect${selectedProspects.length > 1 ? 's' : ''}? This action cannot be undone.`;

    if (!confirm(confirmMessage)) return;

    try {
      // Delete all selected prospects
      await Promise.all(selectedProspects.map(id => deleteProspect(id)));
      setSelectedProspects([]);
      alert(`Successfully deleted ${selectedProspects.length} prospect${selectedProspects.length > 1 ? 's' : ''}`);
    } catch (error) {
      console.error('Error deleting prospects:', error);
      alert('Failed to delete some prospects. Please try again.');
    }
  };

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      // Toggle direction if same column
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      // New column, start with desc
      setSortColumn(column);
      setSortDirection('desc');
    }
  };

  const handleCompleteNextAction = async (prospect: Prospect, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await updateProspect({
      ...prospect,
      nextAction: undefined,
      nextActionDate: undefined,
    });
    playCompletionSound();
    fireConfetti();
  };

  const SortIcon = ({ column }: { column: SortColumn }) => {
    if (sortColumn !== column) {
      return <ArrowUpDown className="w-3 h-3 ml-1 opacity-50" />;
    }
    return sortDirection === 'asc' ? (
      <ArrowUp className="w-3 h-3 ml-1" />
    ) : (
      <ArrowDown className="w-3 h-3 ml-1" />
    );
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="text-muted-foreground">Loading prospects...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <MainNav />
      <AppSidebar />
      <MobileNav />

      <main className="lg:pl-64 pb-20 lg:pb-0 pt-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-semibold text-foreground">Prospects</h1>
            <div className="flex items-center gap-2">
              <div className="flex items-center border rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode("table")}
                  className={`p-2 transition-colors ${viewMode === "table" ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted"}`}
                  title="Table view"
                >
                  <LayoutList className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 transition-colors ${viewMode === "grid" ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted"}`}
                  title="Grid view"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
              </div>
              <Button variant="outline" asChild className="bg-transparent">
                <Link href="/acquisition/import">
                  <Upload className="w-4 h-4 mr-2" />
                  Import
                </Link>
              </Button>
              <Button asChild className="bg-blue-600 hover:bg-blue-700">
                <Link href="/acquisition/prospects/new">
                  <Plus className="w-4 h-4 mr-2" />
                  Add
                </Link>
              </Button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="space-y-4 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-muted-foreground">Filters:</span>
              {products.length > 0 && (
                <Select value={productFilter} onValueChange={setProductFilter}>
                  <SelectTrigger className="w-[140px] h-9 text-sm">
                    <SelectValue placeholder="Product" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Products</SelectItem>
                    {products.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {types.length > 0 && (
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-[140px] h-9 text-sm">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {types.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {countryNames.length > 0 && (
                <Select value={countryFilter} onValueChange={setCountryFilter}>
                  <SelectTrigger className="w-[140px] h-9 text-sm">
                    <SelectValue placeholder="Country" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Countries</SelectItem>
                    {countryNames.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {owners.length > 0 && (
                <Select value={ownerFilter} onValueChange={setOwnerFilter}>
                  <SelectTrigger className="w-[140px] h-9 text-sm">
                    <SelectValue placeholder="Owner" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Owners</SelectItem>
                    {owners.map((o) => (
                      <SelectItem key={o} value={o}>
                        {o}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px] h-9 text-sm">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Not contacted yet">✉️ Not contacted yet</SelectItem>
                  <SelectItem value="Hot">🔥 Hot</SelectItem>
                  <SelectItem value="Warm">☀️ Warm</SelectItem>
                  <SelectItem value="Cold">❄️ Cold</SelectItem>
                  <SelectItem value="Lost">Lost</SelectItem>
                </SelectContent>
              </Select>
              {customLabels.length > 0 && (
                <Select value={customLabelFilter} onValueChange={setCustomLabelFilter}>
                  <SelectTrigger className="w-[160px] h-9 text-sm">
                    <SelectValue placeholder="Label" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Labels</SelectItem>
                    {customLabels.map((label) => (
                      <SelectItem key={label} value={label}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedProspects.length > 0 && (
            <div className="flex items-center gap-3 p-3 mb-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
              <span className="text-sm font-medium text-blue-700 dark:text-blue-300">{selectedProspects.length} selected</span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={handleDeleteSelected}
                  className="h-8"
                >
                  <Trash2 className="w-3 h-3 mr-1.5" />
                  Delete
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setSelectedProspects([])} className="text-blue-700 dark:text-blue-300">
                  Clear
                </Button>
              </div>
            </div>
          )}

          {/* Select all needing follow-up */}
          {needsFollowUp.length > 0 && selectedProspects.length === 0 && (
            <div className="flex items-center gap-2 mb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectNeedingFollowUp}
                className="text-orange-600 border-orange-200 hover:bg-orange-50 bg-transparent"
              >
                <AlertTriangle className="w-3 h-3 mr-1.5" />
                Select all needing follow-up ({needsFollowUp.length})
              </Button>
            </div>
          )}

          {/* Sort toolbar for grid view */}
          {viewMode === "grid" && (
            <div className="flex items-center gap-2 mb-4">
              <span className="text-sm text-muted-foreground">Sort by:</span>
              {(["company", "status", "lastContact", "nextAction", "dealValue"] as SortColumn[]).map((col) => {
                const labels: Record<string, string> = {
                  company: "Name",
                  status: "Status",
                  lastContact: "Last Contact",
                  nextAction: "Next Action",
                  dealValue: "Deal Value",
                };
                const isActive = sortColumn === col;
                return (
                  <button
                    key={col}
                    onClick={() => handleSort(col)}
                    className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-foreground text-background"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    {labels[col!]}
                    {isActive && (
                      sortDirection === "asc"
                        ? <ArrowUp className="w-3 h-3" />
                        : <ArrowDown className="w-3 h-3" />
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Table / Grid */}
          {viewMode === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProspects.map((prospect) => {
                const countryData = countries.find(c => c.name === prospect.country);
                const statusEmoji = {
                  'Not contacted yet': '✉️',
                  'Hot': '🔥',
                  'Warm': '☀️',
                  'Cold': '❄️',
                  'Lost': ''
                }[prospect.status] || '';
                const days = getComputedDaysSinceContact(prospect);

                return (
                  <Link
                    key={prospect.id}
                    href={`/acquisition/prospects/${prospect.id}`}
                    className="block border rounded-lg p-4 hover:bg-muted/30 transition-colors bg-card"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        {countryData?.flagEmoji && (
                          <CountryFlag code={countryData.flagEmoji} className="w-5 h-4 flex-shrink-0" />
                        )}
                        <span className="font-semibold text-foreground truncate">{prospect.company}</span>
                      </div>
                      <span title={prospect.status} className="text-lg flex-shrink-0">{statusEmoji || prospect.status}</span>
                    </div>
                    {prospect.contactPerson && (
                      <p className="text-sm text-muted-foreground mb-2">{prospect.contactPerson}</p>
                    )}
                    <div className="flex items-center justify-between text-sm mt-2 pt-2 border-t">
                      {prospect.productType && <ProductBadge product={prospect.productType} />}
                      <span className="text-muted-foreground">{prospect.dealValue || ""}</span>
                    </div>
                    <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                      <DaysIndicator days={days} />
                    </div>
                    {prospect.nextAction && (
                      <div className="mt-2 pt-2 border-t">
                        <div className="flex items-start gap-1.5">
                          <Circle className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground mt-0.5" />
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground leading-tight">{prospect.nextAction}</p>
                            {prospect.nextActionDate && (
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {(() => {
                                  const d = new Date(prospect.nextActionDate);
                                  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
                                })()}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </Link>
                );
              })}
              {filteredProspects.length === 0 && (
                <p className="text-center text-muted-foreground py-8 col-span-full">
                  No prospects found matching your filters
                </p>
              )}
            </div>
          ) : (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedProspects.length === filteredProspects.length && filteredProspects.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>
                    <button
                      onClick={() => handleSort('company')}
                      className="flex items-center hover:text-foreground transition-colors"
                    >
                      Company
                      <SortIcon column="company" />
                    </button>
                  </TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>
                    <button
                      onClick={() => handleSort('dealValue')}
                      className="flex items-center hover:text-foreground transition-colors"
                    >
                      Deal Value
                      <SortIcon column="dealValue" />
                    </button>
                  </TableHead>
                  <TableHead>
                    <button
                      onClick={() => handleSort('status')}
                      className="flex items-center hover:text-foreground transition-colors"
                    >
                      Status
                      <SortIcon column="status" />
                    </button>
                  </TableHead>
                  <TableHead>
                    <button
                      onClick={() => handleSort('lastContact')}
                      className="flex items-center hover:text-foreground transition-colors"
                    >
                      Last Contact
                      <SortIcon column="lastContact" />
                    </button>
                  </TableHead>
                  <TableHead>
                    <button
                      onClick={() => handleSort('nextAction')}
                      className="flex items-center hover:text-foreground transition-colors"
                    >
                      Next Action
                      <SortIcon column="nextAction" />
                    </button>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProspects.map((prospect, index) => {
                  const countryData = countries.find(c => c.name === prospect.country);
                  const statusEmoji = {
                    'Not contacted yet': '✉️',
                    'Hot': '🔥',
                    'Warm': '☀️',
                    'Cold': '❄️',
                    'Lost': ''
                  }[prospect.status] || '';

                  return (
                    <TableRow key={prospect.id} className="group hover:bg-muted/30">
                      <TableCell>
                        <Checkbox
                          checked={selectedProspects.includes(prospect.id)}
                          onCheckedChange={(checked) => handleSelectProspect(prospect.id, !!checked, index, false)}
                          onClick={(e) => {
                            if (e.shiftKey) {
                              e.preventDefault();
                              handleSelectProspect(prospect.id, true, index, true);
                            }
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {countryData?.flagEmoji && (
                            <span title={prospect.country}>
                              <CountryFlag code={countryData.flagEmoji} className="w-5 h-4" />
                            </span>
                          )}
                          <Link
                            href={`/acquisition/prospects/${prospect.id}`}
                            className="font-medium hover:text-blue-600 transition-colors"
                          >
                            {prospect.company}
                          </Link>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {prospect.contactPerson || "-"}
                      </TableCell>
                      <TableCell>{prospect.productType && <ProductBadge product={prospect.productType} />}</TableCell>
                      <TableCell className="text-sm">
                        {prospect.dealValue || "-"}
                      </TableCell>
                      <TableCell>
                        <span title={prospect.status} className="text-base">
                          {statusEmoji || prospect.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        <DaysIndicator days={getComputedDaysSinceContact(prospect)} /> ago
                      </TableCell>
                      <TableCell className="max-w-[200px]">
                        {prospect.nextAction ? (
                          <div className="flex items-start gap-2">
                            <button
                              onClick={(e) => handleCompleteNextAction(prospect, e)}
                              className="mt-0.5 flex-shrink-0 text-muted-foreground hover:text-primary transition-colors"
                              title="Mark as done"
                            >
                              <Circle className="h-4 w-4" />
                            </button>
                            <Link
                              href={`/acquisition/prospects/${prospect.id}`}
                              className="flex-1 hover:opacity-80 transition-opacity"
                            >
                              <div className="text-sm font-medium text-foreground whitespace-normal break-words">
                                {prospect.nextAction}
                              </div>
                              {prospect.nextActionDate && (
                                <div className="text-xs text-muted-foreground">
                                  {(() => {
                                    const d = new Date(prospect.nextActionDate);
                                    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
                                  })()}
                                </div>
                              )}
                            </Link>
                          </div>
                        ) : (
                          <Link
                            href={`/acquisition/prospects/${prospect.id}`}
                            className="text-sm text-muted-foreground hover:text-blue-600"
                          >
                            /
                          </Link>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filteredProspects.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No prospects found matching your filters
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          )}

          <p className="text-sm text-muted-foreground mt-4">
            Showing {filteredProspects.length} of {prospects.length} prospects
          </p>
        </div>
      </main>
    </div>
  );
}

export default function ProspectsPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="text-muted-foreground">Loading...</span>
        </div>
      </div>
    }>
      <ProspectsContent />
    </Suspense>
  );
}
