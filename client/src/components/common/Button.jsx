// src/components/common/Button.jsx
// -----------------------------------------------------------------------
// One reusable button covering every variant the app needs, so
// spacing/radius/font-weight decisions live in exactly one place
// instead of being repeated (and drifting) across every page.
// -----------------------------------------------------------------------

const VARIANTS = {
  primary: 'bg-nova-amber text-void hover:bg-nova-amber-bright font-semibold',
  secondary: 'bg-surface-raised text-ink hover:bg-hairline border border-hairline',
  ghost: 'bg-transparent text-ink-muted hover:text-ink',
};

export const Button = ({ variant = 'primary', className = '', isLoading = false, children, disabled, ...props }) => (
  <button
    disabled={disabled || isLoading}
    className={`inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50 ${VARIANTS[variant]} ${className}`}
    {...props}
  >
    {isLoading ? 'Please wait...' : children}
  </button>
);
