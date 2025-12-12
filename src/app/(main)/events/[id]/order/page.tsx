"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/lib/features";
import { createOrderWithTickets, checkoutOrder } from "@/lib/features/orderSlice";
import {
  CalendarDaysIcon,
  MapPinIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/outline";
import Swal from "sweetalert2";
import { fetchUserFromFirebase } from "@/lib/features/userSlice";
import { fetchEventById } from "@/lib/features/eventSlice";
import Spinner from "@/components/Spinner";
import { useTranslation } from "react-i18next";

export default function Page() {
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const { currentUser: user } = useSelector((state: RootState) => state.users);
  const { currentEvent: event, loading: eventLoading } = useSelector(
    (state: RootState) => state.events
  );

  console.log("Event in Order Page:", event);
  const price = event?.price || 0;
  const isFreeEvent = event?.isFree || price === 0;
  const limit = 5;
  const subtotal = quantity * price;

  const dispatch = useDispatch<AppDispatch>();
  const params = useParams();
  const router = useRouter(); // ✅ initialize router
  const { t } = useTranslation("common");

  const eventId = params?.id as string;
  const userId = user?.id;

  useEffect(() => {
    dispatch(fetchUserFromFirebase());
    dispatch(fetchEventById(eventId));
  }, [dispatch, eventId]);

  const decrease = () => setQuantity(Math.max(0, quantity - 1));
  const increase = () => setQuantity(Math.min(limit, quantity + 1));

  const handleCheckout = async () => {
    if (!event || !userId || quantity <= 0) return;
    setLoading(true);

    try {
      const totalPrice = isFreeEvent ? 0 : subtotal;
      const newOrder = await dispatch(
        createOrderWithTickets({
          eventId,
          userId,
          quantity,
          totalPrice,
          userEmail: user?.email,
          eventName: event?.title,
          eventDate: event?.startDate,
          price: event?.price,
          eventLocation: event?.venueData?.address,
        })
      ).unwrap();

      if (isFreeEvent) {
        // For free events, immediately confirm the order and skip payment
        await dispatch(checkoutOrder({ orderId: newOrder.id }) as any);

        Swal.fire({
          toast: true,
          position: "top-end",
          icon: "success",
          title: t("event_order_page.toast_order_created"),
          showConfirmButton: false,
          timer: 3000,
          timerProgressBar: true,
        });

        // Redirect to the user's orders list
        router.push(`/orders`);
      } else {
        Swal.fire({
          toast: true,
          position: "top-end",
          icon: "success",
          title: t("event_order_page.toast_order_created"),
          showConfirmButton: false,
          timer: 3000,
          timerProgressBar: true,
        });

        // Paid events go through checkout flow
        router.push(`/orders/${newOrder.id}/checkout`);
      }
    } catch (error: unknown) {
      console.error(error);
      alert(error);
    } finally {
      setLoading(false);
    }
  };

  if (eventLoading)
    return (
      <div className="text-center py-50">
        <Spinner />
      </div>
    );

  return (
    <main className="w-full pb-16">
      {/* Banner */}
      <div className="relative h-64 md:h-80 lg:h-96">
        {event?.images[0] && (
          <Image
            alt={t("event_order_page.banner_alt")}
            src={event?.images[0]}
            fill
            className="object-cover"
            priority
          />
        )}
        <div className="absolute inset-0 bg-linear-to-t from-black/60 to-black/20"></div>
      </div>

      {/* Event Info */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto -mt-16 md:-mt-20 lg:-mt-24 relative z-10">
          <div className="bg-white rounded-xl shadow-2xl p-6 sm:p-8 mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-title tracking-tight">
              {event?.title}
            </h1>
            <p className="mt-2 text-lg text-subtitle">{event?.description}</p>

            <div className="mt-6 border-t border-gray-200 pt-6 grid sm:grid-cols-2 gap-6">
              <div className="flex items-start gap-4">
                <CalendarDaysIcon className="w-8 h-8 text-primary" />
                <div>
                  <h2 className="font-semibold text-title">
                    {t("event_order_page.date_time_label")}
                  </h2>
                  <p className="text-normal">
                    {new Date(event?.startDate || "").toLocaleString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                    })}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <MapPinIcon className="w-8 h-8 text-primary" />
                <div>
                  <h2 className="font-semibold text-title">
                    {t("event_order_page.venue_label")}
                  </h2>
                  <p className="text-normal">{event?.venueData?.address}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Ticket Selection */}
          <div className="bg-white rounded-xl shadow-2xl p-6 sm:p-8">
            <h3 className="text-2xl font-bold text-title">
              {t("event_order_page.select_tickets_title")}
            </h3>

            <div className="mt-6 p-4 rounded-lg border border-gray-200 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="grow">
                <h4 className="text-lg font-semibold text-title">
                  {t("event_order_page.general_admission_label")}
                </h4>
                <p className="text-2xl font-bold text-primary">
                  {isFreeEvent ? t("event_order_page.free_label", { defaultValue: "Free" }) : `$${price.toFixed(2)}`}
                </p>
              </div>

              <div className="flex items-center gap-4 w-full md:w-auto">
                <span className="text-base font-medium text-normal">
                  {t("event_order_page.quantity_label")}
                </span>
                <div className="flex items-center gap-3 p-1 rounded-full bg-gray-100">
                  <button
                    onClick={decrease}
                    disabled={quantity <= 0}
                    className="w-10 h-10 rounded-full bg-white text-title flex items-center justify-center font-bold text-xl hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                  >
                    -
                  </button>
                  <span className="text-xl font-bold w-12 text-center">
                    {quantity}
                  </span>
                  <button
                    onClick={increase}
                    disabled={quantity >= limit}
                    className="w-10 h-10 rounded-full bg-white text-title flex items-center justify-center font-bold text-xl hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-8 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="flex items-baseline gap-3">
                  <p className="text-xl text-normal">
                    {t("event_order_page.total_label")}
                  </p>
                  <p className="text-4xl font-bold text-primary">
                    {isFreeEvent ? t("event_order_page.free_label", { defaultValue: "Free" }) : `$${subtotal.toFixed(2)}`}
                  </p>
                </div>

                <button
                  onClick={handleCheckout}
                  disabled={quantity === 0 || loading || !userId || !event}
                  className="w-full sm:w-auto btn flex items-center justify-center gap-2 py-4 text-lg"
                >
                  {loading
                    ? t("event_order_page.processing")
                    : t("event_order_page.proceed_to_checkout")}
                  <ArrowRightIcon className="w-6 h-6" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
