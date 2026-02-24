import React from 'react';
import { Link } from 'react-router-dom';

const HomePage = () => {
  const features = [
    {
      icon: '🎯',
      title: 'Easy Event Discovery',
      description: 'Browse and find events that match your interests with advanced filtering options.'
    },
    {
      icon: '📝',
      title: 'Quick Registration',
      description: 'Register for events in seconds and manage all your registrations in one place.'
    },
    {
      icon: '🎪',
      title: 'Event Organization',
      description: 'Create and manage events with our intuitive event management tools.'
    },
    {
      icon: '📊',
      title: 'Analytics & Insights',
      description: 'Get detailed analytics and insights about your event performance.'
    },
    {
      icon: '🎟️',
      title: 'Smart Tickets',
      description: 'Generate QR codes and manage digital tickets for your events.'
    },
    {
      icon: '👥',
      title: 'Community Features',
      description: 'Connect with other participants and organizers in your community.'
    }
  ];

  const stats = [
    { number: '5000+', label: 'Events Hosted' },
    { number: '50K+', label: 'Active Users' },
    { number: '100K+', label: 'Registrations' },
    { number: '95%', label: 'Satisfaction Rate' }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 text-white py-20 md:py-32 overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>

        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="text-center mb-12 animate-fadeIn">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              Experience Events <br />
              <span className="bg-gradient-to-r from-blue-200 to-blue-100 bg-clip-text text-transparent">
                Like Never Before
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 mb-10 max-w-2xl mx-auto">
              Discover amazing events, connect with communities, and create unforgettable experiences.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/signup"
                className="btn-primary px-8 py-4 text-lg font-semibold rounded-xl hover:scale-105 transition-transform"
              >
                Get Started Now
              </Link>
              <Link
                to="/browse-events"
                className="px-8 py-4 bg-white text-blue-700 font-semibold rounded-xl hover:shadow-xl transition-all"
              >
                Explore Events
              </Link>
            </div>
          </div>

          {/* Stats Section */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16">
            {stats.map((stat, index) => (
              <div key={index} className="text-center animate-slideIn" style={{ animationDelay: `${index * 100}ms` }}>
                <div className="text-4xl md:text-5xl font-bold mb-2">{stat.number}</div>
                <div className="text-blue-200">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 md:py-32 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Why Choose Felicity?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Discover the features that make Felicity the ultimate event management platform.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="card-elevated p-8 hover:ring-2 hover:ring-blue-500 transition-all animate-fadeIn"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="text-5xl mb-4">{feature.icon}</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 md:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600">Three simple steps to get started</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: 1,
                title: 'Sign Up',
                description: 'Create your account in minutes. No credit card required.',
                icon: '📝'
              },
              {
                step: 2,
                title: 'Browse & Register',
                description: 'Explore events and register for ones that interest you.',
                icon: '🔍'
              },
              {
                step: 3,
                title: 'Attend & Enjoy',
                description: 'Get your ticket and enjoy amazing events with our community.',
                icon: '🎉'
              }
            ].map((item, index) => (
              <div key={index} className="text-center">
                <div className="flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-r from-blue-600 to-blue-700 text-white text-3xl mx-auto mb-6">
                  {item.step}
                </div>
                <div className="text-5xl mb-4">{item.icon}</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">{item.title}</h3>
                <p className="text-gray-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* User Roles Section */}
      <section className="py-20 md:py-32 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              For Everyone
            </h2>
            <p className="text-xl text-gray-600">Whatever your role, we have something for you</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                role: 'Participants',
                emoji: '👥',
                features: ['Discover events', 'Quick registration', 'Digital tickets', 'Save favorites']
              },
              {
                role: 'Organizers',
                emoji: '🎪',
                features: ['Create events', 'Manage registrations', 'Analytics & reports', 'QR tickets']
              },
              {
                role: 'Administrators',
                emoji: '⚙️',
                features: ['Full control', 'Manage organizers', 'Platform statistics', 'User management']
              }
            ].map((item, index) => (
              <div key={index} className="card-elevated overflow-hidden hover:shadow-2xl transition-all">
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-8 text-white text-center">
                  <div className="text-6xl mb-4">{item.emoji}</div>
                  <h3 className="text-2xl font-bold">{item.role}</h3>
                </div>
                <div className="p-8">
                  <ul className="space-y-3">
                    {item.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-3 text-gray-700">
                        <span className="text-blue-600 font-bold">✓</span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 text-white py-16 md:py-24">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-blue-100 mb-10">
            Join thousands of users already enjoying amazing events. Create your account today!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/signup"
              className="px-8 py-4 bg-white text-blue-700 font-bold rounded-xl hover:shadow-2xl transition-all text-lg"
            >
              Sign Up Free
            </Link>
            <Link
              to="/login"
              className="px-8 py-4 bg-blue-500 text-white font-bold rounded-xl hover:bg-blue-400 transition-all text-lg"
            >
              Already Have an Account?
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="text-white font-bold text-xl mb-4">Felicity</div>
              <p>The ultimate event management platform for everyone.</p>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Product</h4>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-white transition">Features</a></li>
                <li><a href="#" className="hover:text-white transition">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition">Security</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Company</h4>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-white transition">About</a></li>
                <li><a href="#" className="hover:text-white transition">Blog</a></li>
                <li><a href="#" className="hover:text-white transition">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Legal</h4>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-white transition">Privacy</a></li>
                <li><a href="#" className="hover:text-white transition">Terms</a></li>
                <li><a href="#" className="hover:text-white transition">Cookies</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center">
            <p>&copy; 2026 Felicity. All rights reserved. Made with ❤️ for events.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
