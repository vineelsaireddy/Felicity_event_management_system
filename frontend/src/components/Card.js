import React from 'react';

const Card = ({
  children,
  variant = 'default',
  padding = true,
  shadow = true,
  onClick,
  className = '',
  header,
  footer,
  ...props
}) => {
  const variantClasses = {
    default: 'card',
    elevated: 'card-elevated',
    outline: 'border-2 border-gray-200 rounded-xl bg-white'
  };

  const paddingClass = padding ? 'p-6' : '';
  const shadowClass = shadow ? 'shadow-md hover:shadow-lg' : '';

  return (
    <div
      className={`${variantClasses[variant]} ${paddingClass} ${shadowClass} transition-all duration-300 ${
        onClick ? 'cursor-pointer' : ''
      } ${className}`}
      onClick={onClick}
      {...props}
    >
      {header && <div className="mb-4 pb-4 border-b border-gray-200">{header}</div>}
      {children}
      {footer && <div className="mt-4 pt-4 border-t border-gray-200">{footer}</div>}
    </div>
  );
};

export default Card;
