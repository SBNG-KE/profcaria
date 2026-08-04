import type { CSSProperties } from 'react';

type LogoProps = { className?: string; markClassName?: string; compact?: boolean; variant?: 'display' | 'lowercase'; style?: CSSProperties };

export function ProfcariaMark({ className = '', style, labelled = true }: Pick<LogoProps, 'className' | 'style'> & { labelled?: boolean }) {
  return <span role={labelled ? 'img' : undefined} aria-label={labelled ? 'Profcaria PC mark' : undefined} aria-hidden={labelled ? undefined : true} className={`profcaria-mark grid aspect-square place-items-center font-editorial text-[0.42em] font-semibold tracking-[-0.06em] text-[var(--accent-primary)] ${className}`} style={style}><span className="relative z-10 text-[var(--text-inverse)]">PC</span></span>;
}

export function ProfcariaBadge({ className = '', markClassName = '' }: Pick<LogoProps, 'className' | 'markClassName'>) {
  return <span className={className} role="img" aria-label="Profcaria"><ProfcariaMark labelled={false} className={`h-full ${markClassName}`} /></span>;
}

export default function ProfcariaLogo({ className = '', markClassName = '', compact = false, variant = 'display', style }: LogoProps) {
  if (compact) return <ProfcariaMark className={markClassName || className} style={style} />;
  return <span className={`inline-flex items-center gap-[0.42em] whitespace-nowrap font-editorial font-semibold tracking-[-0.035em] ${variant === 'lowercase' ? 'lowercase' : ''} ${className}`} style={style} role="img" aria-label="Profcaria"><ProfcariaMark labelled={false} className={`h-[1.2em] ${markClassName}`} /><span>Profcaria</span></span>;
}
