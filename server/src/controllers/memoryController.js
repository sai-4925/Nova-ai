// controllers/memoryController.js
import { listMemories, deleteMemory } from '../memory/longTermMemoryService.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';

// GET /api/memory
export const getMemories = asyncHandler(async (req, res) => {
  const memories = await listMemories(req.user._id);
  new ApiResponse(200, { memories }).send(res);
});

// DELETE /api/memory/:id
export const removeMemory = asyncHandler(async (req, res) => {
  await deleteMemory(req.user._id, req.params.id);
  new ApiResponse(200, null, 'Memory deleted').send(res);
});
