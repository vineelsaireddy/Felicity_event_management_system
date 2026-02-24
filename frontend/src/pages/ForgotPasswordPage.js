import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/Card';
import Alert from '../components/Alert';

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(2); // 1: role selection, 2: email form, 3: success

  const [role, setRole] = useState('organizer');
  const [email, setEmail] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:5000/api/password-reset/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          role,
          reason,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to submit request');
      }

      setSuccessMessage(data.message);
      setStep(3);
    } catch (err) {
      setError(err.message || 'Error submitting request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <Card className="shadow-2xl">
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-8 py-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <span className="text-2xl">🔑</span>
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">Forgot Password?</h1>
              <p className="text-orange-100">Request a password reset from admin</p>
            </div>
          </div>

          <div className="px-8 py-8">
            {error && <Alert type="error" message={error} className="mb-6" />}
            {successMessage && <Alert type="success" message={successMessage} className="mb-6" />}

            {/* Step 1: Role Selection */}
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Select Your Role
                  </label>
                  <div className="space-y-3">
                    {[
                      { value: 'organizer', label: '🏢 Organizer', desc: 'Event organizer account' },
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setRole(option.value);
                          setStep(2);
                        }}
                        className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                          role === option.value
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-blue-300'
                        }`}
                      >
                        <p className="font-semibold text-gray-900">{option.label}</p>
                        <p className="text-sm text-gray-600">{option.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => navigate('/login')}
                  className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold transition-colors"
                >
                  ← Back to Login
                </button>
              </div>
            )}

            {/* Step 2: Email & Reason Form */}
            {step === 2 && (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    📧 Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your.email@example.com"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-sm text-gray-600 mt-2">
                    Enter the email address associated with your {role} account
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    💬 Reason for Reset (Optional)
                  </label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="e.g., I forgot my password, Need urgent access, etc."
                    rows="3"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>📋 Process:</strong> Your request will be sent to an administrator. Once approved, you'll receive a temporary password via email.
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold"
                  >
                    ← Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !email.trim()}
                    className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-colors ${
                      loading || !email.trim()
                        ? 'bg-gray-400 text-white cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {loading ? '⏳ Submitting...' : '📤 Submit Request'}
                  </button>
                </div>
              </form>
            )}

            {/* Step 3: Success */}
            {step === 3 && (
              <div className="text-center space-y-6">
                <div className="text-6xl">✅</div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Request Submitted!</h2>
                  <p className="text-gray-600">
                    Your password reset request has been submitted to the admin team. You will receive an email with a temporary password once your request is approved.
                  </p>
                </div>

                <div className="bg-green-50 border border-green-200 p-4 rounded-lg space-y-2">
                  <p className="text-sm font-semibold text-green-900">📧 Next Steps:</p>
                  <ul className="text-sm text-green-800 space-y-1">
                    <li>✓ Check your email for confirmation</li>
                    <li>✓ Wait for admin approval (usually within 24 hours)</li>
                    <li>✓ You'll receive a temporary password via email</li>
                    <li>✓ Use it to login and change your password</li>
                  </ul>
                </div>

                <button
                  onClick={() => navigate('/login')}
                  className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition-colors"
                >
                  ← Back to Login
                </button>
              </div>
            )}
          </div>
        </Card>

        {/* Footer */}
        <div className="text-center mt-6 text-white text-sm">
          <p>Need help? <a href="mailto:support@felicity.com" className="underline hover:text-blue-100">Contact Support</a></p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
