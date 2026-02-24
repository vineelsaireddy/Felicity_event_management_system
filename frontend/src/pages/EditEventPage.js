import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { organizerAPI } from '../services/api';
import Alert from '../components/Alert';
import FormInput from '../components/FormInput';
import Card from '../components/Card';

const EditEventPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: '',
    eligibility: '',
    registrationDeadline: '',
    startDate: '',
    endDate: '',
    registrationLimit: '',
    registrationFee: '',
    tags: '',
  });

  useEffect(() => {
    fetchEventDetails();
  }, [id]);

  const fetchEventDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await organizerAPI.getEventDetails(id);
      const eventData = response.data.event || response.data;
      setEvent(eventData);

      // Format dates for input fields
      const formatDate = (date) => {
        if (!date) return '';
        const d = new Date(date);
        return d.toISOString().slice(0, 16);
      };

      setFormData({
        name: eventData.name || '',
        description: eventData.description || '',
        type: eventData.type || '',
        eligibility: eventData.eligibility || '',
        registrationDeadline: formatDate(eventData.registrationDeadline),
        startDate: formatDate(eventData.startDate),
        endDate: formatDate(eventData.endDate),
        registrationLimit: eventData.registrationLimit || '',
        registrationFee: eventData.registrationFee || 0,
        tags: eventData.tags?.join(', ') || '',
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch event details');
      console.error('Error:', err);
    } finally {
      setLoading(false);
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
    
    // Validate
    if (!formData.name?.trim()) {
      setError('Event name is required');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const updateData = {
        ...formData,
        registrationDeadline: new Date(formData.registrationDeadline),
        startDate: new Date(formData.startDate),
        endDate: new Date(formData.endDate),
        registrationLimit: parseInt(formData.registrationLimit),
        registrationFee: parseFloat(formData.registrationFee),
        tags: formData.tags.split(',').map(t => t.trim()).filter(t => t),
      };

      await organizerAPI.updateEvent(id, updateData);
      setSuccess('Event updated successfully!');
      setTimeout(() => {
        navigate(`/organizer/event/${id}`);
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update event');
      console.error('Error:', err);
    } finally {
      setSaving(false);
    }
  };

  const isFieldEditable = (fieldName) => {
    if (event?.status === 'Draft') return true;
    if (event?.status === 'Published' || event?.status === 'Ongoing') {
      // Only description and deadline can be edited
      return ['description', 'registrationDeadline', 'registrationLimit'].includes(fieldName);
    }
    return false;
  };

  const getEditabilityInfo = () => {
    const status = event?.status;
    if (status === 'Draft') {
      return { text: 'All fields are editable', color: 'blue' };
    } else if (status === 'Published' || status === 'Ongoing') {
      return {
        text: 'Only description, deadline, and registration limit can be edited',
        color: 'orange'
      };
    } else {
      return {
        text: 'Event is closed. No edits allowed.',
        color: 'red'
      };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading event details...</div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <Alert type="error" message="Event not found" />
          <button
            onClick={() => navigate('/organizer/dashboard')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const editInfo = getEditabilityInfo();
  const canSave = event.status === 'Draft' ||
    event.status === 'Published' ||
    event.status === 'Ongoing';

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(`/organizer/event/${id}`)}
            className="text-blue-600 hover:text-blue-800 mb-4 font-semibold"
          >
            ← Back to Event
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Edit Event</h1>
          <p className="text-gray-600 mt-2">{event.name}</p>
        </div>

        {/* Status Alert */}
        <Card className={`bg-${editInfo.color}-50 border border-${editInfo.color}-200 shadow mb-6`}>
          <div className={`p-4 text-${editInfo.color}-800`}>
            <strong>Status: {event.status}</strong> - {editInfo.text}
          </div>
        </Card>

        {error && <Alert type="error" message={error} />}
        {success && <Alert type="success" message={success} />}

        {/* Edit Form */}
        {canSave && (
          <Card className="bg-white shadow">
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Event Name */}
              <FormInput
                label="Event Name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleInputChange}
                disabled={!isFieldEditable('name')}
                required
              />

              {/* Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Event Type
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  disabled={!isFieldEditable('type')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="">Select a type</option>
                  <option value="Normal">Normal Event (Workshop, Talk, Competition)</option>
                  <option value="Hackathon">Hackathon (Team-based Coding Event)</option>
                  <option value="Merchandise">Merchandise Event (T-Shirt, Hoodie, etc.)</option>
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description {!isFieldEditable('description') && '(Read-only)'}
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  disabled={!isFieldEditable('description')}
                  rows="5"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </div>

              {/* Eligibility */}
              <FormInput
                label="Eligibility"
                name="eligibility"
                type="text"
                value={formData.eligibility}
                onChange={handleInputChange}
                disabled={!isFieldEditable('eligibility')}
                placeholder="e.g., Open to all, Only 3rd year"
              />

              {/* Registration Deadline */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Registration Deadline {!isFieldEditable('registrationDeadline') && '(Read-only)'}
                </label>
                <input
                  type="datetime-local"
                  name="registrationDeadline"
                  value={formData.registrationDeadline}
                  onChange={handleInputChange}
                  disabled={!isFieldEditable('registrationDeadline')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </div>

              {/* Start Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Event Start Date
                </label>
                <input
                  type="datetime-local"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleInputChange}
                  disabled={!isFieldEditable('startDate')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </div>

              {/* End Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Event End Date
                </label>
                <input
                  type="datetime-local"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleInputChange}
                  disabled={!isFieldEditable('endDate')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </div>

              {/* Registration Limit */}
              <FormInput
                label="Registration Limit"
                name="registrationLimit"
                type="number"
                value={formData.registrationLimit}
                onChange={handleInputChange}
                disabled={!isFieldEditable('registrationLimit')}
              />

              {/* Registration Fee */}
              <FormInput
                label="Registration Fee (₹)"
                name="registrationFee"
                type="number"
                value={formData.registrationFee}
                onChange={handleInputChange}
                disabled={!isFieldEditable('registrationFee')}
                step="0.01"
              />

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  name="tags"
                  value={formData.tags}
                  onChange={handleInputChange}
                  disabled={!isFieldEditable('tags')}
                  placeholder="e.g., coding, web, beginner"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t">
                <button
                  type="submit"
                  disabled={saving || !canSave}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  onClick={() => navigate(`/organizer/event/${id}`)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-semibold"
                >
                  Cancel
                </button>
              </div>
            </form>
          </Card>
        )}

        {!canSave && (
          <Card className="bg-red-50 border border-red-200 shadow">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-red-900 mb-2">Cannot Edit Event</h3>
              <p className="text-red-800">
                Events with status "{event.status}" cannot be edited. Only Draft, Published, and Ongoing events can be modified.
              </p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default EditEventPage;
