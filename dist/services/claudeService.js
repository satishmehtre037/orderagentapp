"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getResponse = getResponse;
const claude_js_1 = require("../config/claude.js");
/**
 * Executes a text request against Anthropic Claude API using system prompt and history
 */
async function getResponse(systemPrompt, conversationHistory, newMessage) {
    console.log(`[Claude Service] Sending request to Claude API...`);
    // Format historical messages into Anthropic role format
    const formattedHistory = [];
    for (const msg of conversationHistory) {
        const role = msg.message_direction === 'inbound' ? 'user' : 'assistant';
        // Ensure alternating roles to prevent Anthropic SDK validation error
        if (formattedHistory.length > 0 && formattedHistory[formattedHistory.length - 1].role === role) {
            formattedHistory[formattedHistory.length - 1].content += `\n${msg.message_text}`;
        }
        else {
            formattedHistory.push({ role, content: msg.message_text });
        }
    }
    // Append new user message
    if (formattedHistory.length > 0 && formattedHistory[formattedHistory.length - 1].role === 'user') {
        formattedHistory[formattedHistory.length - 1].content += `\n${newMessage}`;
    }
    else {
        formattedHistory.push({ role: 'user', content: newMessage });
    }
    try {
        const response = await claude_js_1.anthropic.messages.create({
            model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6',
            max_tokens: 1024,
            system: systemPrompt,
            messages: formattedHistory,
        });
        const replyBlock = response.content.find((block) => block.type === 'text');
        const replyText = replyBlock ? replyBlock.text : '';
        console.log(`[Claude Service] Received response from Claude (${replyText.length} chars)`);
        return replyText;
    }
    catch (error) {
        console.error(`[Claude Service Error] Error calling Anthropic API:`, error?.message || error);
        // Fallback error message for graceful user response
        return `Thank you for your message! Our system is currently experiencing a brief pause. An owner or team member will get back to you shortly.`;
    }
}
