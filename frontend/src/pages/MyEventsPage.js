import React, { useState, useEffect } from 'react';
import { eventAPI } from '../services/api';
import Alert from '../components/Alert';
import Card from '../components/Card';

const MyEventsPage = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('upcoming'); // upcoming, normal, merchandise, completed, cancelled
  const [selectedTicket, setSelectedTicket] = useState(null); // For ticket modal

  const tabs = [
    { id: 'upcoming', label: '📅 Upcoming Events', color: 'blue' },
    { id: 'normal', label: '🎯 Normal Events', color: 'green' },
    { id: 'hackathon', label: '🏗️ Hackathon', color: 'purple' },
    { id: 'merchandise', label: '🛍️ Merchandise Purchases', color: 'orange' },
    { id: 'completed', label: '✅ Completed', color: 'gray' },
    { id: 'cancelled', label: '❌ Cancelled/Rejected', color: 'red' },
  ];

  useEffect(() => {
    fetchMyEvents();
  }, []);

  const fetchMyEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await eventAPI.getMyEvents();
      setEvents(response.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch your events');
      console.error('Error fetching events:', err);
    } finally {
      setLoading(false);
    }
  };

  const filterEvents = () => {
    const now = new Date();

    if (activeTab === 'upcoming') {
      // All event types that haven't started yet
      return events.filter(event => new Date(event.startDate) > now);
    }

    if (activeTab === 'normal') {
      // All Normal events (any date)
      return events.filter(event => event.type === 'Normal');
    }

    if (activeTab === 'hackathon') {
      // All Hackathon events (any date)
      return events.filter(event => event.type === 'Hackathon');
    }

    if (activeTab === 'merchandise') {
      // All Merchandise events (any date)
      return events.filter(event => event.type === 'Merchandise');
    }

    if (activeTab === 'completed') {
      return events.filter(event => event.status === 'Completed' || event.status === 'Attended');
    }

    if (activeTab === 'cancelled') {
      return events.filter(event => event.status === 'Cancelled' || event.status === 'Rejected');
    }

    return events;
  };

  const filteredEvents = filterEvents();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <svg className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-gray-600 font-semibold">Loading your events...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">My Events</h1>
          <p className="text-gray-600">Track your registered events and participation history</p>
        </div>

        {/* Error Alert */}
        {error && <Alert type="error" message={error} className="mb-6" />}

        {/* Tabs */}
        <div className="mb-8 bg-white rounded-lg shadow overflow-hidden">
          <div className="flex flex-wrap border-b border-gray-200">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 px-4 py-4 font-semibold transition-colors text-center min-w-max md:min-w-0 ${activeTab === tab.id
                    ? `border-b-4 border-${tab.color}-600 bg-${tab.color}-50 text-${tab.color}-700`
                    : 'text-gray-600 hover:bg-gray-50'
                  }`}
              >
                <span className="text-sm md:text-base">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Events Grid */}
        {filteredEvents.length === 0 ? (
          <Card className="text-center p-12">
            <div className="text-6xl mb-4">📭</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">No Events</h3>
            <p className="text-gray-600 mb-6">
              {activeTab === 'upcoming' && 'You don\'t have any upcoming events. Browse events to register!'}
              {activeTab === 'normal' && 'You haven\'t registered for any normal events yet.'}
              {activeTab === 'hackathon' && 'You haven\'t registered for any hackathon events yet.'}
              {activeTab === 'merchandise' && 'You haven\'t made any merchandise purchases yet.'}
              {activeTab === 'completed' && 'You haven\'t completed any events yet.'}
              {activeTab === 'cancelled' && 'You don\'t have any cancelled registrations.'}
            </p>
            <a
              href="/browse-events"
              className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Browse Events
            </a>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => (
              <Card key={event._id} className="overflow-hidden hover:shadow-lg transition-shadow">
                {/* Event Header */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white min-h-24 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <span className="badge bg-white bg-opacity-30 text-white text-xs font-semibold">
                        {event.type}
                      </span>
                      {event.status && (
                        <span className={`badge text-xs font-semibold px-2 py-1 rounded ${event.status === 'Attended' || event.status === 'Completed'
                            ? 'bg-green-500 text-white'
                            : event.status === 'Registered'
                              ? 'bg-blue-500 text-white'
                              : 'bg-red-500 text-white'
                          }`}>
                          {event.status}
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-bold line-clamp-2">{event.name}</h3>
                  </div>
                  <p className="text-sm text-blue-100 line-clamp-1">{event.description?.substring(0, 40)}...</p>
                </div>

                {/* Event Details */}
                <div className="p-6 space-y-4">
                  {/* Date */}
                  <div className="flex items-center gap-3 text-gray-700">
                    <span className="text-lg">📅</span>
                    <div className="flex-1">
                      <p className="text-sm text-gray-500">Date</p>
                      <p className="font-semibold">
                        {new Date(event.startDate).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>

                  {/* Time */}
                  <div className="flex items-center gap-3 text-gray-700">
                    <span className="text-lg">⏰</span>
                    <div className="flex-1">
                      <p className="text-sm text-gray-500">Time</p>
                      <p className="font-semibold">
                        {new Date(event.startDate).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>

                  {/* Organizer */}
                  <div className="flex items-center gap-3 text-gray-700">
                    <span className="text-lg">🏢</span>
                    <div className="flex-1">
                      <p className="text-sm text-gray-500">Organizer</p>
                      <p className="font-semibold line-clamp-1">
                        {event.organizerId?.name || 'Unknown'}
                      </p>
                    </div>
                  </div>

                  {/* Team Members (for Hackathon events) */}
                  {event.type === 'Hackathon' && event.teamMembers && event.teamMembers.length > 0 && (
                    <div className="pt-2 border-t">
                      <p className="text-sm text-gray-500 mb-2">👥 Team Members ({event.teamMembers.length})</p>
                      <div className="space-y-1">
                        {event.teamMembers.map((member, index) => (
                          <div key={index} className="flex items-center gap-2 text-sm text-gray-700 bg-purple-50 p-2 rounded">
                            <span className="text-purple-600 font-semibold">•</span>
                            <span>{member.email || member}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Participation Date */}
                  {event.registrationDate && (
                    <div className="flex items-center gap-3 text-gray-700 pt-2 border-t">
                      <span className="text-lg">✓</span>
                      <div className="flex-1">
                        <p className="text-sm text-gray-500">Registered</p>
                        <p className="font-semibold text-sm">
                          {new Date(event.registrationDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Ticket ID */}
                  {event.ticketId && (
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-500">Ticket ID</p>
                      <button
                        onClick={() => setSelectedTicket(event)}
                        className="text-sm font-mono font-semibold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer transition-colors"
                      >
                        {event.ticketId} 🔗
                      </button>
                    </div>
                  )}
                </div>

                {/* Action Button */}
                <div className="border-t border-gray-200 px-6 py-3 bg-gray-50">
                  <a
                    href={`/event/${event._id}`}
                    className="w-full block text-center py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold text-sm"
                  >
                    View Details →
                  </a>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Summary Stats */}
        {events.length > 0 && (
          <div className="mt-12 grid grid-cols-1 md:grid-cols-5 gap-4">
            <Card className="text-center p-6">
              <div className="text-4xl mb-2">📅</div>
              <p className="text-gray-600 text-sm mb-1">Total Registered</p>
              <p className="text-3xl font-bold text-blue-600">{events.length}</p>
            </Card>

            <Card className="text-center p-6">
              <div className="text-4xl mb-2">⏳</div>
              <p className="text-gray-600 text-sm mb-1">Upcoming</p>
              <p className="text-3xl font-bold text-yellow-600">
                {events.filter(e => new Date(e.startDate) > new Date()).length}
              </p>
            </Card>

            <Card className="text-center p-6">
              <div className="text-4xl mb-2">🏗️</div>
              <p className="text-gray-600 text-sm mb-1">Hackathon</p>
              <p className="text-3xl font-bold text-purple-600">
                {events.filter(e => e.type === 'Hackathon').length}
              </p>
            </Card>

            <Card className="text-center p-6">
              <div className="text-4xl mb-2">✅</div>
              <p className="text-gray-600 text-sm mb-1">Completed</p>
              <p className="text-3xl font-bold text-green-600">
                {events.filter(e => e.status === 'Completed' || e.status === 'Attended').length}
              </p>
            </Card>

            <Card className="text-center p-6">
              <div className="text-4xl mb-2">🛍️</div>
              <p className="text-gray-600 text-sm mb-1">Merchandise</p>
              <p className="text-3xl font-bold text-orange-600">
                {events.filter(e => e.type === 'Merchandise').length}
              </p>
            </Card>
          </div>
        )}

        {/* Ticket Details Modal */}
        {selectedTicket && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md">
              <div className="bg-blue-600 text-white px-6 py-4 flex justify-between items-center">
                <h2 className="text-xl font-bold">🎫 Ticket Details</h2>
                <button
                  onClick={() => setSelectedTicket(null)}
                  className="text-2xl font-bold hover:opacity-80 transition-opacity"
                >
                  ✕
                </button>
              </div>
              
              <div className="p-6 space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Event Name</p>
                  <p className="text-lg font-semibold text-gray-900">{selectedTicket.name}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Event Type</p>
                  <p className="text-lg font-semibold text-gray-900">{selectedTicket.type}</p>
                </div>

                <div className="bg-gray-100 p-3 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Ticket ID</p>
                  <p className="text-sm font-mono font-bold text-blue-600 break-all">{selectedTicket.ticketId}</p>
                </div>

                {/* QR Code Display */}
                {selectedTicket.qrCode && (
                  <div className="bg-gray-50 p-4 rounded-lg border-2 border-gray-300 flex flex-col items-center">
                    <p className="text-sm text-gray-600 mb-3">📱 QR Code</p>
                    <img
                      src={selectedTicket.qrCode}
                      alt="Ticket QR Code"
                      className="w-32 h-32 rounded-lg border-2 border-gray-300"
                    />
                    <p className="text-xs text-gray-500 mt-2 text-center">
                      Scan this code at the event
                    </p>
                  </div>
                )}

                <div>
                  <p className="text-sm text-gray-600">Organizer</p>
                  <p className="text-lg font-semibold text-gray-900">{selectedTicket.organizerId?.name || 'Unknown'}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Event Date</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {new Date(selectedTicket.startDate).toLocaleDateString()} {new Date(selectedTicket.startDate).toLocaleTimeString()}
                  </p>
                </div>

                <div className="bg-blue-50 p-3 rounded-lg border-l-4 border-blue-600">
                  <p className="text-sm text-blue-800">
                    💡 Save your ticket ID and QR code for check-in. You may be asked to present either at the event.
                  </p>
                </div>

                <button
                  onClick={() => {
                    navigator.clipboard.writeText(selectedTicket.ticketId);
                    alert('Ticket ID copied to clipboard!');
                  }}
                  className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                >
                  📋 Copy Ticket ID
                </button>

                <button
                  onClick={() => setSelectedTicket(null)}
                  className="w-full py-2 px-4 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition-colors font-semibold"
                >
                  Close
                </button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyEventsPage;
