// tests/unit/utils/apiError.test.js
import { describe, it, expect, jest } from '@jest/globals';
import { ApiError } from '../../../src/utils/ApiError.js';
import { ApiResponse } from '../../../src/utils/ApiResponse.js';
import { asyncHandler } from '../../../src/utils/asyncHandler.js';

describe('ApiError', () => {
  it('badRequest sets status 400 and isOperational true', () => {
    const err = ApiError.badRequest('bad input');
    expect(err.statusCode).toBe(400);
    expect(err.isOperational).toBe(true);
    expect(err.message).toBe('bad input');
  });

  it('internal sets status 500 and isOperational false', () => {
    const err = ApiError.internal('boom');
    expect(err.statusCode).toBe(500);
    expect(err.isOperational).toBe(false);
  });
});

describe('ApiResponse', () => {
  it('marks success=true for status codes under 400', () => {
    const res = new ApiResponse(200, { foo: 'bar' }, 'ok');
    expect(res.success).toBe(true);
    expect(res.data).toEqual({ foo: 'bar' });
  });

  it('marks success=false for status codes 400+', () => {
    const res = new ApiResponse(404, null, 'not found');
    expect(res.success).toBe(false);
  });

  it('send() calls res.status().json() with itself', () => {
    const res = new ApiResponse(200, { a: 1 });
    const mockRes = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    res.send(mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith(res);
  });
});

describe('asyncHandler', () => {
  it('forwards a rejected promise to next() instead of throwing', async () => {
    const failingHandler = async () => {
      throw new Error('handler failed');
    };
    const next = jest.fn();
    const wrapped = asyncHandler(failingHandler);

    await wrapped({}, {}, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next.mock.calls[0][0].message).toBe('handler failed');
  });

  it('does not call next() when the handler succeeds', async () => {
    const successHandler = async (req, res) => res.send('ok');
    const next = jest.fn();
    const mockRes = { send: jest.fn() };

    await asyncHandler(successHandler)({}, mockRes, next);

    expect(mockRes.send).toHaveBeenCalledWith('ok');
    expect(next).not.toHaveBeenCalled();
  });
});
