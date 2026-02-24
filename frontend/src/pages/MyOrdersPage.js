import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { merchandiseAPI } from '../services/api';
import Card from '../components/Card';
import Alert from '../components/Alert';

const BACKEND = 'http://localhost:5000';

const statusConfig = {
    'Pending Approval': { label: '⏳ Pending Approval', bg: 'bg-yellow-50', border: 'border-yellow-300', text: 'text-yellow-800', badge: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
    'Successful': { label: '✅ Successful', bg: 'bg-green-50', border: 'border-green-300', text: 'text-green-800', badge: 'bg-green-100 text-green-800 border-green-300' },
    'Rejected': { label: '❌ Rejected', bg: 'bg-red-50', border: 'border-red-300', text: 'text-red-800', badge: 'bg-red-100 text-red-800 border-red-300' },
};

const MyOrdersPage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!user) { navigate('/login'); return; }
        fetchOrders();
    }, [user]);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const res = await merchandiseAPI.getMyOrders();
            setOrders(res.data.orders || []);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load orders');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <svg className="animate-spin h-10 w-10 text-orange-500" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pt-24 pb-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <div className="mb-8">
                    <button onClick={() => navigate('/dashboard')} className="text-blue-600 hover:text-blue-800 font-semibold mb-3">
                        ← Back to Dashboard
                    </button>
                    <h1 className="text-3xl font-bold text-gray-900">My Merchandise Orders</h1>
                    <p className="text-gray-600 mt-1">Track the status of all your merchandise orders</p>
                </div>

                {error && <Alert type="error" message={error} className="mb-6" />}

                {orders.length === 0 ? (
                    <Card className="text-center p-16">
                        <div className="text-6xl mb-4">🛍️</div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">No orders yet</h3>
                        <p className="text-gray-600">Browse merchandise events to place your first order.</p>
                    </Card>
                ) : (
                    <div className="space-y-6">
                        {orders.map((order) => {
                            const cfg = statusConfig[order.status] || statusConfig['Pending Approval'];
                            const hasProof = !!order.paymentProof;
                            const needsProof = order.status === 'Pending Approval' && !hasProof;

                            return (
                                <Card key={order.orderId} className={`overflow-hidden border-2 ${cfg.border}`}>
                                    {/* Status Header */}
                                    <div className={`${cfg.bg} px-6 py-3 flex justify-between items-center`}>
                                        <p className={`font-bold ${cfg.text}`}>{cfg.label}</p>
                                        <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${cfg.badge}`}>
                                            {order.event || 'Merchandise Event'}
                                        </span>
                                    </div>

                                    <div className="p-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {/* Order Items */}
                                            <div>
                                                <h3 className="font-bold text-gray-900 mb-3">Items Ordered</h3>
                                                <div className="space-y-2">
                                                    {order.items.map((item, i) => (
                                                        <div key={i} className="flex justify-between bg-gray-50 p-3 rounded-lg">
                                                            <div>
                                                                <p className="font-semibold text-sm text-gray-900">{item.name}</p>
                                                                <p className="text-xs text-gray-600">
                                                                    {[item.size && `Size: ${item.size}`, item.color && `Color: ${item.color}`, `Qty: ${item.quantity}`].filter(Boolean).join(' · ')}
                                                                </p>
                                                            </div>
                                                            <p className="font-semibold text-sm text-gray-900">₹{(item.price * item.quantity).toFixed(0)}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className="mt-3 flex justify-between font-bold text-gray-900 border-t pt-3">
                                                    <span>Total</span>
                                                    <span>₹{order.totalAmount?.toFixed(2)}</span>
                                                </div>
                                            </div>

                                            {/* Status Details */}
                                            <div className="space-y-4">
                                                {/* Order ID */}
                                                <div className="bg-gray-50 p-3 rounded-lg">
                                                    <p className="text-xs text-gray-500">Order ID</p>
                                                    <p className="text-sm font-mono text-gray-800 break-all">{order.orderId}</p>
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        Ordered: {new Date(order.createdAt).toLocaleString()}
                                                    </p>
                                                </div>

                                                {/* Payment Proof Status */}
                                                {order.status === 'Pending Approval' && (
                                                    <div className={`p-4 rounded-lg border-2 ${hasProof ? 'bg-blue-50 border-blue-300' : 'bg-yellow-50 border-yellow-300'}`}>
                                                        {hasProof ? (
                                                            <>
                                                                <p className="font-semibold text-blue-900 text-sm">🕐 Payment Proof Submitted</p>
                                                                <p className="text-blue-700 text-xs mt-1">Awaiting organizer review. You'll get an email once approved.</p>
                                                                <div className="mt-3">
                                                                    <img
                                                                        src={`${BACKEND}/${order.paymentProof}`}
                                                                        alt="Your payment proof"
                                                                        className="w-full max-h-32 object-cover rounded-lg border border-blue-200"
                                                                    />
                                                                </div>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <p className="font-semibold text-yellow-900 text-sm">⚠️ Payment Proof Required</p>
                                                                <p className="text-yellow-800 text-xs mt-1">Upload your payment screenshot to proceed.</p>
                                                                <button
                                                                    onClick={() => navigate(`/payment-proof-upload/${order.orderId}`)}
                                                                    className="mt-3 w-full py-2 bg-yellow-500 text-white rounded-lg text-sm font-semibold hover:bg-yellow-600 transition-colors"
                                                                >
                                                                    📸 Upload Payment Proof
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                )}

                                                {/* Ticket (on success) */}
                                                {order.status === 'Successful' && order.ticketId && (
                                                    <div className="bg-green-50 border-2 border-green-300 p-4 rounded-lg text-center">
                                                        <p className="text-xs text-green-600 font-semibold mb-1">Your Ticket ID</p>
                                                        <p className="text-xl font-mono font-bold text-green-900">{order.ticketId}</p>
                                                        <p className="text-xs text-green-700 mt-2">Present this at merchandise pickup</p>
                                                    </div>
                                                )}

                                                {/* Rejection Reason */}
                                                {order.status === 'Rejected' && (
                                                    <div className="bg-red-50 border-2 border-red-300 p-4 rounded-lg">
                                                        <p className="font-semibold text-red-900 text-sm mb-1">Rejection Reason</p>
                                                        <p className="text-red-700 text-sm">{order.rejectionReason || 'No reason provided'}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MyOrdersPage;
