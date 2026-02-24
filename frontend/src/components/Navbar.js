import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setDropdownOpen(false);
    setMobileMenuOpen(false);
  };

  return (
    <nav className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 text-white shadow-xl sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link 
            to="/" 
            className="flex items-center gap-2 text-2xl font-bold hover:opacity-90 transition-opacity"
          >
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
              <span className="text-blue-700 font-bold">F</span>
            </div>
            Felicity
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-1">
            {user ? (
              <>
                {/* Participant Links */}
                {user.role === 'participant' && (
                  <div className="flex gap-1">
                    <NavLink to="/dashboard" label="Dashboard" />
                    <NavLink to="/browse-events" label="Events" />
                    <NavLink to="/my-orders" label="My Orders" />
                    <NavLink to="/clubs" label="Clubs" />
                  </div>
                )}

                {/* Organizer Links */}
                {user.role === 'organizer' && (
                  <div className="flex gap-1">
                    <NavLink to="/organizer/dashboard" label="Dashboard" />
                    <NavLink to="/organizer/create-event" label="Create Event" />
                    <NavLink to="/organizer/ongoing" label="Ongoing Events" />
                    <NavLink to="/organizer/merchandise-approval" label="Merch Orders" />
                    <NavLink to="/organizer/profile" label="Profile" />
                  </div>
                )}

                {/* Admin Links */}
                {user.role === 'admin' && (
                  <div className="flex gap-1">
                    <NavLink to="/admin/dashboard" label="Dashboard" />
                    <NavLink to="/admin/manage-organizers" label="Manage Clubs" />
                    <NavLink to="/admin/password-reset-requests" label="Reset Requests" />
                  </div>
                )}

                {/* Notification Bell */}
                <NotificationBell />

                {/* User Dropdown */}
                <div className="relative ml-6">
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white bg-opacity-20 hover:bg-opacity-30 transition-all duration-300"
                  >
                    <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center text-blue-700 font-bold text-sm">
                      {(user.email || user.name || 'U')[0].toUpperCase()}
                    </div>
                    <span className="text-sm font-semibold">{(user.email || user.name || 'User').split('@')[0]}</span>
                    <svg className={`w-4 h-4 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                  </button>

                  {/* Dropdown Menu */}
                  {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white text-gray-800 rounded-xl shadow-2xl py-2 animate-fadeIn">
                      <div className="px-4 py-2 border-b border-gray-200">
                        <p className="text-sm font-semibold">{user.email || user.name || 'User'}</p>
                        <p className="text-xs text-gray-500 capitalize">{user.role}</p>
                      </div>
                      <Link
                        to="/profile"
                        className="block px-4 py-2 hover:bg-blue-50 transition-colors"
                        onClick={() => setDropdownOpen(false)}
                      >
                        👤 Profile
                      </Link>
                      <Link
                        to="/settings"
                        className="block px-4 py-2 hover:bg-blue-50 transition-colors"
                        onClick={() => setDropdownOpen(false)}
                      >
                        ⚙️ Settings
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-600 transition-colors"
                      >
                        🚪 Logout
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex gap-3">
                <Link 
                  to="/login"
                  className="px-6 py-2 bg-white text-blue-700 font-semibold rounded-lg hover:shadow-lg transition-all duration-300"
                >
                  Login
                </Link>
                <Link 
                  to="/signup"
                  className="px-6 py-2 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-400 transition-all duration-300"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden pb-4 border-t border-white border-opacity-20 animate-slideIn">
            {user ? (
              <>
                <div className="py-3 px-4 mb-3 bg-white bg-opacity-10 rounded-lg">
                  <p className="font-semibold">{user.email}</p>
                  <p className="text-sm text-blue-200 capitalize">{user.role}</p>
                </div>

                {user.role === 'participant' && (
                  <>
                    <MobileNavLink to="/dashboard" label="Dashboard" />
                    <MobileNavLink to="/browse-events" label="Events" />
                    <MobileNavLink to="/my-orders" label="My Orders" />
                    <MobileNavLink to="/clubs" label="Clubs" />
                  </>
                )}

                {user.role === 'organizer' && (
                  <>
                    <MobileNavLink to="/organizer/dashboard" label="Dashboard" />
                    <MobileNavLink to="/organizer/create-event" label="Create Event" />
                    <MobileNavLink to="/organizer/ongoing" label="Ongoing Events" />
                    <MobileNavLink to="/organizer/merchandise-approval" label="Merch Orders" />
                    <MobileNavLink to="/organizer/profile" label="Profile" />
                  </>
                )}

                {user.role === 'admin' && (
                  <>
                    <MobileNavLink to="/admin/dashboard" label="Dashboard" />
                    <MobileNavLink to="/admin/manage-organizers" label="Manage Clubs" />
                    <MobileNavLink to="/admin/password-reset-requests" label="Reset Requests" />
                  </>
                )}

                <MobileNavLink to="/profile" label="👤 Profile" />
                <MobileNavLink to="/settings" label="⚙️ Settings" />
                
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-red-300 hover:bg-red-500 hover:bg-opacity-20 transition-colors rounded font-semibold"
                >
                  🚪 Logout
                </button>
              </>
            ) : (
              <div className="flex flex-col gap-3">
                <Link 
                  to="/login"
                  className="px-4 py-2 bg-white text-blue-700 font-semibold rounded-lg text-center"
                >
                  Login
                </Link>
                <Link 
                  to="/signup"
                  className="px-4 py-2 bg-blue-500 text-white font-semibold rounded-lg text-center"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

// Reusable NavLink component
const NavLink = ({ to, label }) => (
  <Link
    to={to}
    className="px-4 py-2 rounded-lg hover:bg-white hover:bg-opacity-20 transition-all duration-300 font-medium text-sm"
  >
    {label}
  </Link>
);

// Mobile NavLink component
const MobileNavLink = ({ to, label }) => (
  <Link
    to={to}
    className="block px-4 py-2 hover:bg-white hover:bg-opacity-20 transition-colors rounded font-semibold"
  >
    {label}
  </Link>
);

export default Navbar;
