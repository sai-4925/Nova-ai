// src/hooks/useSpeechRecognition.js
// -----------------------------------------------------------------------
// Wraps SpeechRecognition/webkitSpeechRecognition. The single trickiest
// behaviour this hook handles: browsers (notably Chrome) silently end
// a "continuous" recognition session after a period of silence anyway.
// Without auto-restart, passive wake-word listening would die after
// ~10-15 seconds of quiet - which would make "always listening for
// Nova" completely unreliable. `shouldKeepListeningRef` tracks INTENT
// (did the user ask us to be listening) separately from the browser's
// actual recognition instance state, so onend can tell the difference
// between "user pressed stop" and "browser gave up" and only
// auto-restarts in the latter case.
// -----------------------------------------------------------------------

import { useCallback, useEffect, useRef, useState } from 'react';

const getSpeechRecognitionCtor = () => window.SpeechRecognition || window.webkitSpeechRecognition;

export const useSpeechRecognition = ({ onFinalResult, onInterimResult } = {}) => {
  const isSupported = !!getSpeechRecognitionCtor();
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState(null);

  const recognitionRef = useRef(null);
  const shouldKeepListeningRef = useRef(false);

  // Keep the latest callbacks in refs so the recognition instance
  // (created once) always calls the CURRENT versions, not stale
  // closures from whenever `.onresult` was first assigned.
  const onFinalResultRef = useRef(onFinalResult);
  const onInterimResultRef = useRef(onInterimResult);
  useEffect(() => {
    onFinalResultRef.current = onFinalResult;
    onInterimResultRef.current = onInterimResult;
  }, [onFinalResult, onInterimResult]);

  useEffect(() => {
    if (!isSupported) return undefined;

    const RecognitionCtor = getSpeechRecognitionCtor();
    const recognition = new RecognitionCtor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      // event.results is a live list of ALL results since recognition
      // started; we only care about results from this event's range.
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        const text = result[0].transcript;
        if (result.isFinal) {
          onFinalResultRef.current?.(text);
        } else {
          onInterimResultRef.current?.(text);
        }
      }
    };

    recognition.onerror = (event) => {
      // 'no-speech' fires constantly during passive listening (just
      // means "nothing was said yet") - not a real error worth surfacing.
      if (event.error !== 'no-speech') {
        setError(event.error);
      }
    };

    recognition.onend = () => {
      // The browser stopped recognition on its own. If the user still
      // wants us listening (wake-word mode is on), restart immediately.
      if (shouldKeepListeningRef.current) {
        try {
          recognition.start();
        } catch {
          // Recognition may already be starting - safe to ignore.
        }
      } else {
        setIsListening(false);
      }
    };

    recognitionRef.current = recognition;

    return () => {
      shouldKeepListeningRef.current = false;
      recognition.stop();
    };
  }, [isSupported]);

  const startListening = useCallback(() => {
    if (!isSupported || !recognitionRef.current) return;
    shouldKeepListeningRef.current = true;
    setError(null);
    try {
      recognitionRef.current.start();
      setIsListening(true);
    } catch {
      // Already started - harmless.
    }
  }, [isSupported]);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return;
    shouldKeepListeningRef.current = false;
    recognitionRef.current.stop();
    setIsListening(false);
  }, []);

  return { isSupported, isListening, error, startListening, stopListening };
};
