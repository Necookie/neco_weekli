import { SignUp } from "@clerk/nextjs";
import { Wordmark } from "@/components/ui/wordmark";

export default function SignUpPage() {
  return (
    <div className="flex min-h-[75dvh] flex-col items-center justify-center px-4 py-8">
      <div className="mb-6 flex flex-col items-center gap-2 text-center">
        <Wordmark size="lg" />
        <p className="text-xs text-mute">
          Build your weekly buffer and financial runway.
        </p>
      </div>

      <SignUp />
    </div>
  );
}
