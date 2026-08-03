// src/hooks/useVoice.js
import { useContext } from 'react';
import { VoiceContext } from '../context/VoiceContext.jsx';

export const useVoice = () => {
  const context = useContext(VoiceContext);
  if (!context) {
    throw new Error('useVoice must be used within a <VoiceProvider>');
  }
  return context;
};
