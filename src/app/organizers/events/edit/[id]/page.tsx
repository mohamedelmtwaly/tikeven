"use client";

import { use, useEffect } from "react";
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/lib/features';
import { fetchEventById, clearCurrentEvent } from '@/lib/features/eventSlice';
import Link from "next/link";
import EventForm from '../../EventForm';
import { useTranslation } from 'react-i18next';

export default function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const dispatch = useDispatch<AppDispatch>();
  const { currentEvent } = useSelector((state: RootState) => state.events);
  const { t } = useTranslation('common');

  useEffect(() => {
    dispatch(fetchEventById(id));
    return () => {
      dispatch(clearCurrentEvent());
    };
  }, [dispatch, id]);

  if (!currentEvent) {
    return (
      <div className="bg-background-light dark:bg-background-dark min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-subtitle">{t('organizer_events.loading_event_data')}</p>
        </div>
      </div>
    );
  }

  return <EventForm mode="edit" eventId={id} initialEvent={currentEvent} />;
}
