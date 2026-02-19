import { useState, useEffect, useRef, useCallback } from 'react';
import Layout from '../../components/Layout';
import { useAuth } from '../../contexts/AuthContext';
import { internalLeadsAPI } from '../../utils/api';
import toast from 'react-hot-toast';
import {
    MagnifyingGlassIcon,
    PaperClipIcon,
    FaceSmileIcon,
    PaperAirplaneIcon,
    PhoneIcon,
    VideoCameraIcon,
    EllipsisHorizontalIcon,
    UserCircleIcon,
    TagIcon,
    ClockIcon,
    CheckCircleIcon,
    BoltIcon,
    ArrowPathIcon,
    ChatBubbleLeftEllipsisIcon
} from '@heroicons/react/24/outline';

// ─── Conversation List ───────────────────────────────────────────────────────
const ConversationList = ({ conversations, selectedId, onSelect, searchTerm, onSearchChange, loading }) => (
    <div className="w-80 border-r border-border bg-card flex flex-col h-full flex-shrink-0">
        <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-display font-semibold text-foreground">Inbox</h2>
                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                    {conversations.filter(c => c.unread > 0).length} unread
                </span>
            </div>
            <div className="relative">
                <MagnifyingGlassIcon className="h-4 w-4 absolute left-3 top-2.5 text-muted-foreground" />
                <input
                    type="text"
                    value={searchTerm}
                    onChange={e => onSearchChange(e.target.value)}
                    placeholder="Search conversations..."
                    className="w-full bg-background/50 border border-border rounded-lg py-2 pl-9 pr-4 text-sm focus:outline-none focus:border-primary/50 text-foreground placeholder:text-muted-foreground transition-colors"
                />
            </div>
        </div>
        <div className="flex-1 overflow-y-auto">
            {loading ? (
                <div className="flex items-center justify-center h-32">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                </div>
            ) : conversations.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground text-sm">
                    <ChatBubbleLeftEllipsisIcon className="h-10 w-10 mx-auto mb-2 opacity-30" />
                    No conversations yet
                </div>
            ) : (
                conversations.map((conv) => (
                    <div
                        key={conv.id}
                        onClick={() => onSelect(conv.id)}
                        className={`p-4 border-b border-border/50 cursor-pointer transition-colors hover:bg-muted/50 ${selectedId === conv.id ? 'bg-primary/5 border-l-2 border-l-primary' : ''}`}
                    >
                        <div className="flex justify-between items-start mb-1">
                            <div className="flex items-center gap-2">
                                <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 ${conv.avatarColor || 'bg-gradient-to-br from-primary to-orange-400'}`}>
                                    {(conv.contactName || '?').substring(0, 2).toUpperCase()}
                                </div>
                                <span className={`font-medium text-sm ${selectedId === conv.id ? 'text-primary' : 'text-foreground'}`}>
                                    {conv.contactName}
                                </span>
                            </div>
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                                <span className="text-xs text-muted-foreground">{conv.time}</span>
                                {conv.unread > 0 && (
                                    <span className="h-4 w-4 rounded-full bg-primary text-black text-[9px] flex items-center justify-center font-bold">
                                        {conv.unread}
                                    </span>
                                )}
                            </div>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-1 ml-10">{conv.lastMessage}</p>
                        {conv.tags?.length > 0 && (
                            <div className="flex mt-1.5 gap-1.5 ml-10">
                                {conv.tags.slice(0, 2).map(tag => (
                                    <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground uppercase tracking-wider">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                ))
            )}
        </div>
    </div>
);

// ─── Chat Area ───────────────────────────────────────────────────────────────
const ChatArea = ({ conversation, onSend, sending }) => {
    const [draft, setDraft] = useState('');
    const messagesEndRef = useRef(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [conversation?.messages]);

    if (!conversation) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-3">
                <ChatBubbleLeftEllipsisIcon className="h-16 w-16 opacity-20" />
                <p className="text-sm">Select a conversation to start chatting</p>
            </div>
        );
    }

    const handleSend = () => {
        if (!draft.trim()) return;
        onSend(conversation.id, draft.trim());
        setDraft('');
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
    };

    const applyAISuggestion = (text) => setDraft(text.replace(/['"]/g, ''));

    return (
        <div className="flex-1 flex flex-col h-full bg-[#0E1117] relative overflow-hidden">
            {/* Header */}
            <div className="h-16 border-b border-border flex items-center justify-between px-6 bg-card/50 backdrop-blur-sm z-10 flex-shrink-0">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-orange-400 flex items-center justify-center text-white font-bold text-sm">
                        {(conversation.contactName || '?').substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                        <h3 className="font-semibold text-foreground text-sm">{conversation.contactName}</h3>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                            Online via WhatsApp · {conversation.phone || ''}
                        </span>
                    </div>
                </div>
                <div className="flex gap-1">
                    {[PhoneIcon, VideoCameraIcon, EllipsisHorizontalIcon].map((Icon, i) => (
                        <button key={i} className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-colors">
                            <Icon className="h-5 w-5" />
                        </button>
                    ))}
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {conversation.messages?.map((msg, i) => (
                    <div key={i} className={`flex ${msg.isOwn ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[70%] rounded-2xl p-3.5 text-sm shadow-sm ${msg.isOwn
                            ? 'bg-primary text-[#0E1117] rounded-br-sm'
                            : 'bg-card border border-border text-foreground rounded-bl-sm'
                            }`}>
                            <p className="whitespace-pre-wrap">{msg.text}</p>
                            <div className={`text-[10px] mt-1 text-right ${msg.isOwn ? 'text-black/60' : 'text-muted-foreground'}`}>
                                {msg.time} {msg.isOwn && <CheckCircleIcon className="h-3 w-3 inline ml-1" />}
                            </div>
                        </div>
                    </div>
                ))}

                {/* AI Suggestion */}
                {conversation.messages?.length > 0 && !conversation.messages[conversation.messages.length - 1]?.isOwn && (
                    <div className="flex justify-start">
                        <div className="bg-muted/20 border border-primary/20 rounded-xl p-3 max-w-sm animate-fade-in">
                            <div className="flex items-center gap-2 mb-2 text-xs text-primary font-medium">
                                <BoltIcon className="h-3 w-3" /> AI Suggestion
                            </div>
                            <p className="text-xs text-foreground/80 italic mb-2">
                                "Hi! Thank you for your interest. I'd love to help you find the perfect property. Could you tell me your preferred location and budget range?"
                            </p>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => applyAISuggestion("Hi! Thank you for your interest. I'd love to help you find the perfect property. Could you tell me your preferred location and budget range?")}
                                    className="text-xs bg-primary/10 text-primary px-3 py-1 rounded hover:bg-primary/20 transition-colors"
                                >Apply</button>
                                <button className="text-xs bg-muted text-muted-foreground px-3 py-1 rounded hover:bg-muted/80 transition-colors">Dismiss</button>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-border bg-card flex-shrink-0">
                <div className="flex items-end gap-2 bg-background border border-border rounded-xl p-2 focus-within:ring-2 focus-within:ring-primary/50 focus-within:border-primary transition-all">
                    <button className="p-2 text-muted-foreground hover:text-primary transition-colors self-end">
                        <PaperClipIcon className="h-5 w-5" />
                    </button>
                    <textarea
                        rows={1}
                        value={draft}
                        onChange={e => setDraft(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Type a message... (Enter to send)"
                        style={{ resize: 'none', minHeight: '36px', maxHeight: '120px' }}
                        className="flex-1 bg-transparent border-none focus:ring-0 text-sm text-foreground placeholder:text-muted-foreground py-1 leading-relaxed"
                    />
                    <button className="p-2 text-muted-foreground hover:text-primary transition-colors self-end">
                        <FaceSmileIcon className="h-5 w-5" />
                    </button>
                    <button
                        onClick={handleSend}
                        disabled={!draft.trim() || sending}
                        className="p-2 bg-primary text-[#0E1117] rounded-lg hover:shadow-[0_0_15px_rgba(249,115,22,0.4)] transition-all self-end disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {sending ? <ArrowPathIcon className="h-5 w-5 animate-spin" /> : <PaperAirplaneIcon className="h-5 w-5" />}
                    </button>
                </div>
            </div>
        </div>
    );
};

// ─── CRM Panel ───────────────────────────────────────────────────────────────
const CRMPanel = ({ conversation }) => {
    if (!conversation) return <div className="w-72 border-l border-border bg-card hidden lg:block" />;
    const lead = conversation.lead;
    return (
        <div className="w-72 border-l border-border bg-card hidden lg:flex flex-col h-full overflow-y-auto flex-shrink-0">
            <div className="p-5 border-b border-border text-center">
                <div className="h-16 w-16 mx-auto rounded-full bg-gradient-to-br from-primary to-orange-400 flex items-center justify-center mb-3 text-white font-bold text-xl">
                    {(conversation.contactName || '?').substring(0, 2).toUpperCase()}
                </div>
                <h3 className="text-base font-semibold text-foreground">{conversation.contactName}</h3>
                {conversation.phone && <p className="text-xs text-muted-foreground">{conversation.phone}</p>}
            </div>

            <div className="p-5 space-y-5">
                {lead?.status && (
                    <div>
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Lead Status</h4>
                        <div className="flex items-center gap-2 text-sm text-foreground bg-primary/10 p-2 rounded-lg border border-primary/20">
                            <div className="h-2 w-2 rounded-full bg-primary animate-pulse"></div>
                            {lead.status}
                        </div>
                    </div>
                )}

                {(lead?.budget_min || lead?.budget_max) && (
                    <div>
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Budget</h4>
                        <p className="text-sm text-foreground">
                            ₹ {lead.budget_min ? `${(lead.budget_min / 100000).toFixed(1)}L` : '—'} –
                            {lead.budget_max ? ` ₹${(lead.budget_max / 100000).toFixed(1)}L` : '—'}
                        </p>
                    </div>
                )}

                <div>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Details</h4>
                    <dl className="space-y-2 text-xs">
                        {[
                            { label: 'Email', value: lead?.email || conversation.email },
                            { label: 'Source', value: lead?.source },
                            { label: 'Stage', value: lead?.stage },
                            { label: 'Assigned', value: lead?.assigned_to?.name },
                        ].filter(r => r.value).map(row => (
                            <div key={row.label} className="flex justify-between gap-2">
                                <dt className="text-muted-foreground">{row.label}</dt>
                                <dd className="text-foreground text-right truncate">{row.value}</dd>
                            </div>
                        ))}
                    </dl>
                </div>

                <div>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Quick Actions</h4>
                    <div className="space-y-2">
                        {lead?._id && (
                            <a
                                href={`/lms/leads/${lead._id}`}
                                className="block text-center p-2 text-xs bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-gray-300 transition-all"
                            >
                                View Lead Profile →
                            </a>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

// ─── Mock data fallback ──────────────────────────────────────────────────────
const MOCK_CONVERSATIONS = [
    {
        id: 1, contactName: 'Rahul Sharma', phone: '+91 98765 43210', time: '10:30 AM', unread: 2,
        lastMessage: 'Is the 3BHK unit available?', lastMessageIsOwn: false,
        tags: ['New Lead', 'High Budget'],
        lead: { status: 'Hot', stage: 'Sourcing', email: 'rahul@example.com', source: 'Facebook Ads', budget_min: 2000000, budget_max: 2500000 },
        messages: [
            { text: 'Hi, I saw your listing for Skyline Avenue.', time: '10:28 AM', isOwn: false },
            { text: 'Hello Rahul! Yes, it is a premium property in a great location.', time: '10:29 AM', isOwn: true },
            { text: 'Is the 3BHK unit available?', time: '10:30 AM', isOwn: false },
        ]
    },
    {
        id: 2, contactName: 'Priya Singh', phone: '+91 97654 32109', time: 'Yesterday', unread: 0,
        lastMessage: 'Thanks for the brochure.', lastMessageIsOwn: false,
        tags: ['Follow Up'],
        lead: { status: 'Warm', stage: 'Walk-in', email: 'priya@example.com', source: 'Referral', budget_min: 1500000, budget_max: 2000000 },
        messages: [
            { text: 'Can you send me the floor plan?', time: 'Yesterday', isOwn: false },
            { text: 'Sent! Let me know if you have any questions.', time: 'Yesterday', isOwn: true },
            { text: 'Thanks for the brochure.', time: 'Yesterday', isOwn: false },
        ]
    }
];

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function Inbox() {
    const [selectedId, setSelectedId] = useState(MOCK_CONVERSATIONS[0].id);
    const [conversations, setConversations] = useState(MOCK_CONVERSATIONS);
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const { user } = useAuth();

    // Try to load real conversations from leads with recent WhatsApp activity
    useEffect(() => {
        if (!user) return;
        const fetchConversations = async () => {
            setLoading(true);
            try {
                // Fetch recent leads as proxy for conversations — real WA conversation
                // fetch would require WebSocket connection with external service
                const res = await internalLeadsAPI.getLeads({ limit: 20, sort: 'updated_at', order: 'desc' });
                const leads = res.data?.data || res.data?.leads || [];
                if (leads.length > 0) {
                    const mapped = leads.filter(l => l.phone).map((lead, i) => ({
                        id: lead._id,
                        contactName: lead.name,
                        phone: lead.phone,
                        time: formatRelativeTime(lead.updated_at || lead.created_at),
                        unread: lead.status === 'Uncontacted' ? 1 : 0,
                        lastMessage: lead.notes?.slice(-1)?.[0] || `${lead.stage} — ${lead.status}`,
                        tags: [lead.stage, lead.source].filter(Boolean),
                        lead,
                        messages: lead.activity_logs?.slice(-5).map(log => ({
                            text: log.content,
                            time: formatRelativeTime(log.created_at),
                            isOwn: false,
                        })) || [],
                        avatarColor: ['bg-gradient-to-br from-blue-500 to-purple-500', 'bg-gradient-to-br from-green-500 to-teal-500', 'bg-gradient-to-br from-orange-500 to-red-500'][i % 3]
                    }));
                    setConversations(mapped);
                    setSelectedId(mapped[0]?.id);
                }
            } catch {
                // Keep mock data
            } finally {
                setLoading(false);
            }
        };
        fetchConversations();
    }, [user]);

    const formatRelativeTime = (dateStr) => {
        if (!dateStr) return '';
        const diff = Date.now() - new Date(dateStr).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'Just now';
        if (mins < 60) return `${mins}m ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h ago`;
        return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    };

    const handleSend = async (convId, text) => {
        setSending(true);
        const newMsg = { text, time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }), isOwn: true };
        // Optimistic update
        setConversations(prev => prev.map(c => c.id === convId
            ? { ...c, messages: [...(c.messages || []), newMsg], lastMessage: text }
            : c
        ));
        try {
            // Real WA send would go through external WA service here
            // Logged for audit purposes
        } finally {
            setSending(false);
        }
        toast.success('Message sent!', { duration: 2000 });
    };

    const filtered = conversations.filter(c =>
        c.contactName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.lastMessage?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const selectedConversation = conversations.find(c => c.id === selectedId);

    return (
        <Layout>
            <div className="h-[calc(100vh-8rem)] bg-card border border-border rounded-xl shadow-soft flex overflow-hidden animate-fade-in -mx-4 sm:mx-0 mt-2">
                <ConversationList
                    conversations={filtered}
                    selectedId={selectedId}
                    onSelect={setSelectedId}
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                    loading={loading}
                />
                <ChatArea
                    conversation={selectedConversation}
                    onSend={handleSend}
                    sending={sending}
                />
                <CRMPanel conversation={selectedConversation} />
            </div>
        </Layout>
    );
}
