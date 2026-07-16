import type { CSSProperties } from 'react';

type LogoProps = {
  className?: string;
  markClassName?: string;
  compact?: boolean;
  variant?: 'display' | 'lowercase';
  style?: CSSProperties;
};

export function OndwiraMark({ className = '', style, labelled = true }: Pick<LogoProps, 'className' | 'style'> & { labelled?: boolean }) {
  return (
    <svg
      viewBox="0 0 72 88"
      role={labelled ? 'img' : undefined}
      aria-label={labelled ? 'Ondwira detached D' : undefined}
      aria-hidden={labelled ? undefined : true}
      className={className}
      style={style}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M15 9V79" stroke="currentColor" strokeWidth="7" strokeLinecap="square" />
      <path
        d="M29 13H34.5C54.1 13 65 24.7 65 44C65 63.3 54.1 75 34.5 75H29"
        stroke="currentColor"
        strokeWidth="7"
        strokeLinecap="square"
      />
      <path d="M15 44H25" stroke="currentColor" strokeWidth="3" />
    </svg>
  );
}

export function OndwiraBadge({ className = '', markClassName = '' }: Pick<LogoProps, 'className' | 'markClassName'>) {
  return (
    <span className={`grid place-items-center overflow-hidden bg-[var(--accent-primary)] text-[var(--text-inverse)] ${className}`} role="img" aria-label="Ondwira">
      <OndwiraMark labelled={false} className={`h-[76%] w-[62%] ${markClassName}`} />
    </span>
  );
}

export default function OndwiraLogo({ className = '', markClassName = '', compact = false, variant = 'display', style }: LogoProps) {
  if (compact) return <OndwiraMark className={markClassName || className} style={style} />;

  const lowercase = variant === 'lowercase';
  return (
    <span className={`inline-flex items-center whitespace-nowrap ${className}`} style={style} role="img" aria-label="Ondwira">
      <span className={lowercase ? 'font-sans text-[1em] font-black tracking-[-0.055em]' : 'font-editorial text-[1.04em] font-semibold tracking-[0.12em]'}>{lowercase ? 'on' : 'ON'}</span>
      <OndwiraMark labelled={false} className={`${lowercase ? 'mx-[0.01em] h-[1.12em] w-[0.76em]' : 'mx-[0.08em] h-[1.18em] w-[0.9em]'} shrink-0 ${markClassName}`} />
      <span className={lowercase ? 'font-sans text-[1em] font-black tracking-[-0.055em]' : 'font-editorial text-[1.04em] font-semibold tracking-[0.12em]'}>{lowercase ? 'wira' : 'WIRA'}</span>
    </span>
  );
}
