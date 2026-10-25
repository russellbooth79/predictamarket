/**
 * FormField.jsx
 *
 * Labelled input field with focus ring, error state, and optional trailing element.
 * Used by all signup form inputs to guarantee consistent styling across steps.
 *
 * The focus ring uses a box-shadow rather than CSS outline so it can be coloured
 * independently from the border — this matches the design token spec
 * (border: #6C63FF + glow rgba(108,99,255,0.15) 3px spread).
 */

import { useState } from 'react';

export default function FormField({
  label,
  id,
  error,
  hint,
  trailing,       // optional JSX element rendered on the right of the input row
  className = '',
  inputClassName = '',
  ...inputProps   // passed through to <input> — type, value, onChange, placeholder, etc.
}) {
  const [focused, setFocused] = useState(false);

  const borderColor = error
    ? '#FF3366'
    : focused
      ? '#6C63FF'
      : 'rgba(255,255,255,0.1)';

  const boxShadow = error
    ? '0 0 0 3px rgba(255,51,102,0.12)'
    : focused
      ? '0 0 0 3px rgba(108,99,255,0.15)'
      : 'none';

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label
          htmlFor={id}
          className="text-sm font-medium"
          style={{ color: '#7B8CAA' }}
        >
          {label}
        </label>
      )}

      <div className="relative flex items-center">
        <input
          id={id}
          {...inputProps}
          onFocus={(e) => {
            setFocused(true);
            inputProps.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            inputProps.onBlur?.(e);
          }}
          className={`w-full rounded-xl px-4 text-base bg-transparent outline-none transition-all duration-150 ${inputClassName}`}
          style={{
            height: '56px',
            color: '#F0F6FF',
            border: `1.5px solid ${borderColor}`,
            boxShadow,
            background: 'rgba(255,255,255,0.04)',
            caretColor: '#6C63FF',
            // Apply trailing padding if a trailing element is present
            paddingRight: trailing ? '100px' : undefined,
          }}
        />

        {trailing && (
          <div className="absolute right-2">
            {trailing}
          </div>
        )}
      </div>

      {error && (
        <p className="text-xs" style={{ color: '#FF3366' }}>{error}</p>
      )}
      {hint && !error && (
        <p className="text-xs" style={{ color: '#7B8CAA' }}>{hint}</p>
      )}
    </div>
  );
}
