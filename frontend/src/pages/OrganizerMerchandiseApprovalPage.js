import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { merchandiseAPI } from '../services/api';
import Card from '../components/Card';
import Alert from '../components/Alert';
import Button from '../components/Button';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const BACKEND_BASE = API_BASE.replace(/\/api\/?$/, '');

const StatusBadge = ({ status }) => {
  const styles = {
    'Pending Approval': 'bg-yellow-100 text-yellow-800 border border-yellow-300',
    'Successful': 'bg-green-100 text-green-800 border border-green-300',
    'Rejected': 'bg-red-100 text-red-800 border border-red-300',
  };
  const icons = { 'Pending Approval': '⏳', 'Successful': '✅', 'Rejected': '❌' };
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${styles[status] || styles['Pending Approval']}`}>
      {icons[status]} {status}
    </span>
  );
};

const OrganizerMerchandiseApprovalPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('pending');
  const [pendingOrders, setPendingOrders] = useState([]);
  const [allOrders, setAllOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [viewProofUrl, setViewProofUrl] = useState(null);

  useEffect(() => {
    if (user?.role !== 'organizer') {
      navigate('/login');
      return;
    }
    fetchAllData();
  }, [user, navigate]);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [pendingRes, allRes] = await Promise.all([
        merchandiseAPI.getPendingOrders(),
        merchandiseAPI.getAllOrders(),
      ]);
      setPendingOrders(pendingRes.data.orders || []);
      setAllOrders(allRes.data.orders || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch orders');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveOrder = async (orderId) => {
    try {
      setError(null);
      await merchandiseAPI.approveOrder(orderId);
      setSuccess('✅ Order approved! Ticket and QR code sent to participant via email.');
      await fetchAllData();
      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to approve order');
    }
  };

  const handleRejectClick = (order) => {
    setSelectedOrder(order);
    setRejectReason('');
    setShowRejectModal(true);
  };

  const handleRejectSubmit = async () => {
    if (!selectedOrder || !rejectReason.trim()) {
      setError('Please provide a reason for rejection');
      return;
    }
    try {
      setError(null);
      await merchandiseAPI.rejectOrder(selectedOrder.orderId, rejectReason);
      setSuccess(`❌ Order from ${selectedOrder.participant.name} rejected.`);
      setShowRejectModal(false);
      setRejectReason('');
      setSelectedOrder(null);
      await fetchAllData();
      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reject order');
    }
  };

  const tabs = [
    { id: 'pending', label: `⏳ Pending Approval (${pendingOrders.length})` },
    { id: 'history', label: `📋 All Orders (${allOrders.length})` },
  ];

  const OrderCard = ({ order, showActions = false }) => (
    <Card key={order.orderId} className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
        {/* Order Details */}
        <div className="lg:col-span-2">
          {/* Participant Info */}
          <div className="mb-4 pb-4 border-b flex items-start justify-between">
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">{order.participant.name}</h3>
              <p className="text-sm text-gray-600">{order.participant.email}</p>
              {order.participant.contact && <p className="text-sm text-gray-600">{order.participant.contact}</p>}
            </div>
            <StatusBadge status={order.status} />
          </div>

          {/* Event */}
          <p className="text-sm text-gray-500 mb-4">Event: <strong className="text-gray-900">{order.event}</strong></p>

          {/* Order Items */}
          <div className="space-y-2 mb-4">
            {order.items.map((item, idx) => (
              <div key={idx} className="bg-gray-50 p-3 rounded-lg flex justify-between items-center">
                <div>
                  <p className="font-semibold text-gray-900">{item.name}</p>
                  <p className="text-sm text-gray-600">
                    {item.size && `Size: ${item.size}`}
                    {item.size && item.color && ' • '}
                    {item.color && `Color: ${item.color}`}
                    {' · '}Qty: {item.quantity}
                  </p>
                </div>
                <p className="font-semibold text-gray-900">₹{(item.price * item.quantity).toFixed(2)}</p>
              </div>
            ))}
          </div>

          {/* Total + Ticket */}
          <div className="flex gap-4">
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200 flex-1">
              <p className="text-xs text-blue-600 font-semibold">Total Amount</p>
              <p className="text-xl font-bold text-blue-900">₹{order.totalAmount.toFixed(2)}</p>
            </div>
            {order.ticketId && (
              <div className="bg-green-50 p-3 rounded-lg border border-green-200 flex-1">
                <p className="text-xs text-green-600 font-semibold">Ticket ID</p>
                <p className="text-sm font-mono font-bold text-green-900">{order.ticketId}</p>
              </div>
            )}
          </div>

          {order.rejectionReason && (
            <div className="mt-3 bg-red-50 p-3 rounded-lg border border-red-200">
              <p className="text-xs text-red-600 font-semibold">Rejection Reason</p>
              <p className="text-sm text-red-800">{order.rejectionReason}</p>
            </div>
          )}

          <p className="text-xs text-gray-400 mt-3">
            Ordered: {new Date(order.createdAt).toLocaleString()}
            {order.approvalDate && ` · Processed: ${new Date(order.approvalDate).toLocaleString()}`}
          </p>
        </div>

        {/* Payment Proof + Actions */}
        <div className="lg:col-span-1">
          <div className="sticky top-32">
            <h3 className="text-sm font-bold text-gray-700 mb-3">Payment Proof</h3>

            {order.paymentProof ? (
              <div className="mb-4">
                {(() => {
                  const proofUrl = `${BACKEND_BASE}/${order.paymentProof}`;
                  const encodedProofUrl = encodeURI(proofUrl);
                  return (
                <img
                  src={encodedProofUrl}
                  alt="Payment Proof"
                  className="w-full rounded-lg border-2 border-gray-300 max-h-64 object-cover cursor-pointer hover:border-blue-400 transition-colors"
                  onClick={() => setViewProofUrl(encodedProofUrl)}
                />
                  );
                })()}
                <p className="text-xs text-gray-400 mt-1 text-center">Click to enlarge</p>
              </div>
            ) : (
              <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4 mb-4">
                <p className="text-yellow-800 font-semibold text-sm">⚠️ No Payment Proof</p>
                <p className="text-xs text-yellow-700 mt-1">Participant has not uploaded proof yet.</p>
              </div>
            )}

            {/* Order ID */}
            <div className="bg-gray-50 p-3 rounded-lg mb-4">
              <p className="text-xs text-gray-500">Order ID</p>
              <p className="text-xs font-mono text-gray-800 break-all">{order.orderId}</p>
            </div>

            {/* Actions - only shown for pending tab */}
            {showActions && order.paymentProof && (
              <div className="space-y-2">
                <Button variant="primary" className="w-full" onClick={() => handleApproveOrder(order.orderId)}>
                  ✓ Approve &amp; Generate Ticket
                </Button>
                <Button variant="danger" className="w-full" onClick={() => handleRejectClick(order)}>
                  ✕ Reject
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <svg className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-gray-600 font-semibold">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button onClick={() => navigate('/organizer/dashboard')} className="text-blue-600 hover:text-blue-800 mb-4 font-semibold">
            ← Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Merchandise Payment Approval</h1>
          <p className="text-gray-600 mt-2">Review payment proofs and approve/reject merchandise orders</p>
        </div>

        {error && <Alert type="error" message={error} className="mb-6" />}
        {success && <Alert type="success" message={success} className="mb-6" />}

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-6">
          <div className="flex gap-0">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-3 font-semibold text-sm transition-colors border-b-2 -mb-px ${activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Pending Approval Tab */}
        {activeTab === 'pending' && (
          pendingOrders.length === 0 ? (
            <Card className="text-center p-12">
              <div className="text-6xl mb-4">✅</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">All Clear!</h3>
              <p className="text-gray-600">No pending merchandise orders with payment proof uploaded.</p>
            </Card>
          ) : (
            <div className="space-y-6">
              {pendingOrders.map(order => (
                <OrderCard key={order.orderId} order={order} showActions={true} />
              ))}
            </div>
          )
        )}

        {/* All Orders History Tab */}
        {activeTab === 'history' && (
          allOrders.length === 0 ? (
            <Card className="text-center p-12">
              <div className="text-6xl mb-4">📋</div>
              <p className="text-gray-500">No merchandise orders found for your events.</p>
            </Card>
          ) : (
            <div className="space-y-4">
              {allOrders.map(order => (
                <OrderCard key={order.orderId} order={order} showActions={false} />
              ))}
            </div>
          )
        )}

        {/* Workflow Info */}
        <Card className="bg-blue-50 border-2 border-blue-200 mt-8">
          <h3 className="font-semibold text-blue-900 mb-3">Approval Workflow</h3>
          <ul className="text-sm text-blue-800 space-y-2">
            <li>✓ Participant places order → uploads payment proof → order appears in <strong>Pending Approval</strong> tab</li>
            <li>✓ Approve → status becomes <strong>Successful</strong>, stock decremented, QR ticket generated &amp; emailed</li>
            <li>✓ Reject → provide reason, participant is notified. <strong>No QR is generated</strong></li>
            <li>✓ <strong>All Orders</strong> tab shows complete history with status badges</li>
          </ul>
        </Card>
      </div>

      {/* Proof Zoom Modal */}
      {viewProofUrl && (
        <div
          className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4"
          onClick={() => setViewProofUrl(null)}
        >
          <div className="relative max-w-3xl w-full">
            <img src={viewProofUrl} alt="Payment Proof" className="w-full rounded-lg shadow-2xl" />
            <button
              className="absolute top-4 right-4 bg-white text-gray-900 rounded-full w-8 h-8 flex items-center justify-center font-bold text-lg hover:bg-gray-100"
              onClick={() => setViewProofUrl(null)}
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {showRejectModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Reject Order</h2>

              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <p className="text-sm text-gray-600">Participant</p>
                <p className="font-semibold text-gray-900">{selectedOrder.participant.name}</p>
                <p className="text-sm text-gray-600 mt-2">Amount</p>
                <p className="font-semibold text-gray-900">₹{selectedOrder.totalAmount.toFixed(2)}</p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Rejection Reason *
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="e.g., Invalid payment proof, Amount mismatch, etc."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  rows="4"
                />
              </div>

              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => { setShowRejectModal(false); setSelectedOrder(null); setRejectReason(''); }}
                >
                  Cancel
                </Button>
                <Button variant="danger" className="flex-1" onClick={handleRejectSubmit}>
                  Reject Order
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default OrganizerMerchandiseApprovalPage;
