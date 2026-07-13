import type { CSSProperties } from 'react';

type LogoProps = {
  className?: string;
  markClassName?: string;
  compact?: boolean;
  style?: CSSProperties;
};

export function OndwiraMark({ className = '', style }: Pick<LogoProps, 'className' | 'style'>) {
  return (
    <svg
      viewBox="0 0 72 88"
      role="img"
      aria-label="Ondwira detached D"
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

export default function OndwiraLogo({ className = '', markClassName = '', compact = false, style }: LogoProps) {
  if (compact) return <OndwiraMark className={markClassName || className} style={style} />;

  return (
    <span className={`inline-flex items-center ${className}`} style={style} aria-label="Ondwira">
      <span className="font-editorial text-[1.04em] font-semibold tracking-[0.12em]">ON</span>
      <OndwiraMark className={`mx-[0.08em] h-[1.18em] w-[0.9em] shrink-0 ${markClassName}`} />
      <span className="font-editorial text-[1.04em] font-semibold tracking-[0.12em]">WIRA</span>
    </span>
  );
}
