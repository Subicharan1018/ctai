import { motion } from 'framer-motion';
import type { Vendor } from '../types';
import { Star, MapPin, ExternalLink, CheckCircle, AlertCircle } from 'lucide-react';

interface Props {
    vendors: Vendor[];
    materialName: string;
}

export function VendorCard({ vendors, materialName }: Props) {
    if (!vendors || vendors.length === 0) {
        return (
            <div className="text-center py-4 text-slate-400">
                No vendors found for {materialName}
            </div>
        );
    }

    const renderStars = (rating: string) => {
        const numRating = parseFloat(rating);
        if (isNaN(numRating)) return null;

        return (
            <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                    <Star
                        key={i}
                        className={`w-3 h-3 ${i < Math.floor(numRating)
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-slate-600'
                            }`}
                    />
                ))}
                <span className="text-slate-400 text-sm ml-1">{rating}</span>
            </div>
        );
    };

    return (
        <div className="space-y-3">
            {vendors.map((vendor, index) => (
                <motion.div
                    key={`${vendor.vendor}-${index}`}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-gradient-to-r from-slate-800/50 to-slate-700/30 rounded-xl p-4 border border-slate-600/30 hover:border-cyan-500/30 transition-all hover:shadow-lg hover:shadow-cyan-500/5"
                >
                    <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                            <h5 className="text-white font-medium text-sm line-clamp-1">
                                {vendor.product}
                            </h5>
                            <p className="text-slate-400 text-xs mt-1">{vendor.vendor || 'Unknown Vendor'}</p>
                        </div>
                        {vendor.url && (
                            <a
                                href={vendor.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-cyan-400 hover:text-cyan-300 transition-colors p-1"
                            >
                                <ExternalLink className="w-4 h-4" />
                            </a>
                        )}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
                        <MapPin className="w-3 h-3" />
                        <span className="line-clamp-1">{vendor.location || 'Location not specified'}</span>
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-700/50">
                        {renderStars(vendor.rating) || (
                            <span className="text-slate-500 text-xs">No rating</span>
                        )}

                        <div className="flex items-center gap-1">
                            {vendor.availability === 'In Stock' ? (
                                <>
                                    <CheckCircle className="w-3 h-3 text-emerald-400" />
                                    <span className="text-emerald-400 text-xs">In Stock</span>
                                </>
                            ) : (
                                <>
                                    <AlertCircle className="w-3 h-3 text-amber-400" />
                                    <span className="text-amber-400 text-xs">{vendor.availability || 'N/A'}</span>
                                </>
                            )}
                        </div>
                    </div>
                </motion.div>
            ))}
        </div>
    );
}
