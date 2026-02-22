import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import Layout from '../../../components/Layout';
import Button from '../../../components/ui/Button';
import axios from '../../../utils/api';
import { toast } from 'react-hot-toast';
import { ChatBubbleLeftIcon, PaperAirplaneIcon, UserCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';

export default function LiveChatInbox() {
    const [conversations, setConversations] = useState([]);
    const [loadingConvos, setLoadingConvos] = useState(true);
    const [activeChat, setActiveChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [loadingMessages, setLoadingMessages] = useState(false);

    // New message form
    const [messageText, setMessageText] = useState('');
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef(null);

    // Initial Load & Polling for Conversations
    useEffect(() => {
        fetchConversations();
        const interval = setInterval(fetchConversations, 10000); // Poll every 10s
        return () => clearInterval(interval);
    }, []);

    // Polling active chat messages
    useEffect(() => {
        let interval;
        if (activeChat) {
            fetchMessages(activeChat._id);
            interval = setInterval(() => fetchMessages(activeChat._id, true), 5000); // Poll active chat every 5s
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [activeChat]);

    // Scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const fetchConversations = async () => {
        try {
            const res = await axios.get('/api/wa-marketing/conversations');
            // Support both array response and {data: array} response
            const convoList = res.data?.data || [];
            // Sort by latest timestamp
            const sorted = (Array.isArray(convoList) ? convoList : convoList.data || []).sort((a, b) => new Date(b.last_timestamp) - new Date(a.last_timestamp));
            setConversations(sorted);
        } catch (error) {
            console.error('Failed to fetch conversations:', error);
        } finally {
            setLoadingConvos(false);
        }
    };

    const fetchMessages = async (number, silent = false) => {
        if (!silent) setLoadingMessages(true);
        try {
            const res = await axios.get(`/api/wa-marketing/conversations/${number}/messages`);
            const msgs = res.data?.data || [];
            // WFB typically returns array directly. Sort ascending.
            setMessages((Array.isArray(msgs) ? msgs : msgs.data || []).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)));
        } catch (error) {
            console.error('Failed to fetch messages:', error);
            if (!silent) toast.error('Failed to load chat history');
        } finally {
            if (!silent) setLoadingMessages(false);
        }
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if (!messageText.trim() || !activeChat) return;

        const val = messageText;
        setMessageText(''); // Optimistic clear
        setSending(true);

        try {
            // Optimistic update
            const tempMsg = {
                _id: Date.now().toString(),
                number: activeChat._id,
                body: val,
                direction: 'outgoing',
                type: 'text',
                timestamp: new Date().toISOString()
            };
            setMessages(prev => [...prev, tempMsg]);

            await axios.post('/api/wa-marketing/conversations/send', {
                to: activeChat._id,
                message: val,
                phone_number_id: activeChat.phone_number_id
            });

            // Refresh in background
            fetchMessages(activeChat._id, true);
        } catch (error) {
            console.error('Send failed:', error);
            toast.error(error.response?.data?.message || 'Failed to send message');
            setMessageText(val); // Restore on error
        } finally {
            setSending(false);
        }
    };

    // Format utility
    const formatTime = (ts) => {
        if (!ts) return '';
        const date = new Date(ts);
        const isToday = date.toDateString() === new Date().toDateString();
        return isToday
            ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    };

    return (
        <Layout>
            <Head>
                <title>Live Chat Inbox | WA Marketing</title>
            </Head>

            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <ChatBubbleLeftIcon className="w-8 h-8 text-primary-600" />
                    Shared Inbox
                </h1>
                <p className="mt-2 text-sm text-gray-700">
                    Interact directly with your audience via the WhatsApp live chat inbox.
                </p>
            </div>

            <div className="bg-white border border-gray-200 shadow rounded-lg overflow-hidden flex" style={{ height: 'calc(100vh - 220px)' }}>
                {/* Conversations Sidebar */}
                <div className="w-1/3 border-r border-gray-200 flex flex-col bg-gray-50 flex-shrink-0">
                    <div className="p-4 border-b border-gray-200 bg-white">
                        <h2 className="text-lg font-medium text-gray-900">Active Chats</h2>
                    </div>

                    <div className="overflow-y-auto flex-1">
                        {loadingConvos && conversations.length === 0 ? (
                            <div className="p-8 text-center text-gray-500 text-sm">Loading chats...</div>
                        ) : conversations.length === 0 ? (
                            <div className="p-8 text-center text-gray-500 text-sm flex flex-col items-center">
                                <ChatBubbleLeftIcon className="w-8 h-8 mb-2 text-gray-400" />
                                No active conversations
                            </div>
                        ) : (
                            <ul className="divide-y divide-gray-200">
                                {conversations.map((convo) => (
                                    <li
                                        key={convo._id}
                                        onClick={() => setActiveChat(convo)}
                                        className={`p-4 cursor-pointer transition-colors ${activeChat?._id === convo._id ? 'bg-primary-50 border-l-4 border-primary-500' : 'hover:bg-gray-100 border-l-4 border-transparent'}`}
                                    >
                                        <div className="flex justify-between items-start">
                                            <div className="flex gap-3">
                                                <UserCircleIcon className={`w-10 h-10 ${activeChat?._id === convo._id ? 'text-primary-400' : 'text-gray-400'}`} />
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900 truncate w-40">
                                                        {convo.name || convo._id}
                                                    </p>
                                                    <p className="text-xs text-gray-500 truncate w-40 mt-0.5">
                                                        {convo.last_message || 'Media/Template message'}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end gap-1">
                                                <span className="text-[10px] text-gray-500">{formatTime(convo.last_timestamp)}</span>
                                                {convo.unread_count > 0 && (
                                                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary-600 text-white text-[10px] font-bold leading-none">
                                                        {convo.unread_count}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>

                {/* Main Chat Area */}
                <div className="w-2/3 flex flex-col bg-slate-50 relative">
                    {activeChat ? (
                        <>
                            {/* Chat Header */}
                            <div className="px-6 py-4 border-b border-gray-200 bg-white shadow-sm flex items-center justify-between z-10">
                                <div className="flex items-center gap-3">
                                    <UserCircleIcon className="w-10 h-10 text-gray-400" />
                                    <div>
                                        <h2 className="text-lg font-medium text-gray-900">{activeChat.name || activeChat._id}</h2>
                                        <p className="text-xs text-gray-500">Phone: {activeChat._id}</p>
                                    </div>
                                </div>
                                <button className="text-gray-400 hover:text-gray-600" onClick={() => setActiveChat(null)}>
                                    <XMarkIcon className="w-6 h-6" />
                                </button>
                            </div>

                            {/* Messages Scroll Area */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-4">
                                {loadingMessages && messages.length === 0 ? (
                                    <div className="text-center text-gray-500 text-sm mt-10">Loading history...</div>
                                ) : messages.length === 0 ? (
                                    <div className="text-center text-gray-500 text-sm mt-10">No messages in this chat. Start typing below!</div>
                                ) : (
                                    messages.map((msg, idx) => {
                                        const isOut = msg.direction === 'outgoing';
                                        return (
                                            <div key={msg._id || idx} className={`flex ${isOut ? 'justify-end' : 'justify-start'}`}>
                                                <div className={`max-w-[70%] rounded-lg px-4 py-2 shadow-sm ${isOut ? 'bg-primary-600 text-white rounded-br-none' : 'bg-white text-gray-900 border border-gray-200 rounded-bl-none'}`}>
                                                    <p className="text-sm whitespace-pre-wrap">{msg.body}</p>
                                                    <div className={`text-[10px] text-right mt-1 ${isOut ? 'text-primary-100' : 'text-gray-400'}`}>
                                                        {formatTime(msg.timestamp)}
                                                        {msg.type === 'template' && ' • template'}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Reply Box */}
                            <div className="p-4 bg-white border-t border-gray-200">
                                <form onSubmit={handleSend} className="flex gap-4">
                                    <input
                                        type="text"
                                        placeholder="Type a message..."
                                        className="flex-1 block w-full rounded-full border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-4 py-3"
                                        value={messageText}
                                        onChange={(e) => setMessageText(e.target.value)}
                                        disabled={sending}
                                    />
                                    <Button
                                        type="submit"
                                        className="rounded-full !p-3 shadow-md border-0 bg-primary-600 hover:bg-primary-700 focus:ring-primary-500 h-12 w-12 flex items-center justify-center transition-transform hover:scale-105"
                                        disabled={!messageText.trim() || sending}
                                    >
                                        <PaperAirplaneIcon className="w-5 h-5 text-white transform -rotate-45" />
                                    </Button>
                                </form>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
                            <ChatBubbleLeftIcon className="w-16 h-16 text-gray-300 mb-4" />
                            <h3 className="text-xl font-medium text-gray-900">Live Chat Inbox</h3>
                            <p className="mt-2 text-sm">Select a conversation from the sidebar to start messaging.</p>
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
}
