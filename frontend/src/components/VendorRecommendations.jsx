import { motion } from 'framer-motion';
import { VendorCard } from './VendorCard';
import { Users, Store } from 'lucide-react';

export function VendorRecommendations({ vendorRecommendations }) {
    const materials = Object.entries(vendorRecommendations).filter(
        ([_, vendors]) => vendors && vendors.length > 0
    );

    if (materials.length === 0) {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="glass-card p-8 text-center"
            >
                <Store className="w-16 h-16 text-slate-500 mx-auto mb-4" />
                <p className="text-slate-400 text-lg">No vendor recommendations available</p>
                <p className="text-slate-500 text-sm mt-2">Try analyzing a project first</p>
            </motion.div>
        );
    }

    const totalVendors = materials.reduce((sum, [_, vendors]) => sum + vendors.length, 0);

    return (
        <div className="space-y-7">
            {/* Header Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-7 bg-linear-to-br from-cyan-600/10 via-blue-600/10 to-purple-600/5 border-cyan-500/20"
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-cyan-500 to-blue-500 flex items-center justify-center shadow-lg">
                            <Store className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold gradient-text">Vendor Recommendations</h3>
                            <p className="text-slate-400 text-sm">Matched suppliers from database</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-slate-400">Total Vendors</p>
                        <p className="text-3xl font-bold text-white">{totalVendors}</p>
                        <p className="text-sm text-cyan-400">{materials.length} categories</p>
                    </div>
                </div>
            </motion.div>

            {/* Vendor Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-7">
                {materials.map(([material, vendors], index) => (
                    <motion.div
                        key={material}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.08 }}
                        className="glass-card p-6"
                    >
                        <div className="flex items-center justify-between mb-5">
                            <h4 className="text-white font-bold text-lg flex items-center gap-3">
                                <div className="w-3 h-3 rounded-full bg-linear-to-r from-cyan-400 to-blue-400 shadow-lg shadow-cyan-500/50" />
                                {material}
                            </h4>
                            <span className="px-3 py-1.5 bg-linear-to-r from-blue-500/20 to-cyan-500/20 text-blue-300 rounded-xl text-sm font-semibold border border-blue-500/30">
                                {vendors.length} vendor{vendors.length !== 1 ? 's' : ''}
                            </span>
                        </div>
                        <VendorCard vendors={vendors} materialName={material} />
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
