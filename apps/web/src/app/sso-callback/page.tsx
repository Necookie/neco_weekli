import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";

export default function SSOCallbackPage() {
  return (
    <div className="flex min-h-[60dvh] items-center justify-center p-4">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <p className="font-display text-sm font-semibold text-ink">
          Completing Google Authentication...
        </p>
        <AuthenticateWithRedirectCallback />
      </div>
    </div>
  );
}
