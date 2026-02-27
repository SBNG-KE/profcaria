"use client"

import React, { useMemo, useState } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { Info } from 'lucide-react';

interface RadarSkillChartProps {
    isDark: boolean;
    skills?: any[];
    employmentHistory?: any[];
    otherProfiles?: any[];
}

// Data structures for the label explanations
const METRIC_DEFINITIONS: Record<string, { desc: string, logic: string }> = {
    'Depth': {
        desc: 'Measures your technical understanding and mastery of core languages, frameworks, and tools.',
        logic: 'AI Score derived from the frequency of robust tech skills and overall average tenure at past roles.'
    },
    'Execution Speed': {
        desc: 'Estimates how rapidly you can prototype, build, and deploy high-quality solutions.',
        logic: 'AI Score derived from the velocity of role changes, total skill volume, and agile frontend frameworks.'
    },
    'Collaboration Index': {
        desc: 'Evaluates your ability to work within teams, across disciplines, and lead projects.',
        logic: 'AI Score boosted by average tenure, cross-functional keywords, and connected external networks.'
    },
    'Creativity': {
        desc: 'Assesses your innovative problem-solving and focus on user experience and design.',
        logic: 'AI Score enhanced by UI/UX skills, external portfolios (e.g., GitHub, Behance), and design tools.'
    }
};

export default function RadarSkillChart({ isDark, skills = [], employmentHistory = [], otherProfiles = [] }: RadarSkillChartProps) {
    const [hoveredLabel, setHoveredLabel] = useState<string | null>(null);

    // Generate pseudo-AI scores based on the quantity and naming of the user's actual skills + employment
    const chartData = useMemo(() => {
        // Industry Averages are no longer hardcoded to 100 to make the graph look realistic
        const IND_AVG = { depth: 78, speed: 82, collab: 85, creative: 74 };

        if ((!skills || skills.length === 0) && (!employmentHistory || employmentHistory.length === 0)) {
            // Default empty state
            return [
                { subject: 'Depth', score: 65, industry: IND_AVG.depth },
                { subject: 'Execution Speed', score: 70, industry: IND_AVG.speed },
                { subject: 'Collaboration Index', score: 60, industry: IND_AVG.collab },
                { subject: 'Creativity', score: 75, industry: IND_AVG.creative },
            ];
        }

        // Employment History parsing
        let totalMonths = 0;
        let jobCount = employmentHistory.length;

        employmentHistory.forEach(job => {
            const start = job.startDate ? new Date(job.startDate) : new Date();
            const end = (job.isCurrent || !job.endDate) ? new Date() : new Date(job.endDate);
            const months = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30);
            if (months > 0) totalMonths += months;
        });

        const avgTenureMonths = jobCount > 0 ? totalMonths / jobCount : 0;
        const speedOfEmployment = jobCount > 2 && avgTenureMonths < 24 ? 15 : (avgTenureMonths >= 24 ? 5 : 10); // Job hoppers fast, lifers steady
        const collabTenureBoost = avgTenureMonths > 36 ? 15 : (avgTenureMonths > 18 ? 10 : 0); // Staying longer proves collaboration

        // Skills parsing
        let skillScoreBase = Math.min(50 + (skills.length * 2), 80);

        // Other profiles parsing (Github, Behance, etc indicates creativity/execution)
        let otherProfileBoost = Math.min(otherProfiles.length * 5, 15);

        // Find skills extracted from other profiles (which are saved in description field now as per new logic)
        const extractedSkillsFromProfiles = otherProfiles.map(p => p.description || '').join(' ').toLowerCase();

        const techKeywords = ['react', 'node', 'python', 'java', 'sql', 'aws', 'docker', 'rust', 'c++', 'dart', 'cybersecurity'];
        const creativeKeywords = ['design', 'ui', 'ux', 'writing', 'video', 'art', 'figma', 'animation', 'creative', 'front-end'];
        const collabKeywords = ['agile', 'scrum', 'management', 'leadership', 'team', 'jira', 'orchestration', 'lead'];

        const rawSkillStr = skills.map(s => s.name?.toLowerCase() || '').join(' ');
        const skillStr = rawSkillStr + ' ' + extractedSkillsFromProfiles;

        let depthBoost = techKeywords.filter(k => skillStr.includes(k)).length * 5;
        let creativeBoost = creativeKeywords.filter(k => skillStr.includes(k)).length * 5 + otherProfileBoost;
        let collabBoost = collabKeywords.filter(k => skillStr.includes(k)).length * 4 + collabTenureBoost;

        const calc = (base: number, boost: number, fallbackAvg: number) => {
            let s = base + Math.min(boost, 30);
            if (s < 50) s = fallbackAvg - Math.floor(Math.random() * 10);
            return Math.min(s, 99);
        };

        return [
            {
                subject: 'Depth',
                score: calc(skillScoreBase, depthBoost, 65),
                industry: IND_AVG.depth
            },
            {
                subject: 'Execution Speed',
                score: calc(skillScoreBase, speedOfEmployment + (skills.length > 5 ? 10 : 0), 70),
                industry: IND_AVG.speed
            },
            {
                subject: 'Collaboration Index',
                score: calc(skillScoreBase - 5, collabBoost, 60),
                industry: IND_AVG.collab
            },
            {
                subject: 'Creativity',
                score: calc(skillScoreBase - 10, creativeBoost, 75),
                industry: IND_AVG.creative
            },
        ];
    }, [skills, employmentHistory, otherProfiles]);

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
                        <div className="flex items-center gap-2 text-[13px] font-bold text-blue-500">
                            <span>AI Career Score : </span>
                            <span>{data.score}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[13px] font-bold text-neutral-400">
                            <span>Industry Average : </span>
                            <span>{data.industry}</span>
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
            <div className="absolute top-4 left-4 right-4 flex items-start gap-2 text-xs text-neutral-500 dark:text-neutral-400 z-10 pointer-events-none opacity-80 backdrop-blur-sm rounded-lg p-2">
                <Info size={14} className="shrink-0 mt-0.5 text-blue-500" />
                <p>
                    <span className="font-bold text-blue-500">How this works:</span> Profcaria AI scans the skills you add to your profile, analyzes their technical depth, categorizes them, and predicts your career proficiencies compared to the industry average.
                </p>
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
                    <Radar
                        name="Industry Average"
                        dataKey="industry"
                        stroke={isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'}
                        strokeWidth={1}
                        fill="transparent"
                        strokeDasharray="4 4"
                        isAnimationActive={false}
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
                    className="absolute z-20 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 md:w-1/2 max-w-[300px] pointer-events-none"
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
                        <div className={`pt-3 border-t ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                            <p className="text-[11px] uppercase tracking-wider font-bold text-neutral-400 mb-1">AI Calculation Logic</p>
                            <p className={`text-xs italic ${isDark ? 'text-blue-400/80' : 'text-blue-600/80'}`}>
                                {METRIC_DEFINITIONS[hoveredLabel].logic}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
