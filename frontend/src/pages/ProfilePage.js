import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { userAPI, organizerAPI } from '../services/api';
import Alert from '../components/Alert';
import Card from '../components/Card';

const areasOfInterestOptions = [
  'Technology', 'Sports', 'Arts & Culture', 'Music', 'Gaming', 
  'Robotics', 'Photography', 'Entrepreneurship', 'Science', 
  'Social Service', 'Dance', 'Theater'
];

const ProfilePage = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [organizers, setOrganizers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [editingPreferences, setEditingPreferences] = useState(false);

  useEffect(() => {
    fetchProfile();
    if (user.role === 'participant') {
      fetchOrganizers();
    }
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (user.role === 'participant') {
        const response = await userAPI.getProfile();
        setProfile(response.data);
        setFormData(response.data);
      } else {
        // For organizers and admins, show basic info from auth context
        setProfile(user);
        setFormData(user);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch profile');
      console.error('Profile fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrganizers = async () => {
    try {
      const response = await organizerAPI.getAllOrganizers();
      setOrganizers(response.data || []);
    } catch (err) {
      console.error('Failed to fetch organizers:', err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError(null);
      
      if (user.role === 'participant') {
        await userAPI.updateProfile(formData);
      } else {
        // Organizers/admins can update specific fields
        await userAPI.updateProfile(formData);
      }
      
      setProfile(formData);
      setIsEditing(false);
      setError(null);
      alert('Profile updated successfully');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
      console.error('Update error:', err);
    }
  };

  const handlePreferenceToggle = (area) => {
    setFormData(prev => {
      const current = prev.areasOfInterest || [];
      if (current.includes(area)) {
        return {
          ...prev,
          areasOfInterest: current.filter(a => a !== area)
        };
      } else {
        return {
          ...prev,
          areasOfInterest: [...current, area]
        };
      }
    });
  };

  const handleClubToggle = (organizerId) => {
    setFormData(prev => {
      const current = prev.followedClubs || [];
      if (current.includes(organizerId)) {
        return {
          ...prev,
          followedClubs: current.filter(id => id !== organizerId)
        };
      } else {
        return {
          ...prev,
          followedClubs: [...current, organizerId]
        };
      }
    });
  };

  const handleSavePreferences = async () => {
    try {
      setError(null);
      await userAPI.updateProfile({
        areasOfInterest: formData.areasOfInterest || [],
        followedClubs: formData.followedClubs || []
      });
      setProfile({
        ...profile,
        areasOfInterest: formData.areasOfInterest,
        followedClubs: formData.followedClubs
      });
      setEditingPreferences(false);
      alert('Preferences updated successfully');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update preferences');
      console.error('Update error:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <Card className="shadow-lg">
          <div className="p-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">My Profile</h1>
            
            {error && <Alert type="error" message={error} />}

            {profile && (
              <div>
                {!isEditing ? (
                  <div className="space-y-4">
                    {user.role === 'participant' && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">First Name</label>
                          <p className="mt-1 text-lg text-gray-900">{profile.firstName}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Last Name</label>
                          <p className="mt-1 text-lg text-gray-900">{profile.lastName}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Participant Type</label>
                          <p className="mt-1 text-lg text-gray-900">{profile.participantType}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">College/Organization</label>
                          <p className="mt-1 text-lg text-gray-900">{profile.collegeOrgName}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Contact Number</label>
                          <p className="mt-1 text-lg text-gray-900">{profile.contactNumber}</p>
                        </div>
                      </>
                    )}
                    
                    <div className="bg-gray-100 border border-gray-300 rounded-lg p-4 mb-6">
                      <p className="text-xs font-semibold text-gray-600 mb-3">🔒 ACCOUNT INFORMATION (Read-Only)</p>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Email Address</label>
                          <p className="mt-1 text-base text-gray-900 font-mono">{profile.email || profile.loginEmail}</p>
                          <p className="text-xs text-gray-500 mt-1">This field cannot be changed</p>
                        </div>
                        
                        {user.role === 'participant' && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Participant Type</label>
                            <p className="mt-1 text-base text-gray-900">{profile.participantType}</p>
                            <p className="text-xs text-gray-500 mt-1">IIIT Student or Non-IIIT (cannot be changed)</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                      <p className="text-xs font-semibold text-blue-700 mb-3">✏️ EDITABLE INFORMATION</p>
                      <div className="space-y-3">
                        {user.role === 'participant' && (
                          <>
                            <div>
                              <label className="block text-sm font-medium text-gray-700">First Name</label>
                              <p className="mt-1 text-lg text-gray-900">{profile.firstName}</p>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Last Name</label>
                              <p className="mt-1 text-lg text-gray-900">{profile.lastName}</p>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700">College/Organization</label>
                              <p className="mt-1 text-lg text-gray-900">{profile.collegeOrgName}</p>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Contact Number</label>
                              <p className="mt-1 text-lg text-gray-900">{profile.contactNumber}</p>
                            </div>
                          </>
                        )}
                        
                        {user.role === 'organizer' && (
                          <>
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Organization Name</label>
                              <p className="mt-1 text-lg text-gray-900">{profile.name}</p>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Category</label>
                              <p className="mt-1 text-lg text-gray-900">{profile.category}</p>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Description</label>
                              <p className="mt-1 text-lg text-gray-900">{profile.description}</p>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Contact Email</label>
                              <p className="mt-1 text-lg text-gray-900">{profile.contactEmail}</p>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Role</label>
                      <p className="mt-1 text-lg text-gray-900 capitalize">{profile.role}</p>
                    </div>

                    {user.role === 'participant' && (
                      <>
                        <hr className="my-6" />
                        <div className="mt-6">
                          <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Preferences</h3>
                          
                          <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-3">Areas of Interest</label>
                            <div className="flex flex-wrap gap-2">
                              {profile.areasOfInterest && profile.areasOfInterest.length > 0 ? (
                                profile.areasOfInterest.map(area => (
                                  <span key={area} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                                    {area}
                                  </span>
                                ))
                              ) : (
                                <p className="text-gray-500 text-sm">No areas selected yet</p>
                              )}
                            </div>
                          </div>

                          <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-3">Clubs Following</label>
                            <div className="space-y-2">
                              {profile.followedClubs && profile.followedClubs.length > 0 ? (
                                profile.followedClubs.map(clubId => {
                                  const org = organizers.find(o => o._id === clubId);
                                  return (
                                    <div key={clubId} className="px-3 py-2 bg-green-100 text-green-800 rounded-lg text-sm font-medium inline-block">
                                      {org?.name || 'Unknown Club'}
                                    </div>
                                  );
                                })
                              ) : (
                                <p className="text-gray-500 text-sm">Not following any clubs yet</p>
                              )}
                            </div>
                          </div>

                          <button
                            onClick={() => {
                              setEditingPreferences(true);
                              setFormData({
                                ...profile,
                                areasOfInterest: profile.areasOfInterest || [],
                                followedClubs: profile.followedClubs || []
                              });
                            }}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            Edit Preferences
                          </button>
                        </div>
                      </>
                    )}

                    <button
                      onClick={() => {
                        setIsEditing(true);
                        setFormData(profile);
                      }}
                      className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Edit Profile
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {user.role === 'participant' && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">First Name</label>
                          <input
                            type="text"
                            name="firstName"
                            value={formData.firstName || ''}
                            onChange={handleInputChange}
                            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Last Name</label>
                          <input
                            type="text"
                            name="lastName"
                            value={formData.lastName || ''}
                            onChange={handleInputChange}
                            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Contact Number</label>
                          <input
                            type="tel"
                            name="contactNumber"
                            value={formData.contactNumber || ''}
                            onChange={handleInputChange}
                            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </>
                    )}

                    <div className="flex gap-3 mt-6">
                      <button
                        type="submit"
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        Save Changes
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditing(false);
                          setFormData(profile);
                        }}
                        className="px-4 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}

                {/* Preferences Editing Section for Participants */}
                {user.role === 'participant' && editingPreferences && (
                  <div className="mt-8 p-6 bg-gray-50 rounded-lg border border-gray-300">
                    <h3 className="text-lg font-semibold text-gray-900 mb-6">Edit Your Preferences</h3>

                    <div className="mb-8">
                      <label className="block text-sm font-medium text-gray-700 mb-4">Areas of Interest</label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {areasOfInterestOptions.map(area => (
                          <button
                            key={area}
                            type="button"
                            onClick={() => handlePreferenceToggle(area)}
                            className={`p-3 rounded-lg font-medium transition-all duration-200 border-2 ${
                              (formData.areasOfInterest || []).includes(area)
                                ? 'border-blue-600 bg-blue-50 text-blue-700'
                                : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                            }`}
                          >
                            {area}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="mb-8">
                      <label className="block text-sm font-medium text-gray-700 mb-4">Clubs / Organizations to Follow</label>
                      <div className="space-y-3 max-h-64 overflow-y-auto">
                        {organizers.length > 0 ? (
                          organizers.map(org => (
                            <label key={org._id} className="flex items-center p-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={(formData.followedClubs || []).includes(org._id)}
                                onChange={() => handleClubToggle(org._id)}
                                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
                              />
                              <span className="ml-3 flex-1">
                                <span className="font-medium text-gray-900">{org.name}</span>
                                {org.category && <span className="ml-2 text-sm text-gray-500">({org.category})</span>}
                              </span>
                            </label>
                          ))
                        ) : (
                          <p className="text-gray-500 text-sm">Loading clubs...</p>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={handleSavePreferences}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        Save Preferences
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingPreferences(false);
                          setFormData({
                            ...profile,
                            areasOfInterest: profile.areasOfInterest,
                            followedClubs: profile.followedClubs
                          });
                        }}
                        className="px-4 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ProfilePage;
