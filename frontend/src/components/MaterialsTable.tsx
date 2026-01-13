import { motion } from 'framer-motion';
import type { MaterialRequirement } from '../types';
import { Package, IndianRupee, AlertCircle, CheckCircle2, Clock } from 'lucide-react';

interface Props {
    materials: MaterialRequirement[];
}

export function MaterialsTable({ materials }: Props) {
    const formatCurrency = (amount: number) => {
        if (amount >= 100000) {
            return `₹${(amount / 100000).toFixed(2)} L`;
        }
        return `₹${amount.toLocaleString('en-IN')}`;
    };

    const formatQuantity = (quantity: number | string) => {
        if (typeof quantity === 'string') {
            return quantity;
        }
        return quantity.toLocaleString('en-IN');
    };

    const formatUnitCost = (cost: number | string) => {
        if (typeof cost === 'string') {
            return cost;
        }
        return cost.toLocaleString('en-IN');
    };

    const getPriorityIcon = (priority?: string) => {
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

    const getPriorityColor = (priority?: string) => {
        switch (priority?.toLowerCase()) {
            case 'high':
                return 'bg-red-500/20 text-red-400 border-red-500/30';
            case 'medium':
                return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
            case 'low':
                return 'bg-green-500/20 text-green-400 border-green-500/30';
            default:
                return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
        }
    };

    // Check if materials have AI-generated fields
    const hasAIFields = materials.some(m => m.priority || m.reason);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="glass-card p-6"
        >
            <h3 className="text-xl font-semibold gradient-text mb-6 flex items-center gap-2">
                <Package className="w-5 h-5 text-cyan-400" />
                Material Requirements
                {hasAIFields && (
                    <span className="text-xs bg-cyan-500/20 text-cyan-400 px-2 py-1 rounded-full ml-2">
                        AI Recommended
                    </span>
                )}
            </h3>

            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-slate-700/50">
                            <th className="text-left py-3 px-4 text-slate-400 font-medium text-sm">Material</th>
                            {hasAIFields && (
                                <th className="text-center py-3 px-4 text-slate-400 font-medium text-sm">Priority</th>
                            )}
                            <th className="text-right py-3 px-4 text-slate-400 font-medium text-sm">Quantity</th>
                            <th className="text-right py-3 px-4 text-slate-400 font-medium text-sm">Unit Cost</th>
                            <th className="text-right py-3 px-4 text-slate-400 font-medium text-sm">
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
                                transition={{ delay: index * 0.05 }}
                                className="border-b border-slate-700/30 hover:bg-slate-700/20 transition-colors"
                            >
                                <td className="py-3 px-4">
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-3">
                                            <div className="w-2 h-2 rounded-full bg-gradient-to-r from-cyan-400 to-blue-400" />
                                            <span className="text-white font-medium">{material.material}</span>
                                        </div>
                                        {material.reason && (
                                            <span className="text-xs text-slate-500 ml-5">{material.reason}</span>
                                        )}
                                    </div>
                                </td>
                                {hasAIFields && (
                                    <td className="py-3 px-4 text-center">
                                        {material.priority && (
                                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs border ${getPriorityColor(material.priority)}`}>
                                                {getPriorityIcon(material.priority)}
                                                {material.priority}
                                            </span>
                                        )}
                                    </td>
                                )}
                                <td className="py-3 px-4 text-right">
                                    <span className="text-slate-300">
                                        {formatQuantity(material.quantity)}
                                    </span>
                                    <span className="text-slate-500 text-sm ml-1">{material.unit}</span>
                                </td>
                                <td className="py-3 px-4 text-right text-slate-300">
                                    <div className="flex items-center justify-end gap-1">
                                        {typeof material.unit_cost === 'number' && (
                                            <IndianRupee className="w-3 h-3 text-slate-500" />
                                        )}
                                        {formatUnitCost(material.unit_cost)}
                                    </div>
                                </td>
                                <td className="py-3 px-4 text-right">
                                    {hasAIFields && material.vendor_count !== undefined ? (
                                        <span className="text-cyan-400 font-semibold">
                                            {material.vendor_count} found
                                        </span>
                                    ) : (
                                        <span className="text-cyan-400 font-semibold">
                                            {formatCurrency(material.total_cost)}
                                        </span>
                                    )}
                                </td>
                            </motion.tr>
                        ))}
                    </tbody>
                    {!hasAIFields && (
                        <tfoot>
                            <tr className="bg-slate-700/30">
                                <td colSpan={3} className="py-4 px-4 text-right font-semibold text-slate-300">
                                    Total Material Cost
                                </td>
                                <td className="py-4 px-4 text-right">
                                    <span className="text-lg font-bold gradient-text">
                                        {formatCurrency(materials.reduce((sum, m) => sum + (typeof m.total_cost === 'number' ? m.total_cost : 0), 0))}
                                    </span>
                                </td>
                            </tr>
                        </tfoot>
                    )}
                </table>
            </div>

            {/* Summary for AI-recommended materials */}
            {hasAIFields && (
                <div className="mt-6 grid grid-cols-3 gap-4">
                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold text-red-400">
                            {materials.filter(m => m.priority?.toLowerCase() === 'high').length}
                        </div>
                        <div className="text-xs text-red-400">High Priority</div>
                    </div>
                    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold text-yellow-400">
                            {materials.filter(m => m.priority?.toLowerCase() === 'medium').length}
                        </div>
                        <div className="text-xs text-yellow-400">Medium Priority</div>
                    </div>
                    <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold text-green-400">
                            {materials.filter(m => m.priority?.toLowerCase() === 'low').length}
                        </div>
                        <div className="text-xs text-green-400">Low Priority</div>
                    </div>
                </div>
            )}
        </motion.div>
    );
}
