/**
 * Barrel for the web app's lib layer.
 *
 * Import order follows the dependency graph — types first, then seed, then
 * derived/computed modules. The store and storage utilities are intentionally
 * NOT re-exported here because they pull in React or DOM globals.
 */

export * from "./types.ts";
export * from "./seed.ts";
export * from "./dashboard.ts";
export * from "./format.ts";
export * from "./nav.ts";
