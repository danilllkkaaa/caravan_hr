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

const styles: Record<Variant, CSSProperties> = {
  primary: {
    background: 'linear-gradient(135deg, #1976D2 0%, #1565C0 100%)',
    color: '#fff',
    border: 'none',
    boxShadow: '0 2px 12px rgba(25,118,210,0.35)',
  },
  secondary: {
    background: '#F0F4F8',
    color: '#1976D2',
    border: '1.5px solid #E0E7EF',
    boxShadow: 'none',
  },
  danger: {
    background: '#FEF2F2',
    color: '#E53935',
    border: '1.5px solid #FECACA',
    boxShadow: 'none',
  },
  ghost: {
    background: 'transparent',
    color: '#1976D2',
    border: 'none',
    boxShadow: 'none',
  },
};

export function AppButton({
  children,
  onClick,
  variant = 'primary',
  fullWidth = false,
  disabled = false,
  icon,
  style,
  type = 'button',
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
        padding: '14px 20px',
        borderRadius: 14,
        fontSize: 15,
        fontWeight: 700,
        fontFamily: 'inherit',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        width: fullWidth ? '100%' : undefined,
        transition: 'opacity 0.15s, transform 0.1s',
        WebkitTapHighlightColor: 'transparent',
        ...styles[variant],
        ...style,
      }}
    >
      {icon && <span style={{ fontSize: 18 }}>{icon}</span>}
      {children}
    </button>
  );
}
