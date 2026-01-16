import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, Loader2, Building2, Sparkles, ChevronRight, LayoutDashboard, Database, HardHat, Calendar } from 'lucide-react';
import { Layout, Input as AntInput, Card, Typography, List, Spin, Avatar, Space, theme, ConfigProvider, Empty } from 'antd';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getProcurementReport } from '../utils/api';
import { BudgetBreakdown } from './BudgetBreakdown';
import { MaterialsTable } from './MaterialsTable';
import { VendorRecommendations } from './VendorRecommendations';
import { GanttChart } from './GanttChart';

const { Sider, Content } = Layout;
const { TextArea } = AntInput;

export function AIAssistant() {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('budget');
    const [hasStarted, setHasStarted] = useState(false);
    const messagesEndRef = useRef(null);

    const tabs = [
        { id: 'budget', label: 'Budget', icon: <Database size={16} /> },
        { id: 'materials', label: 'Materials', icon: <HardHat size={16} /> },
        { id: 'vendors', label: 'Vendors', icon: <Building2 size={16} /> },
        { id: 'schedule', label: 'Schedule', icon: <Calendar size={16} /> }
    ];

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSubmit = async (e) => {
        if (e && e.preventDefault) e.preventDefault();

        if (!input.trim() || isLoading) return;

        const userMessage = {
            id: Date.now().toString(),
            role: 'user',
            content: input,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        const currentInput = input;
        setInput('');
        setIsLoading(true);
        setHasStarted(true);

        try {
            const report = await getProcurementReport(currentInput);

            const aiAnalysis = report.ai_analysis || '';
            const scheduleMonths = report.schedule?.total_months || 0;
            const materialCount = report.material_requirements?.length || 0;

            const assistantMessage = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: `**Analysis Complete**\n\n${aiAnalysis}\n\n**Key Metrics:**\n* 💰 Total Budget: ₹${(report.budget_breakdown?.total_cost / 10000000).toFixed(2)} Cr\n* 📦 Materials: ${materialCount} categories\n* 📅 Duration: ${scheduleMonths} months`,
                timestamp: new Date(),
                data: report
            };

            setMessages(prev => [...prev, assistantMessage]);
            setActiveTab('budget');
        } catch (error) {
            const errorMessage = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: '**Error**\n\nI encountered an issue processing your request. Please ensure the backend is running.',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const latestDataMessage = [...messages].reverse().find(m => m.data);
    const hasData = !!latestDataMessage?.data;

    // Background Class to remove the "void"
    const bgClass = "bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-900 via-[#0a0a0a] to-[#050505]";

    return (
        <ConfigProvider
            theme={{
                algorithm: theme.darkAlgorithm,
                token: {
                    colorPrimary: '#3b82f6',
                    colorBgBase: '#1f1f1f',
                    colorBgContainer: '#1f1f1f',
                },
            }}
        >
            {!hasStarted ? (
                // Landing Page
                <div className="flex h-screen bg-[#020617] items-center justify-center relative overflow-hidden">
                    {/* Richer Background */}
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(59,130,246,0.15),transparent_70%)]" />
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_90%)]" />

                    <div className="z-10 w-full max-w-2xl px-6 text-center">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8 }}
                        >
                            <h1 className="text-6xl font-black text-white mb-6 tracking-tight drop-shadow-xl">
                                Construction <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">AI</span>
                            </h1>
                            <p className="text-slate-400 text-xl mb-12 font-light">Intelligent procurement planning and budget analysis</p>

                            <div className="relative group max-w-xl mx-auto">
                                <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
                                <div className="relative bg-[#0f172a]/90 backdrop-blur-xl rounded-xl p-3 flex items-center border border-slate-700/50 shadow-2xl">
                                    <AntInput
                                        size="large"
                                        placeholder="Describe your project..."
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        onPressEnter={handleSubmit}
                                        className="!bg-transparent !border-0 !text-white !text-xl !placeholder-slate-500 !shadow-none focus:!shadow-none flex-1"
                                    />
                                    <button
                                        className="btn btn-primary btn-circle btn-sm shadow-lg shadow-blue-500/20"
                                        onClick={handleSubmit}
                                        disabled={isLoading}
                                    >
                                        <Send size={18} />
                                    </button>
                                </div>
                            </div>

                            <div className="mt-10 flex flex-wrap justify-center gap-3">
                                {['25 MW Data Center', 'Office Complex 50k sqft', 'High Rise Residential'].map((suggestion, i) => (
                                    <button
                                        key={i}
                                        className="btn btn-outline btn-sm rounded-full text-slate-400 border-slate-700 hover:bg-blue-600/10 hover:border-blue-500 hover:text-blue-400 normal-case font-normal transition-all"
                                        onClick={() => setInput(suggestion)}
                                    >
                                        {suggestion}
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    </div>
                </div>
            ) : (
                // Split View Layout
                <Layout style={{ height: '100vh', background: 'transparent' }} className={bgClass}>
                    {/* Left Sidebar: Chat */}
                    <Sider
                        width={420}
                        style={{
                            background: 'rgba(15, 23, 42, 0.6)',
                            borderRight: '1px solid rgba(51, 65, 85, 0.4)',
                            backdropFilter: 'blur(10px)',
                            height: '100vh',
                            position: 'fixed',
                            left: 0,
                            zIndex: 20
                        }}
                    >
                        <div className="flex flex-col h-full">
                            {/* Header */}
                            <div className="h-16 px-6 border-b border-white/5 flex items-center gap-3 shrink-0 bg-transparent">
                                <div className="p-2 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg shadow-lg shadow-blue-900/20">
                                    <Building2 className="text-white w-5 h-5" />
                                </div>
                                <span className="text-white font-bold text-lg tracking-wide">Construction AI</span>
                            </div>

                            {/* Messages Area */}
                            <div className="flex-1 overflow-y-auto p-5 space-y-6 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-slate-700">
                                {messages.map((item) => (
                                    <div key={item.id} className={`flex gap-4 ${item.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${item.role === 'user'
                                            ? 'bg-blue-600 shadow-lg shadow-blue-900/20'
                                            : 'bg-cyan-600 shadow-lg shadow-cyan-900/20'
                                            }`}>
                                            {item.role === 'user' ? <User size={14} className="text-white" /> : <Bot size={14} className="text-white" />}
                                        </div>

                                        <div className={`flex flex-col max-w-[85%] ${item.role === 'user' ? 'items-end' : 'items-start'}`}>
                                            <div className={`
                                                px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-md
                                                ${item.role === 'user'
                                                    ? 'bg-blue-600 text-white rounded-tr-sm'
                                                    : 'bg-[#1e293b]/80 backdrop-blur text-slate-200 border border-slate-700/50 rounded-tl-sm'}
                                            `}>
                                                <ReactMarkdown
                                                    remarkPlugins={[remarkGfm]}
                                                    components={{
                                                        p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
                                                        ul: ({ node, ...props }) => <ul className="list-disc pl-4 mb-2 space-y-1" {...props} />,
                                                        li: ({ node, ...props }) => <li {...props} />,
                                                        strong: ({ node, ...props }) => <strong className="font-bold text-white" {...props} />,
                                                        h1: ({ node, ...props }) => <h1 className="text-lg font-bold text-white mb-2" {...props} />,
                                                        h2: ({ node, ...props }) => <h2 className="text-base font-bold text-white mb-2" {...props} />
                                                    }}
                                                >
                                                    {item.content}
                                                </ReactMarkdown>
                                            </div>
                                            <span className="text-[10px] text-slate-500 mt-1.5 px-1 font-medium">
                                                {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                                {isLoading && (
                                    <div className="flex gap-4">
                                        <div className="w-8 h-8 rounded-full bg-cyan-600 flex items-center justify-center shrink-0 animate-pulse">
                                            <Bot size={14} className="text-white" />
                                        </div>
                                        <div className="bg-[#1e293b]/50 border border-slate-700/50 px-5 py-4 rounded-2xl rounded-tl-sm">
                                            <span className="loading loading-dots loading-sm text-cyan-400"></span>
                                        </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input Area */}
                            <div className="p-4 border-t border-white/5 bg-[#0f172a]/80 backdrop-blur-md shrink-0">
                                <div className="relative">
                                    <TextArea
                                        placeholder="Follow up with more details..."
                                        autoSize={{ minRows: 1, maxRows: 4 }}
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        onPressEnter={(e) => {
                                            if (!e.shiftKey) {
                                                e.preventDefault();
                                                handleSubmit();
                                            }
                                        }}
                                        className="!bg-[#1e293b] !border-0 !text-slate-200 !rounded-xl !pr-12 !py-3 !pl-4 placeholder:!text-slate-500 focus:!ring-1 focus:!ring-blue-500/50"
                                    />
                                    <button
                                        className={`absolute right-2 bottom-2 btn btn-circle btn-sm btn-ghost hover:bg-blue-500/10 transition-colors ${input.trim() ? "text-blue-400" : "text-slate-600"}`}
                                        onClick={handleSubmit}
                                        disabled={!input.trim() || isLoading}
                                    >
                                        <Send size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </Sider>

                    {/* Right Content: Canvas/Dashboard */}
                    <Layout style={{ marginLeft: 420, background: 'transparent' }}>
                        <Content className="flex flex-col h-screen overflow-hidden relative">
                            {hasData ? (
                                <>
                                    {/* Toolbar */}
                                    <div className="h-16 border-b border-white/5 bg-[#0f172a]/60 backdrop-blur-md flex items-center justify-between px-8 shrink-0 sticky top-0 z-10 transition-all">
                                        <h2 className="text-white font-semibold flex items-center gap-2.5 text-lg">
                                            <div className="p-1.5 bg-cyan-500/10 rounded-lg">
                                                <Sparkles className="w-4 h-4 text-cyan-400" />
                                            </div>
                                            Project Dashboard
                                        </h2>

                                        {/* DaisyUI Tabs */}
                                        <div className="join p-1 bg-[#1e293b]/50 rounded-xl border border-white/5">
                                            {tabs.map(tab => (
                                                <button
                                                    key={tab.id}
                                                    onClick={() => setActiveTab(tab.id)}
                                                    className={`join-item btn btn-sm border-0 font-medium transition-all gap-2 ${activeTab === tab.id
                                                        ? 'btn-primary shadow-lg'
                                                        : 'btn-ghost text-slate-400 hover:text-white hover:bg-white/5'
                                                        }`}
                                                >
                                                    {tab.icon}
                                                    {tab.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Canvas Scroll Area */}
                                    <div className="flex-1 overflow-y-auto p-8 relative scrollbar-track-transparent scrollbar-thumb-slate-700">
                                        {/* Background Grid Pattern */}
                                        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none fixed" />

                                        <div className="max-w-[1600px] mx-auto space-y-8 relative z-0">
                                            <AnimatePresence mode="wait">
                                                {activeTab === 'budget' && latestDataMessage?.data && (
                                                    <motion.div
                                                        key="budget"
                                                        initial={{ opacity: 0, y: 10, scale: 0.98 }}
                                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                                        exit={{ opacity: 0, y: -10, scale: 0.98 }}
                                                        transition={{ duration: 0.2 }}
                                                    >
                                                        <BudgetBreakdown budget={latestDataMessage.data.budget_breakdown} />
                                                    </motion.div>
                                                )}
                                                {activeTab === 'materials' && latestDataMessage?.data && (
                                                    <motion.div
                                                        key="materials"
                                                        initial={{ opacity: 0, y: 10, scale: 0.98 }}
                                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                                        exit={{ opacity: 0, y: -10, scale: 0.98 }}
                                                        transition={{ duration: 0.2 }}
                                                    >
                                                        <MaterialsTable materials={latestDataMessage.data.material_requirements} />
                                                    </motion.div>
                                                )}
                                                {activeTab === 'vendors' && latestDataMessage?.data && (
                                                    <motion.div
                                                        key="vendors"
                                                        initial={{ opacity: 0, y: 10, scale: 0.98 }}
                                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                                        exit={{ opacity: 0, y: -10, scale: 0.98 }}
                                                        transition={{ duration: 0.2 }}
                                                    >
                                                        <VendorRecommendations vendorRecommendations={latestDataMessage.data.vendor_recommendations} />
                                                    </motion.div>
                                                )}
                                                {activeTab === 'schedule' && latestDataMessage?.data?.schedule && (
                                                    <motion.div
                                                        key="schedule"
                                                        initial={{ opacity: 0, y: 10, scale: 0.98 }}
                                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                                        exit={{ opacity: 0, y: -10, scale: 0.98 }}
                                                        transition={{ duration: 0.2 }}
                                                    >
                                                        <GanttChart schedule={latestDataMessage.data.schedule} />
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                        {/* Bottom Spacer */}
                                        <div className="h-12" />
                                    </div>
                                </>
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center text-slate-600">
                                    <div className="p-8 rounded-[32px] bg-white/5 border border-white/5 backdrop-blur-xl">
                                        <Building2 size={80} strokeWidth={1} />
                                    </div>
                                    <p className="mt-6 text-xl font-light text-slate-500">Start a conversation to generate insights</p>
                                </div>
                            )}
                        </Content>
                    </Layout>
                </Layout>
            )}
        </ConfigProvider>
    );
}
