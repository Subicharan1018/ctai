import { motion } from 'framer-motion';
import { Package, IndianRupee, AlertCircle, CheckCircle2, Clock, Layers } from 'lucide-react';

export function MaterialsTable({ materials }) {
    const formatCurrency = (amount) => {
        if (amount >= 100000) {
            return `₹${(amount / 100000).toFixed(2)} L`;
        }
        return `₹${amount.toLocaleString('en-IN')}`;
    };

    const formatQuantity = (quantity) => {
        if (typeof quantity === 'string') {
            return quantity;
        }
        return quantity.toLocaleString('en-IN');
    };

    const formatUnitCost = (cost) => {
        if (typeof cost === 'string') {
            return cost;
        }
        return cost.toLocaleString('en-IN');
    };

    const getPriorityIcon = (priority) => {
        switch (priority?.toLowerCase()) {
            case 'high':
                return <AlertCircle className="w-4 h-4 text-red-400" />;
            case 'medium':
                return <Clock className="w-4 h-4 text-yellow-400" />;
            case 'low':
                return <CheckCircle2 className="w-4 h-4 text-green-400" />;
            default:
                return null;
        }
    };

    const getPriorityColor = (priority) => {
        switch (priority?.toLowerCase()) {
            case 'high':
                return 'bg-gradient-to-r from-red-500/20 to-red-600/10 text-red-400 border-red-500/40';
            case 'medium':
                return 'bg-gradient-to-r from-yellow-500/20 to-amber-600/10 text-yellow-400 border-yellow-500/40';
            case 'low':
                return 'bg-gradient-to-r from-green-500/20 to-emerald-600/10 text-green-400 border-green-500/40';
            default:
                return 'bg-gradient-to-r from-slate-500/20 to-slate-600/10 text-slate-400 border-slate-500/40';
        }
    };

    // Check if materials have AI-generated fields
    const hasAIFields = materials.some(m => m.priority || m.reason);

    return (
        <div className="space-y-7">
            {/* Header Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-7 bg-linear-to-br from-purple-600/10 via-blue-600/10 to-cyan-600/5 border-purple-500/20"
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-purple-500 to-blue-500 flex items-center justify-center shadow-lg">
                            <Layers className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold gradient-text flex items-center gap-2">
                                Material Requirements
                                {hasAIFields && (
                                    <span className="text-xs bg-linear-to-r from-cyan-500/30 to-blue-500/30 text-cyan-300 px-3 py-1 rounded-full border border-cyan-500/30">
                                        ✨ AI Recommended
                                    </span>
                                )}
                            </h3>
                            <p className="text-slate-400 text-sm">Comprehensive material breakdown</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-slate-400">Total Items</p>
                        <p className="text-3xl font-bold text-white">{materials.length}</p>
                    </div>
                </div>
            </motion.div>

            {/* Materials Table */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="glass-card p-6 overflow-hidden"
            >
                <div className="overflow-x-auto -mx-6 px-6">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-slate-700/50">
                                <th className="text-left py-4 px-4 text-slate-400 font-semibold text-sm uppercase tracking-wider">Material</th>
                                {hasAIFields && (
                                    <th className="text-center py-4 px-4 text-slate-400 font-semibold text-sm uppercase tracking-wider">Priority</th>
                                )}
                                <th className="text-right py-4 px-4 text-slate-400 font-semibold text-sm uppercase tracking-wider">Quantity</th>
                                <th className="text-right py-4 px-4 text-slate-400 font-semibold text-sm uppercase tracking-wider">Unit Cost</th>
                                <th className="text-right py-4 px-4 text-slate-400 font-semibold text-sm uppercase tracking-wider">
                                    {hasAIFields ? 'Vendors' : 'Total Cost'}
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {materials.map((material, index) => (
                                <motion.tr
                                    key={material.material}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    whileHover={{ x: 4, backgroundColor: 'rgba(59, 130, 246, 0.05)' }}
                                    transition={{ delay: index * 0.03 }}
                                    className="border-b border-slate-700/30 table-row-hover"
                                >
                                    <td className="py-4 px-4">
                                        <div className="flex flex-col gap-2">
                                            <div className="flex items-center gap-3">
                                                <div className="w-3 h-3 rounded-full bg-linear-to-r from-cyan-400 to-blue-400 shadow-lg shadow-cyan-500/50" />
                                                <span className="text-white font-semibold text-base">{material.material}</span>
                                            </div>
                                            {material.reason && (
                                                <div className="ml-6 flex items-start gap-2">
                                                    <span className="text-xs text-slate-500 italic bg-slate-800/50 px-2 py-1 rounded-lg border border-slate-700/50">
                                                        💡 {material.reason}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    {hasAIFields && (
                                        <td className="py-4 px-4 text-center">
                                            {material.priority && (
                                                <motion.span 
                                                    whileHover={{ scale: 1.1 }}
                                                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold border ${getPriorityColor(material.priority)}`}
                                                >
                                                    {getPriorityIcon(material.priority)}
                                                    {material.priority.toUpperCase()}
                                                </motion.span>
                                            )}
                                        </td>
                                    )}
                                    <td className="py-4 px-4 text-right">
                                        <div className="flex flex-col items-end">
                                            <span className="text-white font-semibold text-base">
                                                {formatQuantity(material.quantity)}
                                            </span>
                                            <span className="text-slate-500 text-xs mt-0.5">{material.unit}</span>
                                        </div>
                                    </td>
                                    <td className="py-4 px-4 text-right">
                                        <div className="flex items-center justify-end gap-1 text-slate-300 font-medium">
                                            {typeof material.unit_cost === 'number' && (
                                                <IndianRupee className="w-4 h-4 text-slate-500" />
                                            )}
                                            {formatUnitCost(material.unit_cost)}
                                        </div>
                                    </td>
                                    <td className="py-4 px-4 text-right">
                                        {hasAIFields && material.vendor_count !== undefined ? (
                                            <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-linear-to-r from-cyan-500/20 to-blue-500/20 text-cyan-400 rounded-xl font-bold text-sm border border-cyan-500/30">
                                                🏢 {material.vendor_count}
                                            </span>
                                        ) : (
                                            <span className="text-cyan-400 font-bold text-base">
                                                {formatCurrency(material.total_cost)}
                                            </span>
                                        )}
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                        {!hasAIFields && (
                            <tfoot>
                                <tr className="bg-linear-to-r from-slate-800/50 to-slate-700/30 border-t-2 border-cyan-500/30">
                                    <td colSpan={3} className="py-5 px-4 text-right font-bold text-slate-200 text-lg">
                                        💰 Total Material Cost
                                    </td>
                                    <td className="py-5 px-4 text-right">
                                        <span className="text-2xl font-bold gradient-text">
                                            {formatCurrency(materials.reduce((sum, m) => sum + (typeof m.total_cost === 'number' ? m.total_cost : 0), 0))}
                                        </span>
                                    </td>
                                </tr>
                            </tfoot>
                        )}
                    </table>
                </div>
            </motion.div>

            {/* Summary for AI-recommended materials */}
            {hasAIFields && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="glass-card p-6"
                >
                    <h4 className="text-lg font-semibold text-white mb-5 flex items-center gap-2">
                        <Package className="w-5 h-5 text-cyan-400" />
                        Priority Summary
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <motion.div 
                            whileHover={{ scale: 1.05, y: -4 }}
                            className="stat-card bg-linear-to-br from-red-500/20 to-red-600/10 border border-red-500/30"
                        >
                            <div className="flex items-center gap-3 mb-2">
                                <AlertCircle className="w-6 h-6 text-red-400" />
                                <span className="text-sm font-semibold text-red-400 uppercase tracking-wide">High Priority</span>
                            </div>
                            <div className="text-4xl font-bold text-red-400">
                                {materials.filter(m => m.priority?.toLowerCase() === 'high').length}
                            </div>
                            <div className="text-xs text-red-400/70 mt-1">Critical Items</div>
                        </motion.div>
                        <motion.div 
                            whileHover={{ scale: 1.05, y: -4 }}
                            className="stat-card bg-linear-to-br from-yellow-500/20 to-amber-600/10 border border-yellow-500/30"
                        >
                            <div className="flex items-center gap-3 mb-2">
                                <Clock className="w-6 h-6 text-yellow-400" />
                                <span className="text-sm font-semibold text-yellow-400 uppercase tracking-wide">Medium Priority</span>
                            </div>
                            <div className="text-4xl font-bold text-yellow-400">
                                {materials.filter(m => m.priority?.toLowerCase() === 'medium').length}
                            </div>
                            <div className="text-xs text-yellow-400/70 mt-1">Important Items</div>
                        </motion.div>
                        <motion.div 
                            whileHover={{ scale: 1.05, y: -4 }}
                            className="stat-card bg-linear-to-br from-green-500/20 to-emerald-600/10 border border-green-500/30"
                        >
                            <div className="flex items-center gap-3 mb-2">
                                <CheckCircle2 className="w-6 h-6 text-green-400" />
                                <span className="text-sm font-semibold text-green-400 uppercase tracking-wide">Low Priority</span>
                            </div>
                            <div className="text-4xl font-bold text-green-400">
                                {materials.filter(m => m.priority?.toLowerCase() === 'low').length}
                            </div>
                            <div className="text-xs text-green-400/70 mt-1">Optional Items</div>
                        </motion.div>
                    </div>
                </motion.div>
            )}
        </div>
    );
}
