import { motion } from 'framer-motion';
import { PieChart } from '@mui/x-charts/PieChart';
import { BarChart } from '@mui/x-charts/BarChart';
import { Card, Row, Col, Statistic, Typography } from 'antd';
import { DollarSign, TrendingUp, Building2, Wallet, Target } from 'lucide-react';

const { Title } = Typography;

// Construction Yellow & White Theme
const COLORS = ['#FFCC00', '#FFFFFF', '#FFD700', '#F0F0F0', '#E6B800'];

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
        <div className="space-y-6">
            {/* Header Card */}
            <Card bordered={false} className="bg-[#1e293b]/70 backdrop-blur-md border border-white/5 shadow-xl">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center border border-blue-500/20">
                            <Wallet className="w-6 h-6 text-blue-400" />
                        </div>
                        <div>
                            <Title level={4} style={{ color: 'white', margin: 0, fontWeight: 600 }}>Budget Analysis</Title>
                            <span className="text-slate-400">Comprehensive cost breakdown</span>
                        </div>
                    </div>
                    <div className="text-right">
                        <span className="text-slate-400 block text-sm">Total Project Cost</span>
                        <Statistic
                            value={budget.total_cost}
                            formatter={(value) => <span className="text-3xl font-bold text-white tracking-tight">{formatCurrency(value)}</span>}
                        />
                        <span className="text-cyan-400 text-sm font-medium">₹{budget.cost_per_sqft.toLocaleString('en-IN')}/sqft</span>
                    </div>
                </div>
            </Card>

            {/* Charts Grid */}
            <Row gutter={[24, 24]}>
                {/* Pie Chart */}
                <Col xs={24} xl={12}>
                    <Card
                        title={<span className="text-white flex items-center gap-2 font-semibold"><Target size={18} className="text-cyan-400" /> Cost Distribution</span>}
                        className="bg-[#1e293b]/60 backdrop-blur-md border border-white/5 h-full"
                        bordered={false}
                    >
                        <div className="h-72 w-full flex justify-center items-center">
                            <PieChart
                                series={[
                                    {
                                        data: chartData.map((item, index) => ({
                                            id: index,
                                            value: item.value,
                                            label: item.name,
                                            color: item.color,
                                        })),
                                        highlightScope: { faded: 'global', highlighted: 'item' },
                                        faded: { innerRadius: 30, additionalRadius: -30, color: 'gray' },
                                        innerRadius: 70,
                                        outerRadius: 100,
                                        paddingAngle: 3,
                                        cornerRadius: 6,
                                        cx: 200,
                                    },
                                ]}
                                width={400}
                                height={250}
                                slotProps={{
                                    legend: { hidden: true },
                                    tooltip: { trigger: 'item' }
                                }}
                                theme={{
                                    text: { fill: '#cbd5e1' },
                                }}
                            />
                        </div>
                        <div className="flex flex-wrap justify-center gap-4 mt-6">
                            {chartData.map((entry, index) => (
                                <div key={`legend-${index}`} className="flex items-center gap-2 px-2 py-1 bg-white/5 rounded-lg border border-white/5">
                                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                                    <span className="text-slate-300 text-xs font-medium">{entry.name}</span>
                                </div>
                            ))}
                        </div>
                    </Card>
                </Col>

                {/* Bar Chart */}
                <Col xs={24} xl={12}>
                    <Card
                        title={<span className="text-white flex items-center gap-2 font-semibold"><TrendingUp size={18} className="text-cyan-400" /> Amount Breakdown</span>}
                        className="bg-[#1e293b]/60 backdrop-blur-md border border-white/5 h-full"
                        bordered={false}
                    >
                        <div className="h-72 w-full">
                            <BarChart
                                xAxis={[{
                                    scaleType: 'band',
                                    data: chartData.map(d => d.name),
                                    tickLabelStyle: { fill: '#94a3b8', fontSize: 12 }
                                }]}
                                yAxis={[{
                                    tickLabelStyle: { fill: '#94a3b8', fontSize: 12 },
                                    valueFormatter: (value) => `${(value / 10000000).toFixed(0)}Cr`
                                }]}
                                series={[{
                                    data: chartData.map(d => d.amount),
                                    valueFormatter: (value) => formatCurrency(value),
                                    color: '#FACC15', // DaisyUI Warning/Yellowish
                                    type: 'bar',
                                    layout: 'vertical'
                                }]}
                                height={280}
                                margin={{ top: 20, bottom: 30, left: 60, right: 10 }}
                                slotProps={{
                                    tooltip: {
                                        root: {
                                            backgroundColor: 'rgba(15, 23, 42, 0.95)',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            borderRadius: '8px',
                                            color: '#fff',
                                        }
                                    }
                                }}
                                theme={{
                                    text: { fill: '#94a3b8' },
                                }}
                            />
                        </div>
                    </Card>
                </Col>
            </Row>

            {/* Detailed Stats Grid */}
            <Card
                title={<span className="text-white flex items-center gap-2 font-semibold"><Building2 size={18} className="text-cyan-400" /> Detailed Cost Breakdown</span>}
                className="bg-[#1e293b]/60 backdrop-blur-md border border-white/5"
                bordered={false}
            >
                <Row gutter={[16, 16]}>
                    {[
                        { label: 'Materials', amount: budget.material_cost, percent: budget.breakdown_percentage.materials, icon: '🧱' },
                        { label: 'Labor', amount: budget.labor_cost, percent: budget.breakdown_percentage.labor, icon: '👷' },
                        { label: 'Equipment', amount: budget.equipment_cost, percent: budget.breakdown_percentage.equipment, icon: '🏗️' },
                        { label: 'Overhead', amount: budget.overhead, percent: budget.breakdown_percentage.overhead, icon: '📊' },
                        { label: 'Profit Margin', amount: budget.contractor_profit, percent: budget.breakdown_percentage.profit, icon: '💎' },
                        { label: 'Cost/Sqft', amount: budget.cost_per_sqft, percent: 0, icon: '📏' },
                    ].map((item, idx) => (
                        <Col xs={24} sm={12} lg={8} key={item.label}>
                            <Card
                                size="small"
                                className="bg-[#1e293b]/50 border-white/5 hover:border-blue-500/50 hover:bg-[#1e293b] transition-all duration-300 cursor-default group"
                                bordered={true}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-2xl group-hover:scale-110 transition-transform duration-300">{item.icon}</span>
                                    {item.percent > 0 && <span className="bg-white/5 text-slate-300 text-xs px-2 py-1 rounded-full border border-white/5">{item.percent}%</span>}
                                </div>
                                <div className="text-slate-400 text-sm font-medium">{item.label}</div>
                                <div className="text-white text-lg font-bold tracking-tight mt-1">
                                    {item.label === 'Cost/Sqft' ? `₹${item.amount.toLocaleString('en-IN')}` : formatCurrency(item.amount)}
                                </div>
                            </Card>
                        </Col>
                    ))}
                </Row>
            </Card>
        </div>
    );
}
