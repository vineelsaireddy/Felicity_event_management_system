import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import Alert from '../components/Alert';
import Card from '../components/Card';

const SettingsPage = () => {
  const { user, logout } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters long');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(false);

      await authAPI.changePassword({
        currentPassword,
        newPassword,
      });

      setSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to change password');
      console.error('Password change error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <Card className="shadow-lg">
          <div className="p-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Settings</h1>

            {/* Change Password Section */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Change Password</h2>
              
              {error && <Alert type="error" message={error} />}
              {success && <Alert type="success" message="Password changed successfully!" />}

              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Current Password</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Confirm New Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
                >
                  {loading ? 'Updating...' : 'Update Password'}
                </button>
              </form>
            </div>

            {/* Account Information Section */}
            <div className="border-t pt-8 mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Account Information</h2>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <p className="mt-1 text-gray-900">{user?.email || user?.loginEmail}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Role</label>
                  <p className="mt-1 text-gray-900 capitalize">{user?.role}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Account Status</label>
                  <p className="mt-1 text-gray-900 text-green-600 font-semibold">Active</p>
                </div>
              </div>
            </div>

            {/* Account Actions Section */}
            <div className="border-t pt-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Account Actions</h2>
              
              <div className="space-y-2">
                <button
                  onClick={() => window.location.href = '/login'}
                  className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Logout
                </button>
                
                <button
                  className="w-full px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors cursor-not-allowed"
                  disabled
                  title="Contact admin to delete account"
                >
                  Delete Account (Contact Admin)
                </button>
              </div>
            </div>

            {/* Preferences Section */}
            <div className="border-t pt-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Preferences</h2>
              
              <div className="space-y-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="ml-2 text-gray-700">Receive email notifications</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="ml-2 text-gray-700">Receive event updates</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="ml-2 text-gray-700">Display profile publicly</span>
                </label>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default SettingsPage;
