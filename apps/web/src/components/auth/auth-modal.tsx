"use client";

import { AlertCircle, Check, Lock, Mail, ShieldCheck, User, X } from "lucide-react";
import { useState } from "react";
import { useAppStore } from "@/lib/store";

export function AuthModal() {
  const { isAuthModalOpen, closeAuthModal, signIn, signUp } = useAppStore();
  const [tab, setTab] = useState<"signin" | "signup">("signin");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isAuthModalOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (tab === "signin") {
      const res = await signIn(email, password);
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
      const res = await signUp(name, email, password);
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
                  ? "Access your financial runway across devices"
                  : "Start planning your weekly buffer with zero guesswork"}
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
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
                  className="w-full rounded-xl border border-black/10 bg-canvas-soft/40 py-2.5 pl-9 pr-3 text-sm text-ink outline-none transition focus:border-ink focus:bg-canvas"
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
                className="w-full rounded-xl border border-black/10 bg-canvas-soft/40 py-2.5 pl-9 pr-3 text-sm text-ink outline-none transition focus:border-ink focus:bg-canvas"
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
                className="w-full rounded-xl border border-black/10 bg-canvas-soft/40 py-2.5 pl-9 pr-3 text-sm text-ink outline-none transition focus:border-ink focus:bg-canvas"
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
                  placeholder="Re-type your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-xl border border-black/10 bg-canvas-soft/40 py-2.5 pl-9 pr-3 text-sm text-ink outline-none transition focus:border-ink focus:bg-canvas"
                />
              </div>
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-primary py-3 font-display text-sm font-extrabold text-on-primary transition hover:bg-primary-active active:scale-[0.98] disabled:opacity-50"
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
          Secured with client SHA-256 password hashing &amp; brute-force protection.
        </p>
      </div>
    </div>
  );
}
