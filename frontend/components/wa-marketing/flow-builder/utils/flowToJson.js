export function flowToJson(nodes, edges) {
    const messageBlocks = nodes.map((node) => {
        const { data } = node;
        const hasButtons = data.buttons && data.buttons.length > 0;

        const block = {
            Message_block_id: node.id,
            function_to_call: hasButtons
                ? "send_message_with_buttons"
                : "send_message_without_buttons",
            body_text: data.bodyText || "",
            footer_text: data.footerText || "",
            sales_Team: data.salesTeam || "",
            position: node.position, // Save UI Coordinates
        };

        if (hasButtons) {
            block.buttons = data.buttons;
        } else {
            block.last_message = data.isLastMessage || false;
        }
        return block;
    });

    const messageRoutes = edges.map((edge) => {
        const sourceNode = nodes.find((n) => n.id === edge.source);
        let messageReceived = edge.sourceHandle || edge.source;

        // If source handle is button-X, map it to the button ID
        if (sourceNode?.data.buttons) {
            const match = messageReceived && messageReceived.match && messageReceived.match(/button-(\d+)/);
            if (match) {
                const btnIndex = parseInt(match[1]);
                const btn = sourceNode.data.buttons[btnIndex];
                if (btn) messageReceived = btn.id;
            }
        }

        // If handle is 'default', use the source node ID
        if (messageReceived === 'default' && sourceNode) {
            messageReceived = sourceNode.id;
        }

        return {
            message_recieved: messageReceived,
            id_of_message_to_be_sent: edge.target,
        };
    });

    return { Message_Blocks: messageBlocks, Message_Routes: messageRoutes };
}
