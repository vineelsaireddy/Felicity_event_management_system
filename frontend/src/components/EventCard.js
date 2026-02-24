import React from 'react';

const EventCard = ({ event, variant = 'default' }) => {
  const getEventStatus = () => {
    const registrationPercentage = (event.participants?.length || 0) / event.registrationLimit * 100;
    if (registrationPercentage === 100) return { text: 'FULL', color: 'red' };
    if (registrationPercentage >= 80) return { text: 'ALMOST FULL', color: 'orange' };
    if (registrationPercentage >= 50) return { text: 'SPOTS LEFT', color: 'blue' };
    return { text: 'OPEN', color: 'green' };
  };

  const status = getEventStatus();
  const registrationPercentage = (event.participants?.length || 0) / event.registrationLimit * 100;

  if (variant === 'compact') {
    return (
      <div className="card p-4 hover:shadow-lg transition-shadow">
        <div className="flex justify-between items-start gap-2 mb-2">
          <span className="badge badge-primary text-xs">{event.type}</span>
          <span className={`badge bg-${status.color}-100 text-${status.color}-700 text-xs`}>
            {status.text}
          </span>
        </div>
        <h4 className="font-bold text-gray-900 mb-2 line-clamp-2">{event.name}</h4>
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
          <span>📍 {event.location || 'TBD'}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
          <div
            className={`h-full rounded-full bg-gradient-to-r from-blue-600 to-blue-700`}
            style={{ width: `${registrationPercentage}%` }}
          ></div>
        </div>
        <p className="text-xs text-gray-500">{event.participants?.length || 0} / {event.registrationLimit}</p>
      </div>
    );
  }

  return (
    <div className="card-elevated group overflow-hidden animate-fadeIn hover:ring-2 hover:ring-blue-500 transition-all">
      {/* Event Header */}
      <div className="relative bg-gradient-to-r from-blue-600 to-blue-700 p-4 text-white min-h-24 flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-start gap-2 mb-2">
            <span className="badge bg-white bg-opacity-30 text-white font-semibold text-xs">
              {event.type}
            </span>
            <span className={`badge bg-${status.color}-500 text-white text-xs font-semibold`}>
              {status.text}
            </span>
          </div>
          <h3 className="text-xl font-bold line-clamp-2">{event.name}</h3>
        </div>
        <p className="text-sm text-blue-100 line-clamp-1">{event.description?.substring(0, 50)}...</p>
      </div>

      {/* Event Details */}
      <div className="p-6 space-y-4">
        <p className="text-gray-700 text-sm line-clamp-2">{event.description}</p>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <span className="text-lg">📍</span>
            <span className="line-clamp-1">{event.location || 'TBD'}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <span className="text-lg">🎯</span>
            <span>{event.eligibility}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <span className="text-lg">👥</span>
            <span>{event.participants?.length || 0} registered</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <span className="text-lg">💺</span>
            <span>{event.registrationLimit} slots</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-gray-600">
            <span>Capacity</span>
            <span className="font-semibold">{Math.round(registrationPercentage)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 bg-gradient-to-r ${
                registrationPercentage >= 80
                  ? 'from-red-500 to-red-600'
                  : registrationPercentage >= 50
                  ? 'from-yellow-500 to-yellow-600'
                  : 'from-green-500 to-green-600'
              }`}
              style={{ width: `${registrationPercentage}%` }}
            ></div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 space-y-2">
          <a
            href={`/event/${event._id}`}
            className="block text-center btn-primary py-2 w-full font-semibold transition-transform transform group-hover:scale-105"
          >
            View Details →
          </a>
          <button className="w-full px-4 py-2 border-2 border-blue-600 text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition-colors">
            ♥️ Save Event
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 px-6 py-3 bg-gray-50 text-xs text-gray-500">
        📅 {event.date ? new Date(event.date).toLocaleDateString() : 'Date TBA'}
      </div>
    </div>
  );
};

export default EventCard;
