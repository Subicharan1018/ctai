import React from 'react';
import DashboardLayout from '@/layouts/DashboardLayout';
import { Button } from "@/components/ui/button";
import { Filter, Plus, Calendar, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import { cn } from "@/lib/utils";

const ProjectSchedule = () => {
    // Mock Data mimicking the HTML
    const stats = [
        { label: 'Total Phases', value: '12', icon: 'account_tree', color: 'text-warning-black', progress: 75, progressColor: 'bg-primary' },
        { label: 'Critical Path', value: '05', icon: 'warning', color: 'text-safety-orange', sub: 'High Conflict Risk', subColor: 'text-safety-orange' },
        { label: 'Days to Deadline', value: '28', icon: 'timer', color: 'text-warning-black', sub: '-5% vs last week', subColor: 'text-red-600' },
        { label: 'Procurement', value: '84%', icon: 'shopping_cart', color: 'text-warning-black', sub: 'On Track', subColor: 'text-green-600' },
    ];

    const tasks = [
        { name: 'Excavation & Site Prep', owner: 'W. Miller', progress: 100, barStart: '0px', barWidth: '320px', barLabel: 'Phase 01: Initial Preparation', status: 'complete' },
        { name: 'Foundation Pour', owner: 'C. Jensen', progress: 45, barStart: '240px', barWidth: '384px', barLabel: 'Phase 02: Concrete Structural', status: 'active', milestone: { pos: '640px', label: 'M1' } },
        { name: 'HVAC Procurement', owner: 'Delayed • AI Rec', progress: 0, barStart: '580px', barWidth: '256px', barLabel: 'Critical: Long Lead Items', status: 'critical', lineStart: '600px' },
        { name: 'Interior Framing', owner: 'Unassigned', progress: 0, barStart: '780px', barWidth: '224px', barLabel: 'Phase 04: Interior Walls', status: 'future' },
        { name: 'Roofing System', owner: 'A. Garcia', progress: 0, barStart: '880px', barWidth: '288px', barLabel: 'Phase 05: Weatherproofing', status: 'dashed', milestone: { pos: '1150px', label: 'Deadline' } },
    ];

    return (
        <DashboardLayout>
            <div className="flex flex-col gap-6">
                {/* Page Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-black uppercase tracking-tighter text-warning-black">Project Schedule Gantt</h1>
                        <p className="text-sm text-gray-500 font-bold">Project Alpha • Master Schedule</p>
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
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {stats.map((stat, idx) => (
                        <div key={idx} className="bg-white border-2 border-warning-black p-4 rounded-lg shadow-[4px_4px_0px_0px_rgba(29,26,12,1)]">
                            <div className="flex justify-between items-start mb-2">
                                <p className="text-xs font-black uppercase text-gray-400">{stat.label}</p>
                                {/* Icon placeholder */}
                            </div>
                            <p className={cn("text-3xl font-black leading-none", stat.color)}>{stat.value}</p>
                            {stat.progress && (
                                <div className="mt-2 h-1 w-full bg-primary/20 rounded-full overflow-hidden">
                                    <div className={cn("h-full", stat.progressColor)} style={{ width: `${stat.progress}%` }}></div>
                                </div>
                            )}
                            {stat.sub && (
                                <p className={cn("text-[10px] mt-2 font-bold uppercase", stat.subColor)}>{stat.sub}</p>
                            )}
                        </div>
                    ))}
                </div>

                {/* Gantt Chart Container */}
                <div className="bg-white border-2 border-warning-black rounded-lg overflow-hidden flex flex-col h-[500px]">
                    {/* Gantt Header */}
                    <div className="flex border-b-2 border-warning-black bg-gray-50/50 sticky top-0 z-10 font-bold text-xs uppercase text-gray-500">
                        <div className="w-64 border-r-2 border-warning-black p-3 shrink-0">Phase / Task</div>
                        <div className="flex-1 flex" style={{ backgroundImage: 'linear-gradient(to right, #eae5cd 1px, transparent 1px)', backgroundSize: '160px 100%' }}>
                            {['Oct 02', 'Oct 09', 'Oct 16', 'Oct 23', 'Oct 30', 'Nov 06'].map((date, i) => (
                                <div key={i} className="w-40 border-r border-warning-black/10 p-3 text-center opacity-70">{date} - ...</div>
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
                                        {/* Critical Line */}
                                        {task.lineStart && (
                                            <div className="absolute top-1/2 left-[600px] right-0 h-0.5 border-t-2 border-dashed border-orange-500 z-0"></div>
                                        )}
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
                                        {/* Milestone */}
                                        {task.milestone && (
                                            <div className="absolute z-20 flex flex-col items-center" style={{ left: task.milestone.pos }}>
                                                <div className="bg-warning-black w-5 h-5 rotate-45 border-2 border-primary flex items-center justify-center -translate-y-1">
                                                    {task.milestone.label === 'M1' && <CheckCircle2 className="w-3 h-3 text-primary -rotate-45" />}
                                                </div>
                                                <span className="text-[9px] font-black absolute top-6 bg-warning-black text-white px-1 uppercase">{task.milestone.label}</span>
                                            </div>
                                        )}
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
                        <div className="text-gray-400">Synced: Oct 12, 2023</div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default ProjectSchedule;
