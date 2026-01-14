import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, Loader2, Building2, ChevronRight } from 'lucide-react';
import { getProcurementReport } from '../utils/api';
import { BudgetBreakdown } from './BudgetBreakdown';
import { MaterialsTable } from './MaterialsTable';
import { VendorRecommendations } from './VendorRecommendations';
import { GanttChart } from './GanttChart';

const tabs = [
    { id: 'budget', label: 'Budget' },
    { id: 'materials', label: 'Materials' },
    { id: 'vendors', label: 'Vendors' },
    { id: 'schedule', label: 'Schedule' }
];

export function AIAssistant() {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('budget');
    const [showResults, setShowResults] = useState(false);
    const [hasStarted, setHasStarted] = useState(false);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage = {
            id: Date.now().toString(),
            role: 'user',
            content: input,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);
        setHasStarted(true);

        try {
            const report = await getProcurementReport(input);

            const aiAnalysis = report.ai_analysis || '';
            const materialCount = report.material_requirements?.length || 0;
            const vendorCount = Object.keys(report.vendor_recommendations || {}).length;
            const scheduleMonths = report.schedule?.total_months || 0;

            const assistantMessage = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: `🎯 **AI Analysis Complete!**\n\n${aiAnalysis}\n\n📋 **Project Overview:**\n• 📐 Built Area: ${report.project_details.built_area_sqft.toLocaleString('en-IN')} sqft\n• 📍 Location: ${report.project_details.location}\n• 🏗️ Type: ${report.project_details.project_type}${report.project_details.power_capacity_mw ? `\n• ⚡ Power: ${report.project_details.power_capacity_mw} MW` : ''}\n\n💎 **Key Insights:**\n• 💰 Total Budget: ₹${(report.budget_breakdown.total_cost / 10000000).toFixed(2)} Cr\n• 📦 Materials: ${materialCount} categories identified\n• 🏢 Vendors: ${vendorCount} vendor groups matched\n• 📅 Duration: ${scheduleMonths} months timeline\n\n👉 Explore the tabs on the right for detailed breakdowns!`,
                timestamp: new Date(),
                data: report
            };

            setMessages(prev => [...prev, assistantMessage]);
            setActiveTab('budget');
            setShowResults(true); // Auto-show results panel
        } catch (error) {
            const errorMessage = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: '❌ Oops! I encountered an error while processing your request.\n\n🔧 **Troubleshooting:**\n• Make sure the backend server is running on port 5001\n• Check your network connection\n• Verify the backend API is accessible\n\nPlease try again in a moment.',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const latestDataMessage = [...messages].reverse().find(m => m.data);
    const hasData = !!latestDataMessage?.data;

    // Landing Page - Before user starts chatting
    if (!hasStarted) {
        return (
            <div className="flex h-screen">
                <div className="flex-1 relative overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.15),transparent_50%)] animate-pulse" style={{ animationDuration: '4s' }} />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(236,72,153,0.15),transparent_50%)] animate-pulse" style={{ animationDuration: '6s' }} />
                    <div className="absolute inset-0 bg-linear-to-b from-black/10 via-transparent to-black/10" />
                    <div className="relative h-full flex flex-col items-center justify-center px-8">
                        {/* Welcome Text */}
                        <motion.h1 
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                            className="text-5xl md:text-6xl font-bold text-white mb-12 text-center"
                        >
                            Ready to build your project?
                        </motion.h1>

                        {/* Large Input Box */}
                        <motion.form 
                            onSubmit={handleSubmit}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                            className="w-full max-w-4xl"
                        >
                            <div className="relative group">
                                {/* Glow effect */}
                                <div className="absolute -inset-1 bg-linear-to-r from-cyan-500 via-blue-500 to-purple-600 rounded-4xl blur-lg opacity-30 group-hover:opacity-50 transition duration-500"></div>
                                
                                {/* Input container */}
                                <div className="relative">
                                    <input
                                        ref={inputRef}
                                        type="text"
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        placeholder=""
                                        className="w-full bg-slate-900/90 backdrop-blur-2xl border-2 border-slate-700/60 hover:border-slate-600/80 focus:border-cyan-500/60 rounded-3xl px-10 py-10 pr-24 text-white text-2xl font-semibold focus:outline-none focus:ring-4 focus:ring-cyan-500/20 transition-all duration-300 shadow-[0_8px_32px_rgba(0,0,0,0.4)] hover:shadow-[0_12px_48px_rgba(6,182,212,0.3)]"
                                        disabled={isLoading}
                                        autoFocus
                                    />
                                    
                                    {/* Animated border gradient */}
                                    <div className="absolute inset-0 rounded-3xl bg-linear-to-r from-cyan-500 via-blue-500 to-purple-600 opacity-0 group-hover:opacity-10 transition-opacity duration-300 pointer-events-none"></div>
                                    
                                    {/* Send button */}
                                    <motion.button
                                        whileHover={{ scale: 1.1, rotate: 5 }}
                                        whileTap={{ scale: 0.9 }}
                                        type="submit"
                                        disabled={isLoading || !input.trim()}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 w-14 h-14 bg-linear-to-br from-cyan-500 via-blue-500 to-purple-600 text-white rounded-2xl hover:shadow-[0_0_30px_rgba(6,182,212,0.6)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg flex items-center justify-center"
                                    >
                                        {isLoading ? (
                                            <Loader2 className="w-6 h-6 animate-spin" />
                                        ) : (
                                            <Send className="w-6 h-6" />
                                        )}
                                    </motion.button>
                                </div>
                            </div>
                        </motion.form>

                        {/* Suggestions */}
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.6, delay: 0.4 }}
                            className="mt-8 flex flex-wrap gap-3 justify-center max-w-4xl"
                        >
                            {[
                                '25 MW Data Center in Mumbai',
                                'Office Building 50,000 sqft',
                                'Residential Complex Budget Analysis'
                            ].map((suggestion, i) => (
                                <motion.button
                                    key={i}
                                    onClick={() => setInput(suggestion)}
                                    whileHover={{ scale: 1.05, y: -2 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="px-6 py-3 bg-white/10 backdrop-blur-sm border border-white/20 text-white rounded-2xl hover:bg-white/20 transition-all text-sm font-medium"
                                >
                                    {suggestion}
                                </motion.button>
                            ))}
                        </motion.div>

                        {/* Info Text */}
                        <motion.p 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.6, delay: 0.6 }}
                            className="mt-12 text-white/60 text-sm max-w-2xl text-center"
                        >
                            ✨ AI-powered construction planning • Budget analysis • Material recommendations • Vendor matching • Project scheduling
                        </motion.p>
                    </div>
                </div>
            </div>
        );
    }

    // Chat Interface - After user starts chatting
    return (
        <div className="flex flex-col h-screen bg-linear-to-br from-slate-900 via-blue-950 to-slate-900 min-h-screen">
            {/* Header */}
            <motion.header 
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="border-b border-slate-800/60 px-10 py-6 bg-slate-900/80 backdrop-blur-xl shadow-lg z-20 relative flex items-center justify-between gap-8"
            >
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-blue-500 via-cyan-500 to-purple-500 flex items-center justify-center shadow-md">
                        <Building2 className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-extrabold text-white tracking-tight">Construction AI</h1>
                        <p className="text-sm text-slate-400 font-medium">Procurement Intelligence</p>
                    </div>
                </div>
                {hasData && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-xl shadow-sm">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                        <span className="text-green-400 text-xs font-semibold">Analysis Ready</span>
                    </div>
                )}
            </motion.header>

            <div className="flex-1 flex overflow-hidden gap-8 px-10 py-8">
                {/* Chat Panel */}
                <motion.div 
                    layout
                    transition={{ duration: 0.5, type: "spring", bounce: 0.2 }}
                    className={`flex flex-col border border-slate-800/60 bg-slate-900/70 rounded-3xl shadow-xl p-8 gap-6 w-full max-w-2xl mx-auto ${showResults && hasData ? '' : 'flex-1'}`}
                >
                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto space-y-6 pr-2">
                        <AnimatePresence mode="popLayout">
                            {messages.map((message) => (
                                <motion.div
                                    key={message.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    className={`flex gap-4 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
                                >
                                    {/* Avatar */}
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow ${message.role === 'user' ? 'bg-blue-600' : 'bg-linear-to-br from-cyan-500 to-purple-600'}`}>
                                        {message.role === 'user' ? <User className="w-5 h-5 text-white" /> : <Bot className="w-5 h-5 text-white" />}
                                    </div>
                                    
                                    {/* Message */}
                                    <div className={`flex-1 max-w-[80%] ${message.role === 'user' ? 'text-right' : ''}`}>
                                        <div className={`inline-block px-6 py-4 rounded-2xl ${message.role === 'user' ? 'bg-blue-600 text-white' : 'bg-slate-800/90 text-slate-100 border border-slate-700/50 shadow-md'}`}>
                                            <p className="text-base whitespace-pre-line leading-relaxed">{message.content}</p>
                                        </div>
                                        <p className="text-xs text-slate-500 mt-2 px-1">
                                            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                        {isLoading && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-4 items-center mt-4">
                                <div className="w-10 h-10 rounded-xl bg-linear-to-br from-cyan-500 to-purple-600 flex items-center justify-center shadow">
                                    <Bot className="w-5 h-5 text-white" />
                                </div>
                                <div className="bg-slate-800/90 px-6 py-4 rounded-2xl border border-slate-700/50 shadow-md flex items-center gap-3">
                                    <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
                                    <span className="text-base text-slate-300">Analyzing...</span>
                                </div>
                            </motion.div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <form onSubmit={handleSubmit} className="flex gap-4 items-center mt-6">
                        <div className="flex-1 relative group">
                            <input
                                ref={inputRef}
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Type your construction query..."
                                className="w-full bg-slate-800/90 border-2 border-slate-700/60 hover:border-slate-600/80 focus:border-cyan-500/60 rounded-2xl px-8 py-6 text-white text-xl font-semibold focus:outline-none focus:ring-4 focus:ring-cyan-500/20 transition-all duration-300 shadow-lg"
                                disabled={isLoading}
                                autoFocus
                            />
                        </div>
                        <motion.button
                            whileHover={{ scale: 1.08 }}
                            whileTap={{ scale: 0.95 }}
                            type="submit"
                            disabled={isLoading || !input.trim()}
                            className="w-16 h-16 bg-linear-to-br from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-2xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-lg hover:shadow-cyan-500/50 text-2xl"
                        >
                            {isLoading ? <Loader2 className="w-7 h-7 animate-spin" /> : <Send className="w-7 h-7" />}
                        </motion.button>
                    </form>
                </motion.div>

                {/* Results Panel */}
                <AnimatePresence>
                {hasData && showResults && (
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.3 }}
                        className="flex flex-col bg-slate-900/90 rounded-3xl shadow-2xl border border-slate-800/60 w-full max-w-2xl mx-auto p-8 gap-6"
                    >
                        {/* Close Button */}
                        <button
                            onClick={() => setShowResults(false)}
                            className="absolute top-6 right-6 z-10 w-10 h-10 flex items-center justify-center bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700/50 rounded-xl text-slate-400 hover:text-white transition-all shadow"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                        {/* Tabs */}
                        <div className="flex gap-4 p-2 border-b border-slate-800 mb-4">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`px-6 py-3 rounded-xl text-base font-semibold transition-all ${
                                        activeTab === tab.id
                                            ? 'bg-cyan-600 text-white shadow'
                                            : 'bg-slate-800/60 text-slate-400 hover:bg-slate-800 hover:text-slate-300'
                                    }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                        {/* Tab Content */}
                        <div className="flex-1 overflow-y-auto p-2">
                            <AnimatePresence mode="wait">
                                {activeTab === 'budget' && latestDataMessage?.data && (
                                    <motion.div
                                        key="budget"
                                        initial={{ opacity: 0, x: 20, scale: 0.95 }}
                                        animate={{ opacity: 1, x: 0, scale: 1 }}
                                        exit={{ opacity: 0, x: -20, scale: 0.95 }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        <BudgetBreakdown budget={latestDataMessage.data.budget_breakdown} />
                                    </motion.div>
                                )}
                                {activeTab === 'materials' && latestDataMessage?.data && (
                                    <motion.div
                                        key="materials"
                                        initial={{ opacity: 0, x: 20, scale: 0.95 }}
                                        animate={{ opacity: 1, x: 0, scale: 1 }}
                                        exit={{ opacity: 0, x: -20, scale: 0.95 }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        <MaterialsTable materials={latestDataMessage.data.material_requirements} />
                                    </motion.div>
                                )}
                                {activeTab === 'vendors' && latestDataMessage?.data && (
                                    <motion.div
                                        key="vendors"
                                        initial={{ opacity: 0, x: 20, scale: 0.95 }}
                                        animate={{ opacity: 1, x: 0, scale: 1 }}
                                        exit={{ opacity: 0, x: -20, scale: 0.95 }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        <VendorRecommendations vendorRecommendations={latestDataMessage.data.vendor_recommendations} />
                                    </motion.div>
                                )}
                                {activeTab === 'schedule' && latestDataMessage?.data?.schedule && (
                                    <motion.div
                                        key="schedule"
                                        initial={{ opacity: 0, x: 20, scale: 0.95 }}
                                        animate={{ opacity: 1, x: 0, scale: 1 }}
                                        exit={{ opacity: 0, x: -20, scale: 0.95 }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        <GanttChart schedule={latestDataMessage.data.schedule} />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                )}
                </AnimatePresence>
            </div>
        </div>
    );
}
