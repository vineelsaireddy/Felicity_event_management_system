import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { eventAPI } from '../services/api';
import Alert from '../components/Alert';
import Card from '../components/Card';

const BACKEND = 'http://localhost:5000';

const MerchandiseStorePage = () => {
    const { eventId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [cart, setCart] = useState([]);
    const [addedMsg, setAddedMsg] = useState(null);

    // Per-item selection state: { itemId: { size, color, quantity } }
    const [selections, setSelections] = useState({});

    useEffect(() => {
        if (!user) { navigate('/login'); return; }
        fetchEvent();
        // Load saved cart
        const saved = localStorage.getItem(`cart_${eventId}`);
        if (saved) { try { setCart(JSON.parse(saved)); } catch { } }
    }, [eventId, user]);

    const fetchEvent = async () => {
        try {
            setLoading(true);
            const res = await eventAPI.getEventDetails(eventId);
            setEvent(res.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load event');
        } finally {
            setLoading(false);
        }
    };

    const setSelection = (itemId, field, value) => {
        setSelections(prev => ({
            ...prev,
            [itemId]: { quantity: 1, ...prev[itemId], [field]: value },
        }));
    };

    const getSelection = (itemId) => selections[itemId] || { size: '', color: '', quantity: 1 };

    const cartTotal = () => {
        return cart.reduce((total, cartItem) => {
            const item = event?.merchandise?.items?.find(m => m.itemId === cartItem.itemId);
            return total + (item?.price || 0) * cartItem.quantity;
        }, 0);
    };

    const cartCount = () => cart.reduce((sum, c) => sum + c.quantity, 0);

    const addToCart = (item) => {
        const sel = getSelection(item.itemId);

        // Check if same item+size+color already in cart
        const key = `${item.itemId}||${sel.size}||${sel.color}`;
        const existing = cart.find(c => `${c.itemId}||${c.size}||${c.color}` === key);

        let updated;
        if (existing) {
            updated = cart.map(c =>
                `${c.itemId}||${c.size}||${c.color}` === key
                    ? { ...c, quantity: c.quantity + Number(sel.quantity) }
                    : c
            );
        } else {
            updated = [...cart, {
                itemId: item.itemId,
                name: item.name,
                size: sel.size,
                color: sel.color,
                quantity: Number(sel.quantity) || 1,
            }];
        }

        setCart(updated);
        localStorage.setItem(`cart_${eventId}`, JSON.stringify(updated));
        setAddedMsg(`✓ "${item.name}" added to cart`);
        setTimeout(() => setAddedMsg(null), 2500);
    };

    const removeFromCart = (index) => {
        const updated = cart.filter((_, i) => i !== index);
        setCart(updated);
        localStorage.setItem(`cart_${eventId}`, JSON.stringify(updated));
    };

    const proceedToCheckout = () => {
        if (cart.length === 0) { setError('Add at least one item to cart first'); return; }
        navigate(`/merchandise-checkout/${eventId}`);
    };

    const items = event?.merchandise?.items || [];

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
            <div className="max-w-7xl mx-auto">

                {/* Header */}
                <div className="mb-8">
                    <button onClick={() => navigate(`/events/${eventId}`)} className="text-blue-600 hover:text-blue-800 font-semibold mb-3">
                        ← Back to Event
                    </button>
                    <h1 className="text-3xl font-bold text-gray-900">{event?.name}</h1>
                    <p className="text-gray-600 mt-1">🛍️ Merchandise Store — browse items and add to cart</p>
                </div>

                {error && <Alert type="error" message={error} className="mb-6" />}

                {/* Added to cart flash */}
                {addedMsg && (
                    <div className="fixed top-20 right-6 z-50 bg-green-600 text-white px-5 py-3 rounded-xl shadow-xl font-semibold animate-pulse">
                        {addedMsg}
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

                    {/* ── Items Grid ── */}
                    <div className="lg:col-span-3">
                        {items.length === 0 ? (
                            <Card className="text-center p-16">
                                <div className="text-6xl mb-4">👕</div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-2">No items available yet</h3>
                                <p className="text-gray-600">The organizer hasn't added merchandise items yet. Check back soon!</p>
                            </Card>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                                {items.map((item) => {
                                    const sel = getSelection(item.itemId);
                                    const sizes = item.size ? item.size.split(',').map(s => s.trim()).filter(Boolean) : [];
                                    const colors = item.color ? item.color.split(',').map(c => c.trim()).filter(Boolean) : [];
                                    const outOfStock = item.stock <= 0;

                                    return (
                                        <Card key={item.itemId} className={`overflow-hidden flex flex-col transition-all hover:shadow-lg ${outOfStock ? 'opacity-60' : ''}`}>

                                            {/* Item image */}
                                            <div className="relative bg-gray-100 h-52 flex items-center justify-center">
                                                {item.image ? (
                                                    <img
                                                        src={`${BACKEND}/${item.image}`}
                                                        alt={item.name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="text-6xl">👕</div>
                                                )}
                                                {outOfStock && (
                                                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                                                        <span className="bg-red-600 text-white font-bold px-4 py-2 rounded-lg">Out of Stock</span>
                                                    </div>
                                                )}
                                                <div className="absolute top-3 right-3 bg-orange-600 text-white text-sm font-bold px-3 py-1 rounded-full">
                                                    ₹{item.price}
                                                </div>
                                            </div>

                                            <div className="p-4 flex flex-col flex-1">
                                                <h3 className="text-lg font-bold text-gray-900 mb-1">{item.name}</h3>
                                                {item.description && (
                                                    <p className="text-sm text-gray-600 mb-3 flex-1">{item.description}</p>
                                                )}

                                                <div className="text-xs text-gray-500 mb-3">
                                                    Stock: <span className={`font-semibold ${item.stock < 10 ? 'text-red-600' : 'text-green-600'}`}>{item.stock} left</span>
                                                </div>

                                                {/* Size selector */}
                                                {sizes.length > 0 && (
                                                    <div className="mb-3">
                                                        <p className="text-xs font-semibold text-gray-700 mb-1">Size</p>
                                                        <div className="flex flex-wrap gap-1">
                                                            {sizes.map(s => (
                                                                <button
                                                                    key={s}
                                                                    onClick={() => setSelection(item.itemId, 'size', s)}
                                                                    className={`px-3 py-1 text-xs rounded-lg border font-semibold transition-colors ${sel.size === s
                                                                            ? 'bg-orange-600 text-white border-orange-600'
                                                                            : 'bg-white text-gray-700 border-gray-300 hover:border-orange-400'
                                                                        }`}
                                                                >
                                                                    {s}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Color selector */}
                                                {colors.length > 0 && (
                                                    <div className="mb-3">
                                                        <p className="text-xs font-semibold text-gray-700 mb-1">Color</p>
                                                        <div className="flex flex-wrap gap-1">
                                                            {colors.map(c => (
                                                                <button
                                                                    key={c}
                                                                    onClick={() => setSelection(item.itemId, 'color', c)}
                                                                    className={`px-3 py-1 text-xs rounded-lg border font-semibold transition-colors ${sel.color === c
                                                                            ? 'bg-blue-600 text-white border-blue-600'
                                                                            : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                                                                        }`}
                                                                >
                                                                    {c}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Quantity */}
                                                <div className="mb-4">
                                                    <p className="text-xs font-semibold text-gray-700 mb-1">Quantity</p>
                                                    <div className="flex items-center border border-gray-300 rounded-lg w-fit">
                                                        <button
                                                            onClick={() => setSelection(item.itemId, 'quantity', Math.max(1, (sel.quantity || 1) - 1))}
                                                            className="px-3 py-1 text-gray-600 hover:bg-gray-100 font-bold"
                                                        >−</button>
                                                        <span className="px-4 py-1 text-sm font-semibold border-l border-r border-gray-300">{sel.quantity || 1}</span>
                                                        <button
                                                            onClick={() => setSelection(item.itemId, 'quantity', Math.min(item.stock, (sel.quantity || 1) + 1))}
                                                            className="px-3 py-1 text-gray-600 hover:bg-gray-100 font-bold"
                                                        >+</button>
                                                    </div>
                                                </div>

                                                {/* Add to Cart */}
                                                <button
                                                    onClick={() => addToCart(item)}
                                                    disabled={outOfStock}
                                                    className={`w-full py-2 rounded-lg font-semibold text-sm transition-colors ${outOfStock
                                                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                                            : 'bg-orange-600 text-white hover:bg-orange-700 active:scale-95'
                                                        }`}
                                                >
                                                    {outOfStock ? 'Out of Stock' : '🛒 Add to Cart'}
                                                </button>
                                            </div>
                                        </Card>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* ── Cart Sidebar ── */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-24">
                            <Card className="overflow-hidden">
                                <div className="bg-orange-600 text-white px-4 py-3 flex justify-between items-center">
                                    <h3 className="font-bold">🛒 Cart ({cartCount()})</h3>
                                    {cart.length > 0 && (
                                        <span className="text-orange-100 text-sm">₹{cartTotal().toFixed(2)}</span>
                                    )}
                                </div>

                                <div className="p-4">
                                    {cart.length === 0 ? (
                                        <div className="text-center py-8">
                                            <div className="text-4xl mb-2">🛒</div>
                                            <p className="text-gray-500 text-sm">Your cart is empty</p>
                                            <p className="text-gray-400 text-xs mt-1">Add items from the store</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {cart.map((cartItem, idx) => {
                                                const item = items.find(m => m.itemId === cartItem.itemId);
                                                return (
                                                    <div key={idx} className="bg-gray-50 rounded-lg p-3">
                                                        <div className="flex justify-between items-start">
                                                            <div className="flex-1 min-w-0">
                                                                <p className="font-semibold text-sm text-gray-900 truncate">{cartItem.name}</p>
                                                                <p className="text-xs text-gray-600">
                                                                    {[cartItem.size, cartItem.color].filter(Boolean).join(' · ')}
                                                                </p>
                                                                <p className="text-xs text-gray-600">Qty: {cartItem.quantity}</p>
                                                            </div>
                                                            <div className="text-right ml-2">
                                                                <p className="text-sm font-bold text-orange-600">₹{((item?.price || 0) * cartItem.quantity).toFixed(0)}</p>
                                                                <button
                                                                    onClick={() => removeFromCart(idx)}
                                                                    className="text-red-500 hover:text-red-700 text-xs mt-1"
                                                                >remove</button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}

                                            <div className="border-t pt-3">
                                                <div className="flex justify-between font-bold text-gray-900 mb-3">
                                                    <span>Total</span>
                                                    <span>₹{cartTotal().toFixed(2)}</span>
                                                </div>
                                                <button
                                                    onClick={proceedToCheckout}
                                                    className="w-full py-2.5 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
                                                >
                                                    Proceed to Checkout →
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MerchandiseStorePage;
