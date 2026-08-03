// src/components/voice/MicButton.jsx
// -----------------------------------------------------------------------
// Replaces the disabled mic placeholder Module 7 left in ChatWindow.
// Gracefully disables itself (with an explanatory tooltip) on browsers
// that don't support the Web Speech API, rather than pretending to work.
// -----------------------------------------------------------------------

import { useVoice } from '../../hooks/useVoice.js';
import { VoiceOrb } from './VoiceOrb.jsx';

const STATE_LABELS = {
  idle: 'Tap to enable voice control',
  passive: 'Listening for "Nova"...',
  active: 'Listening to you...',
  processing: 'Thinking...',
  speaking: 'Speaking...',
};

export const MicButton = () => {
  const { isSupported, voiceState, toggleVoiceMode } = useVoice();

  if (!isSupported) {
    return (
      <button
        type="button"
        disabled
        title="Voice control isn't supported in this browser - try Chrome or Edge"
        className="shrink-0 rounded-full p-2 text-ink-faint opacity-50"
      >
        🎙
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleVoiceMode}
      title={STATE_LABELS[voiceState]}
      aria-label={STATE_LABELS[voiceState]}
      className="shrink-0 rounded-full p-1 transition-transform hover:scale-105"
    >
      <VoiceOrb state={voiceState} size="md" />
    </button>
  );
};
