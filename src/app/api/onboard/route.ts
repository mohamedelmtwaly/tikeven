import Stripe from "stripe";
import { NextResponse } from "next/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  try {
    const { accountId, userId } = await req.json();

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    if (!accountId) {
      return NextResponse.json(
        { error: "Account ID is required" },
        { status: 400 }
      );
    }

    const link = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/organizers/settings?refresh`,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/organizers/settings?success=true`,
      type: "account_onboarding",
    });

    return NextResponse.json({ 
      url: link.url,
      success: true 
    });
  } catch (error: any) {
    console.error('Error in onboarding:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to start onboarding' },
      { status: 500 }
    );
  }
}
