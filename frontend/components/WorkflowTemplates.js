import { useState } from 'react';
import { BoltIcon, ChatBubbleLeftRightIcon, UserGroupIcon, ShoppingCartIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { Button } from './ui/Button';

// Static list of templates for now. In a real app, fetch from backend.
const TEMPLATES = [
    {
        id: 'welcome-sequence',
        name: 'Welcome Sequence',
        description: 'Send welcome message, wait 2 hours, send product info, verify reply.',
        icon: ChatBubbleLeftRightIcon,
        tags: ['Webhook', 'Wait', 'WhatsApp', 'If']
    },
    {
        id: 'lead-nurturing',
        name: 'Lead Nurturing',
        description: 'Score leads >= 50, send offer. Else send educational content.',
        icon: UserGroupIcon,
        tags: ['Trigger', 'Switch', 'WhatsApp', 'CRM Update']
    },
    {
        id: 'abandoned-cart',
        name: 'Abandoned Cart Recovery',
        description: 'Remind after 1h. Check purchase. Send discount if needed.',
        icon: ShoppingCartIcon,
        tags: ['Webhook', 'Wait', 'MySQL', 'WhatsApp']
    },
    {
        id: 'customer-feedback',
        name: 'Customer Feedback',
        description: 'Request feedback post-purchase. Alert support if rating < 3.',
        icon: ChatBubbleLeftRightIcon,
        tags: ['Trigger', 'Wait', 'WhatsApp', 'Filter']
    },
    {
        id: 're-engagement',
        name: 'Re-engagement Campaign',
        description: 'Win-back inactive users after 30 days with special discounts.',
        icon: BoltIcon,
        tags: ['Cron', 'MySQL', 'WhatsApp', 'Tag']
    }
];

export default function WorkflowTemplates({ onUseTemplate }) {
    return (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {TEMPLATES.map((template) => (
                <div key={template.id} className="bg-[#0E1117] border border-border/50 rounded-xl p-6 shadow-sm hover:border-primary/50 transition-all duration-300 flex flex-col h-full group">
                    <div className="flex items-start justify-between mb-4">
                        <div className="p-3 bg-primary/10 rounded-lg text-primary group-hover:bg-primary group-hover:text-black transition-colors">
                            <template.icon className="h-6 w-6" />
                        </div>
                    </div>

                    <h3 className="text-lg font-bold text-white mb-2">{template.name}</h3>
                    <p className="text-sm text-gray-400 mb-6 flex-grow leading-relaxed">
                        {template.description}
                    </p>

                    <div className="flex flex-wrap gap-2 mb-6">
                        {template.tags.map(tag => (
                            <span key={tag} className="inline-flex items-center px-2 py-1 rounded text-[10px] font-medium bg-white/5 text-gray-400 border border-white/10">
                                {tag}
                            </span>
                        ))}
                    </div>

                    <Button
                        onClick={() => onUseTemplate(template)}
                        variant="primary"
                        className="w-full shadow-glow-sm"
                    >
                        Use Template
                    </Button>
                </div>
            ))}
        </div>
    );
}
