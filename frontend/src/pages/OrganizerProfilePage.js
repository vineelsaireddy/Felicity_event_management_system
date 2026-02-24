import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { organizerAPI, passwordResetAPI } from '../services/api';
import Alert from '../components/Alert';
import FormInput from '../components/FormInput';

const OrganizerProfilePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [discordTestResult, setDiscordTestResult] = useState(null);
  const [myResetRequests, setMyResetRequests] = useState([]);
  const [resetRequestsLoading, setResetRequestsLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    description: '',
    contactEmail: '',
    contactNumber: '',
    discordWebhook: '',
  });

  useEffect(() => {
    fetchOrganizerProfile();
    fetchMyResetRequests();
  }, []);

  const fetchOrganizerProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      // Since we don't have a dedicated get profile endpoint, use organizer info from user context
      if (user) {
        setFormData({
          name: user.name || '',
          category: user.category || '',
          description: user.description || '',
          contactEmail: user.contactEmail || '',
          contactNumber: user.contactNumber || '',
          discordWebhook: user.discordWebhook || '',
        });
      }
    } catch (err) {
      setError('Failed to load profile');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyResetRequests = async () => {
    try {
      setResetRequestsLoading(true);
      const res = await passwordResetAPI.getMyRequests();
      setMyResetRequests(res.data);
    } catch (err) {
      // Silently fail — not critical
      console.error('Could not load reset requests:', err);
    } finally {
      setResetRequestsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      await organizerAPI.updateOrganizerProfile(formData);
      setSuccess('Profile updated successfully!');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
      console.error('Error:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleTestDiscordWebhook = async () => {
    if (!formData.discordWebhook) {
      setDiscordTestResult({ type: 'error', message: 'Please enter a Discord webhook URL' });
      return;
    }

    try {
      setDiscordTestResult({ type: 'loading', message: 'Testing webhook...' });

      // Test the webhook by sending a test message
      const response = await fetch(formData.discordWebhook, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: '✅ Discord Webhook Test from Felicity Event Management',
          embeds: [{
            title: 'Webhook Connected Successfully',
            description: 'Your Discord webhook is properly configured.',
            color: 65280, // Green
          }]
        }),
      });

      if (response.ok) {
        setDiscordTestResult({ type: 'success', message: 'Webhook test successful! Messages will be posted to Discord.' });
      } else {
        setDiscordTestResult({ type: 'error', message: 'Webhook test failed. Please check the URL.' });
      }
    } catch (err) {
      setDiscordTestResult({ type: 'error', message: 'Failed to test webhook: ' + err.message });
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
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Organizer Profile</h1>
          <p className="text-gray-600 mt-2">Manage your organization details and settings</p>
        </div>

        {error && <Alert type="error" message={error} />}
        {success && <Alert type="success" message={success} />}

        <form onSubmit={handleSaveProfile} className="bg-white rounded-lg shadow p-6 space-y-6">
          {/* Organization Name */}
          <FormInput
            label="Organization Name"
            name="name"
            type="text"
            value={formData.name}
            onChange={handleChange}
            placeholder="Enter organization name"
            required
          />

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a category</option>
              <option value="Workshop">Workshop</option>
              <option value="Talk">Talk</option>
              <option value="Competition">Competition</option>
              <option value="Hackathon">Hackathon</option>
              <option value="Meetup">Meetup</option>
              <option value="Conference">Conference</option>
              <option value="Seminar">Seminar</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Tell us about your organization"
              rows="4"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Contact Email */}
          <FormInput
            label="Contact Email"
            name="contactEmail"
            type="email"
            value={formData.contactEmail}
            onChange={handleChange}
            placeholder="contact@organization.com"
            required
          />

          {/* Contact Number */}
          <FormInput
            label="Contact Number (Optional)"
            name="contactNumber"
            type="tel"
            value={formData.contactNumber}
            onChange={handleChange}
            placeholder="+91 98765 43210"
          />

          {/* Login Email (Read-only) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Login Email (Non-editable)
            </label>
            <input
              type="email"
              value={user?.email || user?.loginEmail || ''}
              readOnly
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
            />
            <p className="text-xs text-gray-500 mt-1">This email cannot be changed</p>
          </div>

          {/* Discord Webhook Section */}
          <div className="border-t pt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Discord Integration</h2>
            <p className="text-sm text-gray-600 mb-4">
              Automatically post new events to your Discord server.
              <a href="https://discord.com/developers/applications" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline ml-1">
                Create a webhook
              </a>
            </p>

            <FormInput
              label="Discord Webhook URL"
              name="discordWebhook"
              type="url"
              value={formData.discordWebhook}
              onChange={handleChange}
              placeholder="https://discord.com/api/webhooks/..."
            />

            {formData.discordWebhook && (
              <button
                type="button"
                onClick={handleTestDiscordWebhook}
                className="mt-3 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
              >
                Test Webhook
              </button>
            )}

            {discordTestResult && (
              <Alert
                type={discordTestResult.type}
                message={discordTestResult.message}
              />
            )}
          </div>

          {/* Save Button */}
          <div className="flex gap-4 pt-6">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
            <button
              type="button"
              onClick={fetchOrganizerProfile}
              className="flex-1 px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition-colors font-semibold"
            >
              Reset Changes
            </button>
          </div>
        </form>

        {/* Info Section */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">ℹ️ About Your Profile</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>✅ Your name and category help participants discover your events</li>
            <li>✅ Contact email will be displayed on event pages</li>
            <li>✅ Discord webhook will auto-post when you publish new events</li>
            <li>✅ Changes are saved immediately</li>
          </ul>
        </div>

        {/* Password Reset Section */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">🔑 Password Reset</h2>
              <p className="text-sm text-gray-600 mt-1">Request a password reset from administrator</p>
            </div>
            <button
              onClick={() => navigate('/forgot-password')}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-semibold text-sm"
            >
              + New Request
            </button>
          </div>

          {resetRequestsLoading ? (
            <p className="text-gray-500 text-sm">Loading requests...</p>
          ) : myResetRequests.length === 0 ? (
            <div className="text-center py-6 bg-gray-50 rounded-lg">
              <p className="text-gray-500 text-sm">No password reset requests submitted yet.</p>
              <p className="text-gray-400 text-xs mt-1">If you forgot your password, click "New Request" above.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {myResetRequests.map((req) => (
                <div key={req._id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${req.status === 'Approved' ? 'bg-green-100 text-green-800' :
                        req.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                        {req.status === 'Approved' ? '✅' : req.status === 'Rejected' ? '❌' : '⏳'} {req.status}
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(req.requestDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">
                      <strong>Reason:</strong> {req.requestReason || 'Not specified'}
                    </p>
                    {req.status === 'Rejected' && req.rejectionReason && (
                      <p className="text-xs text-red-600 mt-1">
                        <strong>Admin comment:</strong> {req.rejectionReason}
                      </p>
                    )}
                    {req.status === 'Approved' && (
                      <p className="text-xs text-green-600 mt-1">
                        ✓ Temporary password was sent to your registered email.
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrganizerProfilePage;
