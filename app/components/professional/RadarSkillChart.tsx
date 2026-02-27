"use client"

import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';

interface RadarSkillChartProps {
    isDark: boolean;
    // We can allow passing data later when the AI grading is implemented
    data?: any[];
}

export default function RadarSkillChart({ isDark, data }: RadarSkillChartProps) {
    // Mocked immersive data for the "Lifelong Career AI" feature until backend is ready
    const defaultData = [
        { subject: 'Depth', score: 85, fullMark: 100 },
        { subject: 'Execution Speed', score: 92, fullMark: 100 },
        { subject: 'Collaboration Index', score: 88, fullMark: 100 },
        { subject: 'Creativity', score: 95, fullMark: 100 },
    ];

    const chartData = data && data.length > 0 ? data : defaultData;

    return (
        <div className="w-full h-[300px] md:h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
                    <PolarGrid
                        stroke={isDark ? '#404040' : '#e5e7eb'}
                        strokeDasharray="3 3"
                    />
                    <PolarAngleAxis
                        dataKey="subject"
                        tick={{
                            fill: isDark ? '#d4d4d8' : '#3f3f46',
                            fontSize: 12,
                            fontWeight: 700,
                            fontFamily: 'inherit'
                        }}
                    />
                    <PolarRadiusAxis
                        angle={30}
                        domain={[0, 100]}
                        tick={false}
                        axisLine={false}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: isDark ? '#171717' : '#ffffff',
                            borderRadius: '12px',
                            border: isDark ? '1px solid #262626' : '1px solid #e5e7eb',
                            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                        }}
                        itemStyle={{ color: '#3b82f6', fontWeight: 'bold' }}
                    />
                    <Radar
                        name="AI Career Score"
                        dataKey="score"
                        stroke="#3b82f6"
                        strokeWidth={3}
                        fill="#3b82f6"
                        fillOpacity={0.35}
                        isAnimationActive={true}
                        animationBegin={200}
                        animationDuration={2000}
                        animationEasing="ease-out"
                    />
                    {/* Add a second radar layer for "Industry Average" visually addictive feel */}
                    <Radar
                        name="Industry Average"
                        dataKey="fullMark"
                        stroke={isDark ? '#525252' : '#d4d4d8'}
                        strokeWidth={1}
                        fill="transparent"
                        strokeDasharray="5 5"
                        isAnimationActive={false}
                    />
                </RadarChart>
            </ResponsiveContainer>
        </div>
    );
}
