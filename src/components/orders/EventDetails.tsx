"use client";

import { useState } from "react";
import {
  CalendarDaysIcon,
  MapPinIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/outline";

export default function EventDetails() {
  const [quantity, setQuantity] = useState(1);
  const price = 45.0;
  const limit = 10;
  const subtotal = quantity * price;

  const decrease = () => setQuantity(Math.max(0, quantity - 1));
  const increase = () => setQuantity(Math.min(limit, quantity + 1));

  return (
    <div className="max-w-4xl mx-auto -mt-16 md:-mt-20 lg:-mt-24 relative z-10">
      {/* Event Info */}
      <div className="bg-white rounded-xl shadow-2xl p-6 sm:p-8 mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-title tracking-tight">
          Vibrant Lights Concert
        </h1>
        <p className="mt-2 text-lg text-subtitle">
          Experience a night of electrifying performances.
        </p>

        <div className="mt-6 border-t border-gray-200 pt-6 grid sm:grid-cols-2 gap-6">
          <div className="flex items-start gap-4">
            <CalendarDaysIcon className="w-8 h-8 text-primary" />
            <div>
              <h2 className="font-semibold text-title">Date &amp; Time</h2>
              <p className="text-normal">Saturday, Dec 14, 2024 @ 8:00 PM</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <MapPinIcon className="w-8 h-8 text-primary" />
            <div>
              <h2 className="font-semibold text-title">Venue</h2>
              <p className="text-normal">The Grand Arena, New York, NY</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-2xl p-6 sm:p-8">
        <h3 className="text-2xl font-bold text-title">Select Your Tickets</h3>

        <div className="mt-6 p-4 rounded-lg border border-gray-200 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          {/* Ticket Info */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full gap-3">
            <h4 className="text-lg font-semibold text-title">
              General Admission
            </h4>
            <p className="text-2xl font-bold text-primary">
              ${price.toFixed(2)}
            </p>
          </div>

          {/* Quantity Selector */}
          <div className="flex items-center justify-between md:justify-end w-full md:w-auto gap-4">
            <span className="text-base font-medium text-normal">Quantity</span>
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
              <p className="text-xl text-normal">Total:</p>
              <p className="text-4xl font-bold text-primary">
                ${subtotal.toFixed(2)}
              </p>
            </div>

            <button
              disabled={subtotal === 0}
              className="w-full sm:w-auto btn flex items-center justify-center gap-2 py-4 text-lg"
            >
              <span>Proceed to Checkout</span>
              <ArrowRightIcon className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
