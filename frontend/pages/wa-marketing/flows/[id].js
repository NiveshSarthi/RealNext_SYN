import { useState, useCallback, useEffect, useRef } from 'react';
import ReactFlow, {
    Controls,
    Background,
    MiniMap,
    useNodesState,
    useEdgesState,
    addEdge,
    BackgroundVariant,
    Panel
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useRouter } from 'next/router';
import Head from 'next/head';
import {
    ArrowLeftIcon,
    PlusIcon,
    TrashIcon,
    PaperAirplaneIcon,
    CircleStackIcon
} from '@heroicons/react/24/outline';
import { Toaster, toast } from 'react-hot-toast';

// Relative imports based on structure
import MessageNode from '../../../components/wa-marketing/flow-builder/MessageNode';
import { flowApi } from '../../../components/wa-marketing/flow-builder/utils/flowApi';
import { flowToJson } from '../../../components/wa-marketing/flow-builder/utils/flowToJson';
import { jsonToFlow } from '../../../components/wa-marketing/flow-builder/utils/jsonToFlow';
import { useAuth } from '../../../contexts/AuthContext';

const nodeTypes = {
    messageNode: MessageNode,
};

let id = 1;
const getId = () => `${id++}`;

export default function FlowBuilder() {
    const router = useRouter();
    const { id: flowId } = router.query;
    const { user } = useAuth();

    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [flowName, setFlowName] = useState('Untitled Flow');
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);

    // Load Flow Data
    useEffect(() => {
        if (flowId && user) {
            loadFlow();
        }
    }, [flowId, user]);

    const loadFlow = async () => {
        setLoading(true);
        try {
            const data = await flowApi.getFlow(flowId);
            setFlowName(data.meta?.name || 'Untitled Flow');

            const { nodes: loadedNodes, edges: loadedEdges } = jsonToFlow(data.data);

            if (!loadedNodes || loadedNodes.length === 0) {
                // Initialize with a default starting message block
                loadedNodes.push({
                    id: getId(),
                    type: 'messageNode',
                    position: { x: 50, y: 100 },
                    data: {
                        bodyText: 'Start Message here...',
                        footerText: '',
                        buttons: [],
                    },
                    dragHandle: '.custom-drag-handle',
                });
            }

            setNodes(loadedNodes);
            setEdges(loadedEdges);

            // Sync ID counter
            const maxId = loadedNodes.reduce(
                (max, node) => Math.max(max, parseInt(node.id) || 0),
                0
            );
            id = maxId + 1;

        } catch (error) {
            console.error('Failed to load flow', error);
            toast.error('Failed to load flow data');
        } finally {
            setLoading(false);
        }
    };

    const onConnect = useCallback(
        (params) => setEdges((eds) => addEdge({ ...params, animated: true, type: 'default' }, eds)),
        [setEdges]
    );

    const addNode = useCallback(() => {
        const newNode = {
            id: getId(),
            type: 'messageNode',
            position: {
                x: Math.random() * 400,
                y: Math.random() * 400,
            },
            data: {
                bodyText: 'New Message',
                buttons: []
            },
            // Important for drag handle if we had one
            dragHandle: '.custom-drag-handle',
        };
        setNodes((nds) => nds.concat(newNode));
    }, [setNodes]);

    const handleSave = async () => {
        setSaving(true);
        try {
            const flowData = flowToJson(nodes, edges);
            // We can also update name here if we had an input for it, 
            // but for now we just save the graph.
            await flowApi.updateFlow(flowId, {
                Message_Blocks: flowData.Message_Blocks,
                Message_Routes: flowData.Message_Routes
            });
            toast.success('Flow saved successfully!');
        } catch (error) {
            console.error('Save failed', error);
            toast.error('Failed to save flow');
        } finally {
            setSaving(false);
        }
    };

    const handleClear = () => {
        if (window.confirm('Are you sure you want to clear the canvas?')) {
            setNodes([]);
            setEdges([]);
        }
    };

    if (loading) {
        return (
            <div className="h-screen w-screen flex items-center justify-center bg-background text-foreground">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="h-screen w-screen flex flex-col bg-background text-foreground overflow-hidden">
            <Head>
                <title>{flowName} | Flow Builder</title>
            </Head>
            <Toaster position="top-center" />

            {/* Header */}
            <div className="h-16 border-b border-border bg-card flex items-center justify-between px-6 z-10 shadow-sm">
                <div className="flex items-center space-x-4">
                    <button
                        onClick={() => router.push('/wa-marketing/flows')}
                        className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground hover:text-foreground"
                    >
                        <ArrowLeftIcon className="h-5 w-5" />
                    </button>
                    <div>
                        <h1 className="font-bold text-lg text-foreground">{flowName}</h1>
                        <span className="text-xs text-muted-foreground flex items-center">
                            <div className="h-1.5 w-1.5 rounded-full bg-green-500 mr-1.5"></div>
                            Auto-saved
                        </span>
                    </div>
                </div>

                <div className="flex items-center space-x-3">
                    <button
                        onClick={handleClear}
                        className="px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors flex items-center"
                    >
                        <TrashIcon className="h-4 w-4 mr-1.5" />
                        Clear
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center shadow-lg shadow-primary/20"
                    >
                        {saving ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        ) : (
                            <CircleStackIcon className="h-4 w-4 mr-2" />
                        )}
                        Save Flow
                    </button>
                </div>
            </div>

            {/* Canvas */}
            <div className="flex-1 w-full h-full relative">
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    nodeTypes={nodeTypes}
                    fitView
                    className="bg-background"
                    snapToGrid={true}
                    snapGrid={[15, 15]}
                    defaultViewport={{ x: 0, y: 0, zoom: 1 }}
                    minZoom={0.1}
                >
                    <Background
                        variant={BackgroundVariant.Dots}
                        gap={20}
                        size={1}
                        color="var(--muted-foreground)"
                        style={{ opacity: 0.2 }}
                    />
                    <Controls className="bg-card border border-border text-foreground fill-foreground" />
                    <MiniMap
                        className="bg-card border border-border"
                        maskColor="rgba(0, 0, 0, 0.4)"
                        nodeColor={(node) => '#f97316'}
                    />

                    <Panel position="top-left" className="m-4">
                        <button
                            onClick={addNode}
                            className="bg-card border border-border shadow-lg p-2 rounded-lg flex items-center space-x-2 hover:border-primary/50 transition-all group"
                        >
                            <div className="h-8 w-8 bg-primary/10 rounded flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                                <PlusIcon className="h-5 w-5" />
                            </div>
                            <div className="text-left pr-2">
                                <span className="block text-sm font-medium text-foreground">Add Message</span>
                                <span className="block text-[10px] text-muted-foreground">Send text & buttons</span>
                            </div>
                        </button>
                    </Panel>
                </ReactFlow>
            </div>
        </div>
    );
}
