import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

const TYPE_ICONS = {
    message: (
        <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z" />
        </svg>
    ),
    graded: (
        <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
    ),
    certificate: (
        <svg className="w-4 h-4 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 01-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
        </svg>
    ),
    announcement: (
        <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
        </svg>
    ),
    enrollment: (
        <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    ),
    new_enrollment: (
        <svg className="w-4 h-4 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
        </svg>
    ),
    review: (
        <svg className="w-4 h-4 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
    ),
    submission: (
        <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
        </svg>
    ),
    quiz: (
        <svg className="w-4 h-4 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
    ),
    quiz_attempt: (
        <svg className="w-4 h-4 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 13l2 2 4-4" />
        </svg>
    ),
    assignment: (
        <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h8l4 4v10a2 2 0 01-2 2z" />
        </svg>
    ),
    lesson: (
        <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    ),
};

const DefaultIcon = () => (
    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
);

export default function NotificationBell() {
    const [open, setOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();
    const pollRef = useRef(null);

    // Poll unread count every 15 seconds
    useEffect(() => {
        fetchUnreadCount();
        pollRef.current = setInterval(fetchUnreadCount, 15000);
        return () => clearInterval(pollRef.current);
    }, []);

    // Close dropdown on outside click
    useEffect(() => {
        function handleClickOutside(e) {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    async function fetchUnreadCount() {
        try {
            const res = await api.get('/notifications/unread-count');
            setUnreadCount(res.data.unread_count);
        } catch (err) { }
    }

    async function handleOpen() {
        if (open) {
            setOpen(false);
            return;
        }
        setOpen(true);
        setLoading(true);
        try {
            const res = await api.get('/notifications');
            setNotifications(res.data.notifications);
            setUnreadCount(res.data.unread_count);
        } catch (err) { }
        finally {
            setLoading(false);
        }
    }

    async function handleMarkAllRead() {
        await api.post('/notifications/mark-all-read');
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        setUnreadCount(0);
    }

    async function handleClick(notification) {
        // Mark as read
        if (!notification.read) {
            await api.post(`/notifications/${notification.id}/read`);
            setNotifications((prev) =>
                prev.map((n) => n.id === notification.id ? { ...n, read: true } : n)
            );
            setUnreadCount((prev) => Math.max(0, prev - 1));
        }

        // Navigate to link
        if (notification.link) {
            setOpen(false);
            navigate(notification.link);
        }
    }

    async function handleDelete(e, notificationId) {
        e.stopPropagation();
        await api.delete(`/notifications/${notificationId}`);
        setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    }

    function timeAgo(dateStr) {
        const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
        if (diff < 60) return 'just now';
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
        return `${Math.floor(diff / 86400)}d ago`;
    }

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Bell button */}
            <button
                onClick={handleOpen}
                className="relative w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
            >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium leading-none">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {open && (
                <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-100 rounded-xl shadow-xl z-50 overflow-hidden">

                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                        <h3 className="text-sm font-semibold text-gray-800">
                            Notifications
                            {unreadCount > 0 && (
                                <span className="ml-2 text-xs font-medium text-blue-600">
                                    {unreadCount} new
                                </span>
                            )}
                        </h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAllRead}
                                className="text-xs text-blue-600 hover:underline"
                            >
                                Mark all read
                            </button>
                        )}
                    </div>

                    {/* Notification list */}
                    <div className="max-h-96 overflow-y-auto">
                        {loading ? (
                            <div className="p-4 space-y-3">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="animate-pulse flex gap-3">
                                        <div className="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0" />
                                        <div className="flex-1 space-y-1.5">
                                            <div className="h-3 bg-gray-200 rounded w-3/4" />
                                            <div className="h-3 bg-gray-100 rounded w-1/2" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="px-4 py-10 text-center">
                                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                    </svg>
                                </div>
                                <p className="text-sm text-gray-400">No notifications yet</p>
                            </div>
                        ) : (
                            notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    onClick={() => handleClick(notification)}
                                    className={`flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors border-b border-gray-50 group ${!notification.read ? 'bg-blue-50/50' : ''
                                        }`}
                                >
                                    {/* Icon */}
                                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                        {TYPE_ICONS[notification.type] || <DefaultIcon />}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-xs leading-snug ${!notification.read ? 'font-semibold text-gray-800' : 'text-gray-600'}`}>
                                            {notification.title}
                                        </p>
                                        <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">
                                            {notification.body}
                                        </p>
                                        <p className="text-xs text-gray-300 mt-1">
                                            {timeAgo(notification.created_at)}
                                        </p>
                                    </div>

                                    {/* Unread dot + delete */}
                                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                                        {!notification.read && (
                                            <div className="w-2 h-2 rounded-full bg-blue-600 mt-1" />
                                        )}
                                        <button
                                            onClick={(e) => handleDelete(e, notification.id)}
                                            className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-all text-xs"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Footer */}
                    {notifications.length > 0 && (
                        <div className="px-4 py-2.5 border-t border-gray-100 text-center">
                            <button
                                onClick={async () => {
                                    await api.post('/notifications/mark-all-read');
                                    setNotifications([]);
                                    setUnreadCount(0);
                                    setOpen(false);
                                }}
                                className="text-xs text-gray-400 hover:text-red-400 transition-colors"
                            >
                                Clear all notifications
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}