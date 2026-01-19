import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bell, Search, MessageSquare, Construction, Grid, Package, Store, FileText, Send, User } from 'lucide-react';
import { cn } from "@/lib/utils";

const DashboardLayout = ({ children }) => {
    const location = useLocation();
    const [chatQuery, setChatQuery] = useState('');
    const [messages, setMessages] = useState([
        { from: 'ai', text: 'Analyze the concrete procurement overages for the Foundation phase. Why are we 12% over budget?', time: '10:24 AM', isUser: true },
        { from: 'ai', text: 'Concrete overages are driven by three factors:\n1. Market Volatility\n2. Scope Creep\n3. Logistics', time: '10:25 AM', isUser: false }
    ]);

    const handleSendMessage = () => {
        if (!chatQuery.trim()) return;
        setMessages([...messages, { from: 'user', text: chatQuery, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), isUser: true }]);
        setChatQuery('');
        // TODO: Implement AI response
    };

    const isActive = (path) => location.pathname === path;

    return (
        <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark text-warning-black font-display">
            {/* Top Header */}
            <header className="flex items-center justify-between border-b border-gray-200 bg-white dark:bg-zinc-900 px-6 py-3 sticky top-0 z-50">
                <div className="flex items-center gap-8">
                    <Link to="/" className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary flex items-center justify-center rounded">
                            <Construction className="text-white w-5 h-5" />
                        </div>
                        <h2 className="text-lg font-bold leading-tight tracking-tight">HardHat AI</h2>
                    </Link>
                    <div className="hidden md:flex items-center bg-gray-100 dark:bg-zinc-800 rounded-lg px-3 py-1.5 w-64 border border-gray-200 dark:border-zinc-700">
                        <Search className="text-gray-500 w-4 h-4 mr-2" />
                        <input className="bg-transparent border-none focus:outline-none text-sm w-full placeholder-gray-500" placeholder="Search procurement data..." type="text" />
                    </div>
                </div>
                <div className="flex items-center gap-6">
                    <nav className="hidden lg:flex items-center gap-6">
                        <Link to="/budget" className={cn("text-sm font-bold transition-all border-b-2", isActive('/budget') ? "text-warning-black border-primary" : "text-gray-500 border-transparent hover:text-primary")}>Dashboard</Link>
                        <Link to="/schedule" className={cn("text-sm font-bold transition-all border-b-2", isActive('/schedule') ? "text-warning-black border-primary" : "text-gray-500 border-transparent hover:text-primary")}>Schedule</Link>
                        <Link to="/materials" className={cn("text-sm font-bold transition-all border-b-2", isActive('/materials') ? "text-warning-black border-primary" : "text-gray-500 border-transparent hover:text-primary")}>Supply Chain</Link>
                    </nav>
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="icon" className="hover:bg-gray-100 rounded-lg">
                            <Bell className="w-5 h-5 text-gray-600" />
                        </Button>
                        <div className="w-9 h-9 rounded-full bg-primary/10 border-2 border-primary overflow-hidden flex items-center justify-center">
                            <User className="text-primary w-5 h-5" />
                            {/* <img src="..." /> */}
                        </div>
                    </div>
                </div>
            </header>

            <main className="flex flex-1 overflow-hidden h-[calc(100vh-65px)]">
                {/* Sidebar Chat */}
                <aside className="w-[350px] border-r border-gray-200 bg-white flex flex-col hidden md:flex shrink-0">
                    <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                        <div className="flex items-center gap-2">
                            <MessageSquare className="text-primary w-4 h-4" />
                            <span className="font-bold text-sm uppercase tracking-wider">Procurement Assistant</span>
                        </div>
                        <span className="flex items-center gap-1.5 text-[10px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full uppercase">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span> Live
                        </span>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-6 custom-scrollbar">
                        {messages.map((msg, idx) => (
                            <div key={idx} className={cn("flex flex-col gap-2", msg.isUser ? "items-end" : "items-start")}>
                                <div className={cn("p-4 rounded-xl max-w-[90%] text-sm font-medium shadow-sm", msg.isUser ? "bg-primary text-white rounded-tr-none" : "bg-caution text-warning-black rounded-tl-none border-2 border-warning-black shadow-[4px_4px_0px_0px_rgba(18,18,18,1)]")}>
                                    {msg.text}
                                </div>
                                <span className="text-[10px] text-gray-400 font-bold uppercase">{msg.from === 'user' ? 'You' : 'HardHat AI'} • {msg.time}</span>
                            </div>
                        ))}
                    </div>

                    <div className="p-4 bg-white border-t border-gray-200">
                        <div className="relative">
                            <input
                                className="w-full bg-gray-100 border-2 border-gray-200 rounded-lg py-3 px-4 text-sm focus:border-primary focus:outline-none transition-all pr-10"
                                placeholder="Ask about materials..."
                                type="text"
                                value={chatQuery}
                                onChange={(e) => setChatQuery(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                            />
                            <button onClick={handleSendMessage} className="absolute right-2 top-2 bg-warning-black text-white p-1.5 rounded-md hover:bg-primary transition-colors">
                                <Send className="w-3 h-3" />
                            </button>
                        </div>
                    </div>
                </aside>

                {/* Main Content */}
                <section className="flex-1 overflow-y-auto bg-background-light p-6 lg:p-8 custom-scrollbar">
                    {children}
                </section>
            </main>
        </div>
    );
};

export default DashboardLayout;
