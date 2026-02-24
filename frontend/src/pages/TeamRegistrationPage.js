import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { eventAPI, teamAPI } from '../services/api';
import Alert from '../components/Alert';
import Card from '../components/Card';

const TeamRegistrationPage = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showCreateTeamModal, setShowCreateTeamModal] = useState(false);
  const [showJoinTeamModal, setShowJoinTeamModal] = useState(false);
  const [myTeam, setMyTeam] = useState(null);
  
  // Form states
  const [teamName, setTeamName] = useState('');
  const [teamSize, setTeamSize] = useState(2);
  const [inviteCode, setInviteCode] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchEventDetails();
    if (user?.role === 'participant') {
      fetchMyTeam();
    }
  }, [eventId, user]);

  const fetchEventDetails = async () => {
    try {
      setLoading(true);
      const response = await eventAPI.getEventDetails(eventId);
      setEvent(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch event details');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyTeam = async () => {
    try {
      const response = await teamAPI.getMyTeams();
      const team = response.data.find((t) => t.eventId === eventId);
      if (team) {
        setMyTeam(team);
      }
    } catch (err) {
      console.error('Error fetching team:', err);
    }
  };

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    if (!teamName.trim()) {
      setError('Team name is required');
      return;
    }
    if (teamSize < 2 || teamSize > 10) {
      setError('Team size must be between 2 and 10');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      const response = await teamAPI.createTeam({
        eventId,
        teamName,
        teamSize,
      });
      
      // Check if this is an existing team
      if (response.data.existing) {
        setMyTeam(response.data.data);
        setSuccess('✅ You already have a team in this event. Showing your existing team.');
      } else if (response.data && response.data.data) {
        setMyTeam(response.data.data);
        setSuccess('✅ Team created successfully!');
      } else {
        await fetchMyTeam();
        setSuccess('✅ Team created successfully!');
      }
      
      setShowCreateTeamModal(false);
      setTeamName('');
      setTeamSize(2);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create team');
    } finally {
      setSubmitting(false);
    }
  };

  const handleJoinTeam = async (e) => {
    e.preventDefault();
    if (!inviteCode.trim()) {
      setError('Invite code is required');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      const response = await teamAPI.joinTeam({ inviteCode });
      setShowJoinTeamModal(false);
      setInviteCode('');
      
      // Use the team data from response
      if (response.data && response.data.data) {
        setMyTeam(response.data.data);
        setSuccess('✅ You have successfully joined the team! You are now a team member.');
      } else {
        await fetchMyTeam();
        setSuccess('✅ You have successfully joined the team!');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to join team');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCompleteRegistration = async () => {
    if (!myTeam) return;
    
    try {
      setSubmitting(true);
      await teamAPI.completeTeamRegistration(myTeam._id);
      alert('✅ Team registration completed successfully!');
      await fetchMyTeam();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to complete registration');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!myTeam) return;
    if (!window.confirm('Are you sure you want to remove this member?')) return;

    try {
      await teamAPI.removeTeamMember(myTeam._id, memberId);
      await fetchMyTeam();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to remove member');
    }
  };

  const handleDeleteTeam = async () => {
    if (!myTeam) return;
    if (!window.confirm('Are you sure you want to delete this team? This cannot be undone.')) return;

    try {
      setSubmitting(true);
      await teamAPI.deleteTeam(myTeam._id);
      setMyTeam(null);
      setSuccess('✅ Team deleted successfully. You can now create a new team.');
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete team');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <svg className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-gray-600 font-semibold">Loading team registration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => navigate(`/events/${eventId}`)}
          className="text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-2 mb-4"
        >
          ← Back to Event
        </button>

        <Card className="shadow-lg mb-8">
          <div className="bg-gradient-to-r from-purple-600 to-purple-700 p-8 text-white rounded-t-lg">
            <h1 className="text-4xl font-bold mb-2">Hackathon Team Registration</h1>
            <p className="text-purple-100">{event?.name}</p>
          </div>

          {error && <Alert type="error" message={error} className="m-6" />}
          {success && <Alert type="success" message={success} className="m-6" onClose={() => setSuccess(null)} />}

          <div className="p-8">
            {!myTeam ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Create Team Option */}
                <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-300 hover:shadow-lg transition-shadow">
                  <div className="p-6 text-center">
                    <div className="text-4xl mb-4">🏗️</div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">Create a New Team</h3>
                    <p className="text-gray-700 mb-6">
                      You are a team leader. Create a team and invite members to join.
                    </p>
                    <button
                      onClick={() => setShowCreateTeamModal(true)}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
                    >
                      Create Team
                    </button>
                  </div>
                </Card>

                {/* Join Team Option */}
                <Card className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-300 hover:shadow-lg transition-shadow">
                  <div className="p-6 text-center">
                    <div className="text-4xl mb-4">👥</div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">Join an Existing Team</h3>
                    <p className="text-gray-700 mb-6">
                      Have an invite code? Join a team that's already been created.
                    </p>
                    <button
                      onClick={() => setShowJoinTeamModal(true)}
                      className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold"
                    >
                      Join Team
                    </button>
                  </div>
                </Card>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Team Details */}
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-6 rounded-lg border-2 border-purple-200">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div>
                      <p className="text-gray-600 text-sm font-semibold">Team Name</p>
                      <p className="text-2xl font-bold text-gray-900">{myTeam.teamName}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 text-sm font-semibold">Team Size</p>
                      <p className="text-2xl font-bold text-gray-900">{myTeam.teamSize}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 text-sm font-semibold">Members Joined</p>
                      <p className="text-2xl font-bold text-gray-900">{myTeam.members.length}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 text-sm font-semibold">Status</p>
                      <p className={`text-2xl font-bold ${myTeam.registrationStatus === 'Complete' ? 'text-green-600' : 'text-yellow-600'}`}>
                        {myTeam.registrationStatus}
                      </p>
                    </div>
                  </div>

                  {myTeam.registrationStatus !== 'Complete' && (
                    <div className="bg-white p-4 rounded-lg border border-purple-300 mb-4">
                      <p className="text-gray-700 mb-2">
                        <strong>Invite Code:</strong> <span className="font-mono bg-gray-100 px-3 py-1 rounded text-blue-600 font-bold">{myTeam.inviteCode}</span>
                      </p>
                      <p className="text-sm text-gray-600">
                        Share this code with your team members so they can join your team.
                      </p>
                    </div>
                  )}
                </div>

                {/* Team Members */}
                <div className="border-t pt-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">👥 Team Members ({myTeam.members.length}/{myTeam.teamSize})</h3>
                  <div className="grid gap-4">
                    {myTeam.members.map((member, index) => (
                      <div key={index} className="bg-gray-50 p-4 rounded-lg border border-gray-200 flex justify-between items-center">
                        <div>
                          <p className="font-semibold text-gray-900">
                            {member.memberId?.firstName || 'Unknown'} {member.memberId?.lastName || ''}
                            {member.memberId?._id === myTeam.leaderId && (
                              <span className="ml-2 px-3 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">Leader</span>
                            )}
                          </p>
                          <p className="text-sm text-gray-600">{member.email}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            Status: <span className={`font-semibold ${member.invitationStatus === 'Accepted' ? 'text-green-600' : member.invitationStatus === 'Pending' ? 'text-yellow-600' : 'text-red-600'}`}>
                              {member.invitationStatus}
                            </span>
                          </p>
                        </div>
                        {myTeam.leaderId === user?.id && member.memberId?._id !== myTeam.leaderId && (
                          <button
                            onClick={() => handleRemoveMember(member.memberId?._id)}
                            className="px-3 py-1 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 text-sm font-semibold"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {myTeam.members.length < myTeam.teamSize && (
                    <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-blue-800">
                        {myTeam.teamSize - myTeam.members.length} more member(s) needed to complete the team.
                      </p>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                {myTeam.registrationStatus !== 'Complete' && myTeam.members.length === myTeam.teamSize && (
                  <div className="border-t pt-6">
                    <button
                      onClick={handleCompleteRegistration}
                      disabled={submitting}
                      className={`w-full py-3 px-6 rounded-lg font-semibold transition-colors ${
                        submitting
                          ? 'bg-gray-400 text-white cursor-not-allowed'
                          : 'bg-green-600 text-white hover:bg-green-700'
                      }`}
                    >
                      {submitting ? 'Processing...' : '✅ Complete Team Registration'}
                    </button>
                    <p className="text-sm text-gray-600 mt-3 text-center">
                      Click this button once all team members have joined to complete registration.
                    </p>
                  </div>
                )}

                {myTeam.registrationStatus === 'Complete' && (
                  <div className="border-t pt-6 bg-green-50 border-2 border-green-300 p-6 rounded-lg">
                    <p className="text-green-800 font-bold text-lg mb-2">✅ Team Registration Complete</p>
                    <p className="text-green-700">
                      Your team has been successfully registered for the hackathon. All members will receive confirmation emails.
                    </p>
                  </div>
                )}

                {/* Delete Team Option */}
                {myTeam.registrationStatus !== 'Complete' && (
                  <div className="border-t pt-6">
                    <button
                      onClick={handleDeleteTeam}
                      disabled={submitting}
                      className={`w-full py-2 px-4 rounded-lg font-semibold transition-colors ${
                        submitting
                          ? 'bg-gray-400 text-white cursor-not-allowed'
                          : 'bg-red-100 text-red-700 hover:bg-red-200'
                      }`}
                    >
                      {submitting ? 'Deleting...' : '🗑️ Delete This Team'}
                    </button>
                    <p className="text-xs text-gray-500 mt-2 text-center">
                      Delete this team if you want to create a new one. This action cannot be undone.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Create Team Modal */}
      {showCreateTeamModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <div className="bg-blue-600 text-white p-6 rounded-t-lg">
              <h2 className="text-2xl font-bold">Create a New Team</h2>
            </div>
            <form onSubmit={handleCreateTeam} className="p-6 space-y-4">
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Team Name</label>
                <input
                  type="text"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="e.g., CodeMasters, InnovateTech"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  Team Size (2-10 members)
                </label>
                <select
                  value={teamSize}
                  onChange={(e) => setTeamSize(Number(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {[2, 3, 4, 5, 6, 7, 8, 9, 10].map((size) => (
                    <option key={size} value={size}>
                      {size} members
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateTeamModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-colors ${
                    submitting
                      ? 'bg-gray-400 text-white cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {submitting ? 'Creating...' : 'Create Team'}
                </button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Join Team Modal */}
      {showJoinTeamModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <div className="bg-green-600 text-white p-6 rounded-t-lg">
              <h2 className="text-2xl font-bold">Join a Team</h2>
            </div>
            <form onSubmit={handleJoinTeam} className="p-6 space-y-4">
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Team Invite Code</label>
                <input
                  type="text"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  placeholder="Enter 12-character invite code"
                  maxLength="12"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent uppercase font-mono"
                />
              </div>

              <p className="text-sm text-gray-600">
                Ask your team leader for the invite code to join their team.
              </p>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowJoinTeamModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-colors ${
                    submitting
                      ? 'bg-gray-400 text-white cursor-not-allowed'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  {submitting ? 'Joining...' : 'Join Team'}
                </button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};

export default TeamRegistrationPage;
