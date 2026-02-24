import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import MathCaptcha from '../components/MathCaptcha';

const SignupPage = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    participantType: 'IIIT',
    collegeOrgName: '',
    contactNumber: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateStep = (step) => {
    setError('');

    if (step === 1) {
      if (!formData.firstName.trim() || !formData.lastName.trim()) {
        setError('Please enter your first and last name');
        return false;
      }
    } else if (step === 2) {
      if (formData.participantType === 'IIIT') {
        const isValidIIITEmail = formData.email.endsWith('@students.iiit.ac.in') || formData.email.endsWith('@research.iiit.ac.in');
        if (!isValidIIITEmail) {
          setError('IIIT participants must use @students.iiit.ac.in or @research.iiit.ac.in email');
          return false;
        }
      } else if (!formData.email.includes('@')) {
        setError('Please enter a valid email');
        return false;
      }

      if (formData.password.length < 6) {
        setError('Password must be at least 6 characters');
        return false;
      }

      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        return false;
      }
    } else if (step === 3) {
      if (!formData.collegeOrgName.trim()) {
        setError('Please enter your college or organization name');
        return false;
      }
      if (!formData.contactNumber.trim()) {
        setError('Please enter your contact number');
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateStep(3)) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Remove confirmPassword before sending to backend
      const { confirmPassword, ...dataToSend } = formData;
      await signup(dataToSend);
      navigate('/onboarding');
    } catch (error) {
      setError(error.response?.data?.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-lg animate-fadeIn">
        {/* Decorative elements */}
        <div className="absolute top-10 left-5 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse hidden lg:block"></div>

        <div className="card-elevated relative backdrop-blur-xl bg-white bg-opacity-95">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <span className="text-2xl font-bold text-blue-700">F</span>
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">Join Felicity</h1>
              <p className="text-blue-100">Step {currentStep} of 3 - Create your account</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="px-8 pt-8">
            <div className="flex gap-2">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex-1">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${step <= currentStep ? 'bg-gradient-to-r from-blue-600 to-blue-700' : 'bg-gray-300'
                      }`}
                  ></div>
                </div>
              ))}
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

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Step 1: Personal Info */}
              {currentStep === 1 && (
                <div className="space-y-5 animate-fadeIn">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        First Name
                      </label>
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        placeholder="John"
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Last Name
                      </label>
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        placeholder="Doe"
                        className="input-field"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      👤 Participant Type
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {['IIIT', 'Non-IIIT'].map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setFormData({ ...formData, participantType: type })}
                          className={`p-4 rounded-lg font-semibold transition-all duration-300 border-2 ${formData.participantType === type
                              ? 'border-blue-600 bg-blue-50 text-blue-700'
                              : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                            }`}
                        >
                          {type === 'IIIT' ? '🏫 IIIT Student' : '🌍 Non-IIIT'}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      {formData.participantType === 'IIIT'
                        ? 'IIIT participants must use @students.iiit.ac.in or @research.iiit.ac.in'
                        : 'Non-IIIT participants from any organization are welcome'}
                    </p>
                  </div>
                </div>
              )}

              {/* Step 2: Email & Password */}
              {currentStep === 2 && (
                <div className="space-y-5 animate-fadeIn">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      ✉️ Email Address
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder={
                        formData.participantType === 'IIIT'
                          ? 'name@students.iiit.ac.in'
                          : 'your.email@example.com'
                      }
                      className="input-field"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {formData.participantType === 'IIIT'
                        ? 'Must be your official IIIT email'
                        : 'Use your professional email'}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      🔐 Password
                    </label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="At least 6 characters"
                      className="input-field"
                    />
                    <p className="text-xs text-gray-500 mt-1">Use a strong password</p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      ✓ Confirm Password
                    </label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Re-enter your password"
                      className="input-field"
                    />
                  </div>
                </div>
              )}

              {/* Step 3: Additional Info */}
              {currentStep === 3 && (
                <div className="space-y-5 animate-fadeIn">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      🏢 College / Organization Name
                    </label>
                    <input
                      type="text"
                      name="collegeOrgName"
                      value={formData.collegeOrgName}
                      onChange={handleChange}
                      placeholder="e.g., IIIT Hyderabad, MIT"
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      📱 Contact Number
                    </label>
                    <input
                      type="tel"
                      name="contactNumber"
                      value={formData.contactNumber}
                      onChange={handleChange}
                      placeholder="+91 98765 43210"
                      className="input-field"
                    />
                  </div>

                  {/* Summary */}
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <h3 className="font-semibold text-blue-900 mb-3">Review Your Information</h3>
                    <div className="space-y-2 text-sm text-blue-800">
                      <p><span className="font-semibold">Name:</span> {formData.firstName} {formData.lastName}</p>
                      <p><span className="font-semibold">Email:</span> {formData.email}</p>
                      <p><span className="font-semibold">Type:</span> {formData.participantType}</p>
                      <p><span className="font-semibold">Organization:</span> {formData.collegeOrgName}</p>
                    </div>
                  </div>

                  {/* CAPTCHA on final step */}
                  <MathCaptcha onVerified={setCaptchaVerified} />
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex gap-3 pt-4">
                {currentStep > 1 && (
                  <button
                    type="button"
                    onClick={() => setCurrentStep(currentStep - 1)}
                    className="btn-secondary flex-1 py-3 flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back
                  </button>
                )}

                {currentStep < 3 && (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="btn-primary flex-1 py-3 flex items-center justify-center gap-2"
                  >
                    <span>Next</span>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                )}

                {currentStep === 3 && (
                  <button
                    type="submit"
                    disabled={loading || !captchaVerified}
                    className="btn-primary flex-1 py-3 flex items-center justify-center gap-2 font-semibold"
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Creating Account...
                      </>
                    ) : (
                      <>
                        <span>Create Account</span>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </>
                    )}
                  </button>
                )}
              </div>
            </form>

            {/* Login Link */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{' '}
                <Link to="/login" className="text-blue-600 hover:text-blue-700 font-semibold transition-colors">
                  Sign in here
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
