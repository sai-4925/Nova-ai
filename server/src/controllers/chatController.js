// controllers/chatController.js
// -----------------------------------------------------------------------
// Thin HTTP layer. Wires together:
//   - chatService     (persistence: conversations/messages)
//   - novaGraph       (the full LangGraph agent pipeline - Module 9)
//   - sseHelper       (wire format: Server-Sent Events)
//   - textChunker     (replays the graph's one-shot result as an SSE
//                       "typing" effect, preserving Module 7's frontend
//                       contract with zero client-side changes)
//
// This is where Module 9's graph actually enters the running app: every
// chat message now flows through Planner -> Memory -> Tool Selection ->
// (specialist node(s)) -> Response, instead of a single direct Gemini call.
// -----------------------------------------------------------------------

import * as chatService from '../services/chatService.js';
import { buildGeminiHistory } from '../services/geminiService.js';
import { novaGraph } from '../agents/graph/graph.js';
import { buildToolMetadataForMessage } from '../agents/graph/toolMetadata.js';
import { distillAndStoreMemory } from '../memory/longTermMemoryService.js';
import { chunkTextForStreaming } from '../utils/textChunker.js';
import { initSSE, sendSSEEvent, endSSE } from '../utils/sseHelper.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { logger } from '../utils/logger.js';

// POST /api/chat/conversations
export const createConversation = asyncHandler(async (req, res) => {
  const conversation = await chatService.createConversation(req.user._id, req.body.mode);
  new ApiResponse(201, { conversation }, 'Conversation created').send(res);
});

// GET /api/chat/conversations
export const listConversations = asyncHandler(async (req, res) => {
  const conversations = await chatService.listConversations(req.user._id);
  new ApiResponse(200, { conversations }).send(res);
});

// GET /api/chat/conversations/:id/messages
export const getMessages = asyncHandler(async (req, res) => {
  await chatService.getOwnedConversation(req.params.id, req.user._id); // ownership check
  const messages = await chatService.getRecentMessages(req.params.id, 100);
  new ApiResponse(200, { messages }).send(res);
});

// DELETE /api/chat/conversations/:id
export const removeConversation = asyncHandler(async (req, res) => {
  await chatService.deleteConversation(req.params.id, req.user._id);
  new ApiResponse(200, null, 'Conversation deleted').send(res);
});

// POST /api/chat/conversations/:id/messages  (STREAMING via SSE)
// -----------------------------------------------------------------------
// Flow:
//   1. Verify the conversation belongs to this user
//   2. Save the incoming user message
//   3. Fetch recent history and build the graph's initial state
//   4. Run the FULL agent graph once (Planner -> Memory -> Tool
//      Selection -> specialist node(s) -> Response)
//   5. Replay the graph's finalResponse as SSE 'chunk' events so the
//      existing frontend "typing" effect (Module 7) keeps working
//      unchanged - see the module-level trade-off note above
//   6. Persist the assistant message WITH tool metadata (toolName/
//      toolInput/toolOutput) so the audit trail Module 3 designed for
//      is actually populated, not just the plain-text reply
// -----------------------------------------------------------------------
export const sendMessage = asyncHandler(async (req, res) => {
  const { content, isVoice } = req.body;
  const conversationId = req.params.id;

  if (!content || !content.trim()) {
    throw ApiError.badRequest('Message content is required');
  }

  const conversation = await chatService.getOwnedConversation(conversationId, req.user._id);

  await chatService.saveMessage({
    conversationId,
    userId: req.user._id,
    role: 'user',
    content,
    isVoice: !!isVoice,
  });

  // Fire-and-forget: don't block the response on a cosmetic title update.
  chatService.maybeAutoTitleConversation(conversation, content);

  const priorMessages = await chatService.getRecentMessages(conversationId, 20);
  const chatHistory = buildGeminiHistory(priorMessages.slice(0, -1)); // exclude the message we just saved

  initSSE(res);

  try {
    // Run the full agent graph. Every field not set here takes the
    // default declared in agents/graph/state.js (route defaults to
    // 'general', toolResults to [], etc.) - we only need to seed the
    // fields that describe THIS turn.
    const finalState = await novaGraph.invoke({
      userMessage: content,
      isVoice: !!isVoice,
      userId: req.user._id.toString(),
      conversationId,
      chatHistory,
    });

    // Replay the complete response as small chunks over the SAME SSE
    // contract the frontend already listens for - no client changes
    // needed even though generation already finished server-side.
    const chunks = chunkTextForStreaming(finalState.finalResponse);
    for (const chunk of chunks) {
      sendSSEEvent(res, 'chunk', { text: chunk });
    }

    const { toolName, toolInput, toolOutput } = buildToolMetadataForMessage(finalState.toolResults);

    const savedAssistantMessage = await chatService.saveMessage({
      conversationId,
      userId: req.user._id,
      role: 'assistant',
      content: finalState.finalResponse,
      toolName,
      toolInput,
      toolOutput,
    });

    sendSSEEvent(res, 'done', { messageId: savedAssistantMessage._id });

    // Fire-and-forget: distill any durable fact from this exchange for
    // long-term recall in FUTURE conversations - never blocks the
    // response the user is already looking at. Skipped for tool-routed
    // turns (weather/reminders/etc.) where the "assistant reply" is
    // really a tool's mechanical output, not a conversational exchange
    // likely to contain a personal fact worth remembering.
    if (finalState.toolResults.length === 0) {
      distillAndStoreMemory(req.user._id, conversationId, content, finalState.finalResponse).catch((error) => {
        logger.warn(`Unexpected error during memory distillation: ${error.message}`);
      });
    }
  } catch (error) {
    logger.error(`Agent graph execution failed: ${error.message}`);
    sendSSEEvent(res, 'error', { message: 'Nova had trouble responding. Please try again.' });
  } finally {
    endSSE(res);
  }
});
