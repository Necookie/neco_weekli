/**
 * Clerk webhook receiver. Its only job today is `user.deleted`: when an
 * account is removed directly through Clerk (its hosted account portal or
 * the Clerk dashboard) rather than via our in-app "Delete Account" button,
 * nothing else tells Turso that user's rows should go away — this endpoint
 * is what closes that gap. See deleteAccountAction() in lib/server/actions.ts
 * for the other half of account deletion (in-app, deletes Clerk too).
 *
 * Requires CLERK_WEBHOOK_SIGNING_SECRET (see .env.example) — configure this
 * route's URL (`/api/webhooks/clerk`) as an endpoint in the Clerk dashboard
 * subscribed to the `user.deleted` event, then copy its signing secret in.
 */

import { verifyWebhook } from "@clerk/nextjs/webhooks";
import { NextResponse, type NextRequest } from "next/server";
import { deleteUser } from "@/lib/server/repo";

export async function POST(request: NextRequest) {
  let event: Awaited<ReturnType<typeof verifyWebhook>>;
  try {
    event = await verifyWebhook(request);
  } catch (err) {
    console.error("Clerk webhook signature verification failed:", err);
    return new NextResponse("Webhook verification failed", { status: 400 });
  }

  if (event.type === "user.deleted") {
    const userId = event.data.id;
    if (userId) {
      await deleteUser(userId);
    }
  }

  return NextResponse.json({ received: true });
}
