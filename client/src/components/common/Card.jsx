// src/components/common/Card.jsx
// -----------------------------------------------------------------------
// One consistent card shell for every dashboard widget - spacing,
// border, and heading treatment live here once instead of being
// repeated (and drifting) across five different widget files.
// -----------------------------------------------------------------------

export const Card = ({ title, action, children }) => (
  <div className="rounded-2xl border border-hairline bg-surface p-5">
    <div className="mb-4 flex items-center justify-between">
      <h2 className="font-display text-base font-semibold">{title}</h2>
      {action}
    </div>
    {children}
  </div>
);
