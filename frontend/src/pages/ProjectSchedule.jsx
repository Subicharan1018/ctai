import React from 'react';
import DashboardLayout from '@/layouts/DashboardLayout';
import { Button } from "@/components/ui/button";
import { Filter, Plus, Calendar, AlertTriangle, CheckCircle2, Clock, Loader2 } from 'lucide-react';
import { cn } from "@/lib/utils";
import { useProcurement } from '@/context/ProcurementContext';

const ProjectSchedule = () => {
    const { procurementData, isLoading } = useProcurement();

    if (isLoading) {
        return (
            <DashboardLayout>
                <div className="h-full flex items-center justify-center">
                    <Loader2 className="w-10 h-10 animate-spin text-primary" />
                </div>
            </DashboardLayout>
        );
    }

    if (!procurementData) {
        return (
            <DashboardLayout>
                <div className="h-full flex items-center justify-center">
                    <p className="text-gray-500 font-bold">No analysis data found.</p>
                </div>
            </DashboardLayout>
        );
    }

    const { schedule } = procurementData;
    const tasks = schedule.phases;

    const stats = [
        { label: 'Total Phases', value: tasks.length.toString(), icon: 'account_tree', color: 'text-warning-black', progress: 0, progressColor: 'bg-primary' },
        { label: 'Project Duration', value: `${schedule.total_months} Mo`, icon: 'timer', color: 'text-warning-black', sub: 'Calculated by AI', subColor: 'text-green-600' },
        { label: 'Est. Completion', value: schedule.end_date, icon: 'shopping_cart', color: 'text-warning-black', sub: 'Target', subColor: 'text-green-600' },
    ];

    return (
        <DashboardLayout>
            <div className="flex flex-col gap-6">
                {/* Page Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-black uppercase tracking-tighter text-warning-black">Project Schedule Gantt</h1>
                        <p className="text-sm text-gray-500 font-bold">Generated Schedule • {schedule.start_date} to {schedule.end_date}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="flex border-2 border-warning-black rounded-lg overflow-hidden h-9 bg-white">
                            <button className="px-4 text-xs font-bold uppercase hover:bg-primary transition-colors">Day</button>
                            <button className="px-4 text-xs font-bold uppercase bg-primary border-x-2 border-warning-black">Week</button>
                            <button className="px-4 text-xs font-bold uppercase hover:bg-primary transition-colors">Month</button>
                        </div>
                        <Button variant="outline" size="sm" className="border-2 border-warning-black uppercase font-bold text-xs gap-2">
                            <Filter className="w-4 h-4" /> Filter
                        </Button>
                        <Button size="sm" className="bg-primary hover:bg-primary/90 text-warning-black border-2 border-warning-black uppercase font-bold text-xs gap-2 shadow-[2px_2px_0px_0px_rgba(29,26,12,1)]">
                            <Plus className="w-4 h-4" /> New Task
                        </Button>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {stats.map((stat, idx) => (
                        <div key={idx} className="bg-white border-2 border-warning-black p-4 rounded-lg shadow-[4px_4px_0px_0px_rgba(29,26,12,1)]">
                            <div className="flex justify-between items-start mb-2">
                                <p className="text-xs font-black uppercase text-gray-400">{stat.label}</p>
                                {/* Icon placeholder */}
                            </div>
                            <p className={cn("text-3xl font-black leading-none", stat.color)}>{stat.value}</p>
                            {stat.sub && (
                                <p className={cn("text-[10px] mt-2 font-bold uppercase", stat.subColor)}>{stat.sub}</p>
                            )}
                        </div>
                    ))}
                </div>

                {/* Gantt Chart Container */}
                <div className="bg-white border-2 border-warning-black rounded-lg overflow-hidden flex flex-col h-[600px]">
                    {/* Gantt Header */}
                    <div className="flex border-b-2 border-warning-black bg-gray-50/50 sticky top-0 z-10 font-bold text-xs uppercase text-gray-500">
                        <div className="w-64 border-r-2 border-warning-black p-3 shrink-0">Phase / Task</div>
                        <div className="flex-1 flex" style={{ backgroundImage: 'linear-gradient(to right, #eae5cd 1px, transparent 1px)', backgroundSize: '160px 100%' }}>
                            {['Month 1', 'Month 3', 'Month 6', 'Month 9', 'Month 12', 'Month 15', 'Month 18'].map((date, i) => (
                                <div key={i} className="w-40 border-r border-warning-black/10 p-3 text-center opacity-70">{date}</div>
                            ))}
                        </div>
                    </div>

                    {/* Gantt Body */}
                    <div className="flex-1 overflow-auto">
                        <div className="min-w-[1000px]">
                            {tasks.map((task, idx) => (
                                <div key={idx} className="flex border-b border-warning-black/10 hover:bg-gray-50 transition-colors group">
                                    <div className={cn("w-64 border-r-2 border-warning-black p-4 shrink-0", task.status === 'critical' && "bg-orange-50")}>
                                        <p className={cn("font-black text-sm uppercase", task.status === 'critical' ? "text-orange-600" : "text-warning-black")}>{task.name}</p>
                                        <p className={cn("text-[10px] font-bold", task.status === 'critical' ? "text-orange-400" : "text-gray-400")}>{task.owner}</p>
                                    </div>
                                    <div className="flex-1 relative h-16 flex items-center px-0" style={{ backgroundImage: 'linear-gradient(to right, #eae5cd 1px, transparent 1px)', backgroundSize: '40px 100%' }}>
                                        {/* Activity Bar */}
                                        <div
                                            className={cn(
                                                "absolute h-8 border-2 border-warning-black flex items-center px-3 shadow-sm transition-all",
                                                task.status === 'active' ? "bg-primary" :
                                                    task.status === 'critical' ? "bg-orange-500 text-white" :
                                                        task.status === 'dashed' ? "bg-primary/40 border-dashed" : "bg-primary"
                                            )}
                                            style={{ left: task.barStart, width: task.barWidth }}
                                        >
                                            <span className="text-[10px] font-black uppercase truncate">{task.barLabel}</span>
                                            {task.status === 'active' && (
                                                <div className="ml-auto flex items-center gap-1">
                                                    <div className="w-1.5 h-1.5 bg-warning-black rounded-full animate-pulse"></div>
                                                    <span className="text-[9px] font-black">ACTIVE</span>
                                                </div>
                                            )}
                                            {task.status === 'critical' && <AlertTriangle className="w-3 h-3 ml-auto" />}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Footer Legend */}
                    <div className="p-3 border-t-2 border-warning-black bg-white flex items-center justify-between text-[10px] font-black uppercase">
                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-2"><div className="w-3 h-3 bg-primary border border-warning-black"></div> On Schedule</div>
                            <div className="flex items-center gap-2"><div className="w-3 h-3 bg-orange-500 border border-warning-black"></div> Critical Path</div>
                            <div className="flex items-center gap-2"><div className="w-3 h-3 border-2 border-warning-black rotate-45 bg-warning-black"></div> Milestone</div>
                        </div>
                        <div className="text-gray-400">Synced: {new Date().toLocaleDateString()}</div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default ProjectSchedule;
