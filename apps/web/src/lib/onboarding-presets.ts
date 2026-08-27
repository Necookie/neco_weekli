import type { RecurrenceFrequency } from "@neco/core";
import type { TargetSliders } from "./types";

export interface BillPreset {
  id: string;
  title: string;
  amountMajor: number;
  frequency: RecurrenceFrequency;
  dueDayOfMonth: number;
  selectedByDefault?: boolean;
}

export interface ArchetypePreset {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  incomeWeeklyMajor: number;
  savingsPct: number;
  sliders: TargetSliders;
  bills: BillPreset[];
  savingsGoalMajor: number;
  liquidSavingsMajor: number;
}

export const COMMON_BILL_PRESETS: BillPreset[] = [
  { id: "spotify", title: "Spotify", amountMajor: 199, frequency: "MONTHLY", dueDayOfMonth: 5, selectedByDefault: true },
  { id: "netflix", title: "Netflix", amountMajor: 549, frequency: "MONTHLY", dueDayOfMonth: 15, selectedByDefault: true },
  { id: "gym", title: "Gym Membership", amountMajor: 700, frequency: "MONTHLY", dueDayOfMonth: 1 },
  { id: "mobile", title: "Mobile Data / Load", amountMajor: 300, frequency: "MONTHLY", dueDayOfMonth: 20, selectedByDefault: true },
  { id: "cloud", title: "Cloud Storage", amountMajor: 1200, frequency: "ANNUALLY", dueDayOfMonth: 10 },
  { id: "wifi", title: "Home Fiber WiFi", amountMajor: 1500, frequency: "MONTHLY", dueDayOfMonth: 25 },
];

export const ARCHETYPES: ArchetypePreset[] = [
  {
    id: "student",
    title: "College Student",
    subtitle: "Allowance, campus meals, jeepney fares & Spotify",
    icon: "🎓",
    incomeWeeklyMajor: 2500,
    savingsPct: 0.15,
    sliders: {
      commuteMajor: 350,
      campusMealsMajor: 600,
      datesMajor: 300,
      snacksMajor: 150,
    },
    bills: [
      { id: "spotify", title: "Spotify", amountMajor: 199, frequency: "MONTHLY", dueDayOfMonth: 5 },
      { id: "mobile", title: "Mobile Load", amountMajor: 300, frequency: "MONTHLY", dueDayOfMonth: 20 },
    ],
    savingsGoalMajor: 15000,
    liquidSavingsMajor: 3500,
  },
  {
    id: "young_pro",
    title: "First-Job Starter",
    subtitle: "Monthly salary split, sinking subscriptions & emergency fund",
    icon: "💼",
    incomeWeeklyMajor: 6250, // ~₱25,000 / month
    savingsPct: 0.20,
    sliders: {
      commuteMajor: 600,
      campusMealsMajor: 1200,
      datesMajor: 700,
      snacksMajor: 300,
    },
    bills: [
      { id: "netflix", title: "Netflix", amountMajor: 549, frequency: "MONTHLY", dueDayOfMonth: 15 },
      { id: "gym", title: "Gym", amountMajor: 700, frequency: "MONTHLY", dueDayOfMonth: 1 },
      { id: "mobile", title: "Mobile Plan", amountMajor: 999, frequency: "MONTHLY", dueDayOfMonth: 20 },
    ],
    savingsGoalMajor: 50000,
    liquidSavingsMajor: 20000,
  },
  {
    id: "freelancer",
    title: "Freelance & Gig",
    subtitle: "Variable income, core survival floor & runway buffer",
    icon: "⚡",
    incomeWeeklyMajor: 10000,
    savingsPct: 0.25,
    sliders: {
      commuteMajor: 400,
      campusMealsMajor: 1000,
      datesMajor: 800,
      snacksMajor: 300,
    },
    bills: [
      { id: "wifi", title: "Fiber Internet", amountMajor: 1500, frequency: "MONTHLY", dueDayOfMonth: 25 },
      { id: "cloud", title: "Cloud Storage", amountMajor: 1200, frequency: "ANNUALLY", dueDayOfMonth: 10 },
      { id: "spotify", title: "Spotify", amountMajor: 199, frequency: "MONTHLY", dueDayOfMonth: 5 },
    ],
    savingsGoalMajor: 100000,
    liquidSavingsMajor: 45000,
  },
  {
    id: "custom",
    title: "Custom Minimalist",
    subtitle: "Start clean and customize your numbers from scratch",
    icon: "✨",
    incomeWeeklyMajor: 3500,
    savingsPct: 0.20,
    sliders: {
      commuteMajor: 350,
      campusMealsMajor: 500,
      datesMajor: 400,
      snacksMajor: 150,
    },
    bills: [
      { id: "spotify", title: "Spotify", amountMajor: 199, frequency: "MONTHLY", dueDayOfMonth: 5 },
    ],
    savingsGoalMajor: 30000,
    liquidSavingsMajor: 10000,
  },
];
