import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata, Viewport } from "next";
import { Inter, Manrope } from "next/font/google";
import { AppShell } from "@/components/app-shell";
import { AppDataProvider } from "@/lib/store";
import { PwaRegister } from "./pwa-register";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["400", "600"],
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  weight: ["700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Weekli",
  description: "Know exactly what's safe to spend today.",
  applicationName: "Weekli",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Weekli",
  },
};

export const viewport: Viewport = {
  themeColor: "#e8ebe6",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${manrope.variable}`}>
      <body>
        <ClerkProvider
          appearance={{
            variables: {
              colorPrimary: "#9fe870",
              colorBackground: "#ffffff",
              colorInput: "#ffffff",
              borderRadius: "1rem",
              fontFamily: "var(--font-inter), sans-serif",
            },
            elements: {
              formButtonPrimary:
                "bg-primary hover:bg-primary-active text-ink-deep font-semibold rounded-xl transition shadow-xs",
              card: "rounded-xl border border-black/5 shadow-sm bg-canvas",
              headerTitle: "font-display font-extrabold text-ink tracking-tight",
              headerSubtitle: "text-mute text-xs",
              socialButtonsBlockButton: "rounded-xl border border-black/10 hover:bg-canvas-soft transition",
            },
          }}
        >
          <AppDataProvider>
            <AppShell>{children}</AppShell>
          </AppDataProvider>
          <PwaRegister />
        </ClerkProvider>
      </body>
    </html>
  );
}
