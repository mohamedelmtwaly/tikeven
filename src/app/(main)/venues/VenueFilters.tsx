"use client";

import "@/i18n/client";
import Select from "react-select";
import { useTranslation } from "react-i18next";

interface FiltersProps {
  venues: any[];
  city: string;
  setCity: (val: string) => void;
  capacity: string;
  setCapacity: (val: string) => void;
  setCurrentPage: (val: number) => void;
}

export default function VenueFilters({
  venues,
  city,
  setCity,
  capacity,
  setCapacity,
  setCurrentPage,
}: FiltersProps) {
  const { t } = useTranslation();
  const cityOptions = [...new Set(venues.map((v) => v.city))].map((c) => ({
    value: c,
    label: c,
  }));

  const capacityOptions = [
    { value: "small", label: t("filters_capacity_small", { defaultValue: "Small (<3,000)" }) },
    { value: "medium", label: t("filters_capacity_medium", { defaultValue: "Medium (3,000–10,000)" }) },
    { value: "large", label: t("filters_capacity_large", { defaultValue: "Large (>10,000)" }) },
  ];

  const customStyles = {
    control: (base: any) => ({
      ...base,
      borderRadius: "9999px",
      borderColor: "var(--color-border)",
      minHeight: "40px",
      boxShadow: "none",
      "&:hover": { borderColor: "var(--color-primary-500)" },
    }),
    menu: (base: any) => ({
      ...base,
      borderRadius: "0.5rem",
    }),
  };

  return (
    <div className="flex flex-col lg:flex-row justify-center items-center gap-4 w-full">
      <Select
        className="w-full max-w-[180px]"
        options={cityOptions}
        value={cityOptions.find((c) => c.value === city) || null}
        onChange={(option) => {
          setCity(option ? option.value : "");
          setCurrentPage(1);
        }}
        placeholder={t("filters_city_placeholder", { defaultValue: "City" })}
        isClearable
        styles={customStyles}
      />

      <Select
        className="w-full max-w-[180px]"
        options={capacityOptions}
        value={capacityOptions.find((c) => c.value === capacity) || null}
        onChange={(option) => {
          setCapacity(option ? option.value : "");
          setCurrentPage(1);
        }}
        placeholder={t("filters_capacity_placeholder", { defaultValue: "Capacity" })}
        isClearable
        styles={customStyles}
      />
    </div>
  );
}
