import { cn } from "@/lib/utils";
import { type ProductType, PRODUCT_BADGE_COLORS } from "@/lib/types";

interface ProductBadgeProps {
  product: ProductType;
  className?: string;
}

export function ProductBadge({ product, className }: ProductBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium",
        PRODUCT_BADGE_COLORS[product],
        className
      )}
    >
      {product}
    </span>
  );
}
