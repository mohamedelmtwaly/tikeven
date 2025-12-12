"use client";

import { useState, FormEvent } from "react";
import { useDispatch } from "react-redux";
import { createReport } from "@/lib/features/reportsSlice";

interface ReportEventModalProps {
  open: boolean;
  onClose: () => void;
  eventId: string;
  organizerId?: string;
  reporterId?: string;
}

export default function ReportEventModal({
  open,
  onClose,
  eventId,
  organizerId,
  reporterId,
}: ReportEventModalProps) {
  const dispatch = useDispatch();
  const [reportType, setReportType] = useState("spam");
  const [reportMessage, setReportMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!open) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!reportMessage.trim()) return;
    setIsSubmitting(true);
    try {
      await dispatch(
        createReport({
          eventId,
          organizerId,
          reporterId,
          type: reportType,
          message: reportMessage.trim(),
        }) as any
      );
      onClose();
      setReportType("spam");
      setReportMessage("");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    onClose();
    setReportType("spam");
    setReportMessage("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-xl">
        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">Report this event</h3>
        <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
          Tell us what is wrong with this event. This report will help our team review and take action.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <span className="block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Report type
            </span>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <button
                type="button"
                onClick={() => setReportType("spam")}
                className={
                  "inline-flex items-center justify-center rounded-full px-3 py-1.5 border text-xs font-semibold transition-colors " +
                  (reportType === "spam"
                    ? "border-[#1e3a8a] bg-[#1e3a8a] text-white"
                    : "border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800")
                }
              >
                Spam / Scam
              </button>
              <button
                type="button"
                onClick={() => setReportType("inappropriate")}
                className={
                  "inline-flex items-center justify-center rounded-full px-3 py-1.5 border text-xs font-semibold transition-colors " +
                  (reportType === "inappropriate"
                    ? "border-[#1e3a8a] bg-[#1e3a8a] text-white"
                    : "border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800")
                }
              >
                Inappropriate content
              </button>
              <button
                type="button"
                onClick={() => setReportType("incorrect")}
                className={
                  "inline-flex items-center justify-center rounded-full px-3 py-1.5 border text-xs font-semibold transition-colors " +
                  (reportType === "incorrect"
                    ? "border-[#1e3a8a] bg-[#1e3a8a] text-white"
                    : "border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800")
                }
              >
                Incorrect information
              </button>
              <button
                type="button"
                onClick={() => setReportType("other")}
                className={
                  "inline-flex items-center justify-center rounded-full px-3 py-1.5 border text-xs font-semibold transition-colors " +
                  (reportType === "other"
                    ? "border-[#1e3a8a] bg-[#1e3a8a] text-white"
                    : "border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800")
                }
              >
                Other
              </button>
            </div>
          </div>

          <textarea
            value={reportMessage}
            onChange={(e) => setReportMessage(e.target.value)}
            rows={4}
            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]"
            placeholder="Describe the issue with this event..."
          />

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={handleCancel}
              className="inline-flex items-center justify-center h-9 px-4 rounded-full text-sm font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !reportMessage.trim()}
              className="inline-flex items-center justify-center h-9 px-4 rounded-full text-sm font-semibold text-white bg-[#1e3a8a] hover:bg-[#152c6c] disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? "Submitting..." : "Submit report"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
