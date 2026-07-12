import { useId } from 'react';

const noise = [0.03,0.13,0.05,0.16,0.04,0.09,0.14,0.06,0.15,0.04,0.11,0.03,0.18,0.05,0.12,0.08,0.06,0.12,0.03,0.08,0.11,0.04,0.17,0.10,0.19,0.05,0.09,0.15,0.06,0.12,0.03,0.11,0.04,0.16,0.08,0.03,0.10,0.05,0.18,0.09,0.12,0.06,0.14,0.04,0.08,0.16,0.03,0.11,0.05,0.19,0.09,0.12,0.03,0.06,0.15,0.04,0.10,0.03,0.11,0.05,0.17,0.08,0.04,0.14];

export const PixelBackground = ({ isDark, className = 'absolute inset-0 z-0 pointer-events-none' }: { isDark: boolean; className?: string }) => {
  const patternId = `pixels-${useId().replace(/:/g, '')}`;
  return <div className={className} aria-hidden="true" style={{ color: 'var(--pixel-color)' }}>
    <svg width="100%" height="100%"><defs><pattern id={patternId} x="0" y="0" width="32" height="32" patternUnits="userSpaceOnUse">{noise.map((opacity, index) => <rect key={index} x={(index % 8) * 4} y={Math.floor(index / 8) * 4} width="3" height="3" fill="currentColor" fillOpacity={isDark ? opacity * 0.55 : opacity * 0.38} />)}</pattern></defs><rect width="100%" height="100%" fill={`url(#${patternId})`} /></svg>
    <div className="absolute inset-0 opacity-75" style={{ background: 'radial-gradient(circle at center, transparent 0%, var(--bg-primary) 100%)' }} />
  </div>;
};
