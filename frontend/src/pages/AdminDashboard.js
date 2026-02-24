import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Button from '../components/Button';
import Card from '../components/Card';
import Alert from '../components/Alert';
import FormInput from '../components/FormInput';
import { adminAPI } from '../services/api';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [organizers, setOrganizers] = useState([]);
  const [archivedOrganizers, setArchivedOrganizers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [stats, setStats] = useState(null);
  const [createdCredentials, setCreatedCredentials] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    description: '',
    contactEmail: '',
    contactNumber: '',
  });

  const [formErrors, setFormErrors] = useState({});

  // Fetch organizers and stats
  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/login');
      return;
    }
    fetchOrganizers();
    fetchStats();
  }, [user, navigate]);

  const fetchOrganizers = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await adminAPI.getAllOrganizers();
      setOrganizers(response.data);
      
      // Fetch archived organizers
      try {
        const archivedResponse = await adminAPI.getArchivedOrganizers();
        setArchivedOrganizers(archivedResponse.data || []);
      } catch (err) {
        console.error('Failed to fetch archived organizers:', err);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch organizers');
      console.error('Error fetching organizers:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await adminAPI.getDashboardStats();
      setStats(response.data);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  // Validate form
  const validateForm = () => {
    const errors = {};

    if (!formData.name.trim()) {
      errors.name = 'Club/Organizer name is required';
    }

    if (!formData.category.trim()) {
      errors.category = 'Category is required';
    }

    if (!formData.contactEmail.trim()) {
      errors.contactEmail = 'Contact email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.contactEmail)) {
      errors.contactEmail = 'Please enter a valid email';
    }

    if (!formData.contactNumber.trim()) {
      errors.contactNumber = 'Contact number is required';
    } else if (!/^\d{10}$/.test(formData.contactNumber.replace(/\D/g, ''))) {
      errors.contactNumber = 'Please enter a valid 10-digit phone number';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      setError('Please fix the errors in the form');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');
      setCreatedCredentials(null);

      const response = await adminAPI.createOrganizer(formData);

      setSuccess(`✅ Organizer "${formData.name}" created successfully!`);
      setCreatedCredentials(response.data.organizer);

      // Reset form
      setFormData({
        name: '',
        category: '',
        description: '',
        contactEmail: '',
        contactNumber: '',
      });
      setFormErrors({});

      // Refresh organizers list
      await fetchOrganizers();
      await fetchStats();

      // Hide form after 2 seconds
      setTimeout(() => setShowForm(false), 2000);
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message;
      setError(errorMessage);
      console.error('Error creating organizer:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveOrganizer = async (id, name) => {
    if (window.confirm(`Are you sure you want to remove "${name}"?`)) {
      try {
        setError('');
        await adminAPI.removeOrganizer(id);
        setSuccess(`Organizer "${name}" removed successfully`);
        await fetchOrganizers();
        await fetchStats();
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to remove organizer');
        console.error('Error removing organizer:', err);
      }
    }
  };

  const handleArchiveOrganizer = async (id, name) => {
    if (window.confirm(`Archive "${name}"? They won't be able to create new events.`)) {
      try {
        setError('');
        await adminAPI.archiveOrganizer(id);
        setSuccess(`Organizer "${name}" archived successfully`);
        await fetchOrganizers();
        await fetchStats();
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to archive organizer');
        console.error('Error archiving organizer:', err);
      }
    }
  };

  const handleUnarchiveOrganizer = async (id, name) => {
    if (window.confirm(`Restore "${name}"? They will be able to login and create events again.`)) {
      try {
        setError('');
        await adminAPI.unarchiveOrganizer(id);
        setSuccess(`Organizer "${name}" restored successfully`);
        await fetchOrganizers();
        await fetchStats();
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to restore organizer');
        console.error('Error restoring organizer:', err);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Welcome back, {user?.email}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={logout}
            className="mt-4"
          >
            Logout
          </Button>
        </div>

        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Card variant="elevated">
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-600">{stats.totalOrganizers}</div>
                <p className="text-gray-600 mt-2">Active Clubs/Organizers</p>
              </div>
            </Card>
            <Card variant="elevated">
              <div className="text-center">
                <div className="text-4xl font-bold text-green-600">{stats.totalEvents}</div>
                <p className="text-gray-600 mt-2">Total Events</p>
              </div>
            </Card>
          </div>
        )}

        {/* Alerts */}
        {error && (
          <Alert
            type="error"
            message={error}
            onClose={() => setError('')}
            dismissible
            autoClose
            autoCloseDuration={5000}
          />
        )}

        {success && (
          <Alert
            type="success"
            message={success}
            onClose={() => setSuccess('')}
            dismissible
            autoClose
            autoCloseDuration={5000}
          />
        )}

        {/* Created Credentials Display */}
        {createdCredentials && (
          <Card variant="elevated" className="mb-8 border-2 border-green-200 bg-green-50">
            <h3 className="text-xl font-bold text-green-900 mb-4">
              ✅ Auto-Generated Credentials (Share Securely)
            </h3>
            <div className="space-y-3 bg-white p-4 rounded border border-green-300">
              <div>
                <p className="text-sm text-gray-600 font-semibold">Organizer Name:</p>
                <p className="text-lg font-mono text-gray-900">{createdCredentials.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 font-semibold">Login Email:</p>
                <p className="text-lg font-mono text-blue-600 break-all">
                  {createdCredentials.loginEmail}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 font-semibold">Login Password:</p>
                <p className="text-lg font-mono text-red-600 font-bold">
                  {createdCredentials.loginPassword}
                </p>
              </div>
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                <p className="text-sm text-yellow-800">
                  ⚠️ <strong>Important:</strong> Share these credentials securely with the organizer.
                  They will need them to log in and start creating events.
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Create New Organizer Button */}
        <div className="mb-8">
          {!showForm ? (
            <Button variant="primary" size="lg" onClick={() => setShowForm(true)}>
              ➕ Add New Club/Organizer
            </Button>
          ) : (
            <Button variant="secondary" size="lg" onClick={() => setShowForm(false)}>
              ✕ Cancel
            </Button>
          )}
        </div>

        {/* Create Organizer Form */}
        {showForm && (
          <Card variant="elevated" className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Create New Club/Organizer</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <FormInput
                label="Club/Organizer Name"
                type="text"
                placeholder="e.g., Coding Club, Sports Council"
                value={formData.name}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value });
                  if (formErrors.name) setFormErrors({ ...formErrors, name: '' });
                }}
                error={formErrors.name}
                required
              />

              <FormInput
                label="Category"
                type="text"
                placeholder="e.g., Technical, Cultural, Sports"
                value={formData.category}
                onChange={(e) => {
                  setFormData({ ...formData, category: e.target.value });
                  if (formErrors.category) setFormErrors({ ...formErrors, category: '' });
                }}
                error={formErrors.category}
                required
              />

              <FormInput
                label="Description"
                type="text"
                placeholder="Brief description of the club/organizer"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />

              <FormInput
                label="Contact Email"
                type="email"
                placeholder="e.g., contact@club.com"
                value={formData.contactEmail}
                onChange={(e) => {
                  setFormData({ ...formData, contactEmail: e.target.value });
                  if (formErrors.contactEmail) setFormErrors({ ...formErrors, contactEmail: '' });
                }}
                error={formErrors.contactEmail}
                required
              />

              <FormInput
                label="Contact Number"
                type="tel"
                placeholder="10-digit phone number"
                value={formData.contactNumber}
                onChange={(e) => {
                  setFormData({ ...formData, contactNumber: e.target.value });
                  if (formErrors.contactNumber)
                    setFormErrors({ ...formErrors, contactNumber: '' });
                }}
                error={formErrors.contactNumber}
                required
              />

              <div className="pt-4">
                <Button
                  variant="primary"
                  type="submit"
                  fullWidth
                  loading={loading}
                  disabled={loading}
                >
                  {loading ? 'Creating...' : 'Create Organizer & Generate Credentials'}
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* Organizers List */}
        <Card variant="elevated">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Active Clubs/Organizers</h2>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin">
                <svg
                  className="w-8 h-8 text-blue-600"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              </div>
              <p className="text-gray-600 mt-4">Loading organizers...</p>
            </div>
          ) : organizers.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 text-lg">No organizers created yet</p>
              <p className="text-gray-500 mt-2">Click "Add New Club/Organizer" to create one</p>
            </div>
          ) : (
            <div className="space-y-4">
              {organizers.map((org) => (
                <div
                  key={org._id}
                  className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">{org.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        📧 Login: <span className="font-mono text-blue-600">{org.loginEmail}</span>
                      </p>
                      <p className="text-sm text-gray-600">
                        📱 Contact: <span className="font-mono">{org.contactNumber}</span>
                      </p>
                      <p className="text-sm text-gray-600">
                        Category: <span className="font-semibold">{org.category}</span>
                      </p>
                      {org.description && (
                        <p className="text-sm text-gray-600 mt-2">{org.description}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleArchiveOrganizer(org._id, org.name)}
                      >
                        Archive
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleRemoveOrganizer(org._id, org.name)}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Archived Organizers Section */}
        {archivedOrganizers.length > 0 && (
          <Card variant="elevated" className="mt-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-red-700">🔒 Archived / Disabled Clubs/Organizers</h2>

            <div className="space-y-4">
              {archivedOrganizers.map((org) => (
                <div
                  key={org._id}
                  className="p-4 border border-red-200 rounded-lg hover:shadow-md transition-shadow bg-red-50"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">{org.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        📧 Login: <span className="font-mono text-blue-600">{org.loginEmail}</span>
                      </p>
                      <p className="text-sm text-gray-600">
                        📱 Contact: <span className="font-mono">{org.contactNumber}</span>
                      </p>
                      <p className="text-sm text-gray-600">
                        Category: <span className="font-semibold">{org.category}</span>
                      </p>
                      <p className="text-sm text-red-700 font-semibold mt-2">
                        Status: {org.isArchived ? '🔒 Archived' : '❌ Disabled'}
                      </p>
                      {org.description && (
                        <p className="text-sm text-gray-600 mt-2">{org.description}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleUnarchiveOrganizer(org._id, org.name)}
                      >
                        🔓 Restore
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleRemoveOrganizer(org._id, org.name)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
