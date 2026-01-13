import { motion } from 'framer-motion';
import type { Vendor } from '../types';
import { VendorCard } from './VendorCard';
import { Users } from 'lucide-react';

interface Props {
    vendorRecommendations: Record<string, Vendor[]>;
}

export function VendorRecommendations({ vendorRecommendations }: Props) {
    const materials = Object.entries(vendorRecommendations).filter(
        ([_, vendors]) => vendors && vendors.length > 0
    );

    if (materials.length === 0) {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="glass-card p-6 text-center"
            >
                <Users className="w-12 h-12 text-slate-500 mx-auto mb-3" />
                <p className="text-slate-400">No vendor recommendations available</p>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="glass-card p-6"
        >
            <h3 className="text-xl font-semibold gradient-text mb-6 flex items-center gap-2">
                <Users className="w-5 h-5 text-cyan-400" />
                Vendor Recommendations
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {materials.map(([material, vendors], index) => (
                    <motion.div
                        key={material}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                    >
                        <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-cyan-400" />
                            {material}
                            <span className="text-slate-500 text-sm font-normal">
                                ({vendors.length} vendor{vendors.length !== 1 ? 's' : ''})
                            </span>
                        </h4>
                        <VendorCard vendors={vendors} materialName={material} />
                    </motion.div>
                ))}
            </div>
        </motion.div>
    );
}
