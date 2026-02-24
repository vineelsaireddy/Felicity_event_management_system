import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const FeedbackForm = ({ eventId, onFeedbackSubmitted, existingFeedback = null }) => {
  const { token } = useAuth();
  const [rating, setRating] = useState(existingFeedback?.rating || 0);
  const [comments, setComments] = useState(existingFeedback?.comments || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (!eventId) {
      setError('Event ID is missing. Please refresh the page.');
      setLoading(false);
      return;
    }

    if (!rating) {
      setError('Please select a rating');
      setLoading(false);
      return;
    }

    if (!token) {
      setError('Authentication required. Please login again.');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/feedback/${eventId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          rating: parseInt(rating),
          comments: comments.trim(),
        }),
      });

      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        let errorMessage = 'Failed to submit feedback';
        
        if (contentType && contentType.includes('application/json')) {
          try {
            const errorData = await response.json();
            errorMessage = errorData.message || errorMessage;
          } catch (e) {
            errorMessage = `Server error (${response.status}): ${response.statusText}`;
          }
        } else {
          errorMessage = `Server error (${response.status}): ${response.statusText}`;
          if (response.status === 401) {
            errorMessage = 'Authentication failed. Please login again.';
          } else if (response.status === 403) {
            errorMessage = 'You are not authorized to submit feedback. Please ensure you attended this event.';
          } else if (response.status === 404) {
            errorMessage = 'Event not found or feedback endpoint not available.';
          }
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      setSuccess(data.message || 'Feedback submitted successfully');
      setRating(0);
      setComments('');

      if (onFeedbackSubmitted) {
        onFeedbackSubmitted(data.feedback);
      }

      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Feedback submission error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 max-w-2xl">
      <h3 className="text-xl font-semibold mb-4 text-gray-800">Share Your Feedback</h3>
      <p className="text-gray-600 mb-4">
        Your anonymous feedback helps us improve our events. Please share your experience!
      </p>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Star Rating */}
        <div>
          <label className="block text-gray-700 font-medium mb-2">Rate this event</label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                className={`text-3xl transition-colors ${
                  rating >= star ? 'text-yellow-400' : 'text-gray-300'
                }`}
              >
                ★
              </button>
            ))}
          </div>
          <p className="text-sm text-gray-600 mt-2">
            {rating > 0 && `You rated this: ${rating} star${rating > 1 ? 's' : ''}`}
          </p>
        </div>

        {/* Comments */}
        <div>
          <label className="block text-gray-700 font-medium mb-2">Comments (Optional)</label>
          <textarea
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            placeholder="Share your thoughts about the event..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows="4"
            maxLength="500"
          />
          <p className="text-sm text-gray-600 mt-1">{comments.length}/500 characters</p>
        </div>

        {/* Privacy Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm text-blue-800">
            ✓ Your feedback is submitted <strong>anonymously</strong>. The organizer cannot identify you.
          </p>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className={`w-full py-2 px-4 rounded-lg text-white font-medium transition-colors ${
            loading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {loading ? 'Submitting...' : 'Submit Feedback'}
        </button>
      </form>
    </div>
  );
};

export default FeedbackForm;
