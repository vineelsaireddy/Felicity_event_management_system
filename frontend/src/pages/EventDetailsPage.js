import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { eventAPI, merchandiseAPI } from '../services/api';
import Alert from '../components/Alert';
import Card from '../components/Card';
import EventForumSection from '../components/EventForumSection';
import FeedbackForm from '../components/FeedbackForm';

const EventDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [registering, setRegistering] = useState(false);
  const [registrationError, setRegistrationError] = useState(null);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const [myMerchandiseOrder, setMyMerchandiseOrder] = useState(null);

  useEffect(() => {
    fetchEventDetails();
  }, [id]);

  // When event loads, if it's Merchandise and user is participant, fetch their order
  useEffect(() => {
    if (event?.type === 'Merchandise' && user?.role === 'participant') {
      fetchMyMerchandiseOrder();
    }
  }, [event, user]);

  const fetchMyMerchandiseOrder = async () => {
    try {
      const order = await merchandiseAPI.getMyOrderForEvent(id);
      setMyMerchandiseOrder(order);
    } catch (err) {
      // silently ignore
    }
  };

  const fetchEventDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await eventAPI.getEventDetails(id);
      setEvent(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch event details');
      console.error('Error fetching event:', err);
    } finally {
      setLoading(false);
    }
  };

  const isRegistrationDeadlinePassed = () => {
    if (!event) return false;
    return new Date() > new Date(event.registrationDeadline);
  };

  const isCapacityFull = () => {
    if (!event) return false;
    return event.participants.length >= event.registrationLimit;
  };

  const getEventStatus = () => {
    if (isRegistrationDeadlinePassed()) {
      return { text: '❌ Registration Deadline Passed', color: 'red' };
    }

    const registrationPercentage = (event.participants.length / event.registrationLimit) * 100;
    if (registrationPercentage === 100) {
      return { text: '❌ Registration Full', color: 'red' };
    }
    if (registrationPercentage >= 80) {
      return { text: '⚠️ Almost Full', color: 'orange' };
    }
    if (registrationPercentage >= 50) {
      return { text: '✅ Spots Available', color: 'blue' };
    }
    return { text: '✅ Open for Registration', color: 'green' };
  };

  const handleRegister = async () => {
    if (!user || user.role !== 'participant') {
      setRegistrationError('Only participants can register for events');
      return;
    }

    if (isRegistrationDeadlinePassed()) {
      setRegistrationError('Registration deadline has passed');
      return;
    }

    if (isCapacityFull()) {
      setRegistrationError('Event registration is full');
      return;
    }

    try {
      setRegistering(true);
      setRegistrationError(null);

      const response = await eventAPI.registerForEvent(id, {});

      setRegistrationSuccess(true);
      alert(`✅ Registration successful!\n\nTicket ID: ${response.data.ticketId}\n\nYou will receive a confirmation email shortly.`);

      // Refresh event details
      setTimeout(() => {
        fetchEventDetails();
      }, 500);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to register for event';
      // If already registered, just refresh the page — the green panel will appear
      if (msg.toLowerCase().includes('already registered')) {
        fetchEventDetails();
      } else {
        setRegistrationError(msg);
      }
      console.error('Registration error:', err);
    } finally {
      setRegistering(false);
    }
  };

  // Determine if the current user can access the forum
  // event.participants is an array of { participantId, ticketId, status, ... }
  const currentUserId = user?.id || user?._id;
  const isRegistered = (event?.participants || []).some(p => {
    const pid = p.participantId?._id?.toString() || p.participantId?.toString() || '';
    return pid === currentUserId?.toString();
  }) || registrationSuccess;
  const isOrganizerOfEvent = user?.role === 'organizer' &&
    (event?.organizerId?._id?.toString() || event?.organizerId?.toString()) === currentUserId?.toString();
  const canAccessForum = user?.role === 'participant' ? isRegistered : isOrganizerOfEvent;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <svg className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-gray-600 font-semibold">Loading event details...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="text-center p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Event Not Found</h2>
          <p className="text-gray-600 mb-6">The event you're looking for doesn't exist or has been removed.</p>
          <button
            onClick={() => navigate('/browse-events')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Browse Events
          </button>
        </Card>
      </div>
    );
  }

  const status = getEventStatus();
  const registrationPercentage = (event.participants.length / event.registrationLimit) * 100;

  const tabs = [
    { id: 'details', label: '📋 Details' },
    { id: 'forum', label: '💬 Discussion Forum' },
    { id: 'feedback', label: '⭐ Feedback' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header with Status */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/browse-events')}
            className="text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-2 mb-4"
          >
            ← Back to Events
          </button>

          <Card className="shadow-lg">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-8 text-white rounded-t-lg">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className="badge bg-white bg-opacity-30 text-white text-sm font-semibold">
                    {event.type}
                  </span>
                </div>
                <span className={`badge bg-${status.color}-500 text-white text-sm font-semibold px-4 py-2 rounded-full`}>
                  {status.text}
                </span>
              </div>

              <h1 className="text-4xl font-bold mb-2">{event.name}</h1>
              <p className="text-blue-100 text-lg">{event.description}</p>
            </div>

            {/* Tab Navigation */}
            <div className="border-b border-gray-200 px-8">
              <div className="flex gap-0">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-5 py-4 font-semibold text-sm transition-colors border-b-2 -mb-px ${activeTab === tab.id
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Error/Success Messages */}
            {error && <Alert type="error" message={error} className="m-6" />}
            {registrationError && <Alert type="error" message={registrationError} className="m-6" />}
            {registrationSuccess && (
              <Alert type="success" message="✅ Successfully registered for this event!" className="m-6" />
            )}

            {/* ── TAB: DETAILS ── */}
            {activeTab === 'details' && (
              <div className="p-8 space-y-8">
                {/* Event Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Date & Time */}
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-2xl">📅</span>
                      <h3 className="text-lg font-semibold text-gray-900">Date & Time</h3>
                    </div>
                    <div className="space-y-2 text-gray-700">
                      <p><span className="font-medium">Start:</span> {new Date(event.startDate).toLocaleString()}</p>
                      <p><span className="font-medium">End:</span> {new Date(event.endDate).toLocaleString()}</p>
                      <p className="text-sm text-red-600 font-semibold">
                        Deadline: {new Date(event.registrationDeadline).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Organizer Info */}
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-2xl">🏢</span>
                      <h3 className="text-lg font-semibold text-gray-900">Organizer</h3>
                    </div>
                    <div className="space-y-2 text-gray-700">
                      <p><span className="font-medium">Name:</span> {event.organizerId?.name || 'Unknown'}</p>
                      <p><span className="font-medium">Category:</span> {event.organizerId?.category || 'N/A'}</p>
                      {event.organizerId?.contactEmail && (
                        <p><span className="font-medium">Email:</span> <a href={`mailto:${event.organizerId.contactEmail}`} className="text-blue-600 hover:underline">{event.organizerId.contactEmail}</a></p>
                      )}
                    </div>
                  </div>

                  {/* Eligibility & Fee */}
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-2xl">🎫</span>
                      <h3 className="text-lg font-semibold text-gray-900">Registration Details</h3>
                    </div>
                    <div className="space-y-2 text-gray-700">
                      <p><span className="font-medium">Eligibility:</span> {event.eligibility}</p>
                      <p><span className="font-medium">Registration Fee:</span> ₹{event.registrationFee || 'Free'}</p>
                      <p><span className="font-medium">Event Type:</span> {event.type}</p>
                    </div>
                  </div>

                  {/* Capacity */}
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-2xl">👥</span>
                      <h3 className="text-lg font-semibold text-gray-900">Capacity</h3>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm text-gray-700 mb-2">
                          <span><span className="font-medium">{event.participants.length}</span> registered</span>
                          <span><span className="font-medium">{event.registrationLimit}</span> total</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                          <div
                            className={`h-full transition-all duration-500 bg-gradient-to-r ${registrationPercentage >= 80
                              ? 'from-red-500 to-red-600'
                              : registrationPercentage >= 50
                                ? 'from-yellow-500 to-yellow-600'
                                : 'from-green-500 to-green-600'
                              }`}
                            style={{ width: `${registrationPercentage}%` }}
                          ></div>
                        </div>
                        <div className="text-sm text-gray-500 mt-2 text-right">
                          {Math.round(registrationPercentage)}% full
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tags */}
                {event.tags && event.tags.length > 0 && (
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {event.tags.map((tag, index) => (
                        <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Description */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">About This Event</h3>
                  <p className="text-gray-700 leading-relaxed">{event.description}</p>
                </div>

                {/* Action Section — differs by event type */}
                {user?.role === 'participant' && (
                  <div className="border-t pt-6">

                    {/* ── MERCHANDISE FLOW ── */}
                    {event.type === 'Merchandise' && (
                      <div className="space-y-4">
                        {!myMerchandiseOrder ? (
                          /* No order yet — go to checkout */
                          <div>
                            <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg mb-4">
                              <p className="text-orange-900 text-sm font-semibold mb-1">🛍️ Merchandise Event</p>
                              <p className="text-orange-800 text-sm">Browse items, add to cart, and place your order. You'll then upload a payment proof for organizer approval.</p>
                            </div>
                            <button
                              onClick={() => navigate(`/merchandise-store/${event._id}`)}
                              disabled={isRegistrationDeadlinePassed() || isCapacityFull()}
                              className={`w-full py-3 px-6 rounded-lg font-semibold transition-colors ${isRegistrationDeadlinePassed() || isCapacityFull()
                                ? 'bg-gray-400 text-white cursor-not-allowed'
                                : 'bg-orange-600 text-white hover:bg-orange-700'
                                }`}
                            >
                              🛍️ Browse &amp; Order Merchandise
                            </button>
                          </div>
                        ) : myMerchandiseOrder.status === 'Pending Approval' && !myMerchandiseOrder.paymentProof ? (
                          /* Order placed but no proof yet */
                          <div>
                            <div className="bg-yellow-50 border border-yellow-300 p-5 rounded-lg mb-4">
                              <p className="text-yellow-900 font-semibold mb-1">⏳ Order Placed — Payment Proof Required</p>
                              <p className="text-yellow-800 text-sm">
                                Your order (₹{myMerchandiseOrder.totalAmount?.toFixed(2)}) is waiting for payment proof.
                                Please upload your payment screenshot to proceed.
                              </p>
                            </div>
                            <button
                              onClick={() => navigate(`/payment-proof-upload/${myMerchandiseOrder.orderId}`)}
                              className="w-full py-3 px-6 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 font-semibold transition-colors"
                            >
                              📸 Upload Payment Proof
                            </button>
                          </div>
                        ) : myMerchandiseOrder.status === 'Pending Approval' && myMerchandiseOrder.paymentProof ? (
                          /* Proof uploaded, waiting for organizer */
                          <div className="bg-blue-50 border border-blue-200 p-5 rounded-lg text-center">
                            <div className="text-4xl mb-3">🕐</div>
                            <p className="text-blue-900 font-semibold mb-1">Payment Proof Uploaded</p>
                            <p className="text-blue-800 text-sm">Awaiting organizer approval. You'll receive an email with your ticket once approved.</p>
                            <p className="text-xs text-blue-600 mt-2">Order Total: ₹{myMerchandiseOrder.totalAmount?.toFixed(2)}</p>
                          </div>
                        ) : myMerchandiseOrder.status === 'Successful' ? (
                          /* Approved — show ticket */
                          <div className="space-y-4">
                            <div className="bg-green-50 border border-green-200 p-5 rounded-lg text-center">
                              <div className="text-4xl mb-3">✅</div>
                              <p className="text-green-900 font-semibold mb-1">Order Approved!</p>
                              <p className="text-green-800 text-sm mb-3">Your merchandise order has been approved. Present your ticket at pickup.</p>
                              {myMerchandiseOrder.ticketId && (
                                <div className="bg-white border-2 border-green-300 rounded-lg p-3 inline-block">
                                  <p className="text-xs text-green-600 font-semibold">Ticket ID</p>
                                  <p className="text-lg font-mono font-bold text-green-900">{myMerchandiseOrder.ticketId}</p>
                                </div>
                              )}
                            </div>
                            <button
                              onClick={() => navigate(`/merchandise-store/${event._id}`)}
                              className="w-full py-3 px-6 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-semibold transition-colors"
                            >
                              🛍️ Place Another Order
                            </button>
                            <button
                              onClick={() => setActiveTab('forum')}
                              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
                            >
                              💬 Discussion Forum
                            </button>
                          </div>
                        ) : myMerchandiseOrder.status === 'Rejected' ? (
                          /* Rejected */
                          <div>
                            <div className="bg-red-50 border border-red-200 p-5 rounded-lg mb-4 text-center">
                              <div className="text-4xl mb-3">❌</div>
                              <p className="text-red-900 font-semibold mb-1">Order Rejected</p>
                              {myMerchandiseOrder.rejectionReason && (
                                <p className="text-red-700 text-sm">Reason: {myMerchandiseOrder.rejectionReason}</p>
                              )}
                              <p className="text-red-600 text-xs mt-2">Contact the organizer for assistance.</p>
                            </div>
                            <button
                              onClick={() => navigate(`/merchandise-store/${event._id}`)}
                              className="w-full py-3 px-6 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-semibold transition-colors"
                            >
                              🔄 Place New Order
                            </button>
                          </div>
                        ) : null}
                      </div>
                    )}

                    {/* ── HACKATHON FLOW ── */}
                    {event.type === 'Hackathon' && (
                      isRegistered ? (
                        <div className="bg-green-50 border border-green-200 p-6 rounded-lg text-center">
                          <p className="text-green-800 font-semibold mb-2">✅ Already Registered (Team)</p>
                          <p className="text-green-700 text-sm">You are part of a team for this hackathon.</p>
                          <button
                            onClick={() => setActiveTab('forum')}
                            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-semibold"
                          >
                            💬 Go to Discussion Forum
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => navigate(`/team-registration/${event._id}`)}
                          className="w-full py-3 px-6 rounded-lg font-semibold transition-colors bg-purple-600 text-white hover:bg-purple-700"
                        >
                          🏗️ Register Team for Hackathon
                        </button>
                      )
                    )}

                    {/* ── NORMAL EVENT FLOW ── */}
                    {event.type === 'Normal' && (
                      <>
                        {isRegistered ? (
                          <div className="bg-green-50 border border-green-200 p-6 rounded-lg text-center">
                            <p className="text-green-800 font-semibold mb-2">✅ Already Registered</p>
                            <p className="text-green-700 text-sm">You have successfully registered for this event. Check your email for confirmation and ticket details.</p>
                            <button
                              onClick={() => setActiveTab('forum')}
                              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-semibold"
                            >
                              💬 Go to Discussion Forum
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={handleRegister}
                            disabled={registering || isRegistrationDeadlinePassed() || isCapacityFull()}
                            className={`w-full py-3 px-6 rounded-lg font-semibold transition-colors ${registering || isRegistrationDeadlinePassed() || isCapacityFull()
                              ? 'bg-gray-400 text-white cursor-not-allowed'
                              : 'bg-blue-600 text-white hover:bg-blue-700'
                              }`}
                          >
                            {registering ? 'Registering...' : 'Register for Event'}
                          </button>
                        )}
                      </>
                    )}
                  </div>
                )}

                {!user && (
                  <div className="border-t pt-6 bg-blue-50 p-6 rounded-lg text-center">
                    <p className="text-blue-800 mb-4">Please log in to register for this event</p>
                    <button
                      onClick={() => navigate('/login')}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Go to Login
                    </button>
                  </div>
                )}

                {user?.role !== 'participant' && user && user?.role !== 'organizer' && (
                  <div className="border-t pt-6 bg-gray-50 p-6 rounded-lg text-center">
                    <p className="text-gray-700">Only participants can register for events</p>
                  </div>
                )}
              </div>
            )}

            {/* ── TAB: DISCUSSION FORUM ── */}
            {activeTab === 'forum' && (
              <div className="p-6">
                {canAccessForum ? (
                  <EventForumSection eventId={id} />
                ) : (
                  <div className="text-center py-16">
                    <div className="text-6xl mb-4">🔒</div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">Forum Access Restricted</h3>
                    {user?.role === 'participant' ? (
                      <>
                        <p className="text-gray-600 mb-6">You must be registered for this event to access the discussion forum.</p>
                        <button
                          onClick={() => setActiveTab('details')}
                          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
                        >
                          Register for Event
                        </button>
                      </>
                    ) : (
                      <p className="text-gray-600">Only the event organizer and registered participants can access this forum.</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ── TAB: FEEDBACK ── */}
            {activeTab === 'feedback' && (
              <div className="p-8">
                {user?.role === 'participant' ? (
                  <div className="max-w-2xl">
                    <FeedbackForm eventId={id} onFeedbackSubmitted={() => {}} />
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <div className="text-6xl mb-4">🔒</div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">Feedback Access Restricted</h3>
                    <p className="text-gray-600">Only participants can provide feedback for this event.</p>
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};
export default EventDetailsPage;
