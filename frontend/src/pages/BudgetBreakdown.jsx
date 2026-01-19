import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/layouts/DashboardLayout';
import { Button } from "@/components/ui/button";
import { Download, ShoppingCart, TrendingUp, TrendingDown, Clock, BarChart3 } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';
import { procurementService } from '@/services/api';

const BudgetBreakdown = () => {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState(null);

    // Mock data for initial view or fallback
    const mockBarData = [
        { name: 'Jan', value: 40, projected: 30 },
        { name: 'Feb', value: 55, projected: 45 },
        { name: 'Mar', value: 45, projected: 50 },
        { name: 'Apr', value: 90, projected: 70 },
        { name: 'May', value: 65, projected: 60 },
        { name: 'Jun', value: 45, projected: 50 },
    ];

    const mockPieData = [
        { name: 'Steel Rebar', value: 540000, color: '#ff5f14' },
        { name: 'Concrete C35', value: 420000, color: '#121212' },
        { name: 'Formwork', value: 240000, color: '#FFD700' },
    ];

    const pieData = data ? [
        { name: 'Materials', value: data.budget_breakdown.material_cost, color: '#ff5f14' },
        { name: 'Labor', value: data.budget_breakdown.labor_cost, color: '#121212' },
        { name: 'Equipment', value: data.budget_breakdown.equipment_cost, color: '#FFD700' },
        { name: 'Overhead', value: data.budget_breakdown.overhead, color: '#888888' },
    ] : mockPieData;

    const totalCost = data ? data.budget_breakdown.total_cost.toLocaleString() : "4,250,000";
    const committedSpend = data ? (data.budget_breakdown.material_cost + data.budget_breakdown.labor_cost).toLocaleString() : "2,105,400";


    useEffect(() => {
        const query = location.state?.query;
        if (query) {
            setLoading(true);
            procurementService.analyzeProcurement(query)
                .then(response => {
                    console.log("API Response:", response);
                    setData(response);
                })
                .catch(err => console.error(err))
                .finally(() => setLoading(false));
        }
    }, [location.state]);

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white border border-gray-200 p-2 rounded shadow-sm">
                    <p className="text-xs font-bold">{label}</p>
                    <p className="text-xs text-primary">Spend: ${payload[0].value}k</p>
                </div>
            );
        }
        return null;
    };

    return (
        <DashboardLayout>
            {/* Page Header */}
            <div className="flex flex-wrap justify-between items-end gap-4 mb-8">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-[0.2em]">
                        Project Alpha • 402 Construction Site
                    </div>
                    <h1 className="text-4xl font-black text-warning-black uppercase tracking-tight">Budget Breakdown</h1>
                    <p className="text-gray-500 font-medium italic">Data refreshed: 2 minutes ago</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" className="border-2 border-warning-black text-warning-black font-bold uppercase tracking-wider hover:bg-gray-50">
                        <Download className="w-4 h-4 mr-2" /> Export PDF
                    </Button>
                    <Button className="bg-primary text-white font-bold uppercase tracking-wider shadow-[4px_4px_0px_0px_rgba(18,18,18,1)] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_rgba(18,18,18,1)] transition-all active:translate-y-[2px] active:shadow-none">
                        <ShoppingCart className="w-4 h-4 mr-2" /> New Requisition
                    </Button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl border-t-8 border-primary shadow-sm">
                    <p className="text-gray-400 text-xs font-black uppercase tracking-widest mb-1">Total Project Cost</p>
                    <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-black text-warning-black">${totalCost}</span>
                    </div>
                    <div className="flex items-center mt-4 text-green-600 font-bold text-sm">
                        <TrendingUp className="w-4 h-4 mr-1" />
                        <span>+5.2% vs Plan</span>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl border-t-8 border-warning-black shadow-sm">
                    <p className="text-gray-400 text-xs font-black uppercase tracking-widest mb-1">Committed Spend</p>
                    <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-black text-warning-black">${committedSpend}</span>
                    </div>
                    <div className="flex items-center mt-4 text-gray-500 font-bold text-sm">
                        <Clock className="w-4 h-4 mr-1" />
                        <span>49.5% Utilized</span>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl border-t-8 border-caution shadow-sm">
                    <p className="text-gray-400 text-xs font-black uppercase tracking-widest mb-1">Remaining Contingency</p>
                    <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-black text-warning-black">$150,000</span>
                    </div>
                    <div className="flex items-center mt-4 text-red-600 font-bold text-sm">
                        <TrendingDown className="w-4 h-4 mr-1" />
                        <span>-0.5% this month</span>
                    </div>
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Bar Chart */}
                <div className="bg-white p-8 rounded-xl border-2 border-primary shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-2 opacity-10">
                        <BarChart3 size={64} />
                    </div>
                    <h3 className="text-lg font-black uppercase tracking-tight mb-6">Monthly Procurement Trend</h3>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={mockBarData}>
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold' }} />
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                                <Bar dataKey="value" fill="#ff5f14" radius={[4, 4, 0, 0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Donut Chart */}
                <div className="bg-white p-8 rounded-xl border-2 border-caution shadow-sm">
                    <h3 className="text-lg font-black uppercase tracking-tight mb-6">Material Cost Distribution</h3>
                    <div className="flex flex-col md:flex-row items-center gap-8">
                        <div className="relative w-48 h-48 flex-shrink-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={0}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-xs font-bold uppercase text-gray-400">Total</span>
                                <span className="text-xl font-black">$1.2M</span>
                            </div>
                        </div>
                        <div className="flex flex-col gap-4 w-full">
                            {pieData.map((item, idx) => (
                                <div key={idx} className="flex items-center gap-3">
                                    <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: item.color }}></div>
                                    <div className="flex-1">
                                        <div className="flex justify-between">
                                            <p className="text-xs font-black uppercase tracking-widest leading-none">{item.name}</p>
                                            <p className="text-xs font-medium text-gray-500">{item.value > 1000 ? (item.value / 1000).toFixed(1) + 'k' : item.value}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Detailed Spend Table */}
            <div className="bg-white rounded-xl border-2 border-gray-100 overflow-hidden shadow-sm">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/30">
                    <h3 className="font-black uppercase tracking-widest text-sm">Top Vendors by Spend</h3>
                    <button className="text-primary font-bold text-xs uppercase hover:underline">View All Vendors</button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50">
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Vendor Entity</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Category</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Committed</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 text-center">Score</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {[
                                { name: 'IronStream Steel Co.', code: 'IS', cat: 'Structural Steel', spend: '$842,000', score: 92, color: 'bg-warning-black text-caution' },
                                { name: 'Titan Concrete Ltd', code: 'TC', cat: 'Ready-Mix', spend: '$615,500', score: 78, color: 'bg-gray-200 text-warning-black' },
                                { name: 'BuildFast Foundations', code: 'BF', cat: 'Substructure', spend: '$290,000', score: 65, color: 'bg-primary text-white' }
                            ].map((vendor, idx) => (
                                <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 flex items-center justify-center font-black rounded-sm text-xs ${vendor.color}`}>
                                                {vendor.code}
                                            </div>
                                            <span className="font-bold text-sm">{vendor.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-[10px] font-black uppercase rounded">{vendor.cat}</span>
                                    </td>
                                    <td className="px-6 py-4 text-right font-black text-sm">{vendor.spend}</td>
                                    <td className="px-6 py-4">
                                        <div className="w-24 bg-gray-200 h-1.5 rounded-full overflow-hidden mx-auto">
                                            <div
                                                className={`h-full ${vendor.score > 80 ? 'bg-green-500' : vendor.score > 70 ? 'bg-caution' : 'bg-red-500'}`}
                                                style={{ width: `${vendor.score}%` }}
                                            ></div>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default BudgetBreakdown;
