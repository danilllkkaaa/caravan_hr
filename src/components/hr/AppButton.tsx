'use client';
import { ReactNode, CSSProperties } from 'react';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';

interface AppButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: Variant;
  fullWidth?: boolean;
  disabled?: boolean;
  icon?: ReactNode;
  style?: CSSProperties;
  type?: 'button' | 'submit' | 'reset';
}

const VARIANT: Record<Variant, CSSProperties> = {
  primary: {
    background: 'var(--blue)',
    color: '#fff',
    border: 'none',
  },
  secondary: {
    background: 'var(--surface)',
    color: 'var(--text)',
    border: '1px solid var(--border)',
  },
  danger: {
    background: 'var(--red-surface)',
    color: 'var(--red)',
    border: '1px solid var(--red-border)',
  },
  ghost: {
    background: 'transparent',
    color: 'var(--blue)',
    border: 'none',
  },
};

export function AppButton({
  children, onClick, variant = 'primary', fullWidth = false,
  disabled = false, icon, style, type = 'button',
}: AppButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding: '13px 20px',
        borderRadius: 10,
        fontSize: 14,
        fontWeight: 600,
        fontFamily: 'inherit',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.7 : 1,
        width: fullWidth ? '100%' : undefined,
        transition: 'opacity 0.12s',
        WebkitTapHighlightColor: 'transparent',
        letterSpacing: '-0.01em',
        ...VARIANT[variant],
        ...style,
      }}
    >
      {icon && <span style={{ display: 'flex', alignItems: 'center' }}>{icon}</span>}
      {children}
    </button>
  );
}
