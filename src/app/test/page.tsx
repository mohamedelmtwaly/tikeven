"use client";

import { motion } from "framer-motion";
import Image from "next/image";

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-primary-50 p-6">
      <div className="grid w-full max-w-6xl grid-cols-1 gap-10 lg:grid-cols-2 items-stretch">
        {/* LEFT SIDE */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="flex flex-col justify-between text-center lg:text-left h-full"
        >
          {/* TOP TEXT SECTION */}
          <div className="flex flex-col items-center text-center pt-6 mx-8 space-y-8 max-w-md gap-6">
            <p className="text-sm tracking-widest text-gray-600">
              LARGEST FASHION STORE
            </p>

            <h1 className="text-4xl font-serif font-bold leading-snug text-gray-900">
              OFFERS POWERED <br /> BY{" "}
              <span className="text-primary-700">DESIGNERS</span> <br /> AROUND
              THE WORLD.
            </h1>
            <p className="text-gray-600">
              Don’t have an account?{" "}
              <a
                href="#"
                className="underline font-medium hover:text-primary-700 transition"
              >
                Create account →
              </a>
            </p>
          </div>
          {/* IMAGE AT THE END */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8, duration: 0.8 }}
            className="relative mt-12"
          >
            <Image
              src="/images/event.jpg"
              alt="About us"
              width={650}
              height={400}
              className="rounded-3xl object-cover"
            />
            <div className="absolute inset-0 bg-black/20 rounded-3xl flex flex-col justify-end p-6 text-white text-left">
              <h2 className="text-lg font-semibold mb-2">Upcoming Events</h2>
              <p className="text-sm">
                Discover new fashion events and exclusive runway experiences
                near you.
              </p>
            </div>
          </motion.div>
        </motion.div>

        {/* RIGHT SIDE */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1.2 }}
          className="relative flex justify-center items-center"
        >
          <div className="relative rounded-3xl overflow-hidden">
            <Image
              src="/images/22.jpg"
              alt="Fashion"
              width={430}
              height={800}
              className="object-cover"
            />
          </div>

          {/* LOGIN CARD */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.8 }}
            className="absolute bottom-10 bg-white rounded-3xl shadow-xl w-[320px] p-6"
          >
            <h2 className="text-lg font-semibold text-center mb-4">
              Login to your account
            </h2>
            <form className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-600">
                  Username
                </label>
                <input
                  type="text"
                  placeholder="Your username"
                  className="w-full border-b focus:outline-none focus:border-black py-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">
                  Password
                </label>
                <input
                  type="password"
                  placeholder="********"
                  className="w-full border-b focus:outline-none focus:border-black py-1"
                />
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2">
                  <input type="checkbox" />
                  Remember me
                </label>
                <a href="#" className="text-gray-600 hover:underline">
                  Forgot your password?
                </a>
              </div>

              <button
                type="submit"
                className="w-full bg-black text-white rounded-full py-2 mt-3 hover:bg-gray-800 transition"
              >
                Login
              </button>
            </form>
          </motion.div>
        </motion.div>
      </div>
    </main>
  );
}
