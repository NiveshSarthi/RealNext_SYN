export function jsonToFlow(jsonData) {
    // Supports both new object format and legacy array format
    let messageBlocks = [];
    let messageRoutes = [];

    if (!jsonData) return { nodes: [], edges: [] };

    if (Array.isArray(jsonData)) {
        // Legacy: [{Message_Blocks: [...]}, {Message_Routes: [...]}]
        messageBlocks = jsonData[0]?.Message_Blocks || [];
        messageRoutes = jsonData[1]?.Message_Routes || [];
    } else {
        // New: { Message_Blocks: [...], Message_Routes: [...] }
        messageBlocks = jsonData.Message_Blocks || [];
        messageRoutes = jsonData.Message_Routes || [];
    }

    const nodes = messageBlocks.map((block, index) => ({
        id: block.Message_block_id,
        type: "messageNode",
        position: block.position || { x: 50 + index * 450, y: 100 + (index % 2) * 50 }, // Restore or auto-layout
        data: {
            bodyText: block.body_text || "",
            footerText: block.footer_text || "",
            buttons: block.buttons || [],
            isLastMessage: block.last_message || false,
            salesTeam: block.sales_Team || "",
        },
        dragHandle: '.custom-drag-handle',
    }));

    const edges = messageRoutes.map((route, index) => {
        let sourceNode = nodes.find((n) =>
            n.data.buttons?.some((btn) => btn.id === route.message_recieved),
        );

        // Fallback: Check if route matches a Node ID (direct connection)
        if (!sourceNode) {
            sourceNode = nodes.find(n => n.id === route.message_recieved);
        }
        let sourceHandle = null;
        if (sourceNode) {
            const btnIndex = sourceNode.data.buttons.findIndex(
                (b) => b.id === route.message_recieved,
            );
            if (btnIndex !== -1) sourceHandle = `button-${btnIndex}`;
        }
        return {
            id: `edge-${index}`,
            source: sourceNode ? sourceNode.id : route.message_recieved,
            target: route.id_of_message_to_be_sent,
            sourceHandle,
            type: "default",
            animated: true,
        };
    });

    return { nodes, edges };
}
