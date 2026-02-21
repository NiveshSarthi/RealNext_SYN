export function jsonToFlow(jsonData) {
    // Supports both new object format and legacy array format
    let messageBlocks = [];
    let messageRoutes = [];

    if (!jsonData) return { nodes: [], edges: [] };

    if (Array.isArray(jsonData)) {
        // Direct array of blocks? Check first element
        const first = jsonData[0];
        if (first && (first.Message_block_id || first.id || first._id || first.body_text)) {
            messageBlocks = jsonData;
            messageRoutes = []; // Routes likely missing if it's just a flat list
        } else {
            // Legacy: [{Message_Blocks: [...]}, {Message_Routes: [...]}]
            messageBlocks = jsonData[0]?.Message_Blocks || jsonData[0]?.blocks || [];
            messageRoutes = jsonData[1]?.Message_Routes || jsonData[1]?.routes || [];
        }
    } else {
        // New: { Message_Blocks: [...], Message_Routes: [...] }
        messageBlocks = jsonData.Message_Blocks || [];
        messageRoutes = jsonData.Message_Routes || [];
    }

    const nodes = messageBlocks.map((block, index) => {
        const blockId = block.Message_block_id || block.id || block._id || `block-${index}`;
        return {
            id: blockId,
            type: "messageNode",
            position: block.position || { x: 50 + index * 450, y: 100 + (index % 2) * 50 },
            data: {
                bodyText: block.body_text || block.body || block.text || "",
                footerText: block.footer_text || block.footer || "",
                buttons: block.buttons || [],
                isLastMessage: block.last_message || block.is_last || false,
                salesTeam: block.sales_Team || block.sales_team || "",
            },
            dragHandle: '.custom-drag-handle',
        };
    });

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
