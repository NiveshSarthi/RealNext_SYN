// frontend/utils/voiceCommandEngine.js

import { leadsAPI } from './api';

/**
 * Advanced Voice Command Engine
 * Uses Native Browser Web Speech API transcriptions to determine
 * User Intent and extract Entities (names, parameters) via Regex matching.
 */

// --- Intent Definitions & Regex Patterns ---

const INTENTS = {
    CREATE_LEAD: {
        pattern: /(?:create|add|make|new|insert|set up)\s+(?:a\s+|an\s+|the\s+)?(?:lead|contact|person|client)(?:\s+(?:named|called|for)\s+(?<name>[\w\s]+))?/i,
        action: 'ROUTE_TO_CREATE_LEAD'
    },
    OPEN_LEAD: {
        pattern: /(?:open|show|go to|find|search for)\s+(?:the\s+)?(?:lead|contact|person|client)(?:\s+(?:named|called|for))?\s+(?<name>[\w\s]+)/i,
        action: 'ROUTE_TO_SPECIFIC_LEAD'
    },
    CREATE_GROUP: {
        pattern: /(?:create|add|make|new)\s+(?:a\s+|an\s+|the\s+)?(?:group|segment|list)(?:\s+(?:named|called|for)\s+(?<name>[\w\s]+))?/i,
        action: 'ROUTE_TO_CREATE_GROUP'
    },
    NAVIGATE: {
        // Fallback or explicit navigation commands
        pattern: /(?:go to|open|show|take me to)\s+(?:the\s+)?(?<destination>dashboard|home|lead center|pipeline|inventory|properties|marketing|broadcasts|follow ups|schedule)/i,
        action: 'SIMPLE_NAVIGATION'
    },
    TOTAL_LEADS: {
        pattern: /(?:how many|what are the)\s+(?:leads|contacts|people|clients)\s+(?:do we have|are there|total)/i,
        action: 'ANNOUNCE_TOTAL_LEADS'
    }
};

// --- Main Processor ---

export const processVoiceCommand = async (transcript, router) => {
    const lowerTranscript = transcript.toLowerCase().trim();
    if (!lowerTranscript) return { message: null, success: false };

    console.log("[VoiceEngine] Processing transcript:", lowerTranscript);

    // 1. Try CREATE_LEAD
    const createLeadMatch = lowerTranscript.match(INTENTS.CREATE_LEAD.pattern);
    if (createLeadMatch) {
        const extractedName = createLeadMatch.groups?.name?.trim() || "";
        console.log("[VoiceEngine] Intent: CREATE_LEAD, Entity[Name]:", extractedName);

        // Pass the name as a query param if it was spoken
        const query = extractedName ? `?action=createLead&prefillName=${encodeURIComponent(extractedName)}` : `?action=createLead`;
        router.push(`/lms/lead-center${query}`);

        return {
            message: extractedName ? `Executing: Opening New Lead form for "${extractedName}"...` : "Executing: Opening New Lead form...",
            success: true
        };
    }

    // 2. Try OPEN_LEAD (Highest priority for specific targeting if it has a name)
    // Note: 'open a lead' might match here if not careful, but the regex requires the name extraction part to be present
    const openLeadMatch = lowerTranscript.match(INTENTS.OPEN_LEAD.pattern);
    if (openLeadMatch && openLeadMatch.groups?.name) {
        const extractedName = openLeadMatch.groups.name.trim();
        // Prevent accidental trigger if they just said "open the lead center"
        if (extractedName === 'center') return null; // Fallthrough

        console.log("[VoiceEngine] Intent: OPEN_LEAD, Entity[Name]:", extractedName);

        try {
            // Need to search the backend to find the ID for this name
            const response = await leadsAPI.getLeads({ search: extractedName, limit: 1 });

            // Extract the result based on your API's standard pagination wrapper
            const leads = response.data?.data || [];

            if (leads.length > 0) {
                const targetLead = leads[0]; // Take the first best match
                router.push(`/lms/leads/${targetLead._id || targetLead.id}`);
                return { message: `Executing: Opening profile for ${targetLead.name}...`, success: true };
            } else {
                return { message: `Could not find a lead named "${extractedName}".`, success: false };
            }
        } catch (error) {
            console.error("[VoiceEngine] Error finding lead:", error);
            // Fallback: Just go to lead center and put the name in the search bar
            router.push(`/lms/lead-center?search=${encodeURIComponent(extractedName)}`);
            return { message: `Searching Lead Center for "${extractedName}"...`, success: true };
        }
    }

    // 3. Try CREATE_GROUP
    const createGroupMatch = lowerTranscript.match(INTENTS.CREATE_GROUP.pattern);
    if (createGroupMatch) {
        const extractedName = createGroupMatch.groups?.name?.trim() || "";
        console.log("[VoiceEngine] Intent: CREATE_GROUP, Entity[Name]:", extractedName);
        router.push(`/lms/groups?action=createGroup&prefillName=${encodeURIComponent(extractedName)}`);
        return { message: "Executing: Initializing Group Creation...", success: true };
    }

    // 4. Announce Total Leads (Requires API call)
    const totalLeadsMatch = lowerTranscript.match(INTENTS.TOTAL_LEADS.pattern);
    if (totalLeadsMatch) {
        try {
            const response = await leadsAPI.getStats();
            const total = response.data?.data?.total || 0;
            return { message: `System Analysis: We currently have ${total} leads tracked in the system.`, success: true };
        } catch (err) {
            return { message: "Unable to retrieve total leads telemetry at this time.", success: false };
        }
    }


    // 5. Fallback strictly to simple Navigation
    const navMatch = lowerTranscript.match(INTENTS.NAVIGATE.pattern);
    if (navMatch || lowerTranscript.includes('dashboard') || lowerTranscript.includes('home')) {
        let destination = navMatch ? navMatch.groups?.destination?.trim().toLowerCase() : 'dashboard';

        if (lowerTranscript.includes('dashboard') || lowerTranscript.includes('home')) {
            router.push('/');
            return { message: "Routing to Command Center...", success: true };
        }
        if (lowerTranscript.includes('lead') || lowerTranscript.includes('pipeline')) {
            router.push('/lms/lead-center');
            return { message: "Accessing Lead Center...", success: true };
        }
        if (lowerTranscript.includes('inventory') || lowerTranscript.includes('property')) {
            router.push('/inventory');
            return { message: "Accessing Inventory Systems...", success: true };
        }
        if (lowerTranscript.includes('follow up') || lowerTranscript.includes('schedule')) {
            router.push('/lms/followups');
            return { message: "Opening Follow-ups...", success: true };
        }
        if (lowerTranscript.includes('marketing') || lowerTranscript.includes('broadcast')) {
            router.push('/wa-marketing/dashboard');
            return { message: "Priming Marketing Array...", success: true };
        }
    }

    // 6. No Intent Recognized
    return { message: "Command not recognized. Please rephrase your directive.", success: false };
};
