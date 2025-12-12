'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/lib/features';
import { fetchUserById, toggleBlockUser } from '@/lib/features/userSlice';
import { fetchEventsByOrganizer } from '@/lib/features/eventSlice';
import { fetchReports } from '@/lib/features/reportsSlice';
import { format } from 'date-fns';
import { Calendar, Flag, Mail, Phone, MapPin, Lock, Unlock, ArrowLeft, Globe, Facebook, Instagram, Twitter, FileText } from 'lucide-react';
import Spinner from '@/components/Spinner';
import type User from '@/types/user';

// Extend the User type with additional properties used in this component
interface Organizer extends Omit<User, 'image'> {
  image?: string | null;
  blocked?: boolean;  // Made optional to match the User type
  lastLogin?: string | Date;
  phone?: string;
  address?: string;
}

export default function OrganizerDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  
  const { currentUser: organizer, loading: userLoading } = useSelector((state: RootState) => ({
    currentUser: (state.users.users.find((u: Organizer) => u.id === id) as Organizer) || null,
    loading: state.users.loading
  }));
  
  // Define the Settings type
  interface Settings {
    userId: string;
    defaultTicketQuantity: number;
    defaultTicketPrice: number;
    defaultVisibility: string;
    websiteUrl?: string;
    facebookUrl?: string;
    instagramUrl?: string;
    twitterUrl?: string;
  };

  
  const settings = useSelector((state: RootState) => 
    state.settings.settings as Settings | undefined
  );
  
  const { events, loading: eventsLoading } = useSelector((state: RootState) => state.events);
  const { items: reports, loading: reportsLoading } = useSelector((state: RootState) => state.reports);
  
  const [activeTab, setActiveTab] = useState('events');
  const [isBlocking, setIsBlocking] = useState(false);

  useEffect(() => {
    if (id) {
      dispatch(fetchUserById(id as string));
      dispatch(fetchEventsByOrganizer(id as string));
      dispatch(fetchReports());
    }
  }, [id, dispatch]);

  const organizerEvents = events || [];
  const organizerReports = reports.filter(report => report.organizerId === id);

  const handleBlockToggle = async () => {
    if (!organizer) return;
    setIsBlocking(true);
    try {
      await dispatch(toggleBlockUser({ 
        userId: organizer.id, 
        currentStatus: organizer.blocked ?? false 
      }));
    } finally {
      setIsBlocking(false);
    }
  };

  if (userLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner />
      </div>
    );
  }

  if (!organizer) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold">Organizer not found</h2>
        <button
          onClick={() => router.push('/admin/organizers')}
          className="mt-4 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Back to Organizers
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <button 
        onClick={() => router.back()}
        className="mb-6 flex items-center text-sm font-medium text-gray-700 hover:text-gray-900 focus:outline-none"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Organizers
      </button>

      <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
        <div className="px-6 py-8 sm:px-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-start">
            <div className="flex-shrink-0 mb-4 sm:mb-0 sm:mr-6">
              {organizer.image ? (
                <img 
                  src={organizer.image} 
                  alt={organizer.name || 'Organizer'}
                  className="h-24 w-24 rounded-full border-4 border-white shadow"
                />
              ) : (
                <div className="h-24 w-24 rounded-full bg-gray-200 flex items-center justify-center text-3xl font-semibold text-gray-600 border-4 border-white shadow">
                  {organizer.name?.charAt(0).toUpperCase() || 'O'}
                </div>
              )}
            </div>
            <div className="text-center sm:text-left">
              <h1 className="text-2xl font-bold text-gray-900">{organizer.name}</h1>
              <div className="flex items-center justify-center sm:justify-start text-sm text-gray-600 mt-1">
                <Mail className="w-4 h-4 mr-1" />
                {organizer.email}
                {organizer.phone && (
                  <>
                    <span className="mx-2">•</span>
                    <Phone className="w-4 h-4 mr-1" />
                    {organizer.phone}
                  </>
                )}
              </div>
              {organizer.description && (
                <div className="mt-3 text-sm text-gray-600 max-w-2xl">
                  <p className="font-medium text-gray-700">About:</p>
                  <p className="mt-1">{organizer.description}</p>
                </div>
              )}
              <div className="mt-4 flex flex-wrap justify-center sm:justify-start gap-2">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                  organizer.blocked 
                    ? 'bg-red-100 text-red-800' 
                    : 'bg-green-100 text-green-800'
                }`}>
                  {organizer.blocked ? 'Blocked' : 'Active'}
                </span>
                <button
                  onClick={handleBlockToggle}
                  disabled={isBlocking}
                  className={`inline-flex items-center px-3 py-1 rounded-md text-sm font-medium ${
                    organizer.blocked
                      ? 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                      : 'bg-red-600 text-white hover:bg-red-700'
                  }`}
                >
                  {isBlocking ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 mr-2"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      {organizer.blocked ? (
                        <Unlock className="w-4 h-4 mr-1" />
                      ) : (
                        <Lock className="w-4 h-4 mr-1" />
                      )}
                      {organizer.blocked ? 'Unblock' : 'Block'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('events')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'events'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Events
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'reports'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Reports
          </button>
          <button
            onClick={() => setActiveTab('details')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'details'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Details
          </button>
        </nav>
      </div>

      <div className="mt-6">
        {activeTab === 'events' && (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Organizer's Events</h3>
            </div>
            <div className="px-4 py-5 sm:p-6">
              {eventsLoading ? (
                <div className="flex justify-center items-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                </div>
              ) : organizerEvents.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {organizerEvents.map((event) => (
                    <div key={event.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <h3 className="font-medium text-gray-900">{event.title}</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {event.startDate && format(new Date(event.startDate), 'PPpp')}
                      </p>
                      {event.status && (
                        <span className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {event.status}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Calendar className="w-12 h-12 mx-auto text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No events</h3>
                  <p className="mt-1 text-sm text-gray-500">This organizer hasn't created any events yet.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Reports</h3>
            </div>
            <div className="px-4 py-5 sm:p-6">
              {reportsLoading ? (
                <div className="flex justify-center items-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                </div>
              ) : organizerReports.length > 0 ? (
                <div className="space-y-4">
                  {organizerReports.map((report) => (
                    <div key={report.id} className="border-l-4 border-red-500 bg-gray-50 p-4 rounded-r">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium text-gray-900">{report.type || 'Report'}</h4>
                          <p className="text-sm text-gray-600 mt-1">
                            {report.message || 'No details provided'}
                          </p>
                          <div className="mt-2 flex flex-wrap items-center text-xs text-gray-500 gap-x-4">
                            <span>
                              Reported on {report.createdAt ? format(new Date(report.createdAt), 'MMM d, yyyy') : 'an unknown date'}
                            </span>
                            {report.reporterId && (
                              <span>By User ID: {report.reporterId}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      {report.eventId && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <p className="text-sm font-medium text-gray-700">Related Event:</p>
                          <button
                            onClick={() => router.push(`/admin/events/${report.eventId}`)}
                            className="mt-1 text-sm text-blue-600 hover:text-blue-800 hover:underline focus:outline-none"
                          >
                            View Event
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Flag className="w-12 h-12 mx-auto text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No reports</h3>
                  <p className="mt-1 text-sm text-gray-500">This organizer hasn't been reported yet.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'details' && (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Organizer Details</h3>
            </div>
            <div className="px-4 py-5 sm:p-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Contact Information</h4>
                  <dl className="mt-2 space-y-3">
                    <div className="flex items-start">
                      <dt className="w-24 flex-shrink-0 text-sm text-gray-500">Email</dt>
                      <dd className="text-sm text-gray-900">{organizer.email}</dd>
                    </div>
                    {organizer.phone && (
                      <div className="flex items-start">
                        <dt className="w-24 flex-shrink-0 text-sm text-gray-500">Phone</dt>
                        <dd className="text-sm text-gray-900">{organizer.phone}</dd>
                      </div>
                    )}
                    {organizer.description && (
                      <div className="flex items-start">
                        <dt className="w-24 flex-shrink-0 text-sm text-gray-500">About</dt>
                        <dd className="text-sm text-gray-900">{organizer.description}</dd>
                      </div>
                    )}
                  </dl>
                  
                  {(settings?.websiteUrl || settings?.facebookUrl || settings?.instagramUrl || settings?.twitterUrl) && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-gray-500 mb-2">Social Links</h4>
                      <div className="space-y-2">
                        {settings.websiteUrl && (
                          <div className="flex items-center">
                            <Globe className="w-4 h-4 text-gray-500 mr-2" />
                            <a 
                              href={settings.websiteUrl.startsWith('http') ? settings.websiteUrl : `https://${settings.websiteUrl}`}
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:underline"
                            >
                              {settings.websiteUrl.replace(/^https?:\/\//, '')}
                            </a>
                          </div>
                        )}
                        {settings.facebookUrl && (
                          <div className="flex items-center">
                            <Facebook className="w-4 h-4 text-gray-500 mr-2" />
                            <a 
                              href={settings.facebookUrl.startsWith('http') ? settings.facebookUrl : `https://${settings.facebookUrl}`}
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:underline"
                            >
                              {settings.facebookUrl.replace(/^https?:\/\//, '').replace('www.facebook.com/', '')}
                            </a>
                          </div>
                        )}
                        {settings.instagramUrl && (
                          <div className="flex items-center">
                            <Instagram className="w-4 h-4 text-gray-500 mr-2" />
                            <a 
                              href={settings.instagramUrl.startsWith('http') ? settings.instagramUrl : `https://${settings.instagramUrl}`}
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:underline"
                            >
                              {settings.instagramUrl.replace(/^https?:\/\//, '').replace('www.instagram.com/', '')}
                            </a>
                          </div>
                        )}
                        {settings.twitterUrl && (
                          <div className="flex items-center">
                            <Twitter className="w-4 h-4 text-gray-500 mr-2" />
                            <a 
                              href={settings.twitterUrl.startsWith('http') ? settings.twitterUrl : `https://${settings.twitterUrl}`}
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:underline"
                            >
                              {settings.twitterUrl.replace(/^https?:\/\//, '').replace('www.twitter.com/', '')}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <div className="space-y-6">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Account Information</h4>
                    <dl className="mt-2 space-y-3">
                      <div className="flex items-start">
                        <dt className="w-24 flex-shrink-0 text-sm text-gray-500">Status</dt>
                        <dd>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            organizer.blocked ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                          }`}>
                            {organizer.blocked ? 'Blocked' : 'Active'}
                          </span>
                        </dd>
                      </div>
                      {organizer.createdAt && (
                        <div className="flex items-start">
                          <dt className="w-24 flex-shrink-0 text-sm text-gray-500">Member Since</dt>
                          <dd className="text-sm text-gray-900">
                            {format(new Date(organizer.createdAt), 'MMM d, yyyy')}
                          </dd>
                        </div>
                      )}
                      {organizer.lastLogin && (
                        <div className="flex items-start">
                          <dt className="w-24 flex-shrink-0 text-sm text-gray-500">Last Login</dt>
                          <dd className="text-sm text-gray-900">
                            {format(new Date(organizer.lastLogin), 'MMM d, yyyy h:mm a')}
                          </dd>
                        </div>
                      )}
                    </dl>
                  </div>

                  {settings && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Event Settings</h4>
                      <dl className="mt-2 space-y-2">
                        <div className="flex items-start">
                          <dt className="w-24 flex-shrink-0 text-sm text-gray-500">Default Tickets</dt>
                          <dd className="text-sm text-gray-900">
                            {settings.defaultTicketQuantity || '100'} per event
                          </dd>
                        </div>
                        <div className="flex items-start">
                          <dt className="w-24 flex-shrink-0 text-sm text-gray-500">Default Price</dt>
                          <dd className="text-sm text-gray-900">
                            ${settings.defaultTicketPrice || '25.00'} per ticket
                          </dd>
                        </div>
                        <div className="flex items-start">
                          <dt className="w-24 flex-shrink-0 text-sm text-gray-500">Visibility</dt>
                          <dd className="text-sm text-gray-900 capitalize">
                            {settings.defaultVisibility || 'public'}
                          </dd>
                        </div>
                      </dl>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
