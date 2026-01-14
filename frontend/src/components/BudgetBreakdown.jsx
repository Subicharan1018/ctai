import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { DollarSign, TrendingUp, Building2, Wallet, Target } from 'lucide-react';

const COLORS = ['#3b82f6', '#06b6d4', '#8b5cf6', '#ec4899', '#f59e0b'];

export function BudgetBreakdown({ budget }) {
    const chartData = [
        { name: 'Materials', value: budget.breakdown_percentage.materials, amount: budget.material_cost, color: COLORS[0] },
        { name: 'Labor', value: budget.breakdown_percentage.labor, amount: budget.labor_cost, color: COLORS[1] },
        { name: 'Equipment', value: budget.breakdown_percentage.equipment, amount: budget.equipment_cost, color: COLORS[2] },
        { name: 'Overhead', value: budget.breakdown_percentage.overhead, amount: budget.overhead, color: COLORS[3] },
        { name: 'Profit', value: budget.breakdown_percentage.profit, amount: budget.contractor_profit, color: COLORS[4] },
    ];

    const formatCurrency = (amount) => {
        if (amount >= 10000000) {
            return `₹${(amount / 10000000).toFixed(2)} Cr`;
        } else if (amount >= 100000) {
            return `₹${(amount / 100000).toFixed(2)} L`;
        }
        return `₹${amount.toLocaleString('en-IN')}`;
    };

    return (
        <div className="space-y-7">
            {/* Header Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-7 bg-linear-to-br from-blue-600/10 via-cyan-600/10 to-purple-600/5 border-blue-500/20"
            >
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg">
                            <Wallet className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold gradient-text">Budget Analysis</h3>
                            <p className="text-slate-400 text-sm">Comprehensive cost breakdown</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-slate-400">Total Project Cost</p>
                        <p className="text-3xl font-bold text-white">{formatCurrency(budget.total_cost)}</p>
                        <p className="text-sm text-cyan-400 mt-1">₹{budget.cost_per_sqft.toLocaleString('en-IN')}/sqft</p>
                    </div>
                </div>
            </motion.div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-7">
                {/* Pie Chart */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    className="glass-card p-6"
                >
                    <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <Target className="w-5 h-5 text-cyan-400" />
                        Cost Distribution
                    </h4>
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={chartData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={70}
                                    outerRadius={100}
                                    paddingAngle={3}
                                    dataKey="value"
                                >
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    formatter={(value) => [`${value ?? 0}%`, '']}
                                    contentStyle={{
                                        backgroundColor: 'rgba(15, 23, 42, 0.95)',
                                        border: '1px solid rgba(59, 130, 246, 0.3)',
                                        borderRadius: '12px',
                                        color: '#f8fafc',
                                        padding: '12px',
                                    }}
                                />
                                <Legend
                                    verticalAlign="bottom"
                                    height={36}
                                    formatter={(value) => (
                                        <span className="text-slate-300 text-sm font-medium">{value}</span>
                                    )}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                {/* Bar Chart */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="glass-card p-6"
                >
                    <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-cyan-400" />
                        Amount Breakdown
                    </h4>
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.1)" />
                                <XAxis 
                                    dataKey="name" 
                                    stroke="#94a3b8"
                                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                                />
                                <YAxis 
                                    stroke="#94a3b8"
                                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                                    tickFormatter={(value) => `${(value / 10000000).toFixed(0)}Cr`}
                                />
                                <Tooltip
                                    formatter={(value) => [formatCurrency(Number(value)), 'Amount']}
                                    contentStyle={{
                                        backgroundColor: 'rgba(15, 23, 42, 0.95)',
                                        border: '1px solid rgba(59, 130, 246, 0.3)',
                                        borderRadius: '12px',
                                        color: '#f8fafc',
                                        padding: '12px',
                                    }}
                                />
                                <Bar dataKey="amount" radius={[8, 8, 0, 0]}>
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>
            </div>

            {/* Detailed Stats Grid */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="glass-card p-6"
            >
                <h4 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-cyan-400" />
                    Detailed Cost Breakdown
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[
                        { label: 'Materials', amount: budget.material_cost, percent: budget.breakdown_percentage.materials, icon: '🧱', gradient: 'from-blue-500/20 to-blue-600/10', border: 'border-blue-500/30' },
                        { label: 'Labor', amount: budget.labor_cost, percent: budget.breakdown_percentage.labor, icon: '👷', gradient: 'from-cyan-500/20 to-cyan-600/10', border: 'border-cyan-500/30' },
                        { label: 'Equipment', amount: budget.equipment_cost, percent: budget.breakdown_percentage.equipment, icon: '🏗️', gradient: 'from-purple-500/20 to-purple-600/10', border: 'border-purple-500/30' },
                        { label: 'Overhead', amount: budget.overhead, percent: budget.breakdown_percentage.overhead, icon: '📊', gradient: 'from-pink-500/20 to-pink-600/10', border: 'border-pink-500/30' },
                        { label: 'Profit Margin', amount: budget.contractor_profit, percent: budget.breakdown_percentage.profit, icon: '💎', gradient: 'from-amber-500/20 to-amber-600/10', border: 'border-amber-500/30' },
                        { label: 'Cost/Sqft', amount: budget.cost_per_sqft, percent: 0, icon: '📏', gradient: 'from-emerald-500/20 to-emerald-600/10', border: 'border-emerald-500/30' },
                    ].map((item, idx) => (
                        <motion.div
                            key={item.label}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            whileHover={{ scale: 1.05, y: -4 }}
                            transition={{ delay: 0.4 + idx * 0.05 }}
                            className={`stat-card bg-linear-to-br ${item.gradient} border ${item.border}`}
                        >
                            <div className="flex items-start justify-between mb-3">
                                <span className="text-3xl">{item.icon}</span>
                                {item.percent > 0 && (
                                    <span className="px-2 py-1 bg-white/10 rounded-full text-xs font-semibold text-white">
                                        {item.percent}%
                                    </span>
                                )}
                            </div>
                            <p className="text-slate-400 text-sm font-medium mb-2">{item.label}</p>
                            <p className="text-2xl font-bold text-white">
                                {item.label === 'Cost/Sqft' 
                                    ? `₹${item.amount.toLocaleString('en-IN')}`
                                    : formatCurrency(item.amount)
                                }
                            </p>
                        </motion.div>
                    ))}
                </div>
            </motion.div>
        </div>
    );
}
