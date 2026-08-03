// src/components/voice/VoiceOrb.jsx
// -----------------------------------------------------------------------
// The same signature dot from Loader/AuthLayout/headers, now reactive:
// amber = passive/active listening, violet = processing/speaking,
// dim/static = idle. This is what gives the voice feature a visual
// "home" rather than being just an icon-state change on a button.
// -----------------------------------------------------------------------

const STATE_STYLES = {
  idle: { ring: 'bg-ink-faint/20', core: 'bg-ink-faint', animate: '' },
  passive: { ring: 'bg-nova-amber/25', core: 'bg-nova-amber shadow-glow', animate: 'animate-breathe' },
  active: { ring: 'bg-nova-amber/40', core: 'bg-nova-amber shadow-glow', animate: 'animate-burst' },
  processing: { ring: 'bg-signal-violet/30', core: 'bg-signal-violet shadow-glow-violet', animate: 'animate-breathe' },
  speaking: { ring: 'bg-signal-violet/40', core: 'bg-signal-violet shadow-glow-violet', animate: 'animate-burst' },
};

export const VoiceOrb = ({ state = 'idle', size = 'md' }) => {
  const styles = STATE_STYLES[state] || STATE_STYLES.idle;
  const dimensions = size === 'lg' ? 'h-16 w-16' : 'h-8 w-8';
  const coreInset = size === 'lg' ? 'inset-4' : 'inset-2';

  return (
    <div className={`relative ${dimensions}`}>
      <div className={`absolute inset-0 rounded-full ${styles.ring} ${styles.animate}`} />
      <div className={`absolute ${coreInset} rounded-full transition-colors duration-300 ${styles.core}`} />
    </div>
  );
};
