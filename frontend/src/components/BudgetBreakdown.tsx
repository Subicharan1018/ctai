import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import type { BudgetBreakdown as BudgetBreakdownType } from '../types';
import { DollarSign, Percent, Building2 } from 'lucide-react';

interface Props {
    budget: BudgetBreakdownType;
}

const COLORS = ['#0ea5e9', '#22d3ee', '#38bdf8', '#7dd3fc', '#a5f3fc'];

export function BudgetBreakdown({ budget }: Props) {
    const chartData = [
        { name: 'Materials', value: budget.breakdown_percentage.materials, color: COLORS[0] },
        { name: 'Labor', value: budget.breakdown_percentage.labor, color: COLORS[1] },
        { name: 'Equipment', value: budget.breakdown_percentage.equipment, color: COLORS[2] },
        { name: 'Overhead', value: budget.breakdown_percentage.overhead, color: COLORS[3] },
        { name: 'Profit', value: budget.breakdown_percentage.profit, color: COLORS[4] },
    ];

    const formatCurrency = (amount: number) => {
        if (amount >= 10000000) {
            return `₹${(amount / 10000000).toFixed(2)} Cr`;
        } else if (amount >= 100000) {
            return `₹${(amount / 100000).toFixed(2)} L`;
        }
        return `₹${amount.toLocaleString('en-IN')}`;
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="glass-card p-6"
        >
            <h3 className="text-xl font-semibold gradient-text mb-6 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-cyan-400" />
                Budget Breakdown
            </h3>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Pie Chart */}
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={chartData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={90}
                                paddingAngle={2}
                                dataKey="value"
                            >
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip
                                formatter={(value) => [`${value ?? 0}%`, '']}
                                contentStyle={{
                                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                                    border: '1px solid rgba(14, 165, 233, 0.3)',
                                    borderRadius: '8px',
                                    color: '#f8fafc',
                                }}
                            />
                            <Legend
                                verticalAlign="bottom"
                                height={36}
                                formatter={(value) => (
                                    <span className="text-slate-300 text-sm">{value}</span>
                                )}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* Stats Cards */}
                <div className="space-y-4">
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-xl p-4 border border-cyan-500/20"
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-slate-400 text-sm">Total Cost</span>
                            <Building2 className="w-4 h-4 text-cyan-400" />
                        </div>
                        <p className="text-2xl font-bold text-white mt-1">
                            {formatCurrency(budget.total_cost)}
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                        className="bg-gradient-to-r from-blue-500/10 to-indigo-500/10 rounded-xl p-4 border border-blue-500/20"
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-slate-400 text-sm">Cost per Sqft</span>
                            <Percent className="w-4 h-4 text-blue-400" />
                        </div>
                        <p className="text-2xl font-bold text-white mt-1">
                            ₹{budget.cost_per_sqft.toLocaleString('en-IN')}
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-2 gap-3">
                        {[
                            { label: 'Materials', value: budget.material_cost, color: 'from-sky-500/10 to-cyan-500/10' },
                            { label: 'Labor', value: budget.labor_cost, color: 'from-cyan-500/10 to-teal-500/10' },
                        ].map((item, idx) => (
                            <motion.div
                                key={item.label}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 + idx * 0.1 }}
                                className={`bg-gradient-to-r ${item.color} rounded-lg p-3 border border-white/5`}
                            >
                                <p className="text-slate-400 text-xs">{item.label}</p>
                                <p className="text-white font-semibold text-sm mt-1">
                                    {formatCurrency(item.value)}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
