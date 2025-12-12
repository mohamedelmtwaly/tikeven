export type EventStatus =  'Published' | 'Banned';

export const EventStatus = {
  PUBLISHED: 'Published' as EventStatus,
  BANNED: 'Banned' as EventStatus,
};

export interface Event {
  id?: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  venue: string;
  venueData: {
    id: string;
    name: string;
    address: string;
  };
  category: string;
  price: number;
  isFree: boolean;
  ticketsCount?: number;
  images: string[];
  organizerId?: string;
  organizerName?: string;
  createdAt?: string;
  updatedAt?: string;
  status?: EventStatus;
}

export interface EventsState {
  events: Event[];
  loading: boolean;
  error: string | null;
  currentEvent: Event | null;
}

export interface CreateEventData {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  venue: string;
  category: string;
  price: number;
  isFree: boolean;
  ticketsCount: number;
  images: File[];
}

export interface UpdateEventData extends Partial<CreateEventData> {
  id: string;
}
