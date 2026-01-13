import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, Loader2, Building2, Sparkles } from 'lucide-react';
import type { ChatMessage } from '../types';
import { getProcurementReport } from '../utils/api';
import { BudgetBreakdown } from './BudgetBreakdown';
import { MaterialsTable } from './MaterialsTable';
import { VendorRecommendations } from './VendorRecommendations';
import { GanttChart } from './GanttChart';

export function AIAssistant() {
    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            id: '1',
            role: 'assistant',
            content: "Hello! I'm your Construction Procurement AI Assistant powered by NLP. Tell me about your project and I'll analyze it using AI to provide:\n\n• **Material recommendations** fetched from vendor database\n• **Budget breakdown** with cost analysis\n• **Vendor suggestions** matched to your needs\n• **Project schedule** with Gantt chart\n\nTry: \"25 MegaWatt, 2 Lacs SquareFoot Built Up Area, Project Volume of 1875 Cr in Rupees, Build in Navi Mumbai Area\"",
            timestamp: new Date()
        }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'budget' | 'materials' | 'vendors' | 'schedule'>('budget');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage: ChatMessage = {
            id: Date.now().toString(),
            role: 'user',
            content: input,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const report = await getProcurementReport(input);

            const aiAnalysis = report.ai_analysis || '';
            const materialCount = report.material_requirements?.length || 0;
            const vendorCount = Object.keys(report.vendor_recommendations || {}).length;
            const scheduleMonths = report.schedule?.total_months || 0;

            const assistantMessage: ChatMessage = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: `🔍 **AI Analysis Complete**\n\n${aiAnalysis}\n\n📊 **Project Summary:**\n• Built Area: ${report.project_details.built_area_sqft.toLocaleString('en-IN')} sqft\n• Location: ${report.project_details.location}\n• Type: ${report.project_details.project_type}${report.project_details.power_capacity_mw ? `\n• Power: ${report.project_details.power_capacity_mw} MW` : ''}\n\n💰 **Budget:** ₹${(report.budget_breakdown.total_cost / 10000000).toFixed(2)} Crore\n📦 **Materials Found:** ${materialCount} categories\n🏢 **Vendors Matched:** ${vendorCount} categories\n📅 **Schedule:** ${scheduleMonths} months\n\nExplore the tabs on the right for detailed breakdowns.`,
                timestamp: new Date(),
                data: report
            };

            setMessages(prev => [...prev, assistantMessage]);
            setActiveTab('budget');
        } catch (error) {
            const errorMessage: ChatMessage = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: '❌ Sorry, I encountered an error while processing your request. Please make sure the backend server is running on port 5001.',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const latestDataMessage = [...messages].reverse().find(m => m.data);
    const hasData = !!latestDataMessage?.data;

    return (
        <div className="flex flex-col h-screen">
            {/* Header */}
            <header className="glass-card m-4 mb-0 p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center pulse-glow">
                    <Building2 className="w-6 h-6 text-white" />
                </div>
                <div>
                    <h1 className="text-xl font-bold text-white flex items-center gap-2">
                        Construction AI Assistant
                        <Sparkles className="w-4 h-4 text-cyan-400" />
                    </h1>
                    <p className="text-slate-400 text-sm">NLP-Powered Procurement Analysis & Vendor Matching</p>
                </div>
            </header>

            <div className="flex-1 flex gap-4 p-4 overflow-hidden">
                {/* Chat Panel */}
                <div className={`glass-card flex flex-col transition-all duration-500 ${hasData ? 'w-1/3 min-w-[320px]' : 'w-full max-w-2xl mx-auto'}`}>
                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        <AnimatePresence>
                            {messages.map((message) => (
                                <motion.div
                                    key={message.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
                                >
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${message.role === 'user'
                                        ? 'bg-blue-600'
                                        : 'bg-gradient-to-br from-cyan-500 to-blue-600'
                                        }`}>
                                        {message.role === 'user' ? (
                                            <User className="w-4 h-4 text-white" />
                                        ) : (
                                            <Bot className="w-4 h-4 text-white" />
                                        )}
                                    </div>
                                    <div className={`flex-1 ${message.role === 'user' ? 'text-right' : ''}`}>
                                        <div className={`inline-block p-3 rounded-xl max-w-full ${message.role === 'user'
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-slate-700/50 text-slate-200'
                                            }`}>
                                            <p className="text-sm leading-relaxed whitespace-pre-line">{message.content}</p>
                                        </div>
                                        <p className="text-xs text-slate-500 mt-1">
                                            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>

                        {isLoading && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex gap-3"
                            >
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                                    <Bot className="w-4 h-4 text-white" />
                                </div>
                                <div className="bg-slate-700/50 p-3 rounded-xl">
                                    <div className="flex items-center gap-2">
                                        <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
                                        <span className="text-sm text-slate-300">Analyzing with AI...</span>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <form onSubmit={handleSubmit} className="p-4 border-t border-slate-700/50">
                        <div className="flex gap-2">
                            <input
                                ref={inputRef}
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Describe your project (area, location, type)..."
                                className="flex-1 bg-slate-700/50 border border-slate-600/50 rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500/50 transition-colors"
                                disabled={isLoading}
                            />
                            <button
                                type="submit"
                                disabled={isLoading || !input.trim()}
                                className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-4 py-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <Send className="w-5 h-5" />
                                )}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Data Panel - Only shown when data is available */}
                {hasData && (
                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5 }}
                        className="flex-1 flex flex-col overflow-hidden"
                    >
                        {/* Tabs */}
                        <div className="flex gap-2 mb-4">
                            {[
                                { id: 'budget' as const, label: 'Budget' },
                                { id: 'materials' as const, label: 'Materials' },
                                { id: 'vendors' as const, label: 'Vendors' },
                                { id: 'schedule' as const, label: 'Schedule' },
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id
                                        ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white'
                                        : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                                        }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Tab Content */}
                        <div className="flex-1 overflow-y-auto">
                            <AnimatePresence mode="wait">
                                {activeTab === 'budget' && latestDataMessage?.data && (
                                    <motion.div
                                        key="budget"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                    >
                                        <BudgetBreakdown budget={latestDataMessage.data.budget_breakdown} />
                                    </motion.div>
                                )}
                                {activeTab === 'materials' && latestDataMessage?.data && (
                                    <motion.div
                                        key="materials"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                    >
                                        <MaterialsTable materials={latestDataMessage.data.material_requirements} />
                                    </motion.div>
                                )}
                                {activeTab === 'vendors' && latestDataMessage?.data && (
                                    <motion.div
                                        key="vendors"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                    >
                                        <VendorRecommendations vendorRecommendations={latestDataMessage.data.vendor_recommendations} />
                                    </motion.div>
                                )}
                                {activeTab === 'schedule' && latestDataMessage?.data?.schedule && (
                                    <motion.div
                                        key="schedule"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                    >
                                        <GanttChart schedule={latestDataMessage.data.schedule} />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
}
