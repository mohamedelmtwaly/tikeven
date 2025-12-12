import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2022-11-15" as unknown as Stripe.LatestApiVersion,
});

export async function POST(req: NextRequest) {
  try {
    const { amount } = await req.json();
    console.log(amount);

    if (!amount) {
      return NextResponse.json(
        { error: "Amount is required" },
        { status: 400 }
      );
    }
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: "usd",
    });
    return NextResponse.json({ clientSecret: paymentIntent.client_secret });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
