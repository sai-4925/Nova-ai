// src/hooks/useSpeechSynthesis.js
// -----------------------------------------------------------------------
// Wraps the SpeechSynthesis API. Voice selection respects the user's
// saved preference (User.preferences.voiceName from Module 3's model)
// so "which voice Nova speaks in" is a per-user setting, not hardcoded.
// -----------------------------------------------------------------------

import { useCallback, useEffect, useRef, useState } from 'react';

export const useSpeechSynthesis = (preferredVoiceName) => {
  const isSupported = 'speechSynthesis' in window;
  const [isSpeaking, setIsSpeaking] = useState(false);
  const voicesRef = useRef([]);

  useEffect(() => {
    if (!isSupported) return undefined;

    const loadVoices = () => {
      voicesRef.current = window.speechSynthesis.getVoices();
    };
    loadVoices();
    // Voice list loads asynchronously in most browsers - this event
    // fires once it's actually populated.
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, [isSupported]);

  /**
   * @param {string} text
   * @param {{ onEnd?: () => void }} [options]
   */
  const speak = useCallback(
    (text, { onEnd } = {}) => {
      if (!isSupported || !text) {
        onEnd?.();
        return;
      }

      window.speechSynthesis.cancel(); // stop anything already playing

      const utterance = new SpeechSynthesisUtterance(text);
      const matchedVoice = voicesRef.current.find((v) => v.name === preferredVoiceName);
      if (matchedVoice) utterance.voice = matchedVoice;
      utterance.rate = 1;
      utterance.pitch = 1;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => {
        setIsSpeaking(false);
        onEnd?.();
      };
      utterance.onerror = () => {
        setIsSpeaking(false);
        onEnd?.();
      };

      window.speechSynthesis.speak(utterance);
    },
    [isSupported, preferredVoiceName]
  );

  const cancel = useCallback(() => {
    if (isSupported) window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, [isSupported]);

  return { isSupported, isSpeaking, speak, cancel };
};
