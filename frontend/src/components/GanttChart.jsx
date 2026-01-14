import { motion } from 'framer-motion';
import { Calendar, Clock, ChevronRight, TrendingUp } from 'lucide-react';

export function GanttChart({ schedule }) {
    const { phases, total_duration, total_months, start_date, end_date } = schedule;

    // Calculate width percentage for each phase
    const getWidthPercent = (duration) => {
        return (duration / total_duration) * 100;
    };

    // Calculate left position based on days from start
    const getLeftPercent = (startDate) => {
        const start = new Date(start_date);
        const phaseStart = new Date(startDate);
        const daysFromStart = Math.floor((phaseStart.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        return (daysFromStart / total_duration) * 100;
    };

    // Format date for display
    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString('en-IN', {
            month: 'short',
            day: 'numeric',
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
                    label: markerDate.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }),
                    percent
                });
            }
        }
        return markers;
    };

    const monthMarkers = generateMonthMarkers();

    return (
        <div className="space-y-7">
            {/* Header Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-7 bg-linear-to-br from-purple-600/10 via-pink-600/10 to-blue-600/5 border-purple-500/20"
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg pulse-glow">
                            <Calendar className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold gradient-text">Project Timeline</h3>
                            <p className="text-slate-400 text-sm flex items-center gap-2 mt-1">
                                <Clock className="w-3 h-3" />
                                {formatDate(start_date)} → {formatDate(end_date)}
                            </p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-slate-400">Duration</p>
                        <p className="text-3xl font-bold text-white">{total_months}</p>
                        <p className="text-sm text-purple-400">months</p>
                    </div>
                </div>
            </motion.div>

            {/* Gantt Chart */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="glass-card p-6"
            >
                <h4 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-cyan-400" />
                    Phase Timeline
                </h4>

                {/* Timeline Header */}
                <div className="relative h-10 mb-3">
                    <div className="absolute inset-0 flex items-center">
                        {monthMarkers.map((marker, idx) => (
                            <div
                                key={idx}
                                className="absolute text-xs font-semibold text-slate-400"
                                style={{ left: `${marker.percent}%` }}
                            >
                                📅 {marker.label}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Timeline Grid */}
                <div className="relative bg-linear-to-br from-slate-800/60 to-slate-700/40 rounded-2xl p-6 border border-slate-700/50">
                    {/* Grid lines */}
                    <div className="absolute inset-6 flex">
                        {monthMarkers.map((marker, idx) => (
                            <div
                                key={idx}
                                className="absolute h-full border-l border-slate-600/30"
                                style={{ left: `${marker.percent}%` }}
                            />
                        ))}
                    </div>

                    {/* Phases */}
                    <div className="relative space-y-5">
                        {phases.map((phase, index) => (
                            <motion.div
                                key={phase.id}
                                initial={{ opacity: 0, x: -30 }}
                                animate={{ opacity: 1, x: 0 }}
                                whileHover={{ scale: 1.02 }}
                                transition={{ delay: index * 0.1, type: "spring", stiffness: 300 }}
                                className="flex items-center gap-4"
                            >
                                {/* Phase Name */}
                                <div className="w-56 shrink-0">
                                    <span className="text-sm font-semibold text-white truncate block">
                                        {phase.name}
                                    </span>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-xs text-slate-400">
                                            {phase.duration} days
                                        </span>
                                        {phase.progress > 0 && (
                                            <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full border border-green-500/30">
                                                {phase.progress}%
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Gantt Bar Container */}
                                <div className="flex-1 relative h-12">
                                    <motion.div
                                        className="absolute h-full rounded-xl flex items-center px-3 overflow-hidden shadow-lg group"
                                        style={{
                                            left: `${getLeftPercent(phase.startDate)}%`,
                                            width: `${getWidthPercent(phase.duration)}%`,
                                            backgroundColor: phase.color,
                                            minWidth: '80px'
                                        }}
                                        initial={{ scaleX: 0 }}
                                        animate={{ scaleX: 1 }}
                                        transition={{ delay: index * 0.1 + 0.3, duration: 0.6, ease: "easeOut" }}
                                        whileHover={{ y: -4 }}
                                    >
                                        {/* Progress overlay */}
                                        {phase.progress > 0 && (
                                            <div
                                                className="absolute inset-0 bg-white/30 transition-all"
                                                style={{ width: `${phase.progress}%` }}
                                            />
                                        )}
                                        <span className="text-xs text-white font-bold relative z-10 truncate">
                                            {phase.duration}d
                                        </span>
                                        {/* Hover tooltip */}
                                        <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block">
                                            <div className="bg-slate-900 text-white text-xs px-3 py-2 rounded-lg shadow-xl border border-slate-700 whitespace-nowrap">
                                                <div className="font-semibold">{phase.name}</div>
                                                <div className="text-slate-400 text-xs mt-1">
                                                    {formatDate(phase.startDate)} - {formatDate(phase.endDate)}
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Legend */}
                <div className="mt-6 flex flex-wrap gap-3">
                    {phases.map((phase, idx) => (
                        <motion.div 
                            key={phase.id}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.5 + idx * 0.05 }}
                            className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/50 rounded-lg border border-slate-700/50"
                        >
                            <div
                                className="w-4 h-4 rounded shadow-lg"
                                style={{ backgroundColor: phase.color }}
                            />
                            <span className="text-xs text-slate-300 font-medium">{phase.name}</span>
                        </motion.div>
                    ))}
                </div>
            </motion.div>

            {/* Summary Stats */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="glass-card p-6"
            >
                <h4 className="text-lg font-semibold text-white mb-5 flex items-center gap-2">
                    <ChevronRight className="w-5 h-5 text-cyan-400" />
                    Project Statistics
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <motion.div 
                        whileHover={{ scale: 1.05, y: -4 }}
                        className="stat-card bg-linear-to-br from-purple-500/20 to-purple-600/10 border border-purple-500/30"
                    >
                        <div className="text-sm font-semibold text-purple-400 mb-2 uppercase tracking-wide">Total Phases</div>
                        <div className="text-4xl font-bold text-purple-400">{phases.length}</div>
                        <div className="text-xs text-purple-400/70 mt-1">Project stages</div>
                    </motion.div>
                    <motion.div 
                        whileHover={{ scale: 1.05, y: -4 }}
                        transition={{ delay: 0.05 }}
                        className="stat-card bg-linear-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/30"
                    >
                        <div className="text-sm font-semibold text-blue-400 mb-2 uppercase tracking-wide">Timeline</div>
                        <div className="text-4xl font-bold text-blue-400">{total_months}</div>
                        <div className="text-xs text-blue-400/70 mt-1">Months duration</div>
                    </motion.div>
                    <motion.div 
                        whileHover={{ scale: 1.05, y: -4 }}
                        transition={{ delay: 0.1 }}
                        className="stat-card bg-linear-to-br from-cyan-500/20 to-cyan-600/10 border border-cyan-500/30"
                    >
                        <div className="text-sm font-semibold text-cyan-400 mb-2 uppercase tracking-wide">Total Days</div>
                        <div className="text-4xl font-bold text-cyan-400">{total_duration}</div>
                        <div className="text-xs text-cyan-400/70 mt-1">Working days</div>
                    </motion.div>
                </div>
            </motion.div>
        </div>
    );
}
