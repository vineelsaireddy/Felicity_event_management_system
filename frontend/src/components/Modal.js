import React from 'react';

const Modal = ({
  isOpen,
  title,
  children,
  onClose,
  size = 'md',
  footer,
  closeButton = true,
  backdrop = true
}) => {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      {backdrop && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
        ></div>
      )}

      {/* Modal */}
      <div className={`relative bg-white rounded-xl shadow-2xl animate-fadeIn ${sizeClasses[size]} mx-4 z-10 max-h-[90vh] overflow-y-auto`}>
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
            {closeButton && (
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 transition-colors text-2xl"
              >
                ✕
              </button>
            )}
          </div>
        )}

        {/* Content */}
        <div className="p-6">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="border-t border-gray-200 p-6 bg-gray-50 flex justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;
