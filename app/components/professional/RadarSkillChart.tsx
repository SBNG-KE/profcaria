"use client"

import React, { useMemo, useState } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { Info } from 'lucide-react';

interface RadarSkillChartProps {
    isDark: boolean;
    skills?: any[];
    employmentHistory?: any[];
    otherProfiles?: any[];
    aiRadarStats?: any;
    onGenerateAIScore?: () => void;
    isGenerating?: boolean;
    readOnly?: boolean;
}

// Data structures for the label explanations
const METRIC_DEFINITIONS: Record<string, { desc: string, logic: string }> = {
    'Depth': {
        desc: 'Measures your technical understanding and mastery of core languages, frameworks, and tools.',
        logic: 'AI generated metric based on complex backend skills, systems architecture, and robust technical presence.'
    },
    'Execution Speed': {
        desc: 'Estimates how rapidly you can prototype, build, and deploy high-quality solutions.',
        logic: 'AI generated metric based on velocity of delivery, agile frontend frameworks, and rapid transitions.'
    },
    'Collaboration Index': {
        desc: 'Evaluates your ability to work within teams, across disciplines, and lead projects.',
        logic: 'AI generated metric boosted by stability/tenure, leadership roles, and teamwork tools like Jira or Slack.'
    },
    'Creativity': {
        desc: 'Assesses your innovative problem-solving and focus on user experience and design.',
        logic: 'AI generated metric enhanced by UI/UX skills, external portfolios, writing, and creative problem solving.'
    }
};

