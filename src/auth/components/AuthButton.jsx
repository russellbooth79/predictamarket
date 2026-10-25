/**
 * AuthButton.jsx
 *
 * Reusable button for auth flows. Handles four visual variants and three
 * interaction states (default, loading, disabled) in one place so all auth
 * screens stay visually consistent.
 *
 * Variants:
 *   primary-gradient  — CTA buttons (send code, create account)
 *   social-apple      — White Apple SSO button
 *   social-google     — Dark-tinted Google SSO button
 *   outline           — Secondary actions (skip, cancel)
 *
 * The scale press animation uses Framer Motion so it's consistent with
 * the rest of the motion system in this prototype. In production you'd
 * reach for a CSS active:scale-[0.97] instead to avoid JS overhead.
 */

import { motion } from 'framer-motion';

const VARIANTS = {
  'primary-gradient': {
    background: 'linear-gradient(135deg, #6C63FF 0%, #B06FFF 100%)',
    color: '#F0F6FF',
    border: 'none',
    boxShadow: '0 4px 20px rgba(108,99,255,0.35)',
  },
  'social-apple': {
    background: '#FFFFFF',
    color: '#000000',
    border: 'none',
    boxShadow: 'none',
  },
  'social-google': {
    background: 'rgba(255,255,255,0.05)',
    color: '#F0F6FF',
    border: '1px solid rgba(255,255,255,0.12)',
    boxShadow: 'none',
  },
  'outline': {
    background: 'transparent',
    color: '#7B8CAA',
    border: '1px solid rgba(255,255,255,0.12)',
    boxShadow: 'none',
  },
};

export default function AuthButton({
  variant = 'primary-gradient',
  loading = false,
  disabled = false,
  onClick,
  children,
  className = '',
  type = 'button',
}) {
  const styles = VARIANTS[variant];
  const isDisabled = disabled || loading;

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      whileTap={isDisabled ? {} : { scale: 0.97 }}
      transition={{ duration: 0.1 }}
      className={`w-full flex items-center justify-center gap-2.5 rounded-xl font-semibold text-base transition-opacity ${className}`}
      style={{
        height: '56px',
        ...styles,
        opacity: isDisabled ? 0.45 : 1,
        cursor: isDisabled ? 'not-allowed' : 'pointer',
      }}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <LoadingSpinner color={variant === 'social-apple' ? '#000' : '#F0F6FF'} />
          <span>Please wait…</span>
        </span>
      ) : (
        children
      )}
    </motion.button>
  );
}

function LoadingSpinner({ color = '#F0F6FF' }) {
  return (
    <svg
      className="animate-spin"
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="9" cy="9" r="7"
        stroke={color}
        strokeOpacity="0.25"
        strokeWidth="2"
      />
      <path
        d="M9 2a7 7 0 0 1 7 7"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
