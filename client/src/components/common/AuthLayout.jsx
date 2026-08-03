// src/components/common/AuthLayout.jsx
// -----------------------------------------------------------------------
// Shared visual shell for Login/Register: a centred card floating over
// an ambient radial glow, echoing the voice-orb signature before the
// user has even logged in. Extracted here so Login and Register never
// duplicate this background treatment.
// -----------------------------------------------------------------------

export const AuthLayout = ({ children }) => (
  <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-void px-4">
    {/* Ambient nova-burst glow, positioned off-center for visual interest */}
    <div
      aria-hidden="true"
      className="pointer-events-none absolute -top-40 left-1/2 h-[560px] w-[560px] -translate-x-1/2 rounded-full bg-nova-amber/20 blur-3xl"
    />
    <div
      aria-hidden="true"
      className="pointer-events-none absolute bottom-[-200px] right-[-100px] h-[420px] w-[420px] rounded-full bg-signal-violet/20 blur-3xl"
    />

    <div className="relative z-10 w-full max-w-md">
      <div className="mb-8 flex items-center justify-center gap-2">
        <div className="h-2.5 w-2.5 rounded-full bg-nova-amber shadow-glow" />
        <span className="font-display text-xl font-semibold tracking-tight">NOVA</span>
      </div>
      <div className="rounded-2xl border border-hairline bg-surface/80 p-8 backdrop-blur-sm shadow-xl">{children}</div>
    </div>
  </div>
);
