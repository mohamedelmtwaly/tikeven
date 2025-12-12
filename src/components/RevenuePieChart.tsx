"use client";

import { Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchCategories } from "@/lib/features/categorySlice";
import { RootState, AppDispatch } from "@/lib/features";
import Spinner from "@/components/Spinner";
import { useTranslation } from "react-i18next";

ChartJS.register(ArcElement, Tooltip, Legend);

export default function RevenuePieChart() {
  const { t } = useTranslation("common");
  const dispatch = useDispatch<AppDispatch>();
  const { revenueByCategory, loading } = useSelector(
    (state: RootState) => state.analytics
  );
  const { categories } = useSelector((state: RootState) => state.categories);
  const { currentUser } = useSelector((state: RootState) => state.users);

  useEffect(() => {
    if (!categories || categories.length === 0) {
      dispatch(fetchCategories());
    }
  }, [dispatch, categories]);

  console.log(revenueByCategory);
  const labels = (categories && categories.length)
    ? categories.map((c) => c.name)
    : Object.keys(revenueByCategory || {});

  const values = (categories && categories.length)
    ? categories.map((c) => revenueByCategory[(c.id ?? "Other") as string] ?? 0)
    : Object.values(revenueByCategory || {});

  const data = {
    labels,
    datasets: [
      {
        label: t("organizer_analytics.revenue_by_category"),
        data: values,
        backgroundColor: [
          "#3B82F6", "#10B981","#8B5CF6", "#F59E0B", "#EF4444",
          , "#F472B6", "#14B8A6", "#FBBF24",
        ],
        borderColor: "transparent",
        borderWidth: 0,
        hoverBorderColor: "transparent",
        hoverBorderWidth: 0,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: { legend: { position: "right" as const } },
    elements: { arc: { borderWidth: 0, borderColor: "transparent" } },
  };

  const total = values.reduce((sum, n) => sum + (Number(n) || 0), 0);
  if (loading)
    return (
      <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 lg:col-span-2">
        <h2 className="text-lg font-bold text-neutral-900 dark:text-white mb-4">
          {t("organizer_analytics.revenue_by_category")}
        </h2>
        <Spinner size="h-6 w-6" color="border-neutral-400" />
      </div>
    );
  if (!labels.length || !values.length || total <= 0)
    return (
      <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 lg:col-span-2">
        <h2 className="text-lg font-bold text-neutral-900 dark:text-white mb-4">
          {t("organizer_analytics.revenue_by_category")}
        </h2>
        {labels.length ? (
          <div>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-2">{t("organizer_analytics.available_categories")}</p>
            <ul className="flex flex-wrap gap-2">
              {labels.map((label) => (
                <li key={label} className="text-sm px-2 py-1 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200">
                  {label}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="text-sm text-neutral-500 dark:text-neutral-400">{t("organizer_analytics.no_data_available")}</p>
        )}
      </div>
    );

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 lg:col-span-2">
      <h2 className="text-lg font-bold text-neutral-900 dark:text-white mb-4">
        {t("organizer_analytics.revenue_by_category")}
      </h2>
      <div className="max-w-md mx-auto">
        <Pie data={data} options={options} />
      </div>
    </div>
  );
}
