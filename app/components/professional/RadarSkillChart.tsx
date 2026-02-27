"use client"

import React, { useMemo } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';

interface RadarSkillChartProps {
    isDark: boolean;
    skills?: any[];
}

export default function RadarSkillChart({ isDark, skills = [] }: RadarSkillChartProps) {
    // Generate pseudo-AI scores based on the quantity and naming of the user's actual skills
    const chartData = useMemo(() => {
        if (!skills || skills.length === 0) {
            // Default visually engaging state if no skills exist
            return [
                { subject: 'Depth', score: 65, fullMark: 100 },
                { subject: 'Execution Speed', score: 70, fullMark: 100 },
                { subject: 'Collaboration Index', score: 60, fullMark: 100 },
                { subject: 'Creativity', score: 75, fullMark: 100 },
            ];
        }

        // Logic to generate somewhat realistic scores based on user's skills
        // E.g., More skills = higher base score.
        // If skill names suggest specific traits, boost them.
        let baseScore = Math.min(60 + (skills.length * 2), 90);

        const techKeywords = ['react', 'node', 'python', 'java', 'sql', 'aws', 'docker'];
        const creativeKeywords = ['design', 'ui', 'ux', 'writing', 'video', 'art'];
        const collabKeywords = ['agile', 'scrum', 'management', 'leadership', 'team'];

        const skillStr = skills.map(s => s.name?.toLowerCase() || '').join(' ');

        let depthBoost = techKeywords.some(k => skillStr.includes(k)) ? 10 : 0;
        let creativeBoost = creativeKeywords.some(k => skillStr.includes(k)) ? 15 : 0;
        let collabBoost = collabKeywords.some(k => skillStr.includes(k)) ? 15 : 0;

        // Ensure natural variation and cap at 98
        return [
            {
                subject: 'Depth',
                score: Math.min(baseScore + depthBoost + Math.floor(Math.random() * 5), 98),
                fullMark: 100
            },
            {
                subject: 'Execution Speed',
                score: Math.min(baseScore + Math.floor(Math.random() * 8), 96),
                fullMark: 100
            },
            {
                subject: 'Collaboration Index',
                score: Math.min(baseScore + collabBoost + Math.floor(Math.random() * 6), 95),
                fullMark: 100
            },
            {
                subject: 'Creativity',
                score: Math.min(baseScore + creativeBoost + Math.floor(Math.random() * 10), 99),
                fullMark: 100
            },
        ];
    }, [skills]);

    return (
        <div className="w-full relative min-h-[300px] h-[350px] md:h-[400px] flex items-center justify-center">
            {/* Glow effect behind the chart */}
            <div className="absolute inset-0 m-auto w-3/4 h-3/4 bg-blue-500/20 blur-[80px] rounded-full mix-blend-screen pointer-events-none"></div>

            <ResponsiveContainer width="100%" height="100%">
                <RadarChart
                    cx="50%"
                    cy="50%"
                    outerRadius="65%" // Slightly reduced to ensure labels have room on mobile
                    data={chartData}
                >
                    <PolarGrid
                        stroke={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}
                        strokeDasharray="4 4"
                    />
                    <PolarAngleAxis
                        dataKey="subject"
                        tick={{
                            fill: isDark ? '#f8fafc' : '#0f172a', // Brighter contrast
                            fontSize: 12,
                            fontWeight: 800,
                            fontFamily: 'inherit',
                            opacity: 0.9
                        }}
                        tickSize={12} // Push labels slightly outwards
                    />
                    <PolarRadiusAxis
                        angle={30}
                        domain={[0, 100]}
                        tick={false}
                        axisLine={false}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: isDark ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                            borderRadius: '16px',
                            border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.05)',
                            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                            backdropFilter: 'blur(8px)',
                            padding: '12px 16px'
                        }}
                        itemStyle={{ color: '#3b82f6', fontWeight: '900', fontSize: '14px' }}
                        labelStyle={{ color: isDark ? '#94a3b8' : '#64748b', fontWeight: '600', marginBottom: '4px' }}
                    />
                    <Radar
                        name="AI Career Score"
                        dataKey="score"
                        stroke="#3b82f6"
                        strokeWidth={4}
                        fill="url(#colorScore)"
                        fillOpacity={1}
                        isAnimationActive={true}
                        animationBegin={200}
                        animationDuration={1500}
                        animationEasing="ease-out"
                    />
                    {/* Secondary reference layer */}
                    <Radar
                        name="Industry Average"
                        dataKey="fullMark"
                        stroke={isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'}
                        strokeWidth={1}
                        fill="transparent"
                        strokeDasharray="4 4"
                        isAnimationActive={false}
                    />

                    {/* Sexy Gradient Definition */}
                    <defs>
                        <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.6} />
                            <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.1} />
                        </linearGradient>
                    </defs>
                </RadarChart>
            </ResponsiveContainer>
        </div>
    );
}
