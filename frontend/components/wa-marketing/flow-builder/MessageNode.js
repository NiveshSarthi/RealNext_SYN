import React, { useState, useEffect } from 'react';
import { Handle, Position, useReactFlow } from 'reactflow';
import { XMarkIcon, PlusIcon } from '@heroicons/react/24/outline';

const MessageNode = ({ id, data, isConnectable }) => {
    const [bodyText, setBodyText] = useState(data.bodyText || '');
    const [footerText, setFooterText] = useState(data.footerText || '');
    const [buttons, setButtons] = useState(data.buttons || []);
    const [isLastMessage, setIsLastMessage] = useState(data.isLastMessage || false);
    const [salesTeam, setSalesTeam] = useState(data.salesTeam || '');

    const { setNodes } = useReactFlow();

    // Sync local state changes to node data
    useEffect(() => {
        setNodes((nds) =>
            nds.map((node) => {
                if (node.id === id) {
                    node.data = {
                        ...node.data,
                        bodyText,
                        footerText,
                        buttons,
                        isLastMessage,
                        salesTeam,
                    };
                }
                return node;
            })
        );
    }, [bodyText, footerText, buttons, isLastMessage, salesTeam, id, setNodes]);

    const addButton = () => {
        if (buttons.length >= 3) return;
        const newBtnId = `btn_${Date.now()}`;
        setButtons([...buttons, { id: newBtnId, title: 'New Button' }]);
        setIsLastMessage(false); // Can't be last message if it has buttons
    };

    const removeButton = (index) => {
        const newButtons = [...buttons];
        newButtons.splice(index, 1);
        setButtons(newButtons);
    };

    const updateButton = (index, field, value) => {
        const newButtons = [...buttons];
        newButtons[index][field] = value;
        setButtons(newButtons);
    };

    return (
        <div className="bg-card border border-border rounded-lg shadow-lg w-80 text-sm overflow-hidden transform transition-all hover:border-primary/50">
            {/* Input Handle */}
            <Handle type="target" position={Position.Left} isConnectable={isConnectable} className="w-3 h-3 bg-primary border-2 border-white" />

            {/* Header */}
            <div className="custom-drag-handle bg-primary/10 p-3 border-b border-border flex justify-between items-center cursor-move">
                <span className="font-semibold text-primary">Message Block</span>
                <span className="text-xs text-muted-foreground">ID: {id}</span>
            </div>

            <div className="p-3 space-y-3">
                {/* Body Text */}
                <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Body Text</label>
                    <textarea
                        className="w-full bg-background border border-border rounded p-2 text-foreground focus:ring-1 focus:ring-primary focus:border-primary text-xs resize-none"
                        rows={3}
                        value={bodyText}
                        onChange={(e) => setBodyText(e.target.value)}
                        placeholder="Enter message text..."
                    />
                </div>

                {/* Footer Text */}
                <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Footer Text (Optional)</label>
                    <input
                        type="text"
                        className="w-full bg-background border border-border rounded p-2 text-foreground focus:ring-1 focus:ring-primary focus:border-primary text-xs"
                        value={footerText}
                        onChange={(e) => setFooterText(e.target.value)}
                        placeholder="Footer text..."
                    />
                </div>

                {/* Buttons Section */}
                <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Buttons (Max 3)</label>
                    <div className="space-y-2">
                        {buttons.map((btn, index) => (
                            <div key={index} className="relative flex items-center space-x-1 bg-background/50 p-2 rounded border border-border">
                                <div className="flex-1 space-y-1">
                                    <input
                                        type="text"
                                        className="w-full bg-transparent border-b border-border focus:border-primary text-xs p-0.5"
                                        value={btn.id}
                                        onChange={(e) => updateButton(index, 'id', e.target.value)}
                                        placeholder="Button ID (for routing)"
                                    />
                                    <input
                                        type="text"
                                        className="w-full bg-transparent border-none text-xs font-medium p-0.5 focus:ring-0"
                                        value={btn.title}
                                        onChange={(e) => updateButton(index, 'title', e.target.value)}
                                        placeholder="Button Label"
                                    />
                                </div>
                                <button
                                    onClick={() => removeButton(index)}
                                    className="text-gray-500 hover:text-red-500 transition-colors p-1"
                                >
                                    <XMarkIcon className="h-4 w-4" />
                                </button>

                                {/* Output Handle for this button */}
                                <Handle
                                    type="source"
                                    position={Position.Right}
                                    id={`button-${index}`}
                                    isConnectable={isConnectable}
                                    className="w-3 h-3 bg-blue-500 border-2 border-white top-auto right-[-8px]"
                                    style={{ top: '50%' }} // Centered vertically relative to the button row
                                />
                            </div>
                        ))}
                    </div>

                    {buttons.length < 3 && (
                        <button
                            onClick={addButton}
                            className="mt-2 w-full flex items-center justify-center p-2 border border-dashed border-border rounded text-xs text-muted-foreground hover:text-primary hover:border-primary transition-colors"
                        >
                            <PlusIcon className="h-4 w-4 mr-1" /> Add Button
                        </button>
                    )}
                </div>

                {/* Last Message Toggle */}
                {buttons.length === 0 && (
                    <div className="flex items-center space-x-2">
                        <input
                            type="checkbox"
                            id={`last-msg-${id}`}
                            checked={isLastMessage}
                            onChange={(e) => setIsLastMessage(e.target.checked)}
                            className="rounded border-gray-600 bg-background text-primary focus:ring-primary"
                        />
                        <label htmlFor={`last-msg-${id}`} className="text-xs text-gray-400">Is Last Message</label>
                    </div>
                )}

                {/* Sales Team */}
                {isLastMessage && (
                    <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">Assign Sales Team</label>
                        <input
                            type="text"
                            className="w-full bg-background border border-border rounded p-2 text-foreground focus:ring-1 focus:ring-primary focus:border-primary text-xs"
                            value={salesTeam}
                            onChange={(e) => setSalesTeam(e.target.value)}
                            placeholder="e.g. billing_team"
                        />
                    </div>
                )}
            </div>

            {/* Default Output Handle (Continue) */}
            {buttons.length === 0 && !isLastMessage && (
                <Handle
                    type="source"
                    position={Position.Right}
                    id="default"
                    isConnectable={isConnectable}
                    className="w-3 h-3 bg-blue-500 border-2 border-white"
                />
            )}
        </div>
    );
};

export default MessageNode;
