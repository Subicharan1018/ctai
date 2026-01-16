import React from 'react';
import { Card, Typography, Tag, Button, Empty, Row, Col, Rate } from 'antd';
import { MapPin, Phone, ExternalLink, Star } from 'lucide-react';

const { Text, Title, Paragraph } = Typography;

export function VendorCard({ vendors, materialName }) {
    if (!vendors || vendors.length === 0) {
        return <Empty description="No vendors found for this material" />;
    }

    return (
        <div className="space-y-4">
            {vendors.map((vendor, index) => (
                <Card
                    key={index}
                    type="inner"
                    bordered={false}
                    className="bg-[#0f172a]/40 border border-white/5 hover:bg-[#0f172a]/60 transition-colors"
                >
                    <div className="flex flex-col gap-3">
                        {/* Header: Name and Rating */}
                        <div className="flex justify-between items-start">
                            <div>
                                <Text strong className="text-lg text-white block">
                                    {vendor.vendor}
                                </Text>
                                {vendor.product && (
                                    <Text className="text-slate-400 text-sm block mt-1">
                                        {vendor.product}
                                    </Text>
                                )}
                            </div>
                            {vendor.rating && vendor.rating !== 'N/A' && (
                                <div className="flex items-center bg-yellow-500/10 px-2 py-1 rounded border border-yellow-500/20">
                                    <Star size={14} className="text-yellow-400 mr-1 fill-yellow-400" />
                                    <span className="text-yellow-400 font-medium">{vendor.rating}</span>
                                </div>
                            )}
                        </div>

                        {/* Details: Location and Availability */}
                        <div className="flex flex-wrap gap-y-2 gap-x-4 text-sm">
                            {vendor.location && vendor.location !== 'N/A' && (
                                <div className="flex items-center text-slate-400">
                                    <MapPin size={14} className="mr-1.5 text-blue-400" />
                                    {vendor.location}
                                </div>
                            )}
                            {vendor.availability && vendor.availability !== 'N/A' && (
                                <div className="flex items-center text-slate-400">
                                    <span className={`w-2 h-2 rounded-full mr-2 ${vendor.availability.toLowerCase().includes('in stock') || vendor.availability.toLowerCase().includes('available')
                                            ? 'bg-emerald-500'
                                            : 'bg-amber-500'
                                        }`} />
                                    {vendor.availability}
                                </div>
                            )}
                        </div>

                        {/* Footer: Actions */}
                        <div className="pt-2 mt-1 border-t border-white/5 flex items-center justify-between">
                            {vendor.gst && vendor.gst !== 'N/A' && (
                                <Tag className="bg-slate-800 border-slate-700 text-slate-500 m-0">
                                    GST: {vendor.gst}
                                </Tag>
                            )}

                            {vendor.url && (
                                <Button
                                    type="link"
                                    href={vendor.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-0 h-auto text-cyan-400 hover:text-cyan-300 flex items-center ml-auto"
                                >
                                    Contact Supplier <ExternalLink size={14} className="ml-1.5" />
                                </Button>
                            )}
                        </div>
                    </div>
                </Card>
            ))}
        </div>
    );
}
