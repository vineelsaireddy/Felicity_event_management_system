import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { userAPI, organizerAPI } from '../services/api';
import Card from '../components/Card';
import Alert from '../components/Alert';

const OnboardingPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [organizers, setOrganizers] = useState([]);
  const [error, setError] = useState(null);
  const [preferences, setPreferences] = useState({
    areasOfInterest: [],
    followedClubs: [],
  });

  const areasOfInterestOptions = [
    'Technology',
    'Sports',
    'Arts & Culture',
    'Music',
    'Gaming',
    'Robotics',
    'Photography',
    'Entrepreneurship',
    'Science',
    'Social Service',
    'Dance',
    'Theater',
  ];

  useEffect(() => {
    if (user?.role !== 'participant') {
      navigate('/');
      return;
    }
    fetchOrganizers();
  }, []);

  const fetchOrganizers = async () => {
    try {
      const response = await organizerAPI.getAllOrganizers();
      setOrganizers(response.data || []);
    } catch (error) {
      console.error('Error fetching organizers:', error);
    }
  };

  const handleAreaToggle = (area) => {
    setPreferences(prev => ({
      ...prev,
      areasOfInterest: prev.areasOfInterest.includes(area)
        ? prev.areasOfInterest.filter(a => a !== area)
        : [...prev.areasOfInterest, area]
    }));
  };

  const handleClubToggle = (clubId) => {
    setPreferences(prev => ({
      ...prev,
      followedClubs: prev.followedClubs.includes(clubId)
        ? prev.followedClubs.filter(id => id !== clubId)
        : [...prev.followedClubs, clubId]
    }));
  };

  const handleSkip = async () => {
    try {
      setLoading(true);
      await userAPI.updateProfile({
        areasOfInterest: [],
        followedClubs: [],
        profileCompleted: true,
      });
      navigate('/dashboard');
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to skip onboarding');
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    try {
      setLoading(true);
      setError(null);

      await userAPI.updateProfile({
        areasOfInterest: preferences.areasOfInterest,
        followedClubs: preferences.followedClubs,
        profileCompleted: true,
      });

      navigate('/dashboard');
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to save preferences');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-gray-100 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold text-gray-900">Welcome to Felicity!</h1>
            <div className="text-sm font-semibold text-gray-600">Step {step} of 2</div>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 transition-all duration-300"
              style={{ width: `${(step / 2) * 100}%` }}
            ></div>
          </div>
        </div>

        {error && <Alert type="error" message={error} />}

        {/* Step 1: Areas of Interest */}
        {step === 1 && (
          <Card className="shadow-lg">
            <div className="p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">What are your interests?</h2>
              <p className="text-gray-600 mb-8">
                Select the areas you're interested in. This will help us recommend relevant events. You can always change this later.
              </p>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
                {areasOfInterestOptions.map((area) => (
                  <button
                    key={area}
                    onClick={() => handleAreaToggle(area)}
                    className={`p-3 rounded-lg font-medium transition-all ${
                      preferences.areasOfInterest.includes(area)
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {area}
                  </button>
                ))}
              </div>

              <div className="flex gap-4">
                <button
                  onClick={handleSkip}
                  disabled={loading}
                  className="flex-1 px-4 py-3 bg-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-400 transition-colors disabled:bg-gray-400"
                >
                  Skip
                </button>
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          </Card>
        )}

        {/* Step 2: Clubs to Follow */}
        {step === 2 && (
          <Card className="shadow-lg">
            <div className="p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Follow your favorite clubs</h2>
              <p className="text-gray-600 mb-8">
                Follow clubs/organizers to stay updated with their latest events. You can follow more later.
              </p>

              {organizers.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-600">No clubs/organizers available yet</p>
                </div>
              ) : (
                <div className="space-y-3 mb-8 max-h-96 overflow-y-auto">
                  {organizers.map((org) => (
                    <div
                      key={org._id}
                      onClick={() => handleClubToggle(org._id)}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        preferences.followedClubs.includes(org._id)
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-900">{org.name}</h3>
                          <p className="text-sm text-gray-600 mt-1">{org.description}</p>
                          <div className="flex gap-2 mt-2">
                            <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">
                              {org.category}
                            </span>
                          </div>
                        </div>
                        <div
                          className={`flex-shrink-0 w-6 h-6 rounded border-2 flex items-center justify-center ${
                            preferences.followedClubs.includes(org._id)
                              ? 'bg-blue-600 border-blue-600'
                              : 'border-gray-300'
                          }`}
                        >
                          {preferences.followedClubs.includes(org._id) && (
                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-4">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 px-4 py-3 bg-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-400 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleSkip}
                  disabled={loading}
                  className="flex-1 px-4 py-3 bg-gray-400 text-white rounded-lg font-semibold hover:bg-gray-500 transition-colors disabled:bg-gray-500"
                >
                  Skip for Now
                </button>
                <button
                  onClick={handleComplete}
                  disabled={loading}
                  className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:bg-gray-400"
                >
                  {loading ? 'Saving...' : 'Complete'}
                </button>
              </div>
            </div>
          </Card>
        )}

        {/* Info Box */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-bold text-blue-900 mb-2">💡 Why set preferences?</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>✓ Get personalized event recommendations</li>
            <li>✓ Never miss events from your favorite clubs</li>
            <li>✓ Discover events in your areas of interest</li>
            <li>✓ You can change these anytime from your profile</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default OnboardingPage;
