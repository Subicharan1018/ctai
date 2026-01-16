import { motion } from 'framer-motion';
import { Table, Card, Tag, Typography, Statistic, Row, Col } from 'antd';
import { Package, AlertCircle, CheckCircle2, Clock, Layers } from 'lucide-react';

const { Title, Text } = Typography;

export function MaterialsTable({ materials }) {
    const formatCurrency = (amount) => {
        if (amount >= 100000) {
            return `₹${(amount / 100000).toFixed(2)} L`;
        }
        return `₹${amount.toLocaleString('en-IN')}`;
    };

    const hasAIFields = materials.some(m => m.priority || m.reason);

    const columns = [
        {
            title: 'Material',
            dataIndex: 'material',
            key: 'material',
            render: (text, record) => (
                <div>
                    <Text strong style={{ color: 'white' }}>{text}</Text>
                    {record.reason && (
                        <div className="text-slate-400 text-xs mt-1">
                            💡 {record.reason}
                        </div>
                    )}
                </div>
            ),
        },
        hasAIFields ? {
            title: 'Priority',
            dataIndex: 'priority',
            key: 'priority',
            align: 'center',
            render: (priority) => {
                let color = 'default';
                let icon = null;
                switch (priority?.toLowerCase()) {
                    case 'high': color = 'error'; icon = <AlertCircle size={14} />; break;
                    case 'medium': color = 'warning'; icon = <Clock size={14} />; break;
                    case 'low': color = 'success'; icon = <CheckCircle2 size={14} />; break;
                }
                return priority ? (
                    <Tag color={color} className="flex items-center gap-1 justify-center mx-auto w-fit font-medium">
                        {icon} {priority.toUpperCase()}
                    </Tag>
                ) : '-';
            }
        } : {},
        {
            title: 'Quantity',
            dataIndex: 'quantity',
            key: 'quantity',
            align: 'right',
            render: (quantity, record) => (
                <div className="flex flex-col items-end">
                    <Text style={{ color: 'white' }}>{typeof quantity === 'string' ? quantity : quantity.toLocaleString('en-IN')}</Text>
                    <Text type="secondary" style={{ fontSize: '11px', color: '#94a3b8' }}>{record.unit}</Text>
                </div>
            ),
        },
        {
            title: 'Unit Cost',
            dataIndex: 'unit_cost',
            key: 'unit_cost',
            align: 'right',
            render: (cost) => (
                <Text type="secondary" style={{ color: '#94a3b8' }}>
                    {typeof cost === 'number' ? `₹${cost.toLocaleString('en-IN')}` : cost}
                </Text>
            ),
        },
        {
            title: hasAIFields ? 'Vendors' : 'Total Cost',
            key: 'total',
            align: 'right',
            render: (_, record) => hasAIFields && record.vendor_count !== undefined ? (
                <Tag color="cyan" className="font-medium bg-cyan-950/30 border-cyan-900/50">🏢 {record.vendor_count} Vendors</Tag>
            ) : (
                <Text strong style={{ color: '#06b6d4' }}>
                    {formatCurrency(record.total_cost)}
                </Text>
            )
        },
    ].filter(col => col.dataIndex);

    const totalCost = materials.reduce((sum, m) => sum + (typeof m.total_cost === 'number' ? m.total_cost : 0), 0);

    return (
        <div className="space-y-6">
            {/* Header Card */}
            <Card bordered={false} className="bg-[#1e293b]/70 backdrop-blur-md border border-white/5 shadow-xl">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center border border-purple-500/20">
                            <Layers className="w-6 h-6 text-purple-400" />
                        </div>
                        <div>
                            <Title level={4} style={{ color: 'white', margin: 0, fontWeight: 600 }}>
                                Material Requirements
                                {hasAIFields && <Tag color="blue" className="ml-2 border-0 bg-blue-600/20 text-blue-300">AI Recommended</Tag>}
                            </Title>
                            <span className="text-slate-400">Comprehensive breakdown of items</span>
                        </div>
                    </div>
                    <div className="text-right">
                        <span className="text-slate-400 block text-sm">Total Items</span>
                        <div className="text-2xl font-bold text-white tracking-tight">{materials.length}</div>
                    </div>
                </div>
            </Card>

            {/* Table */}
            <Card bordered={false} className="bg-[#1e293b]/60 backdrop-blur-md border border-white/5 overflow-hidden" bodyStyle={{ padding: 0 }}>
                <Table
                    columns={columns}
                    dataSource={materials}
                    pagination={false}
                    rowKey="material"
                    className="ant-table-dark bg-transparent"
                    style={{ background: 'transparent' }}
                    summary={() => !hasAIFields && (
                        <Table.Summary.Row className="bg-white/5 hover:bg-white/5">
                            <Table.Summary.Cell index={0} colSpan={3}>
                                <Text strong style={{ color: 'white' }} className="text-right block pr-4">Total Material Cost</Text>
                            </Table.Summary.Cell>
                            <Table.Summary.Cell index={1} colSpan={2}>
                                <Text strong style={{ color: '#06b6d4', fontSize: '1.2em' }} className="text-right block">
                                    {formatCurrency(totalCost)}
                                </Text>
                            </Table.Summary.Cell>
                        </Table.Summary.Row>
                    )}
                />
            </Card>

            {/* AI Summary */}
            {hasAIFields && (
                <Card
                    title={<span className="text-white flex items-center gap-2 font-semibold"><Package size={18} className="text-cyan-400" /> Priority Summary</span>}
                    className="bg-[#1e293b]/60 backdrop-blur-md border border-white/5"
                    bordered={false}
                >
                    <Row gutter={16}>
                        <Col span={8}>
                            <Card size="small" className="bg-red-500/10 border-red-500/20 shadow-inner">
                                <Statistic
                                    title={<span className="text-red-400 font-medium">High Priority</span>}
                                    value={materials.filter(m => m.priority?.toLowerCase() === 'high').length}
                                    valueStyle={{ color: '#f87171', fontWeight: 'bold' }}
                                    prefix={<AlertCircle size={16} />}
                                />
                            </Card>
                        </Col>
                        <Col span={8}>
                            <Card size="small" className="bg-yellow-500/10 border-yellow-500/20 shadow-inner">
                                <Statistic
                                    title={<span className="text-yellow-400 font-medium">Medium Priority</span>}
                                    value={materials.filter(m => m.priority?.toLowerCase() === 'medium').length}
                                    valueStyle={{ color: '#facc15', fontWeight: 'bold' }}
                                    prefix={<Clock size={16} />}
                                />
                            </Card>
                        </Col>
                        <Col span={8}>
                            <Card size="small" className="bg-green-500/10 border-green-500/20 shadow-inner">
                                <Statistic
                                    title={<span className="text-green-400 font-medium">Low Priority</span>}
                                    value={materials.filter(m => m.priority?.toLowerCase() === 'low').length}
                                    valueStyle={{ color: '#4ade80', fontWeight: 'bold' }}
                                    prefix={<CheckCircle2 size={16} />}
                                />
                            </Card>
                        </Col>
                    </Row>
                </Card>
            )}
        </div>
    );
}
