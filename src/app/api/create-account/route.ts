// In create-account/route.ts
import Stripe from "stripe";
import { NextResponse } from "next/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: Request) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const account = await stripe.accounts.create({
      type: "express",
    });

    const link = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/organizers/settings?refresh`,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/organizers/settings?success`,
      type: "account_onboarding",
    });

    return NextResponse.json({
      accountId: account.id,
      onboardingUrl: link.url,
      userId: userId,
    });
  } catch (err: any) {
    console.error("Error creating Stripe account:", err);
    return NextResponse.json(
      { error: err.message || "Failed to create Stripe account" },
      { status: 400 }
    );
  }
}
