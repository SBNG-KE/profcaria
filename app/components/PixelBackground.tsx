import React from 'react';

const noiseOpacities = [
    0.01, 0.08, 0.03, 0.12, 0.02, 0.06, 0.10, 0.04,
    0.11, 0.02, 0.07, 0.01, 0.14, 0.03, 0.09, 0.05,
    0.04, 0.09, 0.01, 0.05, 0.08, 0.02, 0.13, 0.07,
    0.15, 0.03, 0.06, 0.11, 0.04, 0.09, 0.01, 0.08,
    0.02, 0.12, 0.05, 0.01, 0.07, 0.03, 0.14, 0.06,
    0.09, 0.04, 0.10, 0.02, 0.05, 0.12, 0.01, 0.08,
    0.03, 0.15, 0.06, 0.09, 0.01, 0.04, 0.11, 0.02,
    0.07, 0.01, 0.08, 0.03, 0.13, 0.05, 0.02, 0.10
];

export const PixelBackground = ({ isDark, className = "absolute inset-0 z-0 pointer-events-none" }: { isDark: boolean; className?: string }) => {
    return (
        <div className={`${className} ${isDark ? 'text-white' : 'text-black'}`}>
            <svg width="100%" height="100%">
                <defs>
                    <pattern id="pixel-noise" x="0" y="0" width="32" height="32" patternUnits="userSpaceOnUse">
                        {noiseOpacities.map((op, i) => {
                            const x = (i % 8) * 4;
                            const y = Math.floor(i / 8) * 4;
                            return (
                                <rect key={i} x={x} y={y} width="4" height="4" fill="currentColor" fillOpacity={isDark ? op : op * 0.7} />
                            );
                        })}
                    </pattern>
                </defs>
                <rect x="0" y="0" width="100%" height="100%" fill="url(#pixel-noise)" />
            </svg>
            {/* Smooth vignette fade out so content stays highly readable */}
            <div className={`absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,${isDark ? '#0A0F1A_100%' : '#FFFFFF_100%'})] opacity-80`} />
        </div>
    );
};
