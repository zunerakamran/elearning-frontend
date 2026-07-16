import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import ChatWindow from '../../components/ChatWindow';

export default function ChatPage() {
    const { user } = useAuth();
    const [searchParams] = useSearchParams();
    const [conversations, setConversations] = useState([]);
    const [selected, setSelected] = useState(null);
    const [loading, setLoading] = useState(true);
    const courseId = searchParams.get('course');

    useEffect(() => {
        const endpoint = user?.role === 'instructor'
            ? '/conversations/instructor'
            : '/conversations';

        // If student came from a course page, start/get that conversation first
        const init = async () => {
            if (courseId && user?.role === 'student') {
                try {
                    const res = await api.post(`/courses/${courseId}/conversation`);
                    setSelected(res.data);
                } catch (err) {
                    console.error(err);
                }
            }

            const res = await api.get(endpoint);
            setConversations(res.data);
            setLoading(false);
        };

        init();
    }, [user, courseId]);

    function selectConversation(conv) {
        setSelected(conv);
        // Mark as read locally
        setConversations((prev) =>
            prev.map((c) => c.id === conv.id ? { ...c, unread_count: 0 } : c)
        );
    }

    const totalUnread = conversations.reduce((sum, c) => sum + (c.unread_count || 0), 0);

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-5xl mx-auto px-4 py-6">
                <div className="mb-4">
                    <h1 className="text-xl font-semibold text-gray-900">
                        Messages
                        {totalUnread > 0 && (
                            <span className="ml-2 text-xs font-medium bg-blue-600 text-white px-2 py-0.5 rounded-full">
                                {totalUnread} new
                            </span>
                        )}
                    </h1>
                    <p className="text-sm text-gray-400 mt-0.5">
                        {user?.role === 'instructor'
                            ? 'Messages from your students'
                            : 'Chat with your instructors'}
                    </p>
                </div>

                <div className="bg-white border border-gray-100 rounded-xl overflow-hidden flex" style={{ height: '600px' }}>

                    {/* Sidebar — conversation list */}
                    <div className="w-72 border-r border-gray-100 flex flex-col flex-shrink-0">
                        <div className="px-4 py-3 border-b border-gray-100">
                            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                                Conversations
                            </p>
                        </div>

                        <div className="flex-1 overflow-y-auto">
                            {loading ? (
                                <div className="p-4 space-y-3">
                                    {[1, 2, 3].map((i) => (
                                        <div key={i} className="animate-pulse flex gap-3">
                                            <div className="w-9 h-9 rounded-full bg-gray-200 flex-shrink-0" />
                                            <div className="flex-1 space-y-1.5">
                                                <div className="h-3 bg-gray-200 rounded w-3/4" />
                                                <div className="h-3 bg-gray-100 rounded w-1/2" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : conversations.length === 0 ? (
                                <div className="p-6 text-center">
                                    <p className="text-sm text-gray-400">No conversations yet.</p>
                                    {user?.role === 'student' && (
                                        <p className="text-xs text-gray-300 mt-1">
                                            Go to a course and click "Chat with Instructor"
                                        </p>
                                    )}
                                </div>
                            ) : (
                                conversations.map((conv) => {
                                    const isSelected = selected?.id === conv.id;
                                    const otherPerson = user?.role === 'student'
                                        ? conv.instructor
                                        : conv.student;
                                    const hasUnread = conv.unread_count > 0;

                                    return (
                                        <button
                                            key={conv.id}
                                            onClick={() => selectConversation(conv)}
                                            className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-50 ${isSelected ? 'bg-blue-50 border-l-2 border-l-blue-600' : ''
                                                }`}
                                        >
                                            <div className="relative flex-shrink-0">
                                                <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center bg-gray-100 border border-gray-200 shadow-sm">
                                                    {otherPerson?.profile_picture_url ? (
                                                        <img
                                                            src={otherPerson.profile_picture_url}
                                                            alt={otherPerson.name}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <svg className="w-full h-full text-gray-400 mt-2" fill="currentColor" viewBox="0 0 24 24">
                                                            <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                                                        </svg>
                                                    )}
                                                </div>
                                                {hasUnread && (
                                                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold shadow-sm border-2 border-white">
                                                        {conv.unread_count}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-1.5">
                                                    <p className={`text-sm truncate ${hasUnread ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                                                        {otherPerson?.name}
                                                    </p>
                                                    {!!otherPerson?.is_verified && (
                                                        <svg className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                                                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                                                        </svg>
                                                    )}
                                                </div>
                                                <p className="text-xs text-gray-400 truncate">
                                                    {conv.course?.title}
                                                </p>
                                                {conv.last_message && (
                                                    <p className="text-xs text-gray-300 truncate mt-0.5">
                                                        {conv.last_message.body}
                                                    </p>
                                                )}
                                            </div>
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* Chat window */}
                    <div className="flex-1 flex flex-col">
                        {selected ? (
                            <ChatWindow
                                key={selected.id}
                                conversation={selected}
                            />
                        ) : (
                            <div className="flex-1 flex items-center justify-center bg-gray-50">
                                <div className="text-center">
                                    <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <svg className="w-7 h-7 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                        </svg>
                                    </div>
                                    <p className="text-sm text-gray-500 font-medium">Select a conversation</p>
                                    <p className="text-xs text-gray-300 mt-1">Choose from the list to start chatting</p>
                                </div>
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
}