import { useEffect, useRef, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import Loader from './Loader';

export default function ChatWindow({ conversation, onClose }) {
    const { user } = useAuth();
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [sending, setSending] = useState(false);
    const [loading, setLoading] = useState(true);
    const bottomRef = useRef(null);
    const pollRef = useRef(null);
    const lastIdRef = useRef(0);

    useEffect(() => {
        // Load initial messages
        api.get(`/conversations/${conversation.id}/messages`)
            .then((res) => {
                setMessages(res.data);
                if (res.data.length > 0) {
                    lastIdRef.current = res.data[res.data.length - 1].id;
                }
            })
            .finally(() => setLoading(false));

        // Start polling every 3 seconds
        pollRef.current = setInterval(() => {
            api.get(`/conversations/${conversation.id}/poll?after_id=${lastIdRef.current}`)
                .then((res) => {
                    if (res.data.length > 0) {
                        setMessages((prev) => {
                            const existingIds = new Set(prev.map((m) => m.id));
                            const newMessages = res.data.filter((m) => !existingIds.has(m.id));
                            return [...prev, ...newMessages];
                        });
                        lastIdRef.current = res.data[res.data.length - 1].id;
                    }
                })
                .catch(() => { });
        }, 3000);

        return () => clearInterval(pollRef.current);
    }, [conversation.id]);

    // Scroll to bottom when messages change
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    async function handleSend(e) {
        e.preventDefault();
        if (!input.trim()) return;
        setSending(true);
        try {
            const res = await api.post(`/conversations/${conversation.id}/messages`, {
                body: input.trim(),
            });
            setMessages((prev) => {
                const alreadyExists = prev.some((m) => m.id === res.data.id);
                if (alreadyExists) return prev;
                return [...prev, res.data];
            });
            lastIdRef.current = res.data.id;
            setInput('');
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to send message.');
        } finally {
            setSending(false);
        }
    }

    const otherPerson = user?.role === 'student'
        ? conversation.instructor
        : conversation.student;

    return (
        <div className="flex flex-col h-full">

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-white flex-shrink-0">
                <div className="flex items-center gap-3">
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
                    <div>
                        <p className="text-sm font-semibold text-gray-800">{otherPerson?.name}</p>
                        <p className="text-xs text-gray-400">{conversation.course?.title}</p>
                    </div>
                </div>
                {onClose && (
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 text-lg leading-none"
                    >
                        ✕
                    </button>
                )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-gray-50">
                {loading ? (
                    <div className="pt-8"><Loader text="Loading messages..." /></div>
                ) : messages.length === 0 ? (
                    <div className="text-center pt-8">
                        <p className="text-sm text-gray-400">No messages yet.</p>
                        <p className="text-xs text-gray-300 mt-1">Start the conversation!</p>
                    </div>
                ) : (
                    messages.map((msg) => {
                        const isMe = msg.sender_id === user?.id;
                        return (
                            <div
                                key={msg.id}
                                className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                            >
                                {!isMe && (
                                    <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center bg-gray-100 border border-gray-200 shadow-sm mr-2 flex-shrink-0 mt-0.5">
                                        {msg.sender?.profile_picture_url ? (
                                            <img
                                                src={msg.sender.profile_picture_url}
                                                alt={msg.sender.name}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <svg className="w-full h-full text-gray-400 mt-1.5" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                                            </svg>
                                        )}
                                    </div>
                                )}
                                <div className={`max-w-xs lg:max-w-md ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                                    <div
                                        className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm ${isMe
                                                ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-br-sm'
                                                : 'bg-white text-gray-800 border border-gray-100 rounded-bl-sm'
                                            }`}
                                    >
                                        {msg.body}
                                    </div>
                                    <span className="text-xs text-gray-300 mt-1 px-1">
                                        {new Date(msg.created_at).toLocaleTimeString([], {
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        })}
                                    </span>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={bottomRef} />
            </div>

            {/* Input */}
            <form
                onSubmit={handleSend}
                className="flex items-center gap-2 px-4 py-3 border-t border-gray-100 bg-white flex-shrink-0"
            >
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 border border-gray-200 rounded-full px-4 py-2 text-sm focus:outline-none focus:border-blue-300"
                />
                <button
                    type="submit"
                    disabled={sending || !input.trim()}
                    className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                </button>
            </form>
        </div>
    );
}