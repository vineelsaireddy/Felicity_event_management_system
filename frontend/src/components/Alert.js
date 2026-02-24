import React, { useState, useEffect } from 'react';

const Alert = ({
  type = 'info',
  message,
  title,
  dismissible = true,
  autoClose = false,
  autoCloseDuration = 5000,
  onClose,
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (autoClose && isVisible) {
      const timer = setTimeout(() => {
        handleClose();
      }, autoCloseDuration);
      return () => clearTimeout(timer);
    }
  }, [autoClose, autoCloseDuration, isVisible]);

  const handleClose = () => {
    setIsVisible(false);
    if (onClose) onClose();
  };

  if (!isVisible) return null;

  const alertClasses = {
    error: 'alert-error',
    success: 'alert-success',
    warning: 'alert-warning',
    info: 'alert-info'
  };

  const icons = {
    error: '❌',
    success: '✅',
    warning: '⚠️',
    info: 'ℹ️'
  };

  return (
    <div className={`${alertClasses[type]} animate-slideIn ${className}`}>
      <div className="flex items-start gap-3">
        <span className="text-xl flex-shrink-0">{icons[type]}</span>
        <div className="flex-grow">
          {title && <h3 className="font-semibold mb-1">{title}</h3>}
          {message && <p>{message}</p>}
        </div>
        {dismissible && (
          <button
            onClick={handleClose}
            className="flex-shrink-0 font-bold text-xl hover:opacity-70 transition-opacity"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
};

export default Alert;
