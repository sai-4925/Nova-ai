// agents/nodes/responseNode.js
// -----------------------------------------------------------------------
// The final node before END. Two paths:
//   1. A specialist tool already ran (toolResults is non-empty) -> surface
//      its output directly. Deliberately NOT re-summarising tool output
//      through another Gemini call here - for the Coding Node especially,
//      paraphrasing generated code through a second LLM pass risks
//      mangling it.
//   2. No tool ran ('general' route) -> generate a direct conversational
//      reply, now AUGMENTED with recalled long-term memories (Module 20)
//      appended to the system instruction - this is what lets Nova say
//      things like "since you mentioned you're vegetarian earlier..."
//      in a conversation that started completely fresh.
// -----------------------------------------------------------------------

import { streamChatResponse, DEFAULT_SYSTEM_INSTRUCTION } from '../../services/geminiService.js';
import { logger } from '../../utils/logger.js';

export const buildSystemInstructionWithMemories = (recalledMemories) => {
  if (!recalledMemories || recalledMemories.length === 0) return DEFAULT_SYSTEM_INSTRUCTION;

  return `${DEFAULT_SYSTEM_INSTRUCTION}

Relevant things you remember about this user from past conversations:
${recalledMemories.map((fact) => `- ${fact}`).join('\n')}

Use these naturally if relevant - don't force them in or announce that you "recalled" them.`;
};

export const responseNode = async (state) => {
  if (state.toolResults.length > 0) {
    const combined = state.toolResults.map((result) => result.output).filter(Boolean).join('\n\n');
    return { finalResponse: combined };
  }

  try {
    const systemInstruction = buildSystemInstructionWithMemories(state.recalledMemories);
    const finalResponse = await streamChatResponse(state.chatHistory, state.userMessage, () => {}, systemInstruction);
    return { finalResponse };
  } catch (error) {
    logger.error(`Response Node failed to generate a direct reply: ${error.message}`);
    return { finalResponse: "I'm having trouble responding right now - please try again in a moment." };
  }
};
