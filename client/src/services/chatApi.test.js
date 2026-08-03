// src/services/chatApi.test.js
import { describe, it, expect } from 'vitest';
import { parseSSEFrame } from './chatApi.js';

describe('parseSSEFrame', () => {
  it('parses a well-formed chunk frame', () => {
    const result = parseSSEFrame('event: chunk\ndata: {"text":"Hello"}');
    expect(result).toEqual({ eventName: 'chunk', data: { text: 'Hello' } });
  });

  it('parses a well-formed done frame', () => {
    const result = parseSSEFrame('event: done\ndata: {"messageId":"msg_123"}');
    expect(result).toEqual({ eventName: 'done', data: { messageId: 'msg_123' } });
  });

  it('returns null for a frame missing the data line', () => {
    expect(parseSSEFrame('event: chunk')).toBeNull();
  });

  it('returns null for a frame missing the event line', () => {
    expect(parseSSEFrame('data: {"text":"Hello"}')).toBeNull();
  });
});

describe('end-to-end frame reassembly (simulating a chunk boundary split mid-frame)', () => {
  it('correctly reassembles chunks even when a network read splits a frame in half', () => {
    // Mirrors streamMessage's exact buffering logic without needing a
    // real fetch/ReadableStream - this is the scenario that looks fine
    // in a demo (frames arriving whole) and breaks in production
    // (frames arriving split across TCP packet boundaries).
    const rawFrames =
      'event: chunk\ndata: {"text":"Hello"}\n\n' +
      'event: chunk\ndata: {"text":" world"}\n\n' +
      'event: done\ndata: {"messageId":"msg_123"}\n\n';

    const splitPoint = 30; // an arbitrary, awkward mid-frame offset
    const networkChunks = [rawFrames.slice(0, splitPoint), rawFrames.slice(splitPoint)];

    let buffer = '';
    let accumulated = '';
    let doneId = null;

    for (const chunk of networkChunks) {
      buffer += chunk;
      const frames = buffer.split('\n\n');
      buffer = frames.pop();

      for (const frame of frames) {
        const parsed = parseSSEFrame(frame);
        if (!parsed) continue;
        if (parsed.eventName === 'chunk') accumulated += parsed.data.text;
        else if (parsed.eventName === 'done') doneId = parsed.data.messageId;
      }
    }

    expect(accumulated).toBe('Hello world');
    expect(doneId).toBe('msg_123');
  });
});
