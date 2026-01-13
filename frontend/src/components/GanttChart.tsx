import { motion } from 'framer-motion';
import { Calendar, Clock, ChevronRight } from 'lucide-react';
import type { ProjectSchedule } from '../types';

interface GanttChartProps {
    schedule: ProjectSchedule;
}

export function GanttChart({ schedule }: GanttChartProps) {
    const { phases, total_duration, total_months, start_date, end_date } = schedule;

    // Calculate width percentage for each phase
    const getWidthPercent = (duration: number) => {
        return (duration / total_duration) * 100;
    };

    // Calculate left position based on days from start
    const getLeftPercent = (startDate: string) => {
        const start = new Date(start_date);
        const phaseStart = new Date(startDate);
        const daysFromStart = Math.floor((phaseStart.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        return (daysFromStart / total_duration) * 100;
    };

    // Format date for display
    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-IN', {
            month: 'short',
            year: 'numeric'
        });
    };

    // Generate month markers
    const generateMonthMarkers = () => {
        const markers = [];
        const start = new Date(start_date);

        for (let i = 0; i <= total_months; i += 3) {
            const markerDate = new Date(start);
            markerDate.setMonth(markerDate.getMonth() + i);
            const percent = (i * 30 / total_duration) * 100;

            if (percent <= 100) {
                markers.push({
                    label: formatDate(markerDate.toISOString()),
                    percent
                });
            }
        }
        return markers;
    };

    const monthMarkers = generateMonthMarkers();

    return (
        <div className="glass-card p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-white">Project Schedule</h3>
                        <p className="text-slate-400 text-sm">Total Duration: {total_months} months</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-400">
                    <Clock className="w-4 h-4" />
                    <span>{formatDate(start_date)}</span>
                    <ChevronRight className="w-4 h-4" />
                    <span>{formatDate(end_date)}</span>
                </div>
            </div>

            {/* Timeline Header */}
            <div className="relative h-8 mb-2">
                <div className="absolute inset-0 flex">
                    {monthMarkers.map((marker, idx) => (
                        <div
                            key={idx}
                            className="absolute text-xs text-slate-500"
                            style={{ left: `${marker.percent}%` }}
                        >
                            {marker.label}
                        </div>
                    ))}
                </div>
            </div>

            {/* Timeline Grid */}
            <div className="relative bg-slate-800/50 rounded-lg p-4">
                {/* Grid lines */}
                <div className="absolute inset-4 flex">
                    {monthMarkers.map((marker, idx) => (
                        <div
                            key={idx}
                            className="absolute h-full border-l border-slate-700/50"
                            style={{ left: `${marker.percent}%` }}
                        />
                    ))}
                </div>

                {/* Phases */}
                <div className="relative space-y-3">
                    {phases.map((phase, index) => (
                        <motion.div
                            key={phase.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="flex items-center gap-4"
                        >
                            {/* Phase Name */}
                            <div className="w-48 shrink-0">
                                <span className="text-sm text-slate-300 truncate block">
                                    {phase.name}
                                </span>
                                <span className="text-xs text-slate-500">
                                    {phase.duration} days
                                </span>
                            </div>

                            {/* Gantt Bar Container */}
                            <div className="flex-1 relative h-8">
                                <motion.div
                                    className="absolute h-full rounded-md flex items-center px-2 overflow-hidden"
                                    style={{
                                        left: `${getLeftPercent(phase.startDate)}%`,
                                        width: `${getWidthPercent(phase.duration)}%`,
                                        backgroundColor: phase.color,
                                        minWidth: '60px'
                                    }}
                                    initial={{ scaleX: 0 }}
                                    animate={{ scaleX: 1 }}
                                    transition={{ delay: index * 0.1 + 0.2, duration: 0.5 }}
                                >
                                    {/* Progress overlay */}
                                    {phase.progress > 0 && (
                                        <div
                                            className="absolute inset-0 bg-white/20"
                                            style={{ width: `${phase.progress}%` }}
                                        />
                                    )}
                                    <span className="text-xs text-white font-medium relative z-10 truncate">
                                        {phase.duration}d
                                    </span>
                                </motion.div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Legend */}
            <div className="mt-6 flex flex-wrap gap-4">
                {phases.map((phase) => (
                    <div key={phase.id} className="flex items-center gap-2">
                        <div
                            className="w-3 h-3 rounded"
                            style={{ backgroundColor: phase.color }}
                        />
                        <span className="text-xs text-slate-400">{phase.name}</span>
                    </div>
                ))}
            </div>

            {/* Summary Stats */}
            <div className="mt-6 grid grid-cols-3 gap-4">
                <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-cyan-400">{phases.length}</div>
                    <div className="text-xs text-slate-400">Total Phases</div>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-blue-400">{total_months}</div>
                    <div className="text-xs text-slate-400">Months</div>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-purple-400">{total_duration}</div>
                    <div className="text-xs text-slate-400">Total Days</div>
                </div>
            </div>
        </div>
    );
}
