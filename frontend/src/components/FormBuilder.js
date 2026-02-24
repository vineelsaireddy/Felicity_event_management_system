import React, { useState, useEffect } from 'react';
import Card from './Card';

const FormBuilder = ({ eventId, onSave, initialFields = [], isLocked = false }) => {
  const [fields, setFields] = useState(initialFields);
  const [fieldToAdd, setFieldToAdd] = useState('text');
  const [showPreview, setShowPreview] = useState(false);
  const [newFieldLabel, setNewFieldLabel] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const fieldTypes = [
    { value: 'text', label: 'Short Text' },
    { value: 'textarea', label: 'Long Text' },
    { value: 'email', label: 'Email' },
    { value: 'number', label: 'Number' },
    { value: 'date', label: 'Date' },
    { value: 'select', label: 'Dropdown' },
    { value: 'checkbox', label: 'Checkbox' },
    { value: 'radio', label: 'Radio Buttons' },
    { value: 'file', label: 'File Upload' },
  ];

  const addField = () => {
    if (!newFieldLabel.trim()) {
      setError('Field label is required');
      return;
    }

    const newField = {
      id: Date.now().toString(),
      label: newFieldLabel,
      type: fieldToAdd,
      required: false,
      options: fieldToAdd === 'select' || fieldToAdd === 'radio' ? ['Option 1', 'Option 2'] : [],
    };

    setFields([...fields, newField]);
    setNewFieldLabel('');
    setFieldToAdd('text');
    setError(null);
  };

  const updateField = (id, updates) => {
    setFields(fields.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const removeField = (id) => {
    setFields(fields.filter(f => f.id !== id));
  };

  const moveField = (id, direction) => {
    const index = fields.findIndex(f => f.id === id);
    if ((direction === 'up' && index > 0) || (direction === 'down' && index < fields.length - 1)) {
      const newFields = [...fields];
      const swapIndex = direction === 'up' ? index - 1 : index + 1;
      [newFields[index], newFields[swapIndex]] = [newFields[swapIndex], newFields[index]];
      setFields(newFields);
    }
  };

  const handleSave = async () => {
    if (fields.length === 0) {
      setError('Please add at least one field');
      return;
    }

    try {
      await onSave(fields);
      setSuccess('Form saved successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.message || 'Failed to save form');
    }
  };

  const renderFieldOptions = (field) => {
    if (field.type === 'select' || field.type === 'radio') {
      return (
        <div className="mt-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Options</label>
          <div className="space-y-1">
            {field.options.map((opt, idx) => (
              <div key={idx} className="flex gap-2 items-center">
                <input
                  type="text"
                  value={opt}
                  onChange={(e) => {
                    const newOptions = [...field.options];
                    newOptions[idx] = e.target.value;
                    updateField(field.id, { options: newOptions });
                  }}
                  className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                  disabled={isLocked}
                />
                <button
                  onClick={() => {
                    const newOptions = field.options.filter((_, i) => i !== idx);
                    updateField(field.id, { options: newOptions });
                  }}
                  disabled={isLocked}
                  className="text-red-600 hover:text-red-800 disabled:opacity-50"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={() => {
              updateField(field.id, {
                options: [...field.options, `Option ${field.options.length + 1}`],
              });
            }}
            disabled={isLocked}
            className="mt-2 text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50"
          >
            + Add Option
          </button>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}
      {success && (
        <div className="p-4 bg-green-100 border border-green-400 text-green-700 rounded">
          {success}
        </div>
      )}

      <Card className="bg-white shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Registration Form Builder</h2>

        {!isLocked ? (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-3">Add New Field</h3>
            <div className="flex gap-3 flex-wrap items-end">
              <div className="flex-1 min-w-48">
                <label className="block text-sm font-medium text-gray-700 mb-1">Field Label</label>
                <input
                  type="text"
                  value={newFieldLabel}
                  onChange={(e) => setNewFieldLabel(e.target.value)}
                  placeholder="e.g., Team Name, Department"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onKeyPress={(e) => e.key === 'Enter' && addField()}
                />
              </div>
              <div className="flex-1 min-w-48">
                <label className="block text-sm font-medium text-gray-700 mb-1">Field Type</label>
                <select
                  value={fieldToAdd}
                  onChange={(e) => setFieldToAdd(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {fieldTypes.map(ft => (
                    <option key={ft.value} value={ft.value}>{ft.label}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={addField}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
              >
                Add Field
              </button>
            </div>
          </div>
        ) : (
          <div className="mb-6 p-3 bg-yellow-100 border border-yellow-400 text-yellow-800 rounded">
            ⚠️ Form is locked (at least 1 registration received)
          </div>
        )}

        {/* Fields List */}
        <div className="space-y-3">
          {fields.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No fields added yet. Add your first field above.</p>
          ) : (
            fields.map((field, index) => (
              <div key={field.id} className="p-4 border border-gray-300 rounded-lg bg-gray-50">
                <div className="flex gap-3 items-start justify-between mb-3">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Label</label>
                    <input
                      type="text"
                      value={field.label}
                      onChange={(e) => updateField(field.id, { label: e.target.value })}
                      disabled={isLocked}
                      className="w-full px-3 py-2 border border-gray-300 rounded disabled:bg-gray-200 disabled:cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                    <select
                      value={field.type}
                      onChange={(e) => updateField(field.id, { type: e.target.value })}
                      disabled={isLocked}
                      className="px-3 py-2 border border-gray-300 rounded disabled:bg-gray-200 disabled:cursor-not-allowed"
                    >
                      {fieldTypes.map(ft => (
                        <option key={ft.value} value={ft.value}>{ft.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-3 mb-3">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={field.required}
                      onChange={(e) => updateField(field.id, { required: e.target.checked })}
                      disabled={isLocked}
                      className="w-4 h-4 disabled:cursor-not-allowed"
                    />
                    <span className="text-sm font-medium text-gray-700">Required</span>
                  </label>
                </div>

                {renderFieldOptions(field)}

                <div className="flex gap-2 mt-3 border-t pt-3">
                  <button
                    onClick={() => moveField(field.id, 'up')}
                    disabled={isLocked || index === 0}
                    className="px-2 py-1 text-sm bg-gray-200 text-gray-800 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ↑ Up
                  </button>
                  <button
                    onClick={() => moveField(field.id, 'down')}
                    disabled={isLocked || index === fields.length - 1}
                    className="px-2 py-1 text-sm bg-gray-200 text-gray-800 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Down ↓
                  </button>
                  <button
                    onClick={() => removeField(field.id)}
                    disabled={isLocked}
                    className="px-2 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="flex gap-3 mt-6 pt-4 border-t">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-semibold"
          >
            {showPreview ? 'Hide' : 'Show'} Preview
          </button>
          {!isLocked && (
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold"
            >
              Save Form
            </button>
          )}
        </div>
      </Card>

      {/* Preview */}
      {showPreview && (
        <Card className="bg-blue-50 border-2 border-blue-200 shadow p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Form Preview</h3>
          <div className="bg-white p-6 rounded-lg border border-gray-300">
            {fields.map(field => (
              <div key={field.id} className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {field.label} {field.required && <span className="text-red-600">*</span>}
                </label>

                {field.type === 'textarea' && (
                  <textarea
                    rows="4"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    disabled
                  />
                )}
                {field.type === 'select' && (
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg" disabled>
                    <option>Select an option</option>
                    {field.options.map((opt, idx) => (
                      <option key={idx}>{opt}</option>
                    ))}
                  </select>
                )}
                {field.type === 'checkbox' && (
                  <div className="flex items-center gap-2">
                    <input type="checkbox" disabled />
                    <span className="text-gray-700">{field.label}</span>
                  </div>
                )}
                {field.type === 'radio' && (
                  <div className="space-y-2">
                    {field.options.map((opt, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input type="radio" disabled />
                        <span className="text-gray-700">{opt}</span>
                      </div>
                    ))}
                  </div>
                )}
                {field.type === 'file' && (
                  <input
                    type="file"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    disabled
                  />
                )}
                {['text', 'email', 'number', 'date'].includes(field.type) && (
                  <input
                    type={field.type}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    disabled
                    placeholder="Sample text"
                  />
                )}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

export default FormBuilder;
