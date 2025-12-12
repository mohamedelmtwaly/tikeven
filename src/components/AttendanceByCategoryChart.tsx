'use client';

import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";
import { useTranslation } from "react-i18next";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchCategories } from "@/lib/features/categorySlice";
import { RootState, AppDispatch } from "@/lib/features";
import Spinner from "@/components/Spinner";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend
);

export default function AttendanceByCategoryChart() {
  const { t } = useTranslation("common");
  const dispatch = useDispatch<AppDispatch>();
  const { attendanceByCategory, loading } = useSelector(
    (state: RootState) => state.analytics
  );
  const { categories } = useSelector((state: RootState) => state.categories);

  useEffect(() => {
    if (!categories || categories.length === 0) {
      dispatch(fetchCategories());
    }
  }, [dispatch, categories]);

  const getCategoryName = (categoryId: string) => {
    if (!categories || categories.length === 0) return categoryId;
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.name : categoryId;
  };

  // Generate chart data including all categories, even those with zero attendance
  // and sort them by checked-in count in descending order
  const sortedCategories = [...(categories || [])].sort((a, b) => {
    const aId = a.id || ''; // Provide a default empty string if id is undefined
    const bId = b.id || ''; // Provide a default empty string if id is undefined
    const countA = attendanceByCategory && aId in attendanceByCategory ? attendanceByCategory[aId] : 0;
    const countB = attendanceByCategory && bId in attendanceByCategory ? attendanceByCategory[bId] : 0;
    return countB - countA; // Sort in descending order
  });

  const chartData = {
    labels: sortedCategories.map(cat => cat.name),
    datasets: [
      {
        label: t("tickets.checked_in"),
        data: sortedCategories.map(cat => {
          const catId = cat.id || '';
          return attendanceByCategory && catId in attendanceByCategory ? attendanceByCategory[catId] : 0;
        }),
        backgroundColor: (context: any) => {
          const index = context.dataIndex % 12;
          const colors = [
            "#3B82F6", "#10B981", "#8B5CF6", "#F59E0B", "#EF4444",
            "#F472B6", "#14B8A6", "#FBBF24", "#6366F1", "#EC4899",
            "#10B981", "#F59E0B"
          ];
          return colors[index];
        },
        borderRadius: 4,
        borderSkipped: false,
        barPercentage: 0.8,
        categoryPercentage: 0.8,
        borderColor: (context: any) => {
          const index = context.dataIndex % 12;
          const colors = [
            "#2563EB", "#059669", "#7C3AED", "#D97706", "#DC2626",
            "#DB2777", "#0D9488", "#F59E0B", "#4F46E5", "#DB2777",
            "#059669", "#D97706"
          ];
          return colors[index];
        },
        borderWidth: 1,
        hoverBackgroundColor: (context: any) => {
          const index = context.dataIndex % 12;
          const colors = [
            "#1D4ED8", "#047857", "#6D28D9", "#B45309", "#B91C1C",
            "#BE185D", "#0F766E", "#D97706", "#4338CA", "#BE185D",
            "#047857", "#B45309"
          ];
          return colors[index];
        },
        hoverBorderColor: 'rgba(0, 0, 0, 0.3)',
        hoverBorderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 1000,
      easing: 'easeOutQuart',
      x: {
        type: 'number',
        from: 0,
        duration: 1000,
        easing: 'easeOutQuart' as const
      },
      y: {
        type: 'number',
        from: 0,
        duration: 1000,
        easing: 'easeOutQuart' as const
      },
      colors: {
        type: 'color',
        from: 'rgba(0, 0, 0, 0.1)',
        to: (ctx: any) => {
          const index = ctx.dataIndex % 12;
          const colors = [
            '#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444',
            '#F472B6', '#14B8A6', '#FBBF24', '#6366F1', '#EC4899',
            '#10B981', '#F59E0B'
          ];
          return colors[index];
        }
      }
    } as const,
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: t('tickets.checked_in'),
        },
        ticks: {
          precision: 0
        }
      },
      x: {
        title: {
          display: true,
          text: t('common.category'),
        }
      }
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const label = context.label || '';
            const value = context.raw || 0;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = Math.round((value / total) * 100);
            return `${label}: ${value} ${t('tickets.checked_in')} (${percentage}%)`;
          }
        }
      }
    },
  };

  if (loading && (!categories || categories.length === 0)) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          {t("organizer_analytics.attendance_by_category")}
        </h3>
        <div className="flex justify-center items-center h-64">
          <Spinner size="32px" color="#3B82F6" />
        </div>
      </div>
    );
  }

  if (!categories || categories.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          {t("organizer_analytics.attendance_by_category")}
        </h3>
        <div className="text-center py-12 text-gray-500">
          {t("organizer_analytics.no_attendance_data")}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow h-full">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        {t("organizer_analytics.attendance_by_category")}
      </h3>
      <div className="h-64">
        <Bar data={chartData} options={options} className="max-h-full" />
      </div>
    </div>
  );
}
