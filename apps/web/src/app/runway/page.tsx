import type { Metadata } from "next";
import { RunwayView } from "./runway-view";

export const metadata: Metadata = { title: "Runway & Sinking Engine · Weekli" };

export default function RunwayPage() {
  return <RunwayView />;
}
