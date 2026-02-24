import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { organizerAPI } from '../services/api';
import Card from '../components/Card';
import Alert from '../components/Alert';

const OrganizerDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchOrganizerData();
  }, []);

  const fetchOrganizerData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const eventsResponse = await organizerAPI.getEvents();
      setEvents(eventsResponse.data || []);

      // Calculate stats
      const totalEvents = eventsResponse.data?.length || 0;
      const publishedEvents = eventsResponse.data?.filter(e => e.status === 'Published' || e.status === 'Ongoing')?.length || 0;
      const totalAttendees = eventsResponse.data?.reduce((sum, e) => sum + (e.participants?.length || 0), 0) || 0;

      setStats({
        totalEvents,
        activeEvents: publishedEvents,
        totalAttendees,
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch organizer data');
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePublishEvent = async (eventId) => {
    try {
      await organizerAPI.publishEvent(eventId);
      // Refresh the events list
      await fetchOrganizerData();
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to publish event');
      console.error('Publish error:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Organizer Dashboard</h1>
          <p className="text-gray-600 mt-2">Welcome, {user?.name || user?.email}</p>
        </div>

        {error && <Alert type="error" message={error} />}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-white shadow">
            <div className="p-6">
              <h3 className="text-sm font-medium text-gray-700">Total Events</h3>
              <p className="text-3xl font-bold text-blue-600 mt-2">{stats.totalEvents || 0}</p>
            </div>
          </Card>

          <Card className="bg-white shadow">
            <div className="p-6">
              <h3 className="text-sm font-medium text-gray-700">Active Events</h3>
              <p className="text-3xl font-bold text-green-600 mt-2">{stats.activeEvents || 0}</p>
            </div>
          </Card>

          <Card className="bg-white shadow">
            <div className="p-6">
              <h3 className="text-sm font-medium text-gray-700">Total Attendees</h3>
              <p className="text-3xl font-bold text-purple-600 mt-2">{stats.totalAttendees || 0}</p>
            </div>
          </Card>
        </div>

        {/* Events Section */}
        <Card className="bg-white shadow">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">My Events</h2>
              <a
                href="/organizer/create-event"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create Event
              </a>
            </div>

            {events.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600 mb-4">No events created yet</p>
                <a
                  href="/organizer/create-event"
                  className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Create Your First Event
                </a>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Event Name</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Type</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Status</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Date</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">
                        {events.some(e => e.type === 'Hackathon') ? 'Registrations/Teams' : 'Attendees'}
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {events.map((event) => (
                      <tr key={event._id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 text-gray-900 font-medium">
                          <button
                            onClick={() => navigate(`/organizer/event/${event._id}`)}
                            className="text-blue-600 hover:text-blue-800 hover:underline font-semibold"
                          >
                            {event.name}
                          </button>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            event.type === 'Hackathon' ? 'bg-purple-100 text-purple-800' :
                            event.type === 'Merchandise' ? 'bg-orange-100 text-orange-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {event.type || 'Normal'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-3 py-1 rounded-full text-sm font-semibold ${
                              event.status === 'Published' || event.status === 'Ongoing'
                                ? 'bg-green-100 text-green-800'
                                : event.status === 'Draft'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {event.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-900">
                          {event.startDate ? new Date(event.startDate).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="py-3 px-4 text-gray-900">
                          {event.type === 'Hackathon' ? (
                            <span className="font-semibold">
                              {event.participants?.length || 0} registrations
                              {event.analytics?.hackathoTeamCount ? ` (${event.analytics.hackathoTeamCount} teams)` : ''}
                            </span>
                          ) : (
                            event.participants?.length || 0
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            {event.status === 'Draft' && (
                              <button
                                onClick={() => handlePublishEvent(event._id)}
                                className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-semibold transition-colors"
                              >
                                Publish
                              </button>
                            )}
                            <button
                              onClick={() => navigate(`/organizer/event/${event._id}`)}
                              className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm font-semibold transition-colors"
                            >
                              Details
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default OrganizerDashboard;
