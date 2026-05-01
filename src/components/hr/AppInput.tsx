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

export const AppInput = forwardRef<HTMLInputElement, AppInputProps>(
  ({ label, error, style, ...props }, ref) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {label && (
        <label style={{ fontSize: 13, fontWeight: 600, color: '#546E7A' }}>{label}</label>
      )}
      <input
        ref={ref}
        {...props}
        style={{
          padding: '12px 14px',
          borderRadius: 12,
          border: error ? '1.5px solid #E53935' : '1.5px solid #E0E7EF',
          fontSize: 15,
          color: '#1A2332',
          background: '#fff',
          outline: 'none',
          fontFamily: 'inherit',
          width: '100%',
          transition: 'border-color 0.15s',
          ...style,
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = '#1976D2';
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = error ? '#E53935' : '#E0E7EF';
          props.onBlur?.(e);
        }}
      />
      {error && <div style={{ fontSize: 12, color: '#E53935' }}>{error}</div>}
    </div>
  )
);
AppInput.displayName = 'AppInput';

export const AppTextarea = forwardRef<HTMLTextAreaElement, AppTextareaProps>(
  ({ label, error, style, ...props }, ref) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {label && (
        <label style={{ fontSize: 13, fontWeight: 600, color: '#546E7A' }}>{label}</label>
      )}
      <textarea
        ref={ref}
        {...props}
        style={{
          padding: '12px 14px',
          borderRadius: 12,
          border: error ? '1.5px solid #E53935' : '1.5px solid #E0E7EF',
          fontSize: 15,
          color: '#1A2332',
          background: '#fff',
          outline: 'none',
          fontFamily: 'inherit',
          width: '100%',
          resize: 'none',
          minHeight: 80,
          transition: 'border-color 0.15s',
          ...style,
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = '#1976D2';
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = error ? '#E53935' : '#E0E7EF';
          props.onBlur?.(e);
        }}
      />
      {error && <div style={{ fontSize: 12, color: '#E53935' }}>{error}</div>}
    </div>
  )
);
AppTextarea.displayName = 'AppTextarea';
