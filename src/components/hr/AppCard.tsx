'use client';
import { ReactNode, CSSProperties } from 'react';

interface AppCardProps {
  children: ReactNode;
  padding?: string;
  style?: CSSProperties;
  onClick?: () => void;
}

export function AppCard({ children, padding = '16px', style, onClick }: AppCardProps) {
  return (
    <div
      onClick={onClick}
      style={{
        background: '#fff',
        borderRadius: 16,
        padding,
        boxShadow: '0 1px 8px rgba(25,118,210,0.06)',
        border: '1px solid #EEF2F7',
        overflow: 'hidden',
        ...(onClick ? { cursor: 'pointer', WebkitTapHighlightColor: 'transparent' } : {}),
        ...style,
      }}
    >
      {children}
    </div>
  );
}
