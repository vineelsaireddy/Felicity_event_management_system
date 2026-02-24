import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { organizerAPI, userAPI } from '../services/api';
import Alert from '../components/Alert';
import Card from '../components/Card';

const OrganizerDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [organizer, setOrganizer] = useState(null);
  const [organizerEvents, setOrganizerEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('upcoming');
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    fetchOrganizerDetails();
    checkFollowStatus();
  }, [id, user]);

  const fetchOrganizerDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await organizerAPI.getOrganizerDetails(id);
      setOrganizer(response.data);
      
      // Get organizer's events
      const eventsResponse = await organizerAPI.getOrganizerEvents(id);
      setOrganizerEvents(eventsResponse.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch organizer details');
      console.error('Error fetching organizer:', err);
    } finally {
      setLoading(false);
    }
  };

  const checkFollowStatus = async () => {
    if (user?.role !== 'participant') return;
    
    try {
      const response = await userAPI.getProfile();
      setIsFollowing(response.data.followedClubs?.includes(id) || false);
    } catch (err) {
      console.error('Error checking follow status:', err);
    }
  };

  const handleFollowToggle = async () => {
    if (!user || user.role !== 'participant') {
      alert('Only participants can follow clubs');
      return;
    }

    try {
      setFollowLoading(true);
      const response = await userAPI.getProfile();
      const currentFollowedClubs = response.data.followedClubs || [];
      
      const newFollowedClubs = isFollowing
        ? currentFollowedClubs.filter(clubId => clubId !== id)
        : [...currentFollowedClubs, id];

      await userAPI.updateProfile({
        followedClubs: newFollowedClubs
      });

      setIsFollowing(!isFollowing);
    } catch (err) {
      alert('Failed to update follow status: ' + (err.response?.data?.message || 'Unknown error'));
      console.error('Error updating follow status:', err);
    } finally {
      setFollowLoading(false);
    }
  };

  const filterEvents = () => {
    const now = new Date();

    if (activeTab === 'upcoming') {
      return organizerEvents.filter(event => new Date(event.startDate) > now);
    }

    if (activeTab === 'past') {
      return organizerEvents.filter(event => new Date(event.startDate) <= now);
    }

    return organizerEvents;
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
          <p className="text-gray-600 font-semibold">Loading organizer details...</p>
        </div>
      </div>
    );
  }

  if (!organizer) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="text-center p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Organizer Not Found</h2>
          <p className="text-gray-600 mb-6">This organizer doesn't exist or has been removed.</p>
          <button
            onClick={() => navigate('/clubs')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Clubs
          </button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate('/clubs')}
          className="text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-2 mb-6"
        >
          ← Back to Clubs
        </button>

        {error && <Alert type="error" message={error} className="mb-6" />}

        {/* Header Card */}
        <Card className="shadow-lg overflow-hidden">
          {/* Hero Section */}
          <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-blue-700 p-8 text-white">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <span className="badge bg-white bg-opacity-30 text-white text-sm font-semibold">
                  {organizer.category}
                </span>
                <h1 className="text-4xl font-bold mt-3 mb-2">{organizer.name}</h1>
                <p className="text-blue-100 text-lg">{organizer.description}</p>
              </div>
              
              {user?.role === 'participant' && (
                <button
                  onClick={handleFollowToggle}
                  disabled={followLoading}
                  className={`ml-6 px-6 py-3 rounded-lg font-semibold transition-colors whitespace-nowrap ${
                    isFollowing
                      ? 'bg-white text-blue-600 hover:bg-blue-50'
                      : 'bg-blue-500 text-white hover:bg-blue-600'
                  } ${followLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {followLoading ? 'Updating...' : isFollowing ? '✓ Following' : '+ Follow'}
                </button>
              )}
            </div>
          </div>

          {/* Details Section */}
          <div className="p-8">
            {/* Contact Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 border-b pb-8">
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <span>📧</span> Contact Email
                </h3>
                {organizer.contactEmail ? (
                  <a
                    href={`mailto:${organizer.contactEmail}`}
                    className="text-blue-600 hover:text-blue-700 hover:underline break-all"
                  >
                    {organizer.contactEmail}
                  </a>
                ) : (
                  <p className="text-gray-500">Not available</p>
                )}
              </div>

              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <span>👥</span> Followers
                </h3>
                <p className="text-3xl font-bold text-blue-600">
                  {organizer.followers?.length || 0}
                </p>
              </div>
            </div>

            {/* Status */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Status</h3>
              <div className="flex gap-4">
                {organizer.isActive ? (
                  <span className="badge bg-green-100 text-green-800 font-semibold px-4 py-2 rounded-lg">
                    ✓ Active
                  </span>
                ) : (
                  <span className="badge bg-yellow-100 text-yellow-800 font-semibold px-4 py-2 rounded-lg">
                    ⚠️ Inactive
                  </span>
                )}
                
                {organizer.isArchived && (
                  <span className="badge bg-red-100 text-red-800 font-semibold px-4 py-2 rounded-lg">
                    📦 Archived
                  </span>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Events Section */}
        <div className="mt-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Events</h2>

          {/* Tabs */}
          <div className="mb-6 bg-white rounded-lg shadow overflow-hidden flex">
            <button
              onClick={() => setActiveTab('upcoming')}
              className={`flex-1 px-6 py-4 font-semibold transition-colors ${
                activeTab === 'upcoming'
                  ? 'border-b-4 border-blue-600 bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              📅 Upcoming ({filteredEvents.filter(e => new Date(e.startDate) > new Date()).length})
            </button>
            <button
              onClick={() => setActiveTab('past')}
              className={`flex-1 px-6 py-4 font-semibold transition-colors ${
                activeTab === 'past'
                  ? 'border-b-4 border-blue-600 bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              📜 Past ({filteredEvents.filter(e => new Date(e.startDate) <= new Date()).length})
            </button>
          </div>

          {/* Events Grid */}
          {filteredEvents.length === 0 ? (
            <Card className="text-center p-12">
              <div className="text-6xl mb-4">📭</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">No Events</h3>
              <p className="text-gray-600">
                {activeTab === 'upcoming'
                  ? 'This organizer has no upcoming events'
                  : 'This organizer has no past events'}
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredEvents.map((event) => (
                <Card key={event._id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  {/* Event Header */}
                  <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white min-h-24 flex flex-col justify-between">
                    <div>
                      <span className="badge bg-white bg-opacity-30 text-white text-xs font-semibold">
                        {event.type}
                      </span>
                      <h3 className="text-lg font-bold mt-3 line-clamp-2">{event.name}</h3>
                    </div>
                    <p className="text-sm text-blue-100 line-clamp-1">{event.description?.substring(0, 50)}...</p>
                  </div>

                  {/* Event Details */}
                  <div className="p-6 space-y-4">
                    {/* Date & Time */}
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

                    {/* Eligibility */}
                    <div className="flex items-center gap-3 text-gray-700 pt-2 border-t">
                      <span className="text-lg">🎯</span>
                      <div className="flex-1">
                        <p className="text-sm text-gray-500">Eligibility</p>
                        <p className="font-semibold">{event.eligibility}</p>
                      </div>
                    </div>

                    {/* Capacity */}
                    <div className="bg-gray-50 p-3 rounded-lg text-sm">
                      <div className="flex justify-between mb-2">
                        <span className="text-gray-600">{event.participants?.length || 0} / {event.registrationLimit} registered</span>
                        <span className="font-semibold">{Math.round(((event.participants?.length || 0) / event.registrationLimit) * 100)}%</span>
                      </div>
                      <div className="w-full bg-gray-300 rounded-full h-2">
                        <div
                          className="h-full bg-blue-600 rounded-full"
                          style={{ width: `${Math.min(((event.participants?.length || 0) / event.registrationLimit) * 100, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="border-t border-gray-200 px-6 py-3 bg-gray-50">
                    <a
                      href={`/event/${event._id}`}
                      className="w-full block text-center py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold text-sm"
                    >
                      View Event →
                    </a>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrganizerDetailPage;