export default function RadarSkillChart({
    isDark,
    skills = [],
    employmentHistory = [],
    otherProfiles = [],
    aiRadarStats,
    onGenerateAIScore,
    isGenerating,
    readOnly
}: RadarSkillChartProps) {
    const [hoveredLabel, setHoveredLabel] = useState<string | null>(null);

    // Use AI Generated stats if they exist in the DB, otherwise render a zero'd out or fallback state
    const chartData = useMemo(() => {
        if (aiRadarStats) {
            return [
                { subject: 'Depth', score: aiRadarStats.depth_score || 0 },
                { subject: 'Execution Speed', score: aiRadarStats.execution_speed || 0 },
                { subject: 'Collaboration Index', score: aiRadarStats.collaboration_index || 0 },
                { subject: 'Creativity', score: aiRadarStats.creativity_score || 0 },
            ];
        }

        // Empty state when no AI generation has run yet
        return [
            { subject: 'Depth', score: 0 },
            { subject: 'Execution Speed', score: 0 },
            { subject: 'Collaboration Index', score: 0 },
            { subject: 'Creativity', score: 0 },
        ];
    }, [aiRadarStats]);


    // Custom tick component to handle hover events directly on the SVG text labels
    const CustomTick = (props: any) => {
        const { payload, x, y, textAnchor, stroke, radius } = props;

        // Add X offset to pull Execution Speed further right, and Creativity further left
        // textAnchor is 'start' for the right side (Execution speed) and 'end' for left (Creativity)
        let xOffset = 0;
        if (textAnchor === 'start') xOffset = 8;
        if (textAnchor === 'end') xOffset = -8;

        const yOffset = y > 150 ? 10 : (y < 150 ? -10 : 0);

        return (
            <g
                className="cursor-pointer"
                onMouseEnter={() => setHoveredLabel(payload.value)}
                onMouseLeave={() => setHoveredLabel(null)}
            >
                {/* Transparent hitbox for much smoother hover retention */}
                <rect
                    x={x + xOffset - (textAnchor === 'end' ? 60 : (textAnchor === 'middle' ? 30 : 0))}
                    y={y + yOffset - 15}
                    width={textAnchor === 'middle' ? 80 : 100}
                    height={30}
                    fill="transparent"
                />
                <text
                    x={x + xOffset}
                    y={y + yOffset}
                    dy={4} // Vertically center the text
                    textAnchor={textAnchor}
                    fill={isDark ? '#f8fafc' : '#0f172a'}
                    fontSize={12}
                    fontWeight={800}
                    fontFamily="inherit"
                    className="transition-opacity hover:opacity-80"
                >
                    {payload.value}
                </text>
            </g>
        );
    };

    // Custom Tooltip for the Radar Points (matches the user's screenshot layout)
    const CustomRadarTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className={`p-4 rounded-2xl shadow-xl backdrop-blur-md border ${isDark ? 'bg-slate-900/90 border-slate-700/50' : 'bg-white/95 border-neutral-200'}`}>
                    <h5 className={`font-bold text-sm mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>{data.subject}</h5>
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-[13px] font-bold text-neutral-400">
                            <span>Score : </span>
                            <span>{data.score}</span>
                        </div>
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="w-full relative min-h-[350px] h-[400px] md:h-[450px] flex items-center justify-center p-4">

            {/* Contextual UI: Explain to the user that AI is being used */}
            <div className={`absolute top-4 left-4 right-4 flex flex-col items-center justify-center text-center gap-2 text-xs z-10 opacity-90 rounded-2xl p-4 ${isDark ? 'bg-slate-900/60 border border-slate-700/50' : 'bg-white/60 border border-slate-200'} backdrop-blur-md`}>
                <div className="flex items-center justify-center gap-2 w-full">
                    <Info size={14} className="shrink-0 text-blue-500" />
                    <p className={`font-medium ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                        <span className="font-bold text-blue-500">AI Scoring:</span> These scores are generated securely by an LLM analyzing your experience and skills.
                    </p>
                </div>

                {/* User preference: AI Scores updating is temporarily disabled from frontend UI 
                {!readOnly && onGenerateAIScore && (
                    <button
                        onClick={onGenerateAIScore}
                        disabled={isGenerating}
                        className={`mt-2 w-full md:w-auto px-6 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${isGenerating ? 'bg-neutral-200 dark:bg-neutral-800 text-neutral-400 cursor-not-allowed'
                                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20 active:scale-95'
                            }`}
                    >
                        {isGenerating ? (
                            <>
                                <div className="w-3 h-3 border-2 border-inherit border-t-transparent rounded-full animate-spin"></div>
                                Generating from Meta Llama 3.2...
                            </>
                        ) : 'Update AI Scores'}
                    </button>
                )}
                */}
            </div>

            {/* Glow effect behind the chart */}
            <div className="absolute inset-0 m-auto w-2/3 h-2/3 bg-blue-500/10 blur-[100px] rounded-full mix-blend-screen pointer-events-none"></div>

            {/* The Radar Chart */}
            <ResponsiveContainer width="100%" height="100%">
                <RadarChart
                    cx="50%"
                    cy="55%" // Push it down slightly to account for the top bar
                    outerRadius="50%" // Significantly reduced to give labels plenty of room (Execution Speed)
                    data={chartData}
                >
                    <PolarGrid
                        stroke={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}
                        strokeDasharray="4 4"
                    />
                    <PolarAngleAxis
                        dataKey="subject"
                        tick={<CustomTick />}
                    />
                    <PolarRadiusAxis
                        angle={30}
                        domain={[0, 100]}
                        tick={false}
                        axisLine={false}
                    />
                    <Tooltip content={<CustomRadarTooltip />} cursor={false} />

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
                        activeDot={{ r: 6, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }}
                    />

                    <defs>
                        <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.6} />
                            <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.1} />
                        </linearGradient>
                    </defs>
                </RadarChart>
            </ResponsiveContainer>

            {/* Absolute positioned interactive popover for Label explanations */}
            {hoveredLabel && METRIC_DEFINITIONS[hoveredLabel] && (
                <div
                    className="absolute z-20 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[85%] md:w-1/2 max-w-[320px] pointer-events-none"
                    style={{ animation: 'fadeIn 0.2s ease-out' }}
                >
                    <div className={`p-5 rounded-2xl shadow-2xl backdrop-blur-xl border ${isDark ? 'bg-slate-900/95 border-slate-700/50 shadow-black/50' : 'bg-white/95 border-neutral-200 shadow-neutral-200/50'}`}>
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                            <h4 className={`font-black text-sm uppercase tracking-wider ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                {hoveredLabel}
                            </h4>
                        </div>
                        <p className={`text-sm leading-relaxed mb-4 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                            {METRIC_DEFINITIONS[hoveredLabel].desc}
                        </p>

                        {(aiRadarStats && aiRadarStats.ai_reasoning) ? (
                            <div className={`pt-3 border-t ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                                <p className="text-[11px] uppercase tracking-wider font-bold text-blue-500 mb-1">AI Reasoning for Your Score</p>
                                <p className={`text-xs italic leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                    "{aiRadarStats.ai_reasoning}"
                                </p>
                            </div>
                        ) : (
                            <div className={`pt-3 border-t ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                                <p className="text-[11px] uppercase tracking-wider font-bold text-neutral-400 mb-1">AI Calculation Logic</p>
                                <p className={`text-xs italic ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                                    {METRIC_DEFINITIONS[hoveredLabel].logic}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
