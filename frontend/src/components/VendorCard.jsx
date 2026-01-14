import { motion } from 'framer-motion';
import { Star, MapPin, ExternalLink, CheckCircle, AlertCircle, ShoppingBag, Award } from 'lucide-react';

export function VendorCard({ vendors, materialName }) {
    if (!vendors || vendors.length === 0) {
        return (
            <div className="glass-card p-6 text-center border-slate-600/30">
                <ShoppingBag className="w-12 h-12 text-slate-500 mx-auto mb-3" />
                <p className="text-slate-400">No vendors found for {materialName}</p>
            </div>
        );
    }

    const renderStars = (rating) => {
        const numRating = parseFloat(rating);
        if (isNaN(numRating)) return null;

        return (
            <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                    <Star
                        key={i}
                        className={`w-4 h-4 transition-all ${
                            i < Math.floor(numRating)
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-slate-600'
                        }`}
                    />
                ))}
                <span className="text-slate-300 text-sm ml-2 font-semibold">{rating}</span>
            </div>
        );
    };

    return (
        <div className="space-y-4">
            {vendors.map((vendor, index) => (
                <motion.div
                    key={`${vendor.vendor}-${index}`}
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    whileHover={{ scale: 1.02, y: -4 }}
                    transition={{ delay: index * 0.08, type: "spring", stiffness: 300 }}
                    className="glass-card p-6 bg-linear-to-br from-slate-800/80 to-slate-700/50 border-slate-600/40 hover:border-cyan-500/50 shadow-xl hover:shadow-cyan-500/20 group"
                >
                    {/* Header */}
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-2 h-2 rounded-full bg-linear-to-r from-cyan-400 to-blue-400" />
                                <h5 className="text-white font-bold text-base line-clamp-1 group-hover:text-cyan-400 transition-colors">
                                    {vendor.product}
                                </h5>
                            </div>
                            <div className="flex items-center gap-2">
                                <Award className="w-4 h-4 text-blue-400" />
                                <p className="text-slate-300 text-sm font-medium">{vendor.vendor || 'Unknown Vendor'}</p>
                            </div>
                        </div>
                        {vendor.url && (
                            <motion.a
                                whileHover={{ scale: 1.1, rotate: 15 }}
                                whileTap={{ scale: 0.9 }}
                                href={vendor.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-center w-10 h-10 rounded-xl bg-linear-to-br from-cyan-500/20 to-blue-500/20 hover:from-cyan-500/30 hover:to-blue-500/30 border border-cyan-500/30 transition-all group-hover:border-cyan-500/50"
                            >
                                <ExternalLink className="w-5 h-5 text-cyan-400" />
                            </motion.a>
                        )}
                    </div>

                    {/* Location */}
                    <div className="flex items-center gap-2 text-sm text-slate-400 mb-4 pb-4 border-b border-slate-700/50">
                        <MapPin className="w-4 h-4 text-blue-400" />
                        <span className="line-clamp-1">{vendor.location || 'Location not specified'}</span>
                    </div>

                    {/* Footer Info */}
                    <div className="flex items-center justify-between">
                        {/* Rating */}
                        <div>
                            {renderStars(vendor.rating) || (
                                <span className="text-slate-500 text-sm flex items-center gap-1">
                                    <Star className="w-4 h-4" />
                                    No rating
                                </span>
                            )}
                        </div>

                        {/* Availability Badge */}
                        <div>
                            {vendor.availability === 'In Stock' ? (
                                <span className="badge badge-success shadow-lg shadow-green-500/20">
                                    <CheckCircle className="w-3 h-3" />
                                    In Stock
                                </span>
                            ) : (
                                <span className="badge badge-warning shadow-lg shadow-amber-500/20">
                                    <AlertCircle className="w-3 h-3" />
                                    {vendor.availability || 'N/A'}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* GST Info if available */}
                    {vendor.gst && vendor.gst !== 'N/A' && (
                        <div className="mt-4 pt-4 border-t border-slate-700/50">
                            <p className="text-xs text-slate-500">
                                GST: <span className="text-slate-400 font-mono">{vendor.gst}</span>
                            </p>
                        </div>
                    )}
                </motion.div>
            ))}
        </div>
    );
}
