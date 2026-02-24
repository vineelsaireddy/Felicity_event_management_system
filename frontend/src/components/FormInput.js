import React from 'react';

const FormInput = ({
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  error,
  required = false,
  icon,
  disabled = false,
  helperText
}) => {
  return (
    <div>
      {label && (
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          {icon && <span className="mr-2">{icon}</span>}
          {label}
          {required && <span className="text-red-600">*</span>}
        </label>
      )}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        className={`input-field ${error ? 'border-red-500 focus:ring-red-200 focus:border-red-500' : ''} ${
          disabled ? 'bg-gray-100 cursor-not-allowed' : ''
        }`}
      />
      {error && <p className="text-red-600 text-sm mt-1">{error}</p>}
      {helperText && <p className="text-gray-500 text-xs mt-1">{helperText}</p>}
    </div>
  );
};

export default FormInput;
