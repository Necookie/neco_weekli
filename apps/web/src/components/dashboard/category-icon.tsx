import {
  Bus,
  HeartPulse,
  Receipt,
  ShoppingBag,
  ShoppingBasket,
  Utensils,
} from "lucide-react";
import type { ComponentType } from "react";
import type { Category } from "@/lib/types";

const ICONS: Record<
  Category,
  ComponentType<{ className?: string; strokeWidth?: number }>
> = {
  "Food & Dining": Utensils,
  Transport: Bus,
  Groceries: ShoppingBasket,
  "Bills & Utilities": Receipt,
  Health: HeartPulse,
  Shopping: ShoppingBag,
};

export function CategoryIcon({
  category,
  className = "size-4",
}: {
  category: Category;
  className?: string;
}) {
  const Icon = ICONS[category];
  return <Icon className={className} strokeWidth={2} />;
}
