"use client";

import { useState, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { AppSidebar } from "@/components/app-sidebar";
import { MobileNav } from "@/components/mobile-nav";
import { ProductBadge } from "@/components/product-badge";
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
import type { Prospect } from "@/lib/types";
import {
  Search,
  Plus,
  Upload,
  Eye,
  Sparkles,
  CheckCircle2,
  ThermometerSun,
  Snowflake,
  Pause,
  AlertTriangle,
  Loader2,
} from "lucide-react";

type HealthStatus = "Active" | "Cooling" | "Cold" | "Frozen";

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

function ProspectsContent() {
  const searchParams = useSearchParams();
  const healthParam = searchParams.get("health");

  const { prospects: allProspects, loading } = useProspects();
  const [search, setSearch] = useState("");
  const [productFilter, setProductFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [countryFilter, setCountryFilter] = useState<string>("all");
  const [ownerFilter, setOwnerFilter] = useState<string>("all");
  const [healthFilter, setHealthFilter] = useState<string>(healthParam || "all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedProspects, setSelectedProspects] = useState<string[]>([]);

  // Filter out archived prospects
  const prospects = useMemo(
    () => allProspects.filter((p) => !p.archived),
    [allProspects]
  );

  // Extract unique values for filters
  const { products, types, countries, owners } = useMemo(() => {
    const productsSet = new Set<string>();
    const typesSet = new Set<string>();
    const countriesSet = new Set<string>();
    const ownersSet = new Set<string>();

    prospects.forEach((p) => {
      if (p.productType) productsSet.add(p.productType);
      if (p.prospectType) typesSet.add(p.prospectType);
      if (p.country) countriesSet.add(p.country);
      if (p.owner) ownersSet.add(p.owner);
    });

    return {
      products: Array.from(productsSet).sort(),
      types: Array.from(typesSet).sort(),
      countries: Array.from(countriesSet).sort(),
      owners: Array.from(ownersSet).sort(),
    };
  }, [prospects]);

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

        const prospectHealth = getHealthStatus(p.daysSinceContact ?? 0).toLowerCase();
        const matchesHealth = healthFilter === "all" || prospectHealth === healthFilter;

        return (
          matchesSearch &&
          matchesProduct &&
          matchesType &&
          matchesCountry &&
          matchesOwner &&
          matchesStatus &&
          matchesHealth
        );
      })
      .sort((a, b) => (b.daysSinceContact ?? 0) - (a.daysSinceContact ?? 0));
  }, [prospects, search, productFilter, typeFilter, countryFilter, ownerFilter, statusFilter, healthFilter]);

  const needsFollowUp = filteredProspects.filter((p) => (p.daysSinceContact ?? 0) > 14);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedProspects(filteredProspects.map((p) => p.id));
    } else {
      setSelectedProspects([]);
    }
  };

  const handleSelectProspect = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedProspects([...selectedProspects, id]);
    } else {
      setSelectedProspects(selectedProspects.filter((pid) => pid !== id));
    }
  };

  const handleSelectNeedingFollowUp = () => {
    setSelectedProspects(needsFollowUp.map((p) => p.id));
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
      <AppSidebar />
      <MobileNav />

      <main className="lg:pl-64 pb-20 lg:pb-0">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-semibold text-foreground">Prospects</h1>
            <div className="flex items-center gap-2">
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
              {countries.length > 0 && (
                <Select value={countryFilter} onValueChange={setCountryFilter}>
                  <SelectTrigger className="w-[140px] h-9 text-sm">
                    <SelectValue placeholder="Country" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Countries</SelectItem>
                    {countries.map((c) => (
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
                <SelectTrigger className="w-[120px] h-9 text-sm">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Hot">Hot</SelectItem>
                  <SelectItem value="Warm">Warm</SelectItem>
                  <SelectItem value="Cold">Cold</SelectItem>
                  <SelectItem value="Lost">Lost</SelectItem>
                </SelectContent>
              </Select>
              <Select value={healthFilter} onValueChange={setHealthFilter}>
                <SelectTrigger className="w-[120px] h-9 text-sm">
                  <SelectValue placeholder="Health" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Health</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="cooling">Cooling</SelectItem>
                  <SelectItem value="cold">Cold</SelectItem>
                  <SelectItem value="frozen">Frozen</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedProspects.length > 0 && (
            <div className="flex items-center gap-3 p-3 mb-4 bg-blue-50 border border-blue-200 rounded-lg">
              <span className="text-sm font-medium text-blue-700">{selectedProspects.length} selected</span>
              <Button size="sm" variant="ghost" onClick={() => setSelectedProspects([])} className="text-blue-700">
                Clear
              </Button>
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

          {/* Table */}
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
                  <TableHead className="w-12"></TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Last</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProspects.map((prospect) => (
                  <TableRow key={prospect.id} className="group hover:bg-muted/30">
                    <TableCell>
                      <Checkbox
                        checked={selectedProspects.includes(prospect.id)}
                        onCheckedChange={(checked) => handleSelectProspect(prospect.id, !!checked)}
                      />
                    </TableCell>
                    <TableCell>
                      <HealthIndicator daysSinceContact={prospect.daysSinceContact} />
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/acquisition/prospects/${prospect.id}`}
                        className="font-medium hover:text-blue-600 transition-colors"
                      >
                        {prospect.company}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {prospect.contactPerson || "-"}
                    </TableCell>
                    <TableCell>{prospect.productType && <ProductBadge product={prospect.productType} />}</TableCell>
                    <TableCell>
                      <DaysIndicator days={prospect.daysSinceContact} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/acquisition/prospects/${prospect.id}`}>
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0" title="View">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredProspects.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No prospects found matching your filters
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

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
