import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import MathCaptcha from '../components/MathCaptcha';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('participant');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login(email, password, role);
      if (role === 'participant') navigate('/dashboard');
      else if (role === 'organizer') navigate('/organizer/dashboard');
      else if (role === 'admin') navigate('/admin/dashboard');
    } catch (error) {
      setError(error.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md animate-fadeIn">
        {/* Left side decorative element */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse hidden lg:block"></div>
        <div className="absolute bottom-0 right-10 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse hidden lg:block"></div>

        <div className="card-elevated relative backdrop-blur-xl bg-white bg-opacity-95">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <span className="text-2xl font-bold text-blue-700">F</span>
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
              <p className="text-blue-100">Sign in to your Felicity account</p>
            </div>
          </div>

          {/* Form Content */}
          <div className="px-8 py-8">
            {/* Error Alert */}
            {error && (
              <div className="alert-error mb-6 animate-slideIn">
                <div className="flex items-start gap-3">
                  <span className="text-xl">⚠️</span>
                  <span>{error}</span>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Role Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  👤 Login As
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="select-field"
                >
                  <option value="participant">Participant</option>
                  <option value="organizer">Organizer</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              {/* Email Input */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  ✉️ Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  required
                  className="input-field"
                />
              </div>

              {/* Password Input */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  🔐 Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="input-field"
                />
              </div>

              {/* Forgot Password Link */}
              <div className="text-right">
                <Link to="/forgot-password" className="text-sm text-blue-600 hover:text-blue-700 font-semibold transition-colors">
                  Forgot password?
                </Link>
              </div>

              {/* CAPTCHA */}
              <div>
                <MathCaptcha onVerified={setCaptchaVerified} />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || !captchaVerified}
                className="btn-primary w-full py-3 text-lg font-semibold flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Logging in...
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Don't have an account?</span>
              </div>
            </div>

            {/* Sign Up Link */}
            <Link
              to="/signup"
              className="w-full block text-center px-6 py-3 bg-gradient-to-r from-blue-100 to-blue-50 text-blue-700 font-semibold rounded-lg hover:shadow-lg transition-all duration-300 border-2 border-blue-200"
            >
              Create New Account
            </Link>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 px-8 py-6 text-center text-sm text-gray-600">
            <p>Protected by enterprise-grade encryption</p>
          </div>
        </div>

        {/* Bottom Info */}
        <div className="mt-8 text-center text-blue-100">
          <p className="text-sm">Test Credentials: admin@felicity.iiit.ac.in / admin123</p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
