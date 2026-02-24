import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { organizerAPI } from '../services/api';
import Card from '../components/Card';
import Alert from '../components/Alert';
import FormBuilder from '../components/FormBuilder';

const CreateEventPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [step, setStep] = useState(1); // 1: Event Details, 2: Custom Form
  const [customFormFields, setCustomFormFields] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'Normal',
    eligibility: 'Open',
    registrationDeadline: '',
    startDate: '',
    endDate: '',
    registrationLimit: '',
    registrationFee: 0,
    tags: '',
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateEventDetails = () => {
    if (!formData.name || !formData.description || !formData.startDate || !formData.registrationDeadline) {
      setError('Please fill in all required fields (Name, Description, Registration Deadline, and Start Date)');
      return false;
    }

    const deadline = new Date(formData.registrationDeadline);
    const startDate = new Date(formData.startDate);
    const endDate = formData.endDate ? new Date(formData.endDate) : new Date(formData.startDate);

    if (deadline > startDate) {
      setError('Registration deadline must be before event start date');
      return false;
    }

    if (endDate < startDate) {
      setError('Event end date must be after or equal to start date');
      return false;
    }

    return true;
  };

  const handleProceedToFormBuilder = (e) => {
    e.preventDefault();
    setError(null);
    
    if (validateEventDetails()) {
      setStep(2);
    }
  };

  const handleSaveCustomForm = async (fields) => {
    setCustomFormFields(fields);
    setError(null);
    
    try {
      setLoading(true);

      const eventPayload = {
        name: formData.name,
        description: formData.description,
        type: formData.type,
        eligibility: formData.eligibility,
        registrationDeadline: formData.registrationDeadline,
        startDate: formData.startDate,
        endDate: formData.endDate || formData.startDate,
        registrationLimit: parseInt(formData.registrationLimit) || 100,
        registrationFee: parseInt(formData.registrationFee) || 0,
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()) : [],
        customForm: {
          fields: fields.map((field, index) => ({
            fieldId: field.id,
            fieldName: field.label,
            fieldType: field.type,
            required: field.required,
            options: field.options || [],
            order: index,
          })),
          isLocked: false,
        },
      };

      await organizerAPI.createEvent(eventPayload);
      
      alert('Event created successfully!');
      navigate('/organizer/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create event');
      console.error('Create event error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToDetails = () => {
    setStep(1);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {step === 1 ? (
          <Card className="shadow-lg">
            <div className="p-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-6">Create New Event</h1>
              
              {error && <Alert type="error" message={error} />}

              <form onSubmit={handleProceedToFormBuilder} className="space-y-6">
              {/* Event Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Event Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Tech Workshop 2024"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Description *</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="4"
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Describe your event..."
                  required
                />
              </div>

              {/* Event Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Event Type</label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="Normal">Normal Event (Workshop, Talk, Competition)</option>
                  <option value="Hackathon">Hackathon (Team-based Coding Event)</option>
                  <option value="Merchandise">Merchandise Event (T-Shirt, Hoodie, etc.)</option>
                </select>
              </div>

              {/* Eligibility */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Eligibility</label>
                <select
                  name="eligibility"
                  value={formData.eligibility}
                  onChange={handleInputChange}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="Open">Open to Everyone</option>
                  <option value="IIIT Only">IIIT Students Only</option>
                  <option value="Restricted">Restricted (RSVP Required)</option>
                </select>
              </div>

              {/* Registration Deadline */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Registration Deadline *</label>
                <input
                  type="datetime-local"
                  name="registrationDeadline"
                  value={formData.registrationDeadline}
                  onChange={handleInputChange}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              {/* Start Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Event Start Date *</label>
                <input
                  type="datetime-local"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleInputChange}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              {/* End Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Event End Date</label>
                <input
                  type="datetime-local"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleInputChange}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Registration Limit */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Registration Limit (Capacity)</label>
                <input
                  type="number"
                  name="registrationLimit"
                  value={formData.registrationLimit}
                  onChange={handleInputChange}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., 100"
                  min="1"
                />
              </div>

              {/* Registration Fee */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Registration Fee (₹)</label>
                <input
                  type="number"
                  name="registrationFee"
                  value={formData.registrationFee}
                  onChange={handleInputChange}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0 for free event"
                  min="0"
                />
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Tags (comma-separated)</label>
                <input
                  type="text"
                  name="tags"
                  value={formData.tags}
                  onChange={handleInputChange}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., technology, coding, workshop"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
                >
                  {loading ? 'Proceeding...' : 'Next: Setup Registration Form'}
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/organizer/dashboard')}
                  className="flex-1 px-4 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </Card>
        ) : (
          <div>
            <div className="mb-4">
              <button
                onClick={handleBackToDetails}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                ← Back to Event Details
              </button>
            </div>
            
            {error && <Alert type="error" message={error} />}
            
            <FormBuilder
              onSave={handleSaveCustomForm}
              initialFields={customFormFields}
              isLocked={false}
            />

            <div className="mt-4 flex gap-3">
              <button
                onClick={handleBackToDetails}
                className="flex-1 px-4 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 transition-colors"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => navigate('/organizer/dashboard')}
                className="flex-1 px-4 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateEventPage;
