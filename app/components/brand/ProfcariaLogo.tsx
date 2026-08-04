import type { CSSProperties } from 'react';

type LogoProps = { className?: string; markClassName?: string; compact?: boolean; variant?: 'display' | 'lowercase'; style?: CSSProperties };

export function ProfcariaMark({ className = '', style, labelled = true }: Pick<LogoProps, 'className' | 'style'> & { labelled?: boolean }) {
  return <span role={labelled ? 'img' : undefined} aria-label={labelled ? 'Profcaria PC mark' : undefined} aria-hidden={labelled ? undefined : true} className={`apex-mark grid aspect-square place-items-center border-[0.12em] border-current font-mono text-[0.32em] font-black tracking-[-0.08em] text-[var(--text-inverse)] ${className}`} style={style}>PC</span>;
}

export function ProfcariaBadge({ className = '', markClassName = '' }: Pick<LogoProps, 'className' | 'markClassName'>) {
  return <span className={className} role="img" aria-label="Profcaria"><ProfcariaMark labelled={false} className={`h-full ${markClassName}`} /></span>;
}

export default function ProfcariaLogo({ className = '', markClassName = '', compact = false, variant = 'display', style }: LogoProps) {
  if (compact) return <ProfcariaMark className={markClassName || className} style={style} />;
  return <span className={`inline-flex items-center gap-[0.38em] whitespace-nowrap font-mono font-black ${variant === 'lowercase' ? 'lowercase' : 'uppercase'} ${className}`} style={style} role="img" aria-label="Profcaria"><ProfcariaMark labelled={false} className={`h-[1.2em] ${markClassName}`} /><span>Profcaria</span></span>;
}
