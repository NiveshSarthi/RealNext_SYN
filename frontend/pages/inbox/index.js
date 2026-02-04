import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
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
    CheckCircleIcon
} from '@heroicons/react/24/outline';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

const ConversationList = ({ conversations, selectedId, onSelect }) => (
    <div className="w-80 border-r border-border bg-card flex flex-col h-full">
        <div className="p-4 border-b border-border">
            <h2 className="text-lg font-display font-semibold mb-3 text-foreground">Inbox</h2>
            <div className="relative">
                <MagnifyingGlassIcon className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
                <input
                    type="text"
                    placeholder="Search conversations..."
                    className="w-full bg-background/50 border border-border rounded-lg py-2 pl-9 pr-4 text-sm focus:outline-none focus:border-primary/50 text-foreground placeholder:text-muted-foreground transition-colors"
                />
            </div>
        </div>
        <div className="flex-1 overflow-y-auto">
            {conversations.map((conv) => (
                <div
                    key={conv.id}
                    onClick={() => onSelect(conv.id)}
                    className={`p-4 border-b border-border/50 cursor-pointer transition-colors hover:bg-muted/50 ${selectedId === conv.id ? 'bg-primary/5 border-l-2 border-l-primary' : ''}`}
                >
                    <div className="flex justify-between items-start mb-1">
                        <span className={`font-medium text-sm ${selectedId === conv.id ? 'text-primary' : 'text-foreground'}`}>
                            {conv.contactName}
                        </span>
                        <span className="text-xs text-muted-foreground">{conv.time}</span>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-1">{conv.lastMessage}</p>
                    <div className="flex mt-2 gap-2">
                        {conv.tags.map(tag => (
                            <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground uppercase tracking-wider">
                                {tag}
                            </span>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    </div>
);

const ChatArea = ({ conversation }) => {
    if (!conversation) return <div className="flex-1 flex items-center justify-center text-muted-foreground">Select a conversation</div>;

    return (
        <div className="flex-1 flex flex-col h-full bg-[#0E1117] relative">
            <div className="h-16 border-b border-border flex items-center justify-between px-6 bg-card/50 backdrop-blur-sm z-10">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-orange-400 flex items-center justify-center text-white font-bold text-sm">
                        {conversation.contactName.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                        <h3 className="font-semibold text-foreground">{conversation.contactName}</h3>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> Online via WhatsApp
                        </span>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-colors">
                        <PhoneIcon className="h-5 w-5" />
                    </button>
                    <button className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-colors">
                        <VideoCameraIcon className="h-5 w-5" />
                    </button>
                    <button className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-colors">
                        <EllipsisHorizontalIcon className="h-5 w-5" />
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {conversation.messages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.isOwn ? 'justify-end' : 'justify-start'}`}>
                        <div className={`
              max-w-[70%] rounded-2xl p-4 text-sm shadow-sm
              ${msg.isOwn
                                ? 'bg-primary text-[#0E1117] rounded-br-sm'
                                : 'bg-card border border-border text-foreground rounded-bl-sm'}
            `}>
                            <p>{msg.text}</p>
                            <div className={`text-[10px] mt-1 text-right ${msg.isOwn ? 'text-black/60' : 'text-muted-foreground'}`}>
                                {msg.time}
                            </div>
                        </div>
                    </div>
                ))}
                {/* AI Quick Suggestion */}
                {!conversation.lastMessageIsOwn && (
                    <div className="flex justify-start">
                        <div className="bg-muted/20 border border-primary/20 rounded-lg p-3 max-w-md animate-fade-in">
                            <div className="flex items-center gap-2 mb-2 text-xs text-primary font-medium">
                                <BoltIcon className="h-3 w-3" /> AI Suggestion
                            </div>
                            <p className="text-sm text-foreground/80 italic">"Hello! Yes, we have 3BHK units available in Tower A. Would you like to schedule a site visit for this weekend?"</p>
                            <div className="mt-2 flex gap-2">
                                <button className="text-xs bg-primary/10 text-primary px-3 py-1 rounded hover:bg-primary/20 transition-colors">Apply</button>
                                <button className="text-xs bg-muted text-muted-foreground px-3 py-1 rounded hover:bg-muted/80 transition-colors">Dismiss</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="p-4 border-t border-border bg-card">
                <div className="flex items-center gap-2 bg-background border border-border rounded-xl p-2 focus-within:ring-2 focus-within:ring-primary/50 focus-within:border-primary transition-all shadow-inner">
                    <button className="p-2 text-muted-foreground hover:text-primary transition-colors">
                        <PaperClipIcon className="h-5 w-5" />
                    </button>
                    <input
                        type="text"
                        placeholder="Type a message..."
                        className="flex-1 bg-transparent border-none focus:ring-0 text-sm text-foreground placeholder:text-muted-foreground"
                    />
                    <button className="p-2 text-muted-foreground hover:text-primary transition-colors">
                        <FaceSmileIcon className="h-5 w-5" />
                    </button>
                    <button className="p-2 bg-primary text-[#0E1117] rounded-lg hover:shadow-[0_0_15px_rgba(249,115,22,0.4)] transition-all">
                        <PaperAirplaneIcon className="h-5 w-5" />
                    </button>
                </div>
            </div>
        </div>
    );
};

const CRMPanel = ({ conversation }) => {
    if (!conversation) return <div className="w-80 border-l border-border bg-card hidden lg:block" />;

    return (
        <div className="w-80 border-l border-border bg-card hidden lg:flex flex-col h-full overflow-y-auto">
            <div className="p-6 border-b border-border text-center">
                <div className="h-20 w-20 mx-auto rounded-full bg-muted flex items-center justify-center mb-3 border-2 border-border">
                    <UserCircleIcon className="h-12 w-12 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">{conversation.contactName}</h3>
                <p className="text-sm text-muted-foreground">Lead ID: #L-4921</p>
                <div className="flex justify-center mt-4 gap-2">
                    <Button size="sm" variant="outline">Profile</Button>
                    <Button size="sm" variant="secondary">Note</Button>
                </div>
            </div>

            <div className="p-6 space-y-6">
                <div>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Lead Status</h4>
                    <div className="flex items-center gap-2 text-sm text-foreground bg-primary/10 p-2 rounded-lg border border-primary/20">
                        <div className="h-2 w-2 rounded-full bg-primary animate-pulse"></div>
                        Hot Interest
                    </div>
                </div>

                <div>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Properties</h4>
                    <div className="space-y-2">
                        <div className="p-3 bg-background rounded-lg border border-border hover:border-primary/50 transition-colors">
                            <div className="font-medium text-sm">Skyline Avenue, 3BHK</div>
                            <div className="text-xs text-muted-foreground mt-1">₹ 2.4 Cr • Viewed 2h ago</div>
                        </div>
                    </div>
                </div>

                <div>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Details</h4>
                    <dl className="space-y-3 text-sm">
                        <div className="flex justify-between">
                            <dt className="text-muted-foreground">Email</dt>
                            <dd className="text-foreground text-right truncate pl-4">rahul.user@email.com</dd>
                        </div>
                        <div className="flex justify-between">
                            <dt className="text-muted-foreground">Phone</dt>
                            <dd className="text-foreground text-right">+91 98765 43210</dd>
                        </div>
                        <div className="flex justify-between">
                            <dt className="text-muted-foreground">Budget</dt>
                            <dd className="text-foreground text-right">₹ 2 - 2.5 Cr</dd>
                        </div>
                    </dl>
                </div>

                <div>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Next Action</h4>
                    <div className="flex items-start gap-3 p-3 bg-background rounded-lg border border-border">
                        <ClockIcon className="h-5 w-5 text-secondary mt-0.5" />
                        <div>
                            <p className="text-sm font-medium text-foreground">Site Visit Follow-up</p>
                            <p className="text-xs text-muted-foreground">Tomorrow, 11:00 AM</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default function Inbox() {
    const [selectedId, setSelectedId] = useState(1);

    // Mock Data
    const conversations = [
        {
            id: 1,
            contactName: 'Rahul Sharma',
            time: '10:30 AM',
            lastMessage: 'Is the 3BHK unit available?',
            lastMessageIsOwn: false,
            tags: ['New Lead', 'High Budget'],
            messages: [
                { text: 'Hi, I saw your listing for Skyline Avenue.', time: '10:28 AM', isOwn: false },
                { text: 'Hello Rahul! Yes, it is a premium property.', time: '10:29 AM', isOwn: true },
                { text: 'Is the 3BHK unit available?', time: '10:30 AM', isOwn: false },
            ]
        },
        {
            id: 2,
            contactName: 'Priya Singh',
            time: 'Yesterday',
            lastMessage: 'Thanks for the brochure.',
            lastMessageIsOwn: false,
            tags: ['Follow Up'],
            messages: [
                { text: 'Can you send me the floor plan?', time: 'Yesterday', isOwn: false },
                { text: 'Sent! Let me know if you have questions.', time: 'Yesterday', isOwn: true },
                { text: 'Thanks for the brochure.', time: 'Yesterday', isOwn: false },
            ]
        }
    ];

    const selectedConversation = conversations.find(c => c.id === selectedId);

    return (
        <Layout>
            <div className="h-[calc(100vh-8rem)] bg-card border border-border rounded-xl shadow-soft flex overflow-hidden animate-fade-in relative -mx-4 sm:mx-0 mt-2">
                <ConversationList
                    conversations={conversations}
                    selectedId={selectedId}
                    onSelect={setSelectedId}
                />
                <ChatArea conversation={selectedConversation} />
                <CRMPanel conversation={selectedConversation} />
            </div>
        </Layout>
    );
}
