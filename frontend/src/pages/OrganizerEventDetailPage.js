import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { organizerAPI } from '../services/api';
import Alert from '../components/Alert';
import Card from '../components/Card';
import EventForumSection from '../components/EventForumSection';

// ─── Merchandise Item Form ────────────────────────────────────────────────────
const emptyItem = () => ({
  itemId: '',
  name: '',
  description: '',
  price: '',
  stock: '',
  size: '',
  color: '',
  variants: '',
  image: null,       // existing URL/path
  imageFile: null,   // new File object
  previewUrl: null,  // blob URL for preview
});

const BACKEND = 'http://localhost:5000';

const OrganizerEventDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [event, setEvent] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [searchParticipant, setSearchParticipant] = useState('');
  const [statusChangeLoading, setStatusChangeLoading] = useState(false);

  // ── Merchandise items state ──
  const [items, setItems] = useState([]);
  const [savingItems, setSavingItems] = useState(false);
  const [itemsSaved, setItemsSaved] = useState(null);
  const fileInputRefs = useRef({});

  useEffect(() => { fetchEventDetails(); }, [id]);

  // Populate items when event is loaded
  useEffect(() => {
    if (event?.type === 'Merchandise') {
      setItems((event.merchandise?.items || []).map(item => ({
        ...emptyItem(),
        ...item,
        variants: Array.isArray(item.variants) ? item.variants.join(', ') : (item.variants || ''),
        imageFile: null,
        previewUrl: null,
      })));
    }
  }, [event]);

  const fetchEventDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await organizerAPI.getEventDetails(id);
      setEvent(response.data.event || response.data);
      setRegistrations(response.data.registrations || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch event details');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      setStatusChangeLoading(true);
      await organizerAPI.updateEventStatus(id, { status: newStatus });
      setEvent(prev => ({ ...prev, status: newStatus }));
    } catch (err) {
      setError('Failed to update event status');
    } finally {
      setStatusChangeLoading(false);
    }
  };

  const handleExportCSV = () => {
    const csv = [
      ['Name', 'Email', 'Registration Date', 'Attendance'],
      ...registrations.map(reg => [
        (reg.participantId?.firstName || '') + ' ' + (reg.participantId?.lastName || ''),
        reg.participantId?.email || 'N/A',
        new Date(reg.registrationDate).toLocaleDateString(),
        reg.status === 'Attended' ? 'Yes' : 'No',
      ])
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${event?.name}-participants.csv`;
    a.click();
  };

  const filteredRegistrations = registrations.filter(reg =>
    reg.participantId?.email?.toLowerCase().includes(searchParticipant.toLowerCase()) ||
    reg.participantId?.firstName?.toLowerCase().includes(searchParticipant.toLowerCase()) ||
    reg.participantId?.lastName?.toLowerCase().includes(searchParticipant.toLowerCase())
  );

  // ── Merchandise item helpers ──────────────────────────────────────────────
  const addItem = () => setItems(prev => [...prev, emptyItem()]);

  const removeItem = (idx) => {
    setItems(prev => {
      const copy = [...prev];
      // revoke blob URL
      if (copy[idx].previewUrl) URL.revokeObjectURL(copy[idx].previewUrl);
      copy.splice(idx, 1);
      return copy;
    });
  };

  const updateItem = (idx, field, value) => {
    setItems(prev => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: value };
      return copy;
    });
  };

  const handleImageSelect = (idx, file) => {
    if (!file) return;
    const previewUrl = URL.createObjectURL(file);
    setItems(prev => {
      const copy = [...prev];
      // cleanup old preview
      if (copy[idx].previewUrl) URL.revokeObjectURL(copy[idx].previewUrl);
      copy[idx] = { ...copy[idx], imageFile: file, previewUrl };
      return copy;
    });
  };

  const handleSaveItems = async () => {
    try {
      setSavingItems(true);
      setItemsSaved(null);

      const formData = new FormData();

      // Serialize items metadata (without file objects)
      const itemsMeta = items.map(({ imageFile, previewUrl, ...rest }) => rest);
      formData.append('items', JSON.stringify(itemsMeta));

      // Attach image files with indexed fieldnames
      items.forEach((item, idx) => {
        if (item.imageFile) {
          formData.append(`image_${idx}`, item.imageFile);
        }
      });

      await organizerAPI.updateMerchandiseItems(id, formData);
      setItemsSaved('✅ Merchandise items saved successfully!');
      fetchEventDetails(); // refresh
    } catch (err) {
      setItemsSaved('❌ ' + (err.response?.data?.message || 'Failed to save items'));
    } finally {
      setSavingItems(false);
    }
  };

  // ── Tabs ──────────────────────────────────────────────────────────────────
  const allTabs = event?.type === 'Merchandise'
    ? ['overview', 'forum', 'merchandise', 'analytics', 'participants']
    : ['overview', 'forum', 'analytics', 'participants'];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading event details...</div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <Alert type="error" message="Event not found" />
          <button onClick={() => navigate('/organizer/dashboard')} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">

        {/* ── Header ── */}
        <div className="mb-8">
          <button onClick={() => navigate('/organizer/dashboard')} className="text-blue-600 hover:text-blue-800 mb-4 font-semibold">
            ← Back to Dashboard
          </button>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-bold text-gray-900">{event.name}</h1>
              <div className="mt-3 flex gap-4">
                <span className={`px-4 py-1 rounded-full text-sm font-semibold ${event.status === 'Published' || event.status === 'Ongoing' ? 'bg-green-100 text-green-800' :
                    event.status === 'Draft' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
                  }`}>{event.status}</span>
                <span className="text-gray-600">{event.type}</span>
              </div>
            </div>
            {(event.status === 'Draft' || event.status === 'Published' || event.status === 'Ongoing') && (
              <button onClick={() => navigate(`/event/${event._id}/edit`)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold">
                Edit Event
              </button>
            )}
          </div>
        </div>

        {error && <Alert type="error" message={error} className="mb-4" />}

        {/* ── Tab Bar ── */}
        <div className="mb-6 flex gap-0 border-b border-gray-200">
          {allTabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-3 font-semibold text-sm transition-colors border-b-2 -mb-px capitalize ${activeTab === tab ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
            >
              {tab === 'merchandise' ? '🛍️ Merchandise Items' : tab === 'forum' ? '💬 Discussion Forum' : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* ══════════════════ OVERVIEW TAB ══════════════════ */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-white shadow">
                <div className="p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Event Information</h2>
                  <div className="space-y-3">
                    <div><p className="text-sm font-semibold text-gray-600">Type</p><p className="text-gray-900">{event.type}</p></div>
                    <div><p className="text-sm font-semibold text-gray-600">Eligibility</p><p className="text-gray-900">{event.eligibility}</p></div>
                    <div><p className="text-sm font-semibold text-gray-600">Registration Fee</p><p className="text-gray-900">₹{event.registrationFee || 0}</p></div>
                    <div><p className="text-sm font-semibold text-gray-600">Registration Limit</p><p className="text-gray-900">{event.registrationLimit}</p></div>
                  </div>
                </div>
              </Card>
              <Card className="bg-white shadow">
                <div className="p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Dates &amp; Times</h2>
                  <div className="space-y-3">
                    <div><p className="text-sm font-semibold text-gray-600">Registration Deadline</p><p className="text-gray-900">{new Date(event.registrationDeadline).toLocaleString()}</p></div>
                    <div><p className="text-sm font-semibold text-gray-600">Event Start</p><p className="text-gray-900">{new Date(event.startDate).toLocaleString()}</p></div>
                    <div><p className="text-sm font-semibold text-gray-600">Event End</p><p className="text-gray-900">{new Date(event.endDate).toLocaleString()}</p></div>
                  </div>
                </div>
              </Card>
            </div>
            <Card className="bg-white shadow"><div className="p-6"><h2 className="text-xl font-bold text-gray-900 mb-4">Description</h2><p className="text-gray-700 leading-relaxed">{event.description}</p></div></Card>
            {(event.status === 'Published' || event.status === 'Ongoing') && (
              <Card className="bg-white shadow">
                <div className="p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Status Management</h2>
                  <div className="flex gap-3">
                    {event.status === 'Ongoing' && (
                      <button onClick={() => handleStatusChange('Completed')} disabled={statusChangeLoading} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-semibold">
                        Mark as Completed
                      </button>
                    )}
                    <button onClick={() => handleStatusChange('Closed')} disabled={statusChangeLoading} className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 font-semibold">
                      Close Event
                    </button>
                  </div>
                </div>
              </Card>
            )}
          </div>
        )}

        {/* ══════════════════ DISCUSSION FORUM TAB ══════════════════ */}
        {activeTab === 'forum' && (
          <div className="space-y-6">
            <Card className="bg-blue-50 border border-blue-200 shadow p-6">
              <div className="flex gap-3 items-start">
                <span className="text-3xl">💬</span>
                <div>
                  <h2 className="text-xl font-bold text-blue-900 mb-2">Discussion Forum</h2>
                  <p className="text-sm text-blue-800">See and respond to all messages from participants. You can pin important discussions, post announcements, and delete inappropriate content.</p>
                </div>
              </div>
            </Card>
            <EventForumSection eventId={event._id} />
          </div>
        )}

        {/* ══════════════════ MERCHANDISE ITEMS TAB ══════════════════ */}
        {activeTab === 'merchandise' && (
          <div className="space-y-6">
            {/* Info Banner */}
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 flex gap-3">
              <span className="text-2xl">🛍️</span>
              <div>
                <p className="font-semibold text-orange-900">Merchandise Item Manager</p>
                <p className="text-sm text-orange-800">Add items (T-shirts, hoodies, etc.) with images, prices &amp; stock. Participants will see these in their cart when placing orders.</p>
              </div>
            </div>

            {itemsSaved && (
              <div className={`p-4 rounded-lg font-semibold ${itemsSaved.startsWith('✅') ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
                {itemsSaved}
              </div>
            )}

            {/* Items List */}
            <div className="space-y-4">
              {items.length === 0 && (
                <Card className="text-center p-10">
                  <div className="text-5xl mb-3">👕</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">No items yet</h3>
                  <p className="text-gray-600 mb-4">Click "Add Item" below to start adding merchandise (T-shirts, hoodies, caps, etc.)</p>
                </Card>
              )}

              {items.map((item, idx) => (
                <Card key={idx} className="overflow-hidden">
                  <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-3 flex justify-between items-center">
                    <h3 className="text-white font-semibold">Item #{idx + 1} {item.name && `— ${item.name}`}</h3>
                    <button onClick={() => removeItem(idx)} className="text-white hover:text-red-200 font-bold text-lg transition-colors">✕ Remove</button>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                      {/* ── Image Upload ── */}
                      <div className="lg:col-span-1">
                        <p className="text-sm font-semibold text-gray-700 mb-2">Item Image</p>
                        <div
                          className="border-2 border-dashed border-gray-300 rounded-xl overflow-hidden cursor-pointer hover:border-orange-400 transition-colors"
                          onClick={() => fileInputRefs.current[idx]?.click()}
                        >
                          {(item.previewUrl || item.image) ? (
                            <div className="relative">
                              <img
                                src={item.previewUrl || `${BACKEND}/${item.image}`}
                                alt="Item"
                                className="w-full h-48 object-cover"
                              />
                              <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 transition-all flex items-center justify-center">
                                <span className="text-white opacity-0 hover:opacity-100 font-semibold text-sm bg-black bg-opacity-50 px-3 py-1 rounded-lg">Change Photo</span>
                              </div>
                            </div>
                          ) : (
                            <div className="h-48 flex flex-col items-center justify-center text-gray-400">
                              <div className="text-4xl mb-2">📷</div>
                              <p className="text-sm font-semibold">Click to upload image</p>
                              <p className="text-xs">PNG, JPG (max 5MB)</p>
                            </div>
                          )}
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          ref={el => fileInputRefs.current[idx] = el}
                          onChange={e => handleImageSelect(idx, e.target.files[0])}
                        />
                        {item.imageFile && (
                          <p className="text-xs text-green-600 mt-1 font-semibold">✓ {item.imageFile.name}</p>
                        )}
                      </div>

                      {/* ── Item Details ── */}
                      <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Name */}
                        <div className="sm:col-span-2">
                          <label className="block text-sm font-semibold text-gray-700 mb-1">Item Name *</label>
                          <input
                            type="text"
                            value={item.name}
                            onChange={e => updateItem(idx, 'name', e.target.value)}
                            placeholder="e.g. Felicity T-Shirt, College Hoodie"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
                          />
                        </div>

                        {/* Description */}
                        <div className="sm:col-span-2">
                          <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
                          <textarea
                            value={item.description}
                            onChange={e => updateItem(idx, 'description', e.target.value)}
                            placeholder="e.g. 100% cotton, pre-shrunk, available in multiple sizes"
                            rows="2"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
                          />
                        </div>

                        {/* Price */}
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1">Price (₹) *</label>
                          <input
                            type="number"
                            min="0"
                            value={item.price}
                            onChange={e => updateItem(idx, 'price', e.target.value)}
                            placeholder="e.g. 499"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
                          />
                        </div>

                        {/* Stock */}
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1">Stock Quantity *</label>
                          <input
                            type="number"
                            min="0"
                            value={item.stock}
                            onChange={e => updateItem(idx, 'stock', e.target.value)}
                            placeholder="e.g. 100"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
                          />
                        </div>

                        {/* Available Sizes */}
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1">Available Sizes</label>
                          <input
                            type="text"
                            value={item.size}
                            onChange={e => updateItem(idx, 'size', e.target.value)}
                            placeholder="e.g. S, M, L, XL, XXL"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
                          />
                        </div>

                        {/* Color */}
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1">Available Colors</label>
                          <input
                            type="text"
                            value={item.color}
                            onChange={e => updateItem(idx, 'color', e.target.value)}
                            placeholder="e.g. Black, White, Navy"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
                          />
                        </div>

                        {/* Variants */}
                        <div className="sm:col-span-2">
                          <label className="block text-sm font-semibold text-gray-700 mb-1">Other Variants (comma separated)</label>
                          <input
                            type="text"
                            value={item.variants}
                            onChange={e => updateItem(idx, 'variants', e.target.value)}
                            placeholder="e.g. Printed, Embroidered, Plain"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Add Item + Save buttons */}
            <div className="flex gap-4 flex-wrap">
              <button
                onClick={addItem}
                className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-orange-400 text-orange-600 rounded-xl font-semibold hover:bg-orange-50 transition-colors"
              >
                ＋ Add Item
              </button>
              <button
                onClick={handleSaveItems}
                disabled={savingItems || items.length === 0}
                className={`flex items-center gap-2 px-8 py-3 rounded-xl font-semibold transition-colors ${savingItems || items.length === 0
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-orange-600 text-white hover:bg-orange-700'
                  }`}
              >
                {savingItems ? '⏳ Saving...' : '💾 Save All Items'}
              </button>
            </div>

            {/* Preview note */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-900">
              <strong>ℹ️ How it works:</strong> After saving, participants will see all items with their images, prices and stock when they visit this event page and click "Browse &amp; Order Merchandise".
            </div>
          </div>
        )}

        {/* ══════════════════ ANALYTICS TAB ══════════════════ */}
        {activeTab === 'analytics' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-white shadow"><div className="p-6"><h3 className="text-sm font-medium text-gray-600">Total Registrations</h3><p className="text-3xl font-bold text-blue-600 mt-2">{registrations.length}</p></div></Card>
            <Card className="bg-white shadow"><div className="p-6"><h3 className="text-sm font-medium text-gray-600">Attendance Rate</h3><p className="text-3xl font-bold text-green-600 mt-2">{registrations.length > 0 ? Math.round((registrations.filter(r => r.status === 'Attended').length / registrations.length) * 100) : 0}%</p></div></Card>
            <Card className="bg-white shadow"><div className="p-6"><h3 className="text-sm font-medium text-gray-600">Total Revenue</h3><p className="text-3xl font-bold text-purple-600 mt-2">₹{event.analytics?.totalRevenue || 0}</p></div></Card>
            <Card className="bg-white shadow"><div className="p-6"><h3 className="text-sm font-medium text-gray-600">Remaining Capacity</h3><p className="text-3xl font-bold text-orange-600 mt-2">{event.registrationLimit - registrations.length}</p></div></Card>
          </div>
        )}

        {/* ══════════════════ PARTICIPANTS TAB ══════════════════ */}
        {activeTab === 'participants' && (
          <div className="space-y-6">
            <div className="flex gap-4 items-center">
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchParticipant}
                onChange={e => setSearchParticipant(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button onClick={handleExportCSV} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold">
                📥 Export CSV
              </button>
            </div>
            <Card className="bg-white shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Name</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Email</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Reg Date</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Ticket ID</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRegistrations.length === 0 ? (
                      <tr><td colSpan="5" className="text-center py-8 text-gray-600">{registrations.length === 0 ? 'No registrations yet' : 'No matching participants'}</td></tr>
                    ) : (
                      filteredRegistrations.map(reg => (
                        <tr key={reg._id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4 font-medium text-gray-900">{reg.participantId?.firstName} {reg.participantId?.lastName}</td>
                          <td className="py-3 px-4 text-gray-700">{reg.participantId?.email}</td>
                          <td className="py-3 px-4 text-gray-700">{new Date(reg.registrationDate).toLocaleDateString()}</td>
                          <td className="py-3 px-4 text-gray-700 font-mono text-sm">{reg.ticketId || 'N/A'}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded text-sm font-semibold ${reg.status === 'Attended' ? 'bg-green-100 text-green-800' :
                                reg.status === 'Registered' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                              }`}>{reg.status}</span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrganizerEventDetailPage;
