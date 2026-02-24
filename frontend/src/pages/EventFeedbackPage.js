import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Card from '../components/Card';
import Button from '../components/Button';

const EventFeedbackPage = () => {
  const { eventId } = useParams();
  const { token, user } = useAuth();
  const [stats, setStats] = useState(null);
  const [feedback, setFeedback] = useState([]);
  const [filteredFeedback, setFilteredFeedback] = useState([]);
  const [selectedRating, setSelectedRating] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortBy, setSortBy] = useState('latest');

  useEffect(() => {
    fetchFeedback();
    fetchStatistics();
  }, [eventId, token]);

  const fetchStatistics = async () => {
    try {
      const response = await fetch(`/api/feedback/${eventId}/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch statistics');
      }

      const data = await response.json();
      setStats(data);
    } catch (err) {
      setError(err.message);
    }
  };

  const fetchFeedback = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/feedback/${eventId}/view`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch feedback');
      }

      const data = await response.json();
      setFeedback(data.feedback);
      setFilteredFeedback(data.feedback);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterByRating = async (rating) => {
    setSelectedRating(rating);
    setLoading(true);

    try {
      const response = await fetch(`/api/feedback/${eventId}/rating/${rating}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch filtered feedback');
      }

      const data = await response.json();
      setFilteredFeedback(data.feedback);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClearFilter = () => {
    setSelectedRating(null);
    setFilteredFeedback(feedback);
  };

  const sortedFeedback = [...filteredFeedback].sort((a, b) => {
    switch (sortBy) {
      case 'latest':
        return new Date(b.createdAt) - new Date(a.createdAt);
      case 'oldest':
        return new Date(a.createdAt) - new Date(b.createdAt);
      case 'highestRating':
        return b.rating - a.rating;
      case 'lowestRating':
        return a.rating - b.rating;
      default:
        return 0;
    }
  });

  const renderStars = (rating) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={star <= rating ? 'text-yellow-400' : 'text-gray-300'}
          >
            ★
          </span>
        ))}
      </div>
    );
  };

  if (loading && !stats) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading feedback...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Statistics Section */}
        {stats && (
          <Card>
            <h1 className="text-3xl font-bold mb-6 text-gray-800">{stats.eventName}</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Total Feedback */}
              <div className="bg-blue-50 p-6 rounded-lg">
                <p className="text-gray-600 text-sm font-medium">Total Feedback</p>
                <p className="text-4xl font-bold text-blue-600 mt-2">{stats.totalFeedback}</p>
              </div>

              {/* Average Rating */}
              <div className="bg-green-50 p-6 rounded-lg">
                <p className="text-gray-600 text-sm font-medium">Average Rating</p>
                <p className="text-4xl font-bold text-green-600 mt-2">{stats.averageRating}</p>
                <div className="mt-2">{renderStars(Math.round(stats.averageRating))}</div>
              </div>

              {/* Response Rate */}
              <div className="bg-purple-50 p-6 rounded-lg">
                <p className="text-gray-600 text-sm font-medium">Response Rate</p>
                <p className="text-2xl font-bold text-purple-600 mt-2">
                  {stats.totalFeedback > 0 ? ((stats.totalFeedback / 100) * 100).toFixed(1) : 0}%
                </p>
              </div>
            </div>

            {/* Rating Distribution */}
            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-4 text-gray-800">Rating Distribution</h3>
              <div className="space-y-3">
                {[5, 4, 3, 2, 1].map((rating) => (
                  <div
                    key={rating}
                    className="flex items-center gap-4 cursor-pointer hover:bg-gray-100 p-2 rounded"
                    onClick={() => handleFilterByRating(rating)}
                  >
                    <div className="w-12 flex justify-center">
                      <span className="text-lg font-medium text-gray-700">{rating}★</span>
                    </div>
                    <div className="flex-1">
                      <div className="w-full bg-gray-200 rounded-full h-6">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-blue-600 h-6 rounded-full flex items-center justify-end pr-2"
                          style={{
                            width: `${
                              stats.totalFeedback > 0
                                ? (stats.ratingDistribution[rating] / stats.totalFeedback) * 100
                                : 0
                            }%`,
                          }}
                        >
                          {stats.ratingDistribution[rating] > 0 && (
                            <span className="text-white text-sm font-medium">
                              {stats.ratingPercentages[rating]}%
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="w-16 text-right">
                      <span className="text-gray-700 font-medium">
                        {stats.ratingDistribution[rating]} reviews
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}

        {/* Feedback List Section */}
        <div className="mt-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">
              Feedback Details
              {selectedRating && ` - ${selectedRating} Star${selectedRating > 1 ? 's' : ''}`}
            </h2>
            <div className="flex gap-4">
              {selectedRating && (
                <Button
                  onClick={handleClearFilter}
                  className="bg-gray-600 hover:bg-gray-700"
                >
                  Clear Filter
                </Button>
              )}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="latest">Latest First</option>
                <option value="oldest">Oldest First</option>
                <option value="highestRating">Highest Rating</option>
                <option value="lowestRating">Lowest Rating</option>
              </select>
            </div>
          </div>

          {sortedFeedback.length === 0 ? (
            <Card>
              <p className="text-center text-gray-600 py-8">
                No feedback available yet. Participants will be able to share feedback after attending the event.
              </p>
            </Card>
          ) : (
            <div className="space-y-4">
              {sortedFeedback.map((item) => (
                <Card key={item._id}>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div>{renderStars(item.rating)}</div>
                        <span className="text-gray-600 text-sm">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      {item.comments && (
                        <p className="text-gray-700 mt-2">{item.comments}</p>
                      )}
                    </div>
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

export default EventFeedbackPage;
