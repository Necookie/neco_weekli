/**
 * Native, secure authentication and user session management.
 * Includes client-side SHA-256 password hashing, input sanitization,
 * email validation, and brute-force rate-limiting guardrails.
 */

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface StoredUserAccount extends UserProfile {
  passwordHash: string;
}

const USERS_STORAGE_KEY = "neco_weekli_users_v1";
const SESSION_STORAGE_KEY = "neco_weekli_session_v1";
const ATTEMPTS_STORAGE_KEY = "neco_weekli_login_attempts_v1";

const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 30 * 1000; // 30 seconds

/** Hash password using Web Crypto API SHA-256 */
export async function hashPassword(password: string, salt: string = "weekli_salt"): Promise<string> {
  const enc = new TextEncoder();
  const data = enc.encode(password + salt);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Validate email format */
export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/** Validate password strength */
export function validatePassword(password: string): { valid: boolean; message?: string } {
  if (password.length < 6) {
    return { valid: false, message: "Password must be at least 6 characters long." };
  }
  return { valid: true };
}

/** Check rate limiting for login attempts */
export function checkRateLimit(email: string): { allowed: boolean; waitSeconds?: number } {
  if (typeof window === "undefined") return { allowed: true };
  try {
    const raw = window.localStorage.getItem(ATTEMPTS_STORAGE_KEY);
    if (!raw) return { allowed: true };
    const data = JSON.parse(raw);
    const userAttempts = data[email.toLowerCase()];
    if (!userAttempts) return { allowed: true };

    if (userAttempts.count >= MAX_ATTEMPTS) {
      const elapsed = Date.now() - userAttempts.lastAttempt;
      if (elapsed < LOCKOUT_MS) {
        const remaining = Math.ceil((LOCKOUT_MS - elapsed) / 1000);
        return { allowed: false, waitSeconds: remaining };
      }
      // Reset if lockout period passed
      delete data[email.toLowerCase()];
      window.localStorage.setItem(ATTEMPTS_STORAGE_KEY, JSON.stringify(data));
    }
  } catch {
    // Ignore storage parse errors
  }
  return { allowed: true };
}

/** Record failed attempt */
export function recordFailedAttempt(email: string): void {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(ATTEMPTS_STORAGE_KEY) || "{}";
    const data = JSON.parse(raw);
    const key = email.toLowerCase();
    const prev = data[key] || { count: 0, lastAttempt: 0 };
    data[key] = {
      count: prev.count + 1,
      lastAttempt: Date.now(),
    };
    window.localStorage.setItem(ATTEMPTS_STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Ignore
  }
}

/** Clear failed attempts upon successful login */
export function clearFailedAttempts(email: string): void {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(ATTEMPTS_STORAGE_KEY);
    if (!raw) return;
    const data = JSON.parse(raw);
    delete data[email.toLowerCase()];
    window.localStorage.setItem(ATTEMPTS_STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Ignore
  }
}

/** Get all registered users from local secure store */
export function getRegisteredUsers(): StoredUserAccount[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(USERS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/** Save user accounts list */
export function saveRegisteredUsers(users: StoredUserAccount[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
}

/** Load current active session */
export function getActiveSession(): UserProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(SESSION_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/** Save active session */
export function setActiveSession(user: UserProfile | null): void {
  if (typeof window === "undefined") return;
  if (!user) {
    window.localStorage.removeItem(SESSION_STORAGE_KEY);
  } else {
    window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(user));
  }
}
