import React from 'react';

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  onClick,
  type = 'button',
  className = '',
  fullWidth = false,
  icon,
  ...props
}) => {
  const sizeClasses = {
    sm: 'px-3 py-1 text-sm',
    md: 'px-6 py-2.5 text-base',
    lg: 'px-8 py-3 text-lg',
    xl: 'px-10 py-4 text-xl'
  };

  const variantClasses = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    danger: 'btn-danger',
    success: 'btn-success',
    outline: 'px-6 py-2.5 border-2 border-blue-600 text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition-all duration-300'
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        ${variantClasses[variant]} 
        ${sizeClasses[size]}
        ${fullWidth ? 'w-full' : ''}
        ${disabled || loading ? 'opacity-50 cursor-not-allowed' : ''}
        flex items-center justify-center gap-2
        font-semibold
        rounded-lg
        transition-all duration-300
        ${className}
      `}
      {...props}
    >
      {loading ? (
        <>
          <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Loading...
        </>
      ) : (
        <>
          {icon && <span>{icon}</span>}
          {children}
        </>
      )}
    </button>
  );
};

export default Button;
