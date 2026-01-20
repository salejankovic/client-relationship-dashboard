"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProductBadge } from "@/components/product-badge";
import {
  COUNTRY_FLAGS,
  PRODUCT_COLORS,
  STATUS_COLORS,
  type Prospect,
  type ProspectStatus,
} from "@/lib/types";
import {
  Eye,
  Sparkles,
  AlertTriangle,
  DollarSign,
  Flame,
  Snowflake,
  ThermometerSun,
  Ban,
} from "lucide-react";

interface FollowupCardProps {
  prospect: Prospect;
  onGenerateFollowup?: () => void;
}

const StatusIcon = ({ status }: { status: ProspectStatus }) => {
  switch (status) {
    case "Hot":
      return <Flame className="w-3 h-3" />;
    case "Warm":
      return <ThermometerSun className="w-3 h-3" />;
    case "Cold":
      return <Snowflake className="w-3 h-3" />;
    case "Lost":
      return <Ban className="w-3 h-3" />;
  }
};

export function FollowupCard({ prospect, onGenerateFollowup }: FollowupCardProps) {
  const needsFollowup = prospect.daysSinceContact > 7;
  const flag = COUNTRY_FLAGS[prospect.country] || "";

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("sr-Latn", {
      day: "2-digit",
      month: "2-digit",
    });
  };

  const formatCurrency = (value?: number) => {
    if (!value) return null;
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div
      className={cn(
        "group relative flex items-center gap-4 p-4 bg-card rounded-lg border border-border hover:shadow-md transition-all",
        needsFollowup && "border-l-4 border-l-orange-500"
      )}
    >
      <div className={cn("w-1 h-12 rounded-full", PRODUCT_COLORS[prospect.product])} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href={`/prospects/${prospect.id}`}
            className="font-semibold text-foreground hover:text-blue-600 transition-colors"
          >
            {prospect.company}
          </Link>
          <ProductBadge product={prospect.product} />
          <Badge variant="outline" className={`gap-1 text-xs ${STATUS_COLORS[prospect.status]}`}>
            <StatusIcon status={prospect.status} />
            {prospect.status}
          </Badge>
        </div>
        <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground flex-wrap">
          <span>
            {prospect.contactPerson.split(",")[0]} {flag}
          </span>
          <span>•</span>
          <span>Last: {formatDate(prospect.lastActivity)}</span>
          {prospect.dealValue && (
            <>
              <span>•</span>
              <span className="flex items-center gap-1 text-green-600 font-medium">
                <DollarSign className="w-3 h-3" />
                {formatCurrency(prospect.dealValue)}
              </span>
            </>
          )}
        </div>
        {needsFollowup && (
          <div className="flex items-center gap-1 mt-1.5 text-orange-600 text-xs font-medium">
            <AlertTriangle className="w-3 h-3" />
            {prospect.daysSinceContact} days since last contact
          </div>
        )}
        {prospect.next && prospect.next !== "/" && (
          <div className="mt-1.5">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
              Next: {prospect.next}
            </span>
          </div>
        )}
      </div>
      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/prospects/${prospect.id}`}>
            <Eye className="w-4 h-4" />
          </Link>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onGenerateFollowup}
          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
        >
          <Sparkles className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
