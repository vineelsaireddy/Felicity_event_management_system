import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { passwordResetAPI } from '../services/api';
import Card from '../components/Card';
import Alert from '../components/Alert';
import Button from '../components/Button';

const StatusBadge = ({ status }) => {
  const styles = {
    Pending: 'bg-yellow-100 text-yellow-800 border border-yellow-300',
    Approved: 'bg-green-100 text-green-800 border border-green-300',
    Rejected: 'bg-red-100 text-red-800 border border-red-300',
  };
  const icons = { Pending: '⏳', Approved: '✅', Rejected: '❌' };
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${styles[status] || styles.Pending}`}>
      {icons[status]} {status}
    </span>
  );
};

const PasswordResetRequestsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('pending');
  const [pendingRequests, setPendingRequests] = useState([]);
  const [historyRequests, setHistoryRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [approvedPassword, setApprovedPassword] = useState(null);
  const [approvedUserEmail, setApprovedUserEmail] = useState(null);
  const [passwordCopied, setPasswordCopied] = useState(false);

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/login');
      return;
    }
    fetchAllData();
  }, [user, navigate]);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [pendingRes, historyRes] = await Promise.all([
        passwordResetAPI.getResetRequests(),
        passwordResetAPI.getResetHistory(),
      ]);
      setPendingRequests(pendingRes.data);
      setHistoryRequests(historyRes.data);
    } catch (err) {
      setError('Failed to fetch password reset requests');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveRequest = async (requestId, email) => {
    try {
      setError(null);
      const response = await passwordResetAPI.approveReset(requestId);
      setApprovedPassword(response.data.temporaryPassword);
      setApprovedUserEmail(email);
      setShowPasswordModal(true);
      setSuccess(`✅ Password reset approved for ${email}. Temporary password sent via email.`);
      await fetchAllData();
      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to approve request');
      console.error('Error:', err);
    }
  };

  const handleRejectRequest = async (requestId, email) => {
    const reason = prompt(`Reject reset request for ${email}?\n\nOptional reason:`);
    if (reason !== null) {
      try {
        setError(null);
        await passwordResetAPI.rejectReset(requestId, reason);
        setSuccess(`❌ Reset request for ${email} has been rejected`);
        await fetchAllData();
        setTimeout(() => setSuccess(null), 5000);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to reject request');
        console.error('Error:', err);
      }
    }
  };

  const formatDate = (date) => {
    const now = new Date();
    const diff = now - new Date(date);
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (hours < 1) {
      const minutes = Math.floor(diff / (1000 * 60));
      return `${minutes}m ago`;
    } else if (hours < 24) {
      return `${hours}h ago`;
    } else {
      return `${days}d ago · ${new Date(date).toLocaleDateString()}`;
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(approvedPassword);
    setPasswordCopied(true);
    setTimeout(() => setPasswordCopied(false), 2000);
  };

  const tabs = [
    { id: 'pending', label: `⏳ Pending (${pendingRequests.length})` },
    { id: 'history', label: `📋 Full History (${historyRequests.length})` },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/admin/dashboard')}
            className="text-blue-600 hover:text-blue-800 mb-4 font-semibold"
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Password Reset Requests</h1>
          <p className="text-gray-600 mt-2">Manage organizer password reset requests</p>
        </div>

        {error && <Alert type="error" message={error} />}
        {success && <Alert type="success" message={success} />}

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-6">
          <div className="flex gap-0">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-3 font-semibold text-sm transition-colors border-b-2 -mb-px ${activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <Card className="bg-white shadow">
          {loading ? (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin">
                <svg className="w-8 h-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
              <p className="text-gray-600 mt-4">Loading requests...</p>
            </div>
          ) : activeTab === 'pending' ? (
            pendingRequests.length === 0 ? (
              <div className="p-8 text-center">
                <div className="text-4xl mb-4">✅</div>
                <p className="text-gray-600 text-lg">All caught up!</p>
                <p className="text-gray-500 mt-2">No pending password reset requests</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {pendingRequests.map((request) => (
                  <div key={request._id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{request.userEmail}</h3>
                          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                            {request.userRole}
                          </span>
                          <StatusBadge status={request.status} />
                        </div>
                        <p className="text-sm text-gray-600 mt-2">
                          <strong>Reason:</strong> {request.requestReason || 'Not specified'}
                        </p>
                        <p className="text-xs text-gray-500 mt-2">
                          Requested: <strong>{formatDate(request.requestDate)}</strong>
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleApproveRequest(request._id, request.userEmail)}
                        >
                          ✓ Approve & Send Password
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleRejectRequest(request._id, request.userEmail)}
                        >
                          ✕ Reject
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            // History Tab
            historyRequests.length === 0 ? (
              <div className="p-8 text-center">
                <div className="text-4xl mb-4">📋</div>
                <p className="text-gray-500">No password reset requests found</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {historyRequests.map((request) => (
                  <div key={request._id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <h3 className="text-base font-semibold text-gray-900">{request.userEmail}</h3>
                          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                            {request.userRole}
                          </span>
                          <StatusBadge status={request.status} />
                        </div>
                        <p className="text-sm text-gray-600">
                          <strong>Reason:</strong> {request.requestReason || 'Not specified'}
                        </p>
                        {request.rejectionReason && (
                          <p className="text-sm text-red-600 mt-1">
                            <strong>Rejection reason:</strong> {request.rejectionReason}
                          </p>
                        )}
                        <div className="flex gap-4 mt-2 text-xs text-gray-500">
                          <span>Requested: {formatDate(request.requestDate)}</span>
                          {request.approvalDate && <span>Processed: {formatDate(request.approvalDate)}</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </Card>

        {/* Info Section */}
        <Card className="bg-blue-50 border-2 border-blue-200 mt-6">
          <h3 className="font-semibold text-blue-900 mb-3">How It Works</h3>
          <ul className="text-sm text-blue-800 space-y-2">
            <li>✓ Organizers request a password reset from the Forgot Password page</li>
            <li>✓ Pending requests appear here for admin review</li>
            <li>✓ Approving auto-generates a temporary password and emails it to the organizer</li>
            <li>✓ The History tab shows all past requests with their approval status</li>
          </ul>
        </Card>
      </div>

      {/* Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">✓</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Request Approved!</h2>
              <p className="text-gray-600 mt-2">Temporary password sent to user's email</p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-4 border-2 border-gray-200">
              <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide font-semibold">User Email</p>
              <p className="text-lg font-mono text-gray-900 break-all">{approvedUserEmail}</p>
            </div>

            <div className="bg-blue-50 rounded-lg p-4 mb-4 border-2 border-blue-200">
              <p className="text-xs text-blue-600 mb-2 uppercase tracking-wide font-semibold">Temporary Password</p>
              <div className="flex items-center gap-2">
                <p className="text-2xl font-mono font-bold text-blue-900 flex-1">{approvedPassword}</p>
                <button
                  onClick={copyToClipboard}
                  className={`px-3 py-2 rounded transition-colors text-sm font-semibold ${passwordCopied
                      ? 'bg-green-500 text-white'
                      : 'bg-white text-blue-600 border border-blue-300 hover:bg-blue-50'
                    }`}
                >
                  {passwordCopied ? '✓ Copied!' : 'Copy'}
                </button>
              </div>
            </div>

            <div className="bg-orange-50 rounded-lg p-4 mb-6 border-l-4 border-orange-500">
              <p className="text-sm text-orange-900">
                <span className="font-semibold">⚠️ Important:</span> Share this password with the user verbally or through a secure channel. The password is also sent to their registered email.
              </p>
            </div>

            <button
              onClick={() => {
                setShowPasswordModal(false);
                setApprovedPassword(null);
                setApprovedUserEmail(null);
                setPasswordCopied(false);
              }}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PasswordResetRequestsPage;
