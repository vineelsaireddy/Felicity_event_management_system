import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { eventAPI, merchandiseAPI } from '../services/api';
import Card from '../components/Card';
import Alert from '../components/Alert';
import Button from '../components/Button';

const MerchandiseCheckoutPage = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [event, setEvent] = useState(null);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchEventAndCart();
  }, [eventId, user, navigate]);

  const fetchEventAndCart = async () => {
    try {
      setLoading(true);
      const eventResponse = await eventAPI.getEventDetails(eventId);
      setEvent(eventResponse.data);

      // Check if there's cart data in localStorage
      const savedCart = localStorage.getItem(`cart_${eventId}`);
      if (savedCart) {
        setCart(JSON.parse(savedCart));
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load event');
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = () => {
    return cart.reduce((total, item) => {
      const merchandise = event?.merchandise?.items?.find(m => m.itemId === item.itemId);
      return total + (merchandise?.price || 0) * item.quantity;
    }, 0);
  };

  const handlePlaceOrder = async () => {
    if (cart.length === 0) {
      setError('Your cart is empty');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const response = await merchandiseAPI.placeOrder(eventId, cart);

      // Clear cart
      localStorage.removeItem(`cart_${eventId}`);

      // Navigate to payment proof upload
      navigate(`/payment-proof-upload/${response.data.orderId}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to place order');
      setSubmitting(false);
    }
  };

  const removeFromCart = (itemId) => {
    const updatedCart = cart.filter(item => item.itemId !== itemId);
    setCart(updatedCart);
    localStorage.setItem(`cart_${eventId}`, JSON.stringify(updatedCart));
  };

  const updateQuantity = (itemId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }

    const updatedCart = cart.map(item =>
      item.itemId === itemId ? { ...item, quantity } : item
    );
    setCart(updatedCart);
    localStorage.setItem(`cart_${eventId}`, JSON.stringify(updatedCart));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <svg className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-gray-600 font-semibold">Loading...</p>
        </div>
      </div>
    );
  }

  const total = calculateTotal();

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 pt-24">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <button
          onClick={() => navigate(`/events/${eventId}`)}
          className="text-blue-600 hover:text-blue-800 font-semibold mb-6"
        >
          ← Continue Shopping
        </button>

        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Checkout</h1>
          <p className="text-gray-600 mt-2">{event?.name}</p>
        </div>

        {error && <Alert type="error" message={error} className="mb-6" />}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <Card className="shadow-lg">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900">Order Summary</h2>
              </div>

              {cart.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="text-6xl mb-4">🛒</div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Your Cart is Empty</h3>
                  <p className="text-gray-600 mb-4">Add merchandise items to proceed with checkout</p>
                  <Button
                    variant="primary"
                    onClick={() => navigate(`/events/${eventId}`)}
                  >
                    Continue Shopping
                  </Button>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {cart.map((cartItem) => {
                    const merchandiseItem = event?.merchandise?.items?.find(
                      m => m.itemId === cartItem.itemId
                    );

                    if (!merchandiseItem) return null;

                    return (
                      <div key={cartItem.itemId} className="p-6 hover:bg-gray-50 transition-colors">
                        <div className="flex gap-4">
                          {/* Item Image */}
                          <div className="flex-shrink-0">
                            {merchandiseItem.image ? (
                              <img
                                src={`http://localhost:5000/${merchandiseItem.image}`}
                                alt={merchandiseItem.name}
                                className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                              />
                            ) : (
                              <div className="w-20 h-20 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center text-3xl">
                                👕
                              </div>
                            )}
                          </div>

                          {/* Item Info */}
                          <div className="flex-1">
                            <h3 className="text-lg font-bold text-gray-900">{merchandiseItem.name}</h3>
                            {merchandiseItem.description && (
                              <p className="text-sm text-gray-500 mt-1">{merchandiseItem.description}</p>
                            )}

                            <div className="mt-2 text-sm text-gray-600 space-y-1">
                              {cartItem.size && <p>Size: <span className="font-semibold text-gray-900">{cartItem.size}</span></p>}
                              {cartItem.color && <p>Color: <span className="font-semibold text-gray-900">{cartItem.color}</span></p>}
                            </div>

                            {/* Quantity Control */}
                            <div className="mt-3 flex items-center gap-2">
                              <label className="text-sm font-semibold text-gray-700">Qty:</label>
                              <div className="flex items-center border border-gray-300 rounded-lg">
                                <button
                                  onClick={() => updateQuantity(cartItem.itemId, cartItem.quantity - 1)}
                                  className="px-3 py-1 text-gray-600 hover:bg-gray-100"
                                >−</button>
                                <input
                                  type="number"
                                  min="1"
                                  value={cartItem.quantity}
                                  onChange={(e) => updateQuantity(cartItem.itemId, parseInt(e.target.value))}
                                  className="w-12 text-center border-l border-r border-gray-300 py-1"
                                />
                                <button
                                  onClick={() => updateQuantity(cartItem.itemId, cartItem.quantity + 1)}
                                  className="px-3 py-1 text-gray-600 hover:bg-gray-100"
                                >+</button>
                              </div>
                            </div>
                          </div>

                          {/* Price & Remove */}
                          <div className="text-right">
                            <p className="text-2xl font-bold text-blue-600">
                              ₹{(merchandiseItem.price * cartItem.quantity).toFixed(2)}
                            </p>
                            <p className="text-sm text-gray-600">₹{merchandiseItem.price}/unit</p>
                            <button
                              onClick={() => removeFromCart(cartItem.itemId)}
                              className="mt-3 text-red-600 hover:text-red-800 font-semibold text-sm"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </div>

          {/* Order Total & Checkout */}
          <div className="lg:col-span-1">
            <Card className="shadow-lg sticky top-32">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-bold text-gray-900">Order Total</h3>
              </div>

              <div className="p-6 space-y-4">
                {/* Items Count */}
                <div className="flex justify-between text-sm">
                  <p className="text-gray-600">Items ({cart.reduce((sum, item) => sum + item.quantity, 0)})</p>
                  <p className="font-semibold text-gray-900">₹{total.toFixed(2)}</p>
                </div>

                {/* Subtotal */}
                <div className="py-4 border-t border-b border-gray-200 flex justify-between">
                  <p className="font-semibold text-gray-900">Subtotal</p>
                  <p className="text-xl font-bold text-gray-900">₹{total.toFixed(2)}</p>
                </div>

                {/* Note */}
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-sm text-blue-900">
                    After placing the order, you'll upload a payment proof image.
                    Your order will be pending until the organizer approves it.
                  </p>
                </div>

                {/* Checkout Button */}
                <Button
                  variant="primary"
                  className="w-full"
                  disabled={cart.length === 0 || submitting}
                  onClick={handlePlaceOrder}
                >
                  {submitting ? 'Processing...' : 'Place Order'}
                </Button>

                {/* Continue Shopping */}
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={() => navigate(`/events/${eventId}`)}
                >
                  Continue Shopping
                </Button>
              </div>
            </Card>

            {/* Info Card */}
            <Card className="bg-green-50 border-2 border-green-200 mt-6">
              <div className="p-6">
                <p className="text-sm text-green-900">
                  <strong>✓ Next Step:</strong><br />
                  Upload your payment proof on the next page. Include the transaction receipt with amount, date, and reference number clearly visible.
                </p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MerchandiseCheckoutPage;
