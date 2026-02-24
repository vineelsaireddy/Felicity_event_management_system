import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { organizerAPI, userAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Alert from '../components/Alert';
import Card from '../components/Card';

const ClubsListPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [organizers, setOrganizers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [userProfile, setUserProfile] = useState(null);
  const [followingIds, setFollowingIds] = useState([]);
  const [actionLoading, setActionLoading] = useState({});

  useEffect(() => {
    fetchOrganizers();
    if (user?.role === 'participant') {
      fetchUserProfile();
    }
  }, [user]);

  const fetchOrganizers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await organizerAPI.getAllOrganizers();
      setOrganizers(response.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch clubs/organizers');
      console.error('Error fetching organizers:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserProfile = async () => {
    try {
      const response = await userAPI.getProfile();
      setUserProfile(response.data);
      setFollowingIds(response.data.followedClubs || []);
    } catch (err) {
      console.error('Error fetching profile:', err);
    }
  };

  const handleFollowToggle = async (organizerId) => {
    if (!user || user.role !== 'participant') {
      alert('Only participants can follow clubs');
      return;
    }

    try {
      setActionLoading(prev => ({ ...prev, [organizerId]: true }));

      const isFollowing = followingIds.includes(organizerId);
      const newFollowedClubs = isFollowing
        ? followingIds.filter(id => id !== organizerId)
        : [...followingIds, organizerId];

      await userAPI.updateProfile({
        followedClubs: newFollowedClubs
      });

      setFollowingIds(newFollowedClubs);

      // Update userProfile
      if (userProfile) {
        setUserProfile({
          ...userProfile,
          followedClubs: newFollowedClubs
        });
      }
    } catch (err) {
      alert('Failed to update follow status: ' + (err.response?.data?.message || 'Unknown error'));
      console.error('Error updating follow status:', err);
    } finally {
      setActionLoading(prev => ({ ...prev, [organizerId]: false }));
    }
  };

  const filteredOrganizers = organizers.filter(org =>
    org.name.toLowerCase().includes(search.toLowerCase()) ||
    org.category.toLowerCase().includes(search.toLowerCase()) ||
    org.description.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <svg className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-gray-600 font-semibold">Loading clubs and organizers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 text-white py-12 shadow-lg">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl font-bold mb-3">🏢 Clubs & Organizers</h1>
          <p className="text-blue-100 text-lg">Discover and follow clubs that interest you</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        {error && <Alert type="error" message={error} className="mb-6" />}

        {/* Search Bar */}
        <div className="mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="relative">
              <input
                type="text"
                placeholder="Search clubs by name, category, or description..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              />
              <svg className="w-5 h-5 absolute left-4 top-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Following Stats */}
        {user?.role === 'participant' && followingIds.length > 0 && (
          <div className="mb-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <p className="text-blue-900 font-semibold">
              ⭐ You're following <span className="text-lg">{followingIds.length}</span> club{followingIds.length !== 1 ? 's' : ''}
            </p>
          </div>
        )}

        {/* Clubs Grid */}
        {filteredOrganizers.length === 0 ? (
          <Card className="text-center p-12">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">No Clubs Found</h3>
            <p className="text-gray-600">
              {search ? 'Try adjusting your search terms' : 'No clubs or organizers available'}
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredOrganizers.map((org) => {
              const isFollowing = followingIds.includes(org._id);
              
              return (
                <Card key={org._id} className="overflow-hidden hover:shadow-lg transition-all group">
                  {/* Club Header */}
                  <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6 text-white min-h-32 flex flex-col justify-between group-hover:shadow-lg transition-shadow">
                    <div>
                      <span className="badge bg-white bg-opacity-30 text-white text-xs font-semibold inline-block">
                        {org.category}
                      </span>
                      <h3 className="text-2xl font-bold mt-3 line-clamp-2">{org.name}</h3>
                    </div>
                  </div>

                  {/* Club Details */}
                  <div className="p-6 space-y-4">
                    {/* Description */}
                    <div>
                      <p className="text-sm text-gray-500 font-medium mb-2">About</p>
                      <p className="text-gray-700 line-clamp-3">{org.description}</p>
                    </div>

                    {/* Contact Email */}
                    {org.contactEmail && (
                      <div className="border-t pt-4">
                        <p className="text-sm text-gray-500 font-medium mb-2">Contact</p>
                        <a
                          href={`mailto:${org.contactEmail}`}
                          className="text-blue-600 hover:text-blue-700 hover:underline text-sm break-all"
                        >
                          {org.contactEmail}
                        </a>
                      </div>
                    )}

                    {/* Followers Count */}
                    <div className="bg-gray-50 p-3 rounded-lg text-center">
                      <p className="text-sm text-gray-600 mb-1">Followers</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {org.followers?.length || 0}
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="border-t border-gray-200 px-6 py-3 bg-gray-50 space-y-2">
                    {user?.role === 'participant' ? (
                      <>
                        <button
                          onClick={() => handleFollowToggle(org._id)}
                          disabled={actionLoading[org._id]}
                          className={`w-full py-2 px-4 rounded-lg font-semibold transition-colors ${
                            isFollowing
                              ? 'bg-blue-600 text-white hover:bg-blue-700'
                              : 'bg-white border-2 border-blue-600 text-blue-600 hover:bg-blue-50'
                          } ${actionLoading[org._id] ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          {actionLoading[org._id]
                            ? 'Updating...'
                            : isFollowing
                            ? '✓ Following'
                            : '+ Follow'}
                        </button>
                        <button
                          onClick={() => navigate(`/organizer/${org._id}`)}
                          className="w-full py-2 px-4 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
                        >
                          View Details →
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => navigate(`/organizer/${org._id}`)}
                        className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                      >
                        View Details →
                      </button>
                    )}
                  </div>

                  {/* Status Indicator */}
                  {org.isActive === false && (
                    <div className="bg-yellow-50 px-6 py-2 border-t border-yellow-200">
                      <p className="text-xs text-yellow-800 font-semibold">⚠️ Currently Inactive</p>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}

        {/* Total Count */}
        <div className="mt-12 text-center">
          <p className="text-gray-600 font-semibold">
            Showing {filteredOrganizers.length} of {organizers.length} clubs
          </p>
        </div>
      </div>
    </div>
  );
};

export default ClubsListPage;
