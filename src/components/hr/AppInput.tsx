'use client';
import { InputHTMLAttributes, TextareaHTMLAttributes, forwardRef } from 'react';

interface AppInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

interface AppTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

const inputBase: React.CSSProperties = {
  padding: '11px 13px',
  borderRadius: 8,
  border: '1px solid var(--border)',
  fontSize: 14,
  color: 'var(--text)',
  background: 'var(--surface)',
  outline: 'none',
  fontFamily: 'inherit',
  width: '100%',
  transition: 'border-color 0.12s',
  lineHeight: 1.5,
};

export const AppInput = forwardRef<HTMLInputElement, AppInputProps>(
  ({ label, error, style, ...props }, ref) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      {label && (
        <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-2)' }}>{label}</label>
      )}
      <input
        ref={ref}
        {...props}
        style={{
          ...inputBase,
          borderColor: error ? 'var(--red)' : 'var(--border)',
          ...style,
        }}
        onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--blue)'; props.onFocus?.(e); }}
        onBlur={(e)  => { e.currentTarget.style.borderColor = error ? 'var(--red)' : 'var(--border)'; props.onBlur?.(e); }}
      />
      {error && <div style={{ fontSize: 12, color: 'var(--red)' }}>{error}</div>}
    </div>
  )
);
AppInput.displayName = 'AppInput';

export const AppTextarea = forwardRef<HTMLTextAreaElement, AppTextareaProps>(
  ({ label, error, style, ...props }, ref) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      {label && (
        <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-2)' }}>{label}</label>
      )}
      <textarea
        ref={ref}
        {...props}
        style={{
          ...inputBase,
          borderColor: error ? 'var(--red)' : 'var(--border)',
          resize: 'none',
          minHeight: 80,
          ...style,
        }}
        onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--blue)'; props.onFocus?.(e); }}
        onBlur={(e)  => { e.currentTarget.style.borderColor = error ? 'var(--red)' : 'var(--border)'; props.onBlur?.(e); }}
      />
      {error && <div style={{ fontSize: 12, color: 'var(--red)' }}>{error}</div>}
    </div>
  )
);
AppTextarea.displayName = 'AppTextarea';
