import type { Metadata } from "next";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";

export const metadata: Metadata = {
  title: "Get Started · Weekli",
  description: "Calibrate your weekly pulse, commitments, and runway.",
};

export default function OnboardingPage() {
  return <OnboardingWizard />;
}
