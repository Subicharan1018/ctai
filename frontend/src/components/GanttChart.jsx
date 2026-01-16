import { motion } from 'framer-motion';
import { Calendar, Clock, ChevronRight, TrendingUp } from 'lucide-react';
import { Card, Row, Col, Statistic, Typography } from 'antd';

const { Title, Text } = Typography;

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
        <div className="space-y-6">
            {/* Header Card */}
            <Card bordered={false} className="bg-[#1e293b]/70 backdrop-blur-md border border-white/5 shadow-xl">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-pink-500/20 rounded-xl flex items-center justify-center border border-pink-500/20">
                            <Calendar className="w-6 h-6 text-pink-400" />
                        </div>
                        <div>
                            <Title level={4} style={{ color: 'white', margin: 0, fontWeight: 600 }}>Project Timeline</Title>
                            <span className="text-slate-400 flex items-center gap-2">
                                <Clock size={14} />
                                {formatDate(start_date)} → {formatDate(end_date)}
                            </span>
                        </div>
                    </div>
                    <div className="text-right">
                        <span className="text-slate-400 block text-sm">Duration</span>
                        <div className="text-2xl font-bold text-white tracking-tight">{total_months}</div>
                        <span className="text-purple-400 text-sm font-medium">months</span>
                    </div>
                </div>
            </Card>

            {/* Gantt Chart */}
            <Card
                title={<span className="text-white flex items-center gap-2 font-semibold"><TrendingUp size={18} className="text-cyan-400" /> Phase Timeline</span>}
                className="bg-[#1e293b]/60 backdrop-blur-md border border-white/5"
                bordered={false}
            >

                {/* Timeline Header */}
                <div className="relative h-8 mb-4">
                    <div className="absolute inset-0 flex items-center">
                        {monthMarkers.map((marker, idx) => (
                            <div
                                key={idx}
                                className="absolute text-xs font-semibold text-slate-500 border-l border-slate-700 pl-1 h-3"
                                style={{ left: `${marker.percent}%` }}
                            >
                                <span className="absolute -top-5 left-0 whitespace-nowrap">{marker.label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Timeline Grid */}
                <div className="relative bg-[#0f172a]/50 rounded-xl p-6 border border-white/5">
                    {/* Grid lines */}
                    <div className="absolute inset-x-6 top-6 bottom-6 flex pointer-events-none">
                        {monthMarkers.map((marker, idx) => (
                            <div
                                key={idx}
                                className="absolute h-full border-l border-slate-700/30"
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
                                whileHover={{ scale: 1.01 }}
                                transition={{ delay: index * 0.1 }}
                                className="flex items-center gap-4 group"
                            >
                                {/* Phase Name */}
                                <div className="w-48 shrink-0">
                                    <Text strong style={{ color: 'white', display: 'block' }} ellipsis>
                                        {phase.name}
                                    </Text>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Text type="secondary" style={{ fontSize: '11px', color: '#94a3b8' }}>
                                            {phase.duration} days
                                        </Text>
                                        {phase.progress > 0 && (
                                            <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/20">
                                                {phase.progress}%
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Gantt Bar Container */}
                                <div className="flex-1 relative h-10 bg-slate-800/50 rounded-lg overflow-hidden border border-white/5 shadow-inner">
                                    <motion.div
                                        className="absolute h-full rounded shadow-lg flex items-center px-3 overflow-hidden cursor-help backdrop-brightness-110"
                                        style={{
                                            left: `${getLeftPercent(phase.startDate)}%`,
                                            width: `${getWidthPercent(phase.duration)}%`,
                                            backgroundColor: phase.color,
                                            minWidth: '60px'
                                        }}
                                        initial={{ scaleX: 0 }}
                                        animate={{ scaleX: 1 }}
                                        transition={{ delay: index * 0.1 + 0.3, duration: 0.6 }}
                                    >
                                        <span className="text-[10px] text-white font-bold truncate mix-blend-difference drop-shadow-md">
                                            {phase.duration}d
                                        </span>
                                    </motion.div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Legend */}
                <div className="mt-6 flex flex-wrap gap-3">
                    {phases.map((phase, idx) => (
                        <div key={phase.id} className="flex items-center gap-2 px-2 py-1 bg-white/5 rounded border border-white/5">
                            <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: phase.color }} />
                            <span className="text-xs text-slate-400 font-medium">{phase.name}</span>
                        </div>
                    ))}
                </div>
            </Card>

            {/* Summary Stats */}
            <Card
                title={<span className="text-white flex items-center gap-2 font-semibold"><ChevronRight size={18} className="text-cyan-400" /> Project Statistics</span>}
                className="bg-[#1e293b]/60 backdrop-blur-md border border-white/5"
                bordered={false}
            >
                <Row gutter={16}>
                    <Col span={8}>
                        <Card size="small" className="bg-purple-500/10 border-purple-500/20 shadow-inner">
                            <Statistic
                                title={<span className="text-purple-400 text-xs uppercase font-bold tracking-wider">Total Phases</span>}
                                value={phases.length}
                                valueStyle={{ color: '#d8b4fe', fontWeight: 'bold' }}
                            />
                        </Card>
                    </Col>
                    <Col span={8}>
                        <Card size="small" className="bg-blue-500/10 border-blue-500/20 shadow-inner">
                            <Statistic
                                title={<span className="text-blue-400 text-xs uppercase font-bold tracking-wider">Timeline</span>}
                                value={total_months}
                                suffix={<span className="text-xs text-blue-400/70 ml-1 font-medium">Months</span>}
                                valueStyle={{ color: '#93c5fd', fontWeight: 'bold' }}
                            />
                        </Card>
                    </Col>
                    <Col span={8}>
                        <Card size="small" className="bg-cyan-500/10 border-cyan-500/20 shadow-inner">
                            <Statistic
                                title={<span className="text-cyan-400 text-xs uppercase font-bold tracking-wider">Total Days</span>}
                                value={total_duration}
                                suffix={<span className="text-xs text-cyan-400/70 ml-1 font-medium">Working Days</span>}
                                valueStyle={{ color: '#67e8f9', fontWeight: 'bold' }}
                            />
                        </Card>
                    </Col>
                </Row>
            </Card>
        </div>
    );
}
