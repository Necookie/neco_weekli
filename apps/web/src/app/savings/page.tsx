import type { Metadata } from "next";
import { SavingsView } from "./savings-view";

export const metadata: Metadata = { title: "Savings · Weekli" };

export default function SavingsPage() {
  return <SavingsView />;
}
