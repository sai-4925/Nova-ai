// src/context/VoiceContext.jsx
// -----------------------------------------------------------------------
// The voice assistant's state machine:
//
//   idle --(mic pressed)--> passive --(wake word heard)--> active
//     ^                        ^                              |
//     |                        |                    (silence timeout,
//     |                        |                     command finalised)
//     |                        |                              v
//     +---(speaking ends)-- speaking <--(assistant reply ready)-- processing
//
// Mounted INSIDE ChatProvider (see ChatPage.jsx) specifically so it can
// call useChat().sendMessage() directly - voice is just another way to
// submit a message into the SAME chat pipeline Module 7 built, never a
// separate path to the backend.
//
// Feedback-loop prevention: recognition is stopped before Nova speaks
// and restarted only after speech synthesis ends, so the assistant
// never hears (and reacts to) its own voice.
// -----------------------------------------------------------------------

import { createContext, useCallback, useEffect, useRef, useState } from 'react';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition.js';
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis.js';
import { containsWakeWord, extractCommandAfterWakeWord } from '../utils/wakeWordDetector.js';
import { useChat } from '../hooks/useChat.js';
import { useAuth } from '../hooks/useAuth.js';

export const VoiceContext = createContext(null);

const SILENCE_TIMEOUT_MS = 1200; // how long to wait after the user stops talking before finalising a command

export const VoiceProvider = ({ children }) => {
  const { user } = useAuth();
  const { sendMessage, messages, isStreaming } = useChat();
  const { speak, cancel: cancelSpeech } = useSpeechSynthesis(user?.preferences?.voiceName);

  // 'idle' | 'passive' | 'active' | 'processing' | 'speaking'
  const [voiceState, setVoiceState] = useState('idle');
  const [liveTranscript, setLiveTranscript] = useState('');

  const commandBufferRef = useRef('');
  const silenceTimerRef = useRef(null);
  const pendingVoiceReplyRef = useRef(false); // true only when the in-flight reply was triggered by voice
  const prevIsStreamingRef = useRef(false);
  const voiceStateRef = useRef('idle'); // mirrors voiceState for use inside stable callbacks

  useEffect(() => {
    voiceStateRef.current = voiceState;
  }, [voiceState]);

  const submitVoiceCommand = useCallback(
    (command) => {
      if (!command.trim()) {
        setVoiceState('passive');
        return;
      }
      clearTimeout(silenceTimerRef.current);
      commandBufferRef.current = '';
      setLiveTranscript('');
      pendingVoiceReplyRef.current = true;
      setVoiceState('processing');
      sendMessage(command.trim(), true);
    },
    [sendMessage]
  );

  const resetSilenceTimer = useCallback(() => {
    clearTimeout(silenceTimerRef.current);
    silenceTimerRef.current = setTimeout(() => {
      if (voiceStateRef.current === 'active' && commandBufferRef.current.trim()) {
        submitVoiceCommand(commandBufferRef.current);
      }
    }, SILENCE_TIMEOUT_MS);
  }, [submitVoiceCommand]);

  const handleFinalResult = useCallback(
    (text) => {
      if (voiceStateRef.current === 'passive') {
        if (!containsWakeWord(text)) return;

        const command = extractCommandAfterWakeWord(text);
        if (command) {
          // Wake word + command in one breath: "Hey Nova, what's the weather"
          submitVoiceCommand(command);
        } else {
          // Wake word alone: switch to active listening and wait for
          // the command in the NEXT utterance.
          commandBufferRef.current = '';
          setVoiceState('active');
          resetSilenceTimer();
        }
        return;
      }

      if (voiceStateRef.current === 'active') {
        commandBufferRef.current = `${commandBufferRef.current} ${text}`.trim();
        setLiveTranscript(commandBufferRef.current);
        resetSilenceTimer();
      }
    },
    [resetSilenceTimer, submitVoiceCommand]
  );

  const handleInterimResult = useCallback(
    (text) => {
      if (voiceStateRef.current === 'active') {
        setLiveTranscript(`${commandBufferRef.current} ${text}`.trim());
        resetSilenceTimer();
      }
    },
    [resetSilenceTimer]
  );

  const { isSupported, startListening, stopListening } = useSpeechRecognition({
    onFinalResult: handleFinalResult,
    onInterimResult: handleInterimResult,
  });

  const toggleVoiceMode = useCallback(() => {
    if (voiceState === 'idle') {
      setVoiceState('passive');
      startListening();
    } else {
      clearTimeout(silenceTimerRef.current);
      commandBufferRef.current = '';
      setLiveTranscript('');
      cancelSpeech();
      stopListening();
      setVoiceState('idle');
    }
  }, [voiceState, startListening, stopListening, cancelSpeech]);

  // Watches for the assistant's reply finishing streaming. If THIS
  // particular reply was triggered by voice, speak it aloud - typed
  // replies never trigger speech, even while voice mode is on.
  useEffect(() => {
    const justFinishedStreaming = prevIsStreamingRef.current && !isStreaming;
    prevIsStreamingRef.current = isStreaming;

    if (!justFinishedStreaming || !pendingVoiceReplyRef.current) return;

    pendingVoiceReplyRef.current = false;
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage || lastMessage.role !== 'assistant' || !lastMessage.content) {
      setVoiceState('passive');
      return;
    }

    // Pause recognition while Nova talks so it doesn't hear itself.
    stopListening();
    setVoiceState('speaking');
    speak(lastMessage.content, {
      onEnd: () => {
        setVoiceState('passive');
        startListening();
      },
    });
  }, [isStreaming, messages, speak, startListening, stopListening]);

  const value = {
    isSupported,
    voiceState, // 'idle' | 'passive' | 'active' | 'processing' | 'speaking'
    liveTranscript,
    toggleVoiceMode,
  };

  return <VoiceContext.Provider value={value}>{children}</VoiceContext.Provider>;
};
