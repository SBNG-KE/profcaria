import type { CSSProperties } from 'react';

type LogoProps = {
  className?: string;
  /** Kept for compatibility while older screens move to the text-only wordmark. */
  markClassName?: string;
  compact?: boolean;
  variant?: 'display' | 'lowercase';
  style?: CSSProperties;
};

function Wordmark({ className = '', variant = 'display', style }: Pick<LogoProps, 'className' | 'variant' | 'style'>) {
  return (
    <span
      className={`profcaria-wordmark whitespace-nowrap font-editorial font-semibold tracking-[-0.035em] ${variant === 'lowercase' ? 'lowercase' : ''} ${className}`}
      style={style}
      aria-label="Profcaria"
    >
      <span>Profcaria</span>
      <svg className="profcaria-wordmark-wave" viewBox="0 0 160 14" preserveAspectRatio="none" aria-hidden="true">
        <path className="profcaria-wordmark-wave-primary" pathLength="1" d="M-12 8 C 4 1, 20 1, 36 8 S 68 15, 84 8 S 116 1, 132 8 S 164 15, 180 8" />
        <path className="profcaria-wordmark-wave-secondary" pathLength="1" d="M-18 9 C -2 15, 14 15, 30 9 S 62 3, 78 9 S 110 15, 126 9 S 158 3, 174 9" />
      </svg>
    </span>
  );
}

/** @deprecated Visible Profcaria branding is now the text-only wordmark. */
export function ProfcariaMark({ className = '', style }: Pick<LogoProps, 'className' | 'style'> & { labelled?: boolean }) {
  return <Wordmark className={className} style={style} />;
}

/** @deprecated Visible Profcaria branding is now the text-only wordmark. */
export function ProfcariaBadge({ className = '' }: Pick<LogoProps, 'className' | 'markClassName'>) {
  return <Wordmark className={className} />;
}

export default function ProfcariaLogo({ className = '', variant = 'display', style }: LogoProps) {
  return <Wordmark className={className} variant={variant} style={style} />;
}
