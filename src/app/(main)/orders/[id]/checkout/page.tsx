"use client";

import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import Checkout from "@/components/Checkout";
import { useTranslation } from "react-i18next";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export default function CheckoutPage() {
  const { t } = useTranslation("common");
  return (
    <>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center">
        <h1 className="text-2xl md:text-3xl font-bold text-primary dark:text-white">
          <span suppressHydrationWarning>{t("checkout_page.title")}</span>
        </h1>
      </div>
      <Elements stripe={stripePromise}>
        <Checkout />
      </Elements>
    </>
  );
}
