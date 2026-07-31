import type { Metadata } from "next";
import { BillsView } from "./bills-view";

export const metadata: Metadata = { title: "Bills · Weekli" };

export default function BillsPage() {
  return <BillsView />;
}
