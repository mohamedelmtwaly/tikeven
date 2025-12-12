"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { LockClosedIcon } from "@heroicons/react/24/outline";
import Spinner from "@/components/Spinner";
import { useDispatch, useSelector } from "react-redux";
import { checkoutOrder, fetchOrderById } from "@/lib/features/orderSlice";
import { AppDispatch, RootState } from "@/lib/features";
import Swal from "sweetalert2";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useStripe, useElements, CardNumberElement, CardExpiryElement, CardCvcElement } from "@stripe/react-stripe-js";
import { useTranslation } from "react-i18next";

const checkoutSchema = z.object({
  email: z
    .string()
    .email("checkout_component.validation.email_invalid"),
  cardHolder: z
    .string()
    .min(1, "checkout_component.validation.card_holder_required"),
  postalCode: z
    .string()
    .min(3, "checkout_component.validation.postal_code_required"),
});

type CheckoutFormData = z.infer<typeof checkoutSchema>;

export default function Checkout() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { error, order, loading } = useSelector(
    (state: RootState) => state.orders
  );

  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [clientSecret, setClientSecret] = useState<string>("");
  const [cardComplete, setCardComplete] = useState(false);
  const [expiryComplete, setExpiryComplete] = useState(false);
  const [cvcComplete, setCvcComplete] = useState(false);
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);
  const [cardBrand, setCardBrand] = useState<string>("unknown");
  const { t } = useTranslation("common");

  const { register, handleSubmit, formState: { errors } } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
  });

  useEffect(() => {
    dispatch(fetchOrderById(id));
  }, [dispatch, id]);

  useEffect(() => {
    if (!order) return;

    // Call backend to create PaymentIntent
    fetch("/api/create-payment-intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: Math.round(order.totalPrice * 100) }),
    })
      .then(res => res.json())
      .then(data => setClientSecret(data.clientSecret))
      .catch(err => console.error(err));
  }, [order]);

  const handleCheckout = async (data: CheckoutFormData) => {
    console.log("Checkout Data:", stripe, elements, clientSecret);
    if (!stripe || !elements || !clientSecret) return;
    setProcessing(true);

    const cardElement = elements.getElement(CardNumberElement);
    if (!cardElement) return;

    try {
      // Validate stripe elements completeness first
      if (!cardComplete || !expiryComplete || !cvcComplete) {
        setAttemptedSubmit(true);
        setProcessing(false);
        Swal.fire({
          icon: "error",
          title: t("checkout_component.incomplete_card_title"),
          text: t("checkout_component.incomplete_card_text"),
        });
        return;
      }
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: {
            card: cardElement,
            billing_details: {
              name: data.cardHolder,
              email: data.email,
              address: { postal_code: data.postalCode },
            },
          },
        }
      );

      if (stripeError) {
        Swal.fire({
          icon: "error",
          title: t("checkout_component.payment_failed_title"),
          text: stripeError.message,
        });
      } else if (paymentIntent?.status === "succeeded") {
        await dispatch(checkoutOrder({ orderId: order?.id! })).unwrap();
        Swal.fire({
          toast: true,
          position: "top-end",
          icon: "success",
          title: t("checkout_component.payment_success_title"),
          showConfirmButton: false,
          timer: 3000,
          timerProgressBar: true,
        });
        router.push("/orders");
      }
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: t("checkout_component.generic_error_title"),
      });
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <div className="text-center py-50"><Spinner /></div>;
  if (error) return <div className="text-center py-10 text-red-500">{error}</div>;

  return (
    <main className="w-full p-10 md:py-20">
      <div className="container mx-auto max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Order Summary */}
        <div className="bg-white dark:bg-subtle-dark border border-gray-200 dark:border-gray-700 p-6 rounded-xl shadow-lg flex flex-col h-full">
          <h2 className="text-2xl font-bold mb-6 text-title dark:text-white">
            {t("checkout_component.order_summary_title")}
          </h2>
          <div className="flex items-center gap-4">
            {order?.eventData?.image && <Image
              src={order?.eventData?.image}
              alt={t("checkout_component.event_image_alt")}
              width={80}
              height={80}
              className="rounded-lg object-cover ring-1 ring-gray-200 dark:ring-gray-700"
            />}
            <div>
              <h3 className="font-bold text-lg text-title dark:text-white">{order?.eventName}</h3>
              <p className="text-gray-600 dark:text-gray-300">{order?.quantity} × ${order?.price}</p>
            </div>
          </div>
          <div className="border-t border-gray-200 dark:border-gray-700 mt-6 pt-4 space-y-2 text-gray-700 dark:text-gray-200">
            <div className="flex justify-between"><span>{t("checkout_component.subtotal_label")}</span><span>${order?.totalPrice}</span></div>
            <div className="flex justify-between font-bold text-lg text-title dark:text-white"><span>{t("checkout_component.total_label")}</span><span>${(order?.totalPrice ?? 0)}</span></div>
          </div>
          <div className="mt-auto pt-4 rounded-lg border border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-800/60 dark:bg-blue-900/20 dark:text-blue-300 p-3 flex items-start gap-3">
            <span className="text-lg leading-none">📧</span>
            <div className="text-sm">
              <p className="font-medium">{t("checkout_component.email_notice_title")}</p>
              <p className="opacity-90">
                {t("checkout_component.email_notice_prefix")}
                {order?.userEmail ? (
                  <> {t("checkout_component.email_notice_to_label")} <span className="font-medium">{order.userEmail}</span>.</>
                ) : (
                  <> {t("checkout_component.email_notice_to_generic")}</>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Billing + Payment (combined in one form and one card) */}
        <form onSubmit={handleSubmit(handleCheckout)}>
          <div className="bg-white dark:bg-subtle-dark border border-gray-200 dark:border-gray-700 p-6 rounded-xl shadow-lg space-y-6">
            <h2 className="text-2xl font-bold text-title dark:text-white">
              {t("checkout_component.billing_payment_title")}
            </h2>

            {/* Billing Information */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t("checkout_component.fields.email.label")}
                </label>
                <input
                  {...register("email")}
                  type="email"
                  className="mt-1 h-10 text-sm border border-gray-300 dark:border-gray-700 rounded-md w-full px-3 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  placeholder={t("checkout_component.fields.email.placeholder")}
                />
                {errors.email && (
                  <p className="text-red-500 text-sm">
                    {t(errors.email.message as string)}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t("checkout_component.fields.card_holder.label")}
                </label>
                <input
                  {...register("cardHolder")}
                  className="mt-1 h-10 text-sm border border-gray-300 dark:border-gray-700 rounded-md w-full px-3 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  placeholder={t("checkout_component.fields.card_holder.placeholder")}
                />
                {errors.cardHolder && (
                  <p className="text-red-500 text-sm">
                    {t(errors.cardHolder.message as string)}
                  </p>
                )}
              </div>
            </div>
            

            {/* Payment Details (Stripe) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t("checkout_component.fields.card_number.label")}
                </label>
                <div className={`border ${attemptedSubmit && !cardComplete ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'} rounded-lg p-3 bg-gray-50 dark:bg-gray-900`}>
                  <CardNumberElement
                    options={{ showIcon: true, iconStyle: 'solid', style: { base: { fontSize: '16px' } } }}
                    onChange={(e:any)=> { setCardComplete(e.complete); if (e.brand) setCardBrand(e.brand); }}
                  />
                </div>
                {attemptedSubmit && !cardComplete && (
                  <p className="mt-1 text-xs text-red-500">
                    {t("checkout_component.fields.card_number.required")}
                  </p>
                )}
                <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {t("checkout_component.fields.card_number.card_type_label")} <span className="font-medium">{cardBrand}</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t("checkout_component.fields.expiry.label")}
                </label>
                <div className={`border ${attemptedSubmit && !expiryComplete ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'} rounded-lg p-3 bg-gray-50 dark:bg-gray-900`}>
                  <CardExpiryElement options={{ style: { base: { fontSize: '16px' } } }} onChange={(e:any)=> setExpiryComplete(e.complete)} />
                </div>
                {attemptedSubmit && !expiryComplete && (
                  <p className="mt-1 text-xs text-red-500">
                    {t("checkout_component.fields.expiry.required")}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t("checkout_component.fields.cvc.label")}
                </label>
                <div className={`border ${attemptedSubmit && !cvcComplete ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'} rounded-lg p-3 bg-gray-50 dark:bg-gray-900`}>
                  <CardCvcElement options={{ style: { base: { fontSize: '16px' } } }} onChange={(e:any)=> setCvcComplete(e.complete)} />
                </div>
                {attemptedSubmit && !cvcComplete && (
                  <p className="mt-1 text-xs text-red-500">
                    {t("checkout_component.fields.cvc.required")}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t("checkout_component.fields.postal_code.label")}
                </label>
                <input
                  {...register("postalCode")}
                  className="mt-1 h-10 text-sm border border-gray-300 dark:border-gray-700 rounded-md w-full px-3 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  placeholder={t("checkout_component.fields.postal_code.placeholder")}
                />
                {errors.postalCode && (
                  <p className="text-red-500 text-sm">
                    {t(errors.postalCode.message as string)}
                  </p>
                )}
              </div>
            </div>

            <button type="submit" disabled={processing} className={`w-full bg-primary cursor-pointer text-white py-4 px-8 rounded-full font-semibold text-lg flex items-center justify-center gap-2 transition-all ${processing ? "cursor-not-allowed bg-primary/70" : "hover:bg-primary-800/90 hover:shadow-lg"}`}>
              {processing ? (
                <>
                  <span>{t("checkout_component.button_processing")}</span>
                  <span className="inline-flex mt-1 ">
                     <Spinner size="h-4 w-4" color="border-white" padding="p-0" />
                  </span>
                </>
              ) : (
                <>
                  <LockClosedIcon className="w-5 h-5" />
                  <span>{t("checkout_component.button_confirm_purchase")}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
