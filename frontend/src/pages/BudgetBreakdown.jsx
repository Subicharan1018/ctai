import React from 'react';
import DashboardLayout from '@/layouts/DashboardLayout';
import { Button } from "@/components/ui/button";
import { Download, ShoppingCart, TrendingUp, TrendingDown, Clock, BarChart3, Loader2 } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';
import { useProcurement } from '@/context/ProcurementContext';

const BudgetBreakdown = () => {
    const { procurementData, isLoading } = useProcurement();
    const data = procurementData;

    // Use data from context or fall back to mock if null (though ideally we redirect if null)
    if (isLoading) {
        return (
            <DashboardLayout>
                <div className="h-full flex flex-col items-center justify-center gap-4">
                    <Loader2 className="w-12 h-12 animate-spin text-primary" />
                    <h2 className="text-xl font-black uppercase text-warning-black">Generating AI Analysis...</h2>
                    <p className="text-gray-500 font-bold text-sm">Crunching market data and supply chain logistics</p>
                </div>
            </DashboardLayout>
        );
    }

    if (!data) {
        return (
            <DashboardLayout>
                <div className="h-full flex items-center justify-center">
                    <p className="text-gray-500 font-bold">No analysis data found. Please run a new analysis.</p>
                </div>
            </DashboardLayout>
        );
    }

    // Map API data to charts
    // Mock monthly trend for now (backend doesn't provide time-series yet)
    const mockBarData = [
        { name: 'Jan', value: 40, projected: 30 },
        { name: 'Feb', value: 55, projected: 45 },
        { name: 'Mar', value: 45, projected: 50 },
        { name: 'Apr', value: 90, projected: 70 },
        { name: 'May', value: 65, projected: 60 },
        { name: 'Jun', value: 45, projected: 50 },
    ];

    const pieData = [
        { name: 'Materials', value: data.budget_breakdown.material_cost, color: '#ff5f14' },
        { name: 'Labor', value: data.budget_breakdown.labor_cost, color: '#121212' },
        { name: 'Equipment', value: data.budget_breakdown.equipment_cost, color: '#FFD700' },
        { name: 'GST (18%)', value: data.budget_breakdown.gst_cost || 0, color: '#6366F1' }, // Added GST
        { name: 'Overhead', value: data.budget_breakdown.overhead, color: '#888888' },
    ];

    const totalCost = data.budget_breakdown.total_cost.toLocaleString('en-IN');
    const committedSpend = (data.budget_breakdown.material_cost + data.budget_breakdown.labor_cost).toLocaleString('en-IN');
    const projectTitle = data.project_details?.project_type?.toUpperCase() || "PROJECT";

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white border border-gray-200 p-2 rounded shadow-sm">
                    <p className="text-xs font-bold">{label}</p>
                    <p className="text-xs text-primary">Spend: ₹{payload[0].value}k</p>
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
                        {data.project_details?.location || 'Unknown Location'} • {data.project_details?.built_area_sqft?.toLocaleString()} SQFT
                    </div>
                    <h1 className="text-4xl font-black text-warning-black uppercase tracking-tight">Budget Breakdown</h1>
                    <p className="text-gray-500 font-medium italic">AI Analysis for {projectTitle}</p>
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
                        <span className="text-4xl font-black text-warning-black">₹{totalCost}</span>
                    </div>
                    <div className="flex items-center mt-4 text-green-600 font-bold text-sm">
                        <TrendingUp className="w-4 h-4 mr-1" />
                        <span>Est. ₹{data.budget_breakdown.cost_per_sqft}/sqft</span>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl border-t-8 border-warning-black shadow-sm">
                    <p className="text-gray-400 text-xs font-black uppercase tracking-widest mb-1">Material + Labor</p>
                    <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-black text-warning-black">₹{committedSpend}</span>
                    </div>
                    <div className="flex items-center mt-4 text-gray-500 font-bold text-sm">
                        <Clock className="w-4 h-4 mr-1" />
                        <span>Core Spend</span>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl border-t-8 border-caution shadow-sm">
                    <p className="text-gray-400 text-xs font-black uppercase tracking-widest mb-1">GST Component (18%)</p>
                    <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-black text-warning-black">₹{data.budget_breakdown.gst_cost?.toLocaleString('en-IN') || 0}</span>
                    </div>
                    <div className="flex items-center mt-4 text-red-600 font-bold text-sm">
                        <TrendingDown className="w-4 h-4 mr-1" />
                        <span>Tax Liability</span>
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
                    <h3 className="text-lg font-black uppercase tracking-tight mb-6">Cost Distribution</h3>
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
                                <span className="text-lg font-black">₹{(data.budget_breakdown.total_cost / 10000000).toFixed(2)}Cr</span>
                            </div>
                        </div>
                        <div className="flex flex-col gap-4 w-full">
                            {pieData.map((item, idx) => (
                                <div key={idx} className="flex items-center gap-3">
                                    <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: item.color }}></div>
                                    <div className="flex-1">
                                        <div className="flex justify-between">
                                            <p className="text-xs font-black uppercase tracking-widest leading-none">{item.name}</p>
                                            <p className="text-xs font-medium text-gray-500">₹{item.value > 100000 ? (item.value / 100000).toFixed(1) + 'L' : item.value}</p>
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
                    <h3 className="font-black uppercase tracking-widest text-sm">Top Vendors Nearby ({data.project_details?.location || "India"})</h3>
                    <button className="text-primary font-bold text-xs uppercase hover:underline">View All Vendors</button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50">
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Vendor Entity</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Location</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Rating</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 text-center">Score</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {(() => {
                                // Extract and flatten vendors from recommendations
                                const allVendors = [];
                                if (data.vendor_recommendations) {
                                    Object.entries(data.vendor_recommendations).forEach(([category, vendors]) => {
                                        vendors.forEach(v => {
                                            allVendors.push({ ...v, category });
                                        });
                                    });
                                }

                                // Sort by relevance/rating and take top 5
                                const topVendors = allVendors
                                    .sort((a, b) => (parseFloat(b.rating) || 0) - (parseFloat(a.rating) || 0))
                                    .slice(0, 5);

                                if (topVendors.length === 0) {
                                    return (
                                        <tr>
                                            <td colSpan="4" className="px-6 py-8 text-center text-gray-400 text-sm font-medium">
                                                No specific vendor recommendations found for this location.
                                            </td>
                                        </tr>
                                    );
                                }

                                return topVendors.map((vendor, idx) => {
                                    const score = parseFloat(vendor.rating) * 20 || 0; // Convert 5 star to 100
                                    const color = score > 90 ? 'bg-green-500' : score > 70 ? 'bg-caution' : 'bg-red-500';

                                    return (
                                        <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 flex items-center justify-center font-black rounded-sm text-xs bg-gray-100 text-gray-600">
                                                        {vendor.vendor?.substring(0, 2).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <span className="font-bold text-sm block text-warning-black">{vendor.vendor || vendor.name}</span>
                                                        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[9px] font-black uppercase rounded mt-1 inline-block">{vendor.category}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-xs font-bold text-gray-500">{vendor.location}</span>
                                            </td>
                                            <td className="px-6 py-4 text-right font-black text-sm">{vendor.rating}</td>
                                            <td className="px-6 py-4">
                                                <div className="w-24 bg-gray-200 h-1.5 rounded-full overflow-hidden mx-auto">
                                                    <div
                                                        className={`h-full ${color}`}
                                                        style={{ width: `${Math.min(score, 100)}%` }}
                                                    ></div>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                });
                            })()}
                        </tbody>
                    </table>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default BudgetBreakdown;
