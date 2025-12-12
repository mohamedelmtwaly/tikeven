/** @format */
"use client";

import React from "react";

interface VenueMapProps {
  latitude?: number | null;
  longitude?: number | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  title?: string | null;
}

export default function VenueMap({
  latitude,
  longitude,
  address,
  city,
  country,
  title,
}: VenueMapProps) {
  // prefer lat/lng if available, otherwise fall back to address/title search
  let src = "";
  if (typeof latitude === "number" && typeof longitude === "number") {
    src = `https://www.google.com/maps?q=${latitude},${longitude}&hl=en&z=15&output=embed`;
  } else {
    const addr = [address, city, country].filter(Boolean).join(", ");
    const q = encodeURIComponent(addr || title || "");
    src = `https://www.google.com/maps?q=${q}&hl=en&z=12&output=embed`;
  }

  return (
    <div className="w-full aspect-video rounded-xl overflow-hidden shadow-lg border border-border">
      <iframe
        src={src}
        width="100%"
        height="100%"
        style={{ border: 0 }}
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        title={title ? `${title} - map` : "Venue map"}
      />
    </div>
  );
}
