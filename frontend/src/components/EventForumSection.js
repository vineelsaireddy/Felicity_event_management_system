import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { forumAPI } from '../services/api';

const REACTIONS = ['👍', '❤️', '🎉', '🤔', '😂'];
const POLL_INTERVAL_MS = 3000; // near-real-time polling

const MessageBubble = ({ msg, currentUserId, currentUserRole, isOrganizer, eventId, onDelete, onPin, onReact, onReply }) => {
    const isOwn = msg.authorId === currentUserId;
    const isDeleted = msg.isDeleted;

    // Group reactions by emoji with counts
    const reactionGroups = REACTIONS.reduce((acc, emoji) => {
        const count = (msg.reactions || []).filter(r => r.emoji === emoji).length;
        const youReacted = (msg.reactions || []).some(r => r.emoji === emoji && r.userId === currentUserId);
        if (count > 0) acc.push({ emoji, count, youReacted });
        return acc;
    }, []);

    const typeStyle = {
        announcement: 'border-l-4 border-purple-500 bg-purple-50',
        question: 'border-l-4 border-yellow-400 bg-yellow-50',
        message: '',
    }[msg.type] || '';

    return (
        <div className={`group relative rounded-xl p-4 mb-3 ${isOwn ? 'ml-8 bg-blue-50 border border-blue-200' : 'mr-8 bg-white border border-gray-200'} ${typeStyle} shadow-sm hover:shadow-md transition-shadow`}>
            {/* Pin indicator */}
            {msg.isPinned && (
                <div className="flex items-center gap-1 text-xs text-purple-700 font-semibold mb-2">
                    📌 Pinned
                </div>
            )}

            {/* Header */}
            <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 flex-wrap">
                    <span className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 ${msg.authorRole === 'organizer' ? 'bg-purple-600' : 'bg-blue-500'}`}>
                        {msg.authorName?.[0]?.toUpperCase() || '?'}
                    </span>
                    <div>
                        <span className="font-semibold text-gray-900 text-sm">{msg.authorName}</span>
                        {msg.authorRole === 'organizer' && (
                            <span className="ml-1 px-1.5 py-0.5 bg-purple-100 text-purple-700 text-xs font-semibold rounded">Organizer</span>
                        )}
                        {msg.type === 'announcement' && (
                            <span className="ml-1 px-1.5 py-0.5 bg-purple-200 text-purple-800 text-xs font-semibold rounded">📢 Announcement</span>
                        )}
                        {msg.type === 'question' && (
                            <span className="ml-1 px-1.5 py-0.5 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded">❓ Question</span>
                        )}
                    </div>
                </div>
                <span className="text-xs text-gray-400 flex-shrink-0">
                    {new Date(msg.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    {' · '}
                    {new Date(msg.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </span>
            </div>

            {/* Content */}
            <p className={`text-sm leading-relaxed whitespace-pre-wrap ${isDeleted ? 'text-gray-400 italic' : 'text-gray-800'}`}>
                {msg.content}
            </p>

            {/* Reactions */}
            {!isDeleted && reactionGroups.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-3">
                    {reactionGroups.map(({ emoji, count, youReacted }) => (
                        <button
                            key={emoji}
                            onClick={() => onReact(msg._id, emoji)}
                            className={`px-2 py-0.5 rounded-full text-xs font-medium border transition-colors ${youReacted ? 'bg-blue-100 border-blue-400 text-blue-700' : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'}`}
                        >
                            {emoji} {count}
                        </button>
                    ))}
                </div>
            )}

            {/* Action Bar */}
            {!isDeleted && (
                <div className="flex items-center gap-2 mt-3 pt-2 border-t border-gray-100 opacity-0 group-hover:opacity-100 transition-opacity flex-wrap">
                    {/* React buttons */}
                    {REACTIONS.map(emoji => (
                        <button
                            key={emoji}
                            onClick={() => onReact(msg._id, emoji)}
                            title={`React ${emoji}`}
                            className="text-xs hover:scale-125 transition-transform"
                        >
                            {emoji}
                        </button>
                    ))}
                    <div className="flex-1" />
                    <button
                        onClick={() => onReply(msg)}
                        className="text-xs text-blue-600 hover:underline font-medium"
                    >
                        Reply
                    </button>
                    {(isOwn || isOrganizer) && (
                        <button
                            onClick={() => onDelete(msg._id)}
                            className="text-xs text-red-500 hover:underline font-medium"
                        >
                            Delete
                        </button>
                    )}
                    {isOrganizer && (
                        <button
                            onClick={() => onPin(msg._id)}
                            className="text-xs text-purple-600 hover:underline font-medium"
                        >
                            {msg.isPinned ? 'Unpin' : 'Pin'}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

const EventForumSection = ({ eventId }) => {
    const { user } = useAuth();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [msgType, setMsgType] = useState('message');
    const [replyTo, setReplyTo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [posting, setPosting] = useState(false);
    const [error, setError] = useState('');
    const [lastPollTime, setLastPollTime] = useState(null);
    const bottomRef = useRef(null);
    const pollingRef = useRef(null);

    const isOrganizer = user?.role === 'organizer';
    const currentUserId = user?.id?.toString() || user?._id?.toString();

    const fetchMessages = useCallback(async (initial = false) => {
        try {
            const since = initial ? null : lastPollTime;
            const res = await forumAPI.getMessages(eventId, since);
            const fetched = res.data.messages || [];

            if (initial) {
                setMessages(fetched);
            } else if (fetched.length > 0) {
                setMessages(prev => {
                    const ids = new Set(prev.map(m => m._id));
                    const newOnes = fetched.filter(m => !ids.has(m._id));
                    // Also update existing messages (for pin/delete/reactions)
                    const updated = prev.map(m => fetched.find(f => f._id === m._id) || m);
                    return [...updated, ...newOnes];
                });
            }
            if (res.data.serverTime) setLastPollTime(res.data.serverTime);
        } catch (err) {
            if (initial) setError('Could not load forum messages.');
        } finally {
            if (initial) setLoading(false);
        }
    }, [eventId, lastPollTime]);

    // Initial load
    useEffect(() => {
        fetchMessages(true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [eventId]);

    // Polling for near-real-time updates
    useEffect(() => {
        pollingRef.current = setInterval(() => fetchMessages(false), POLL_INTERVAL_MS);
        return () => clearInterval(pollingRef.current);
    }, [fetchMessages]);

    // Scroll to bottom on new messages
    useEffect(() => {
        if (!loading) {
            bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages.length, loading]);

    const handlePost = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;
        setPosting(true);
        setError('');
        try {
            const res = await forumAPI.postMessage(eventId, {
                content: newMessage.trim(),
                type: msgType,
                parentId: replyTo?._id || null,
            });
            setMessages(prev => [...prev, res.data]);
            setNewMessage('');
            setReplyTo(null);
            setMsgType('message');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to post message.');
        } finally {
            setPosting(false);
        }
    };

    const handleDelete = async (messageId) => {
        if (!window.confirm('Delete this message?')) return;
        try {
            await forumAPI.deleteMessage(eventId, messageId);
            setMessages(prev => prev.map(m =>
                m._id === messageId ? { ...m, isDeleted: true, content: '[Message deleted]' } : m
            ));
        } catch (err) {
            setError('Failed to delete message.');
        }
    };

    const handlePin = async (messageId) => {
        try {
            await forumAPI.togglePin(eventId, messageId);
            setMessages(prev => prev.map(m =>
                m._id === messageId ? { ...m, isPinned: !m.isPinned } : m
            ).sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0)));
        } catch (err) {
            setError('Failed to pin message.');
        }
    };

    const handleReact = async (messageId, emoji) => {
        try {
            const res = await forumAPI.reactToMessage(eventId, messageId, emoji);
            setMessages(prev => prev.map(m =>
                m._id === messageId ? { ...m, reactions: res.data.reactions } : m
            ));
        } catch (err) {
            console.error('React failed:', err);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12 gap-3 text-gray-500">
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Loading forum...
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto max-h-[500px] px-2 py-4 space-y-1" id="forum-messages">
                {messages.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="text-5xl mb-4">💬</div>
                        <p className="text-gray-500 font-medium">No messages yet. Start the conversation!</p>
                    </div>
                ) : (
                    messages.map(msg => (
                        <MessageBubble
                            key={msg._id}
                            msg={msg}
                            currentUserId={currentUserId}
                            currentUserRole={user?.role}
                            isOrganizer={isOrganizer}
                            eventId={eventId}
                            onDelete={handleDelete}
                            onPin={handlePin}
                            onReact={handleReact}
                            onReply={setReplyTo}
                        />
                    ))
                )}
                <div ref={bottomRef} />
            </div>

            {/* Error */}
            {error && (
                <div className="mx-2 mb-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    {error}
                </div>
            )}

            {/* Reply indicator */}
            {replyTo && (
                <div className="mx-2 mb-2 p-2 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between text-sm">
                    <span className="text-blue-700">
                        ↩️ Replying to <strong>{replyTo.authorName}</strong>: "{replyTo.content?.slice(0, 60)}..."
                    </span>
                    <button onClick={() => setReplyTo(null)} className="text-gray-400 hover:text-gray-600 ml-2">✕</button>
                </div>
            )}

            {/* Post Box */}
            <form onSubmit={handlePost} className="border-t border-gray-200 px-3 pt-4 pb-2 bg-white">
                {/* Type selector — only organizers see Announcement option */}
                <div className="flex gap-2 mb-3">
                    {[
                        { value: 'message', label: '💬 Message' },
                        { value: 'question', label: '❓ Question' },
                        ...(isOrganizer ? [{ value: 'announcement', label: '📢 Announcement' }] : []),
                    ].map(opt => (
                        <button
                            key={opt.value}
                            type="button"
                            onClick={() => setMsgType(opt.value)}
                            className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${msgType === opt.value ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>

                <div className="flex gap-2 items-end">
                    <textarea
                        value={newMessage}
                        onChange={e => setNewMessage(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handlePost(e); } }}
                        placeholder={
                            msgType === 'announcement'
                                ? 'Post an announcement to all participants...'
                                : msgType === 'question'
                                    ? 'Ask a question...'
                                    : 'Write a message... (Enter to send, Shift+Enter for new line)'
                        }
                        rows={2}
                        className="flex-1 resize-none px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                    <button
                        type="submit"
                        disabled={posting || !newMessage.trim()}
                        className="flex-shrink-0 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors font-semibold text-sm"
                    >
                        {posting ? '...' : 'Send'}
                    </button>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                    🔄 Updates every {POLL_INTERVAL_MS / 1000}s · {messages.filter(m => !m.isDeleted).length} messages
                </p>
            </form>
        </div>
    );
};

export default EventForumSection;
