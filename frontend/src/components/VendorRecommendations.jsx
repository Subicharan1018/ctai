import { motion } from 'framer-motion';
import { VendorCard } from './VendorCard';
import { Store } from 'lucide-react';
import { Card, Row, Col, Typography, Statistic, Empty } from 'antd';

const { Title, Text } = Typography;

export function VendorRecommendations({ vendorRecommendations }) {
    const materials = Object.entries(vendorRecommendations).filter(
        ([_, vendors]) => vendors && vendors.length > 0
    );

    if (materials.length === 0) {
        return (
            <Card bordered={false} className="bg-[#1e293b]/70 backdrop-blur-md border border-white/5">
                <Empty description={<span className="text-slate-400">No vendor recommendations available</span>} />
            </Card>
        );
    }

    const totalVendors = materials.reduce((sum, [_, vendors]) => sum + vendors.length, 0);

    return (
        <div className="space-y-6">
            {/* Header Card */}
            <Card bordered={false} className="bg-[#1e293b]/70 backdrop-blur-md border border-white/5 shadow-xl">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-cyan-500/20 rounded-xl flex items-center justify-center border border-cyan-500/20">
                            <Store className="w-6 h-6 text-cyan-400" />
                        </div>
                        <div>
                            <Title level={4} style={{ color: 'white', margin: 0, fontWeight: 600 }}>Vendor Recommendations</Title>
                            <span className="text-slate-400">Matched suppliers from database</span>
                        </div>
                    </div>
                    <div className="text-right">
                        <span className="text-slate-400 block text-sm">Total Groups</span>
                        <div className="text-2xl font-bold text-white tracking-tight">{materials.length}</div>
                        <span className="text-cyan-400 text-sm font-medium">{totalVendors} vendors found</span>
                    </div>
                </div>
            </Card>

            {/* Vendor Grid */}
            <Row gutter={[24, 24]}>
                {materials.map(([material, vendors], index) => (
                    <Col xs={24} xl={12} key={material}>
                        <Card
                            title={
                                <div className="flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.5)]" />
                                    <span className="text-white font-semibold">{material}</span>
                                </div>
                            }
                            extra={
                                <span className="text-xs bg-cyan-500/10 text-cyan-400 px-2 py-1 rounded border border-cyan-500/20 font-medium">
                                    {vendors.length} vendor{vendors.length !== 1 ? 's' : ''}
                                </span>
                            }
                            className="bg-[#1e293b]/60 backdrop-blur-md border border-white/5 h-full"
                            bordered={false}
                        >
                            <VendorCard vendors={vendors} materialName={material} />
                        </Card>
                    </Col>
                ))}
            </Row>
        </div>
    );
}
