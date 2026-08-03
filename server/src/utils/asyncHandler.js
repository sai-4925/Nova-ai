// utils/asyncHandler.js
// -----------------------------------------------------------------------
// Wraps an async Express route/controller handler.
//
// WHY THIS EXISTS:
// Without this, EVERY controller would need:
//   try { ... } catch (err) { next(err); }
// Across 30+ controller functions across auth/chat/agents, that's a lot
// of repeated boilerplate and an easy place to forget error handling.
// asyncHandler centralises that in one reusable higher-order function.
//
// USAGE:
//   router.post('/login', asyncHandler(authController.login));
// -----------------------------------------------------------------------

export const asyncHandler = (requestHandler) => (req, res, next) => {
  Promise.resolve(requestHandler(req, res, next)).catch(next);
};
