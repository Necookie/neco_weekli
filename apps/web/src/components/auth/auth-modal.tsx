"use client";

import { useClerk } from "@clerk/nextjs";
import { AlertCircle, Lock, Mail, ShieldCheck, User, X } from "lucide-react";
import { useState } from "react";
import { useAppStore } from "@/lib/store";

export function AuthModal() {
  const { isAuthModalOpen, closeAuthModal, signIn: nativeSignIn, signUp: nativeSignUp } = useAppStore();
  const clerk = useClerk();

  const [tab, setTab] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  if (!isAuthModalOpen) return null;

  async function handleGoogleOAuth() {
    setError(null);
    setGoogleLoading(true);

    try {
      if (tab === "signin") {
        clerk.openSignIn();
      } else {
        clerk.openSignUp();
      }
      closeAuthModal();
    } catch (err) {
      console.error("Google Auth error:", err);
      setError(err instanceof Error ? err.message : "Google sign-in could not be opened.");
    } finally {
      setGoogleLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (tab === "signin") {
      const res = await nativeSignIn(email, password);
      setLoading(false);
      if (!res.success) {
        setError(res.error || "Failed to sign in.");
      } else {
        closeAuthModal();
      }
    } else {
      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        setLoading(false);
        return;
      }
      const res = await nativeSignUp(name, email, password);
      setLoading(false);
      if (!res.success) {
        setError(res.error || "Failed to create account.");
      } else {
        closeAuthModal();
      }
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in">
      <div
        className="w-full max-w-md overflow-hidden rounded-xl border border-black/5 bg-canvas p-6 shadow-2xl transition-all"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-black/5">
          <div className="flex items-center gap-2">
            <span className="grid size-8 place-items-center rounded-lg bg-primary/20 text-ink">
              <ShieldCheck className="size-4 text-ink-deep" />
            </span>
            <div>
              <h2 className="font-display text-lg font-extrabold text-ink">
                {tab === "signin" ? "Sign In to Weekli" : "Create Your Account"}
              </h2>
              <p className="text-xs text-mute">
                {tab === "signin"
                  ? "Access your financial runway & safe-to-spend"
                  : "Calibrate your weekly plan and track survival buffer"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={closeAuthModal}
            aria-label="Close modal"
            className="rounded-full p-1.5 text-mute hover:bg-canvas-soft hover:text-ink transition"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="mt-4 flex rounded-xl bg-canvas-soft p-1">
          <button
            type="button"
            onClick={() => {
              setTab("signin");
              setError(null);
            }}
            className={`flex-1 rounded-lg py-2 text-xs font-bold transition ${
              tab === "signin"
                ? "bg-canvas text-ink shadow-xs"
                : "text-mute hover:text-ink"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setTab("signup");
              setError(null);
            }}
            className={`flex-1 rounded-lg py-2 text-xs font-bold transition ${
              tab === "signup"
                ? "bg-canvas text-ink shadow-xs"
                : "text-mute hover:text-ink"
            }`}
          >
            Register
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-negative/10 p-3 text-xs font-medium text-negative-darkest">
            <AlertCircle className="size-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Google OAuth Button */}
        <div className="mt-4">
          <button
            type="button"
            onClick={handleGoogleOAuth}
            disabled={googleLoading}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-black/10 bg-canvas py-2.5 px-4 text-xs font-bold text-ink shadow-xs transition hover:bg-canvas-soft active:scale-[0.98] disabled:opacity-50"
          >
            <svg className="size-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>
              {googleLoading
                ? "Connecting to Google..."
                : tab === "signin"
                  ? "Continue with Google"
                  : "Sign Up with Google"}
            </span>
          </button>
        </div>

        {/* Divider */}
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-black/10" />
          </div>
          <div className="relative flex justify-center text-[10px] uppercase">
            <span className="bg-canvas px-2 text-mute">or with email &amp; password</span>
          </div>
        </div>

        {/* Email / Password Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          {tab === "signup" && (
            <div>
              <label className="mb-1 block text-xs font-semibold text-body">
                Full Name or Nickname
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-mute">
                  <User className="size-4" />
                </span>
                <input
                  type="text"
                  required
                  placeholder="e.g. Neco"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-black/10 bg-canvas-soft/40 py-2 pl-9 pr-3 text-sm text-ink outline-none transition focus:border-ink focus:bg-canvas"
                />
              </div>
            </div>
          )}

          <div>
            <label className="mb-1 block text-xs font-semibold text-body">
              Email Address
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-mute">
                <Mail className="size-4" />
              </span>
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-black/10 bg-canvas-soft/40 py-2 pl-9 pr-3 text-sm text-ink outline-none transition focus:border-ink focus:bg-canvas"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-body">
              Password
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-mute">
                <Lock className="size-4" />
              </span>
              <input
                type="password"
                required
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-black/10 bg-canvas-soft/40 py-2 pl-9 pr-3 text-sm text-ink outline-none transition focus:border-ink focus:bg-canvas"
              />
            </div>
          </div>

          {tab === "signup" && (
            <div>
              <label className="mb-1 block text-xs font-semibold text-body">
                Confirm Password
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-mute">
                  <Lock className="size-4" />
                </span>
                <input
                  type="password"
                  required
                  placeholder="Re-type password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-xl border border-black/10 bg-canvas-soft/40 py-2 pl-9 pr-3 text-sm text-ink outline-none transition focus:border-ink focus:bg-canvas"
                />
              </div>
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-primary py-2.5 font-display text-sm font-extrabold text-on-primary transition hover:bg-primary-active active:scale-[0.98] disabled:opacity-50"
            >
              {loading
                ? "Processing..."
                : tab === "signin"
                  ? "Sign In"
                  : "Create Account"}
            </button>
          </div>
        </form>

        <p className="mt-4 text-center text-[11px] text-mute">
          Secured with Clerk Google SSO &amp; client SHA-256 password protection.
        </p>
      </div>
    </div>
  );
}
