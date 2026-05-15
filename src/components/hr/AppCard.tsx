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
        background: 'var(--surface)',
        borderRadius: 12,
        padding,
        border: '1px solid var(--border)',
        overflow: 'hidden',
        ...(onClick ? { cursor: 'pointer', WebkitTapHighlightColor: 'transparent', active: { background: 'var(--bg)' } } : {}),
        ...style,
      }}
    >
      {children}
    </div>
  );
}
