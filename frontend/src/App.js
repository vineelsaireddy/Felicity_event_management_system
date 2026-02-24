import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import SignupPage from './pages/SignupPage';
import BrowseEventsPage from './pages/BrowseEventsPage';
import AdminDashboard from './pages/AdminDashboard';
import PasswordResetRequestsPage from './pages/PasswordResetRequestsPage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import OrganizerDashboard from './pages/OrganizerDashboard';
import CreateEventPage from './pages/CreateEventPage';
import EditEventPage from './pages/EditEventPage';
import OrganizerEventDetailPage from './pages/OrganizerEventDetailPage';
import OrganizerProfilePage from './pages/OrganizerProfilePage';
import OnboardingPage from './pages/OnboardingPage';
import EventDetailsPage from './pages/EventDetailsPage';
import TeamRegistrationPage from './pages/TeamRegistrationPage';
import MyEventsPage from './pages/MyEventsPage';
import ClubsListPage from './pages/ClubsListPage';
import OrganizerDetailPage from './pages/OrganizerDetailPage';
import MerchandiseCheckoutPage from './pages/MerchandiseCheckoutPage';
import MerchandiseStorePage from './pages/MerchandiseStorePage';
import MyOrdersPage from './pages/MyOrdersPage';
import PaymentProofUploadPage from './pages/PaymentProofUploadPage';
import OrganizerMerchandiseApprovalPage from './pages/OrganizerMerchandiseApprovalPage';
import EventFeedbackPage from './pages/EventFeedbackPage';
import './index.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Navbar />
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/signup" element={<SignupPage />} />

          {/* Participant Protected Routes */}
          <Route
            path="/onboarding"
            element={
              <ProtectedRoute allowedRoles={['participant']}>
                <OnboardingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/browse-events"
            element={
              <ProtectedRoute allowedRoles={['participant']}>
                <BrowseEventsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowedRoles={['participant']}>
                <MyEventsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-events"
            element={
              <ProtectedRoute allowedRoles={['participant']}>
                <MyEventsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/clubs"
            element={
              <ProtectedRoute allowedRoles={['participant']}>
                <ClubsListPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/event/:id"
            element={
              <ProtectedRoute allowedRoles={['participant']}>
                <EventDetailsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/team-registration/:eventId"
            element={
              <ProtectedRoute allowedRoles={['participant']}>
                <TeamRegistrationPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/organizer/:id"
            element={
              <OrganizerDetailPage />
            }
          />

          {/* Organizer Protected Routes */}
          <Route
            path="/organizer/dashboard"
            element={
              <ProtectedRoute allowedRoles={['organizer']}>
                <OrganizerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/organizer/create-event"
            element={
              <ProtectedRoute allowedRoles={['organizer']}>
                <CreateEventPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/event/:id/edit"
            element={
              <ProtectedRoute allowedRoles={['organizer']}>
                <EditEventPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/organizer/ongoing"
            element={
              <ProtectedRoute allowedRoles={['organizer']}>
                <OrganizerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/organizer/profile"
            element={
              <ProtectedRoute allowedRoles={['organizer']}>
                <OrganizerProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/organizer/event/:id"
            element={
              <ProtectedRoute allowedRoles={['organizer']}>
                <OrganizerEventDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/event/:eventId/feedback"
            element={
              <ProtectedRoute allowedRoles={['organizer']}>
                <EventFeedbackPage />
              </ProtectedRoute>
            }
          />

          {/* Admin Protected Routes */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/manage-organizers"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/password-reset-requests"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <PasswordResetRequestsPage />
              </ProtectedRoute>
            }
          />

          {/* Merchandise Routes */}
          <Route
            path="/merchandise-store/:eventId"
            element={
              <ProtectedRoute allowedRoles={['participant']}>
                <MerchandiseStorePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/merchandise-checkout/:eventId"
            element={
              <ProtectedRoute allowedRoles={['participant']}>
                <MerchandiseCheckoutPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/payment-proof-upload/:orderId"
            element={
              <ProtectedRoute allowedRoles={['participant']}>
                <PaymentProofUploadPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-orders"
            element={
              <ProtectedRoute allowedRoles={['participant']}>
                <MyOrdersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/organizer/merchandise-approval"
            element={
              <ProtectedRoute allowedRoles={['organizer']}>
                <OrganizerMerchandiseApprovalPage />
              </ProtectedRoute>
            }
          />

          {/* Common Protected Routes (All authenticated users) */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute allowedRoles={['participant', 'organizer', 'admin']}>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute allowedRoles={['participant', 'organizer', 'admin']}>
                <SettingsPage />
              </ProtectedRoute>
            }
          />

          {/* Catch all - redirect to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
