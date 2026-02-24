import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { merchandiseAPI } from '../services/api';
import Card from '../components/Card';
import Alert from '../components/Alert';
import Button from '../components/Button';

const PaymentProofUploadPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    // Validate file type
    if (!selectedFile.type.startsWith('image/')) {
      setError('Please upload an image file (PNG, JPG, GIF, etc.)');
      return;
    }

    // Validate file size (max 5MB)
    if (selectedFile.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    setFile(selectedFile);
    setError(null);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!file) {
      setError('Please select a payment proof image');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const formData = new FormData();
      formData.append('paymentProof', file);

      await merchandiseAPI.uploadPaymentProof(orderId, formData);

      setSuccess('✅ Payment proof uploaded successfully! Your order is now pending approval from the organizer.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to upload payment proof');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 pt-24">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <button
          onClick={() => navigate('/dashboard')}
          className="text-blue-600 hover:text-blue-800 font-semibold mb-6"
        >
          ← Back to Dashboard
        </button>

        <Card className="shadow-lg">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-8 text-white">
            <div className="text-center">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <span className="text-2xl">📸</span>
              </div>
              <h1 className="text-3xl font-bold mb-2">Upload Payment Proof</h1>
              <p className="text-orange-100">Submit your payment screenshot to complete your merchandise order</p>
            </div>
          </div>

          {/* Content */}
          <div className="p-8">
            {error && <Alert type="error" message={error} className="mb-6" />}
            {success && (
              <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4 mb-6">
                <div className="flex gap-3 items-start">
                  <div className="text-2xl">✅</div>
                  <div className="flex-1">
                    <p className="text-green-900 font-bold text-sm mb-2">{success}</p>
                    <p className="text-green-800 text-xs mb-4">Your order is awaiting organizer approval. You'll receive an email with your ticket once approved.</p>
                    <div className="flex gap-2 flex-wrap">
                      <button
                        onClick={() => navigate('/my-orders')}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold text-sm transition-colors"
                      >
                        📋 View My Orders
                      </button>
                      <button
                        onClick={() => navigate('/browse-events')}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold text-sm transition-colors"
                      >
                        🛍️ Continue Shopping
                      </button>
                      <button
                        onClick={() => navigate('/dashboard')}
                        className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-semibold text-sm transition-colors"
                      >
                        🏠 Go to Dashboard
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {!success ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Order ID Display */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <p className="text-sm text-gray-600 mb-1">Order ID</p>
                <p className="text-lg font-mono font-bold text-gray-900">{orderId}</p>
              </div>

              {/* Instructions */}
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                <p className="text-sm text-blue-900">
                  <strong>Instructions:</strong> Take a screenshot of your payment confirmation or bank transfer receipt. 
                  The image should clearly show the transaction amount, date, and reference number.
                </p>
              </div>

              {/* File Upload Area */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Payment Proof Image *
                </label>
                
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                    id="file-input"
                    disabled={loading}
                  />
                  
                  {preview ? (
                    <div className="relative">
                      <img
                        src={preview}
                        alt="Preview"
                        className="w-full max-h-96 object-cover rounded-lg border-2 border-blue-300"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setFile(null);
                          setPreview(null);
                        }}
                        className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-2 rounded-full transition-colors"
                      >
                        ✕
                      </button>
                      <p className="text-sm text-gray-600 mt-2 text-center">
                        <button
                          type="button"
                          onClick={() => document.getElementById('file-input').click()}
                          className="text-blue-600 hover:text-blue-800 underline"
                        >
                          Change image
                        </button>
                      </p>
                    </div>
                  ) : (
                    <label
                      htmlFor="file-input"
                      className="block w-full border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors"
                    >
                      <div className="text-5xl mb-3">📷</div>
                      <p className="text-gray-900 font-semibold mb-1">Click to upload or drag and drop</p>
                      <p className="text-sm text-gray-600">PNG, JPG, GIF (Max 5MB)</p>
                    </label>
                  )}
                </div>
              </div>

              {/* File Info */}
              {file && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm text-green-900">
                    <strong>Selected File:</strong> {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                </div>
              )}

              {/* Important Notes */}
              <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
                <p className="text-sm text-yellow-900 mb-2">
                  <strong>Important:</strong>
                </p>
                <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
                  <li>Image should be clear and readable</li>
                  <li>Amount in receipt must match order total</li>
                  <li>Include transaction date and reference number</li>
                  <li>Do not crop out important information</li>
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => navigate('/dashboard')}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  className="flex-1"
                  disabled={!file || loading}
                  type="submit"
                >
                  {loading ? 'Uploading...' : 'Upload Payment Proof'}
                </Button>
              </div>

              {/* Success Message Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-900">
                  ✓ After uploading, your order will be sent for organizer approval. 
                  You'll receive an email confirmation once approved along with your ticket and QR code.
                </p>
              </div>
            </form>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-600 mb-6">You can close this window or use the buttons above to navigate.</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default PaymentProofUploadPage;
