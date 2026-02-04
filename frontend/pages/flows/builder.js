import { useState } from 'react';
import Layout from '../../components/Layout';
import {
    PlusIcon,
    PlayIcon,
    ChatBubbleBottomCenterTextIcon,
    ClockIcon,
    ArrowPathIcon,
    CheckCircleIcon,
    XCircleIcon,
    EllipsisVerticalIcon
} from '@heroicons/react/24/outline';

const Node = ({ type, title, subtitle, x, y, icon: Icon, status = 'idle' }) => {
    const getStatusColor = (s) => {
        switch (s) {
            case 'active': return 'ring-2 ring-primary border-primary';
            case 'completed': return 'border-green-500';
            case 'error': return 'border-red-500';
            default: return 'border-border hover:border-primary/50';
        }
    };

    const getIconBg = (t) => {
        switch (t) {
            case 'trigger': return 'bg-primary/20 text-primary';
            case 'action': return 'bg-blue-500/20 text-blue-500';
            case 'condition': return 'bg-orange-500/20 text-orange-500';
            default: return 'bg-executed/20 text-muted-foreground';
        }
    };

    return (
        <div
            className={`absolute w-64 bg-card rounded-xl border p-4 shadow-lg transition-all duration-300 z-10 ${getStatusColor(status)}`}
            style={{ left: x, top: y }}
        >
            <div className="flex justify-between items-start mb-2">
                <div className={`p-2 rounded-lg ${getIconBg(type)}`}>
                    <Icon className="h-5 w-5" />
                </div>
                <button className="text-muted-foreground hover:text-foreground">
                    <EllipsisVerticalIcon className="h-5 w-5" />
                </button>
            </div>
            <h4 className="text-sm font-semibold text-foreground">{title}</h4>
            <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>

            {/* Connector Points */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-card border border-border flex items-center justify-center hover:scale-110 transition-transform cursor-pointer">
                <div className="w-2 h-2 rounded-full bg-muted-foreground"></div>
            </div>
            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-card border border-border flex items-center justify-center hover:scale-110 transition-transform cursor-pointer">
                <div className="w-2 h-2 rounded-full bg-primary"></div>
            </div>
        </div>
    );
};

const Connection = ({ start, end }) => {
    // Simple bezier curve calculation
    const controlPointY = start.y + (end.y - start.y) / 2;
    const path = `M ${start.x + 128} ${start.y + 120} C ${start.x + 128} ${controlPointY + 120}, ${end.x + 128} ${controlPointY}, ${end.x + 128} ${end.y}`;

    return (
        <svg className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-visible z-0">
            <path
                d={path}
                fill="none"
                stroke="hsl(var(--border))"
                strokeWidth="2"
                className="opacity-50"
            />
            <circle cx={end.x + 128} cy={end.y} r="3" fill="hsl(var(--border))" />
        </svg>
    );
};

export default function AutomationBuilder() {
    const [nodes, setNodes] = useState([
        { id: 1, type: 'trigger', title: 'Incoming Message', subtitle: 'Keywords: "Price", "Cost"', x: 400, y: 50, icon: ChatBubbleBottomCenterTextIcon, status: 'completed' },
        { id: 2, type: 'condition', title: 'Check Business Hours', subtitle: 'If time is 9AM - 6PM', x: 400, y: 200, icon: ClockIcon, status: 'completed' },
        { id: 3, type: 'action', title: 'Send Catalogue', subtitle: 'Brochure PDF + Price List', x: 200, y: 350, icon: ArrowPathIcon, status: 'active' },
        { id: 4, type: 'action', title: 'Auto-reply OOO', subtitle: 'Message: "We will call back"', x: 600, y: 350, icon: ChatBubbleBottomCenterTextIcon, status: 'idle' },
    ]);

    return (
        <Layout>
            <div className="h-[calc(100vh-8rem)] flex flex-col animate-fade-in -mx-4 sm:mx-0 mt-2">
                {/* Toolbar */}
                <div className="h-16 bg-card border border-border rounded-t-xl flex items-center justify-between px-6 shadow-sm z-20">
                    <div className="flex items-center gap-4">
                        <h1 className="text-lg font-display font-semibold text-foreground">Lead Nurture Flow #1</h1>
                        <span className="px-2 py-0.5 rounded-full bg-green-500/10 text-green-500 text-xs font-medium border border-green-500/20">Active</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <button className="btn btn-secondary text-xs">
                            <PlayIcon className="h-4 w-4 mr-2" /> Test Run
                        </button>
                        <button className="btn btn-primary text-xs">
                            Save Flow
                        </button>
                    </div>
                </div>

                {/* Builder Canvas */}
                <div className="flex-1 bg-[#0E1117] relative overflow-hidden rounded-b-xl border-x border-b border-border shadow-inner">
                    {/* Grid Background */}
                    <div
                        className="absolute inset-0 opacity-[0.03]"
                        style={{
                            backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)',
                            backgroundSize: '20px 20px'
                        }}
                    ></div>

                    {/* Connections (Visual Mockup for positions) */}
                    <Connection start={nodes[0]} end={nodes[1]} />
                    <Connection start={nodes[1]} end={nodes[2]} />
                    <Connection start={nodes[1]} end={nodes[3]} />

                    {/* Nodes */}
                    {nodes.map(node => (
                        <Node key={node.id} {...node} />
                    ))}

                    {/* Floating Controls */}
                    <div className="absolute bottom-8 right-8 flex flex-col gap-2">
                        <button className="h-10 w-10 rounded-full bg-card border border-border text-foreground shadow-lg flex items-center justify-center hover:bg-primary hover:text-black hover:border-primary transition-colors">
                            <PlusIcon className="h-6 w-6" />
                        </button>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
