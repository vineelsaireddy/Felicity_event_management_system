import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { eventAPI, userAPI } from '../services/api';

const BrowseEventsPage = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    type: '',
    eligibility: '',
    dateFrom: '',
    dateTo: '',
  });
  const [sortBy, setSortBy] = useState('upcoming');
  const [userProfile, setUserProfile] = useState(null);
  const [recommendedEventIds, setRecommendedEventIds] = useState([]);

  useEffect(() => {
    if (user && user.role === 'participant') {
      fetchUserProfile();
    }
    fetchEvents();
  }, [filters, sortBy, user]);

  const fetchUserProfile = async () => {
    try {
      if (user && user.role === 'participant') {
        const response = await userAPI.getProfile();
        setUserProfile(response.data);
      }
    } catch (err) {
      console.error('Error fetching user profile:', err);
    }
  };

  const calculateRecommendationScore = (event) => {
    if (!userProfile) return 0;

    let score = 0;

    // Check if event is from a followed club
    if (userProfile.followedClubs && userProfile.followedClubs.includes(event.organizer)) {
      score += 50; // High priority for followed clubs
    }

    // Check if event matches areas of interest
    if (userProfile.areasOfInterest && event.category) {
      const eventCategory = event.category.toLowerCase();
      const hasMatch = userProfile.areasOfInterest.some(
        area => area.toLowerCase() === eventCategory || eventCategory.includes(area.toLowerCase())
      );
      if (hasMatch) {
        score += 30; // Medium priority for matching interests
      }
    }

    return score;
  };

  const getRecommendationBadge = (eventId) => {
    if (recommendedEventIds.includes(eventId)) {
      return '⭐ Recommended for you';
    }
    return null;
  };

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const response = await eventAPI.getAllEvents({
        search,
        ...filters,
      });
      
      let sortedEvents = response.data;
      
      // Calculate recommendation scores and identify recommended events
      if (user && user.role === 'participant' && userProfile) {
        const scoredEvents = sortedEvents.map(event => ({
          ...event,
          recommendationScore: calculateRecommendationScore(event)
        }));

        const recommended = scoredEvents
          .filter(e => e.recommendationScore > 0)
          .map(e => e._id);
        
        setRecommendedEventIds(recommended);

        // Sort by recommendation score first, then by selected sort option
        sortedEvents = scoredEvents.sort((a, b) => {
          // First, prioritize by recommendation score
          if (b.recommendationScore !== a.recommendationScore) {
            return b.recommendationScore - a.recommendationScore;
          }

          // Then apply secondary sort
          if (sortBy === 'popular') {
            return b.participants.length - a.participants.length;
          } else if (sortBy === 'trending') {
            return b.participants.length - a.participants.length;
          }
          return 0;
        });

        // Filter trending if selected
        if (sortBy === 'trending') {
          // Get top 5 events by participant count (must have at least some registrations)
          sortedEvents = sortedEvents
            .filter(e => e.participants.length > 0)
            .slice(0, 5); // Top 5
        }
      } else {
        // For non-participants, apply regular sorting
        if (sortBy === 'popular') {
          sortedEvents = sortedEvents.sort((a, b) => b.participants.length - a.participants.length);
        } else if (sortBy === 'trending') {
          // Get top 5 events by participant count
          sortedEvents = sortedEvents
            .filter(e => e.participants.length > 0)
            .slice(0, 5); // Top 5
        }
      }
      
      setEvents(sortedEvents);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchEvents();
  };

  const getEventStatus = (event) => {
    const registrationPercentage = (event.participants.length / event.registrationLimit) * 100;
    if (registrationPercentage === 100) return { text: 'FULL', color: 'red' };
    if (registrationPercentage >= 80) return { text: 'ALMOST FULL', color: 'orange' };
    if (registrationPercentage >= 50) return { text: 'SPOTS LEFT', color: 'blue' };
    return { text: 'OPEN', color: 'green' };
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 text-white py-12 shadow-lg">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl font-bold mb-3">🎉 Discover Events</h1>
          <p className="text-blue-100 text-lg">Find and register for amazing events happening around you</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Search and Filter Bar */}
        <div className="mb-12">
          <form onSubmit={handleSearch} className="bg-white rounded-xl shadow-md p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
              {/* Search Input */}
              <div className="lg:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Search Events</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search by name or keyword..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="input-field pl-10"
                  />
                  <svg className="w-5 h-5 absolute left-3 top-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>

              {/* Type Filter */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Type</label>
                <select
                  value={filters.type}
                  onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                  className="select-field"
                >
                  <option value="">All Types</option>
                  <option value="Normal">Normal</option>
                  <option value="Merchandise">Merchandise</option>
                </select>
              </div>

              {/* Eligibility Filter */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Eligibility</label>
                <select
                  value={filters.eligibility}
                  onChange={(e) => setFilters({ ...filters, eligibility: e.target.value })}
                  className="select-field"
                >
                  <option value="">All</option>
                  <option value="IIIT Only">IIIT Only</option>
                  <option value="Open">Open</option>
                </select>
              </div>

              {/* Date From Filter */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">From Date</label>
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                  className="select-field"
                />
              </div>

              {/* Date To Filter */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">To Date</label>
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                  className="select-field"
                />
              </div>

              {/* Search Button */}
              <div className="flex items-end">
                <button
                  type="submit"
                  className="btn-primary w-full py-3 flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Search
                </button>
              </div>
            </div>
          </form>

          {/* Sort and View Options */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <label className="text-sm font-semibold text-gray-700 mr-4">Sort by:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="select-field inline-block w-40"
              >
                <option value="upcoming">Upcoming</option>
                <option value="popular">Most Popular</option>
                <option value="trending">Trending</option>
              </select>
            </div>
            <div className="text-sm text-gray-600 font-semibold">
              {events.length} {events.length === 1 ? 'event' : 'events'} found
            </div>
          </div>

          {/* Events Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="text-center">
                <svg className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="text-gray-600 font-semibold">Loading amazing events...</p>
              </div>
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">No Events Found</h3>
              <p className="text-gray-600 mb-6">Try adjusting your filters or search terms</p>
              <button
                onClick={() => {
                  setSearch('');
                  setFilters({ type: '', eligibility: '' });
                }}
                className="btn-primary"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event) => {
                const status = getEventStatus(event);
                const registrationPercentage = (event.participants.length / event.registrationLimit) * 100;

                return (
                  <div
                    key={event._id}
                    className="card-elevated group overflow-hidden animate-fadeIn hover:ring-2 hover:ring-blue-500 transition-all"
                  >
                    {/* Event Header with Badge */}
                    <div className="relative bg-gradient-to-r from-blue-600 to-blue-700 p-4 text-white min-h-24 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start gap-2 mb-2 flex-wrap">
                          <div className="flex gap-2 flex-wrap">
                            <span className="badge bg-white bg-opacity-30 text-white font-semibold text-xs">
                              {event.type}
                            </span>
                            {getRecommendationBadge(event._id) && (
                              <span className="badge bg-yellow-400 text-gray-900 font-semibold text-xs animate-pulse">
                                {getRecommendationBadge(event._id)}
                              </span>
                            )}
                          </div>
                          <span className={`badge bg-${status.color}-500 text-white text-xs font-semibold`}>
                            {status.text}
                          </span>
                        </div>
                        <h3 className="text-xl font-bold line-clamp-2">{event.name}</h3>
                      </div>
                      <p className="text-sm text-blue-100 line-clamp-1">{event.description.substring(0, 50)}...</p>
                    </div>

                    {/* Event Details */}
                    <div className="p-6 space-y-4">
                      {/* Description */}
                      <p className="text-gray-700 text-sm line-clamp-2">
                        {event.description}
                      </p>

                      {/* Info Grid */}
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center gap-2 text-gray-600">
                          <span className="text-lg">📍</span>
                          <span className="line-clamp-1">{event.location || 'TBD'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <span className="text-lg">🎯</span>
                          <span>{event.eligibility}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <span className="text-lg">👥</span>
                          <span>{event.participants?.length || 0} registered</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <span className="text-lg">💺</span>
                          <span>{event.registrationLimit} slots</span>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-gray-600">
                          <span>Capacity</span>
                          <span className="font-semibold">{Math.round(registrationPercentage)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full transition-all duration-500 bg-gradient-to-r ${
                              registrationPercentage >= 80
                                ? 'from-red-500 to-red-600'
                                : registrationPercentage >= 50
                                ? 'from-yellow-500 to-yellow-600'
                                : 'from-green-500 to-green-600'
                            }`}
                            style={{ width: `${registrationPercentage}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="pt-2 space-y-2">
                        <a
                          href={`/event/${event._id}`}
                          className="block text-center btn-primary py-2 w-full font-semibold transition-transform transform group-hover:scale-105"
                        >
                          View Details →
                        </a>
                        <button
                          className="w-full px-4 py-2 border-2 border-blue-600 text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition-colors"
                        >
                          ♥️ Save Event
                        </button>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="border-t border-gray-200 px-6 py-3 bg-gray-50 text-xs text-gray-500">
                      📅 {new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at {new Date(event.date).toLocaleTimeString()}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BrowseEventsPage;
