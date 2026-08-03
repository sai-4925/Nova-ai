// src/components/common/Loader.jsx
// -----------------------------------------------------------------------
// The breathing orb is NOVA's signature visual element - introduced
// here in its calmest state (idle loading) so the same shape can later
// intensify into the "listening/bursting" animation in the voice
// assistant UI (later module) without feeling like a new component.
// -----------------------------------------------------------------------

export const Loader = ({ label = 'Loading...' }) => (
  <div className="flex flex-col items-center gap-4">
    <div className="relative h-14 w-14">
      <div className="absolute inset-0 rounded-full bg-nova-amber/30 animate-breathe" />
      <div className="absolute inset-3 rounded-full bg-nova-amber shadow-glow" />
    </div>
    <p className="font-mono text-xs tracking-wide text-ink-muted">{label}</p>
  </div>
);
