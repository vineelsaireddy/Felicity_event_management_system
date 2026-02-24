import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const NotificationBell = () => {
  const { user, token } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  // Fetch notifications
  const fetchNotifications = async () => {
    if (!user || user.role !== 'participant' || !token) return;
    
    try {
      setLoading(true);
      const response = await axios.get(
        `${API_URL}/notifications`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNotifications(response.data.notifications);
      setUnreadCount(response.data.unreadCount);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch on mount and set up polling
  useEffect(() => {
    if (user && user.role === 'participant') {
      fetchNotifications();
      // Poll every 10 seconds
      const interval = setInterval(fetchNotifications, 10000);
      return () => clearInterval(interval);
    }
  }, [user, token]);

  const markAsRead = async (notificationId) => {
    try {
      await axios.patch(
        `${API_URL}/notifications/${notificationId}/read`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchNotifications();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await axios.patch(
        `${API_URL}/notifications/read/all`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchNotifications();
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      await axios.delete(
        `${API_URL}/notifications/${notificationId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchNotifications();
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  if (!user || user.role !== 'participant') return null;

  return (
    <div className="relative">
      {/* Bell Icon */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-all duration-300"
        title="Notifications"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 1118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        
        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white text-gray-800 rounded-xl shadow-2xl z-50 max-h-96 overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-blue-50 to-blue-100 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
            <h3 className="font-bold text-lg">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-sm text-blue-600 hover:text-blue-700 font-semibold"
              >
                Mark all as read
              </button>
            )}
          </div>

          {/* Notifications List */}
          {loading ? (
            <div className="p-4 text-center text-gray-500">Loading...</div>
          ) : notifications.length === 0 ? (
            <div className="p-4 text-center text-gray-500">No notifications</div>
          ) : (
            <div className="divide-y divide-gray-200">
              {notifications.map((notification) => (
                <div
                  key={notification._id}
                  className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                    !notification.isRead ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => !notification.isRead && markAsRead(notification._id)}
                >
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        {!notification.isRead && (
                          <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                        )}
                        <h4 className="font-semibold text-sm">{notification.title}</h4>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                      <p className="text-xs text-gray-500 mt-2">
                        {new Date(notification.createdAt).toLocaleDateString()} {' '}
                        {new Date(notification.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(notification._id);
                      }}
                      className="text-gray-400 hover:text-red-500 transition-colors p-1"
                      title="Delete"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
