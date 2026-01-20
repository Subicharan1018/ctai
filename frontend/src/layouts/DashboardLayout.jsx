import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Bell, Search, MessageSquare, Construction, User, Send, LogOut, History, Plus } from 'lucide-react';
import { cn } from "@/lib/utils";
import { useProcurement } from '../context/ProcurementContext';

const DashboardLayout = ({ children }) => {
    const location = useLocation();
    const { user, logout, currentConversationId, setCurrentConversationId, runAnalysis } = useProcurement();

    // Local state for chat UI
    const [chatQuery, setChatQuery] = useState('');
    const [messages, setMessages] = useState([]);
    const [isHistoryView, setIsHistoryView] = useState(false);
    const [history, setHistory] = useState([]);
    const messagesEndRef = useRef(null);

    // Initial load
    useEffect(() => {
        if (user) {
            fetchConversations();
        }
    }, [user]);

    // Load messages when conversation changes
    useEffect(() => {
        if (currentConversationId) {
            fetchMessages(currentConversationId);
        } else {
            setMessages([]);
        }
    }, [currentConversationId]);

    // Scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const fetchConversations = async () => {
        try {
            const res = await fetch(`http://localhost:5001/conversations?user_id=${user.id}`);
            const data = await res.json();
            setHistory(data);
            if (data.length > 0 && !currentConversationId) {
                // Select most recent
                setCurrentConversationId(data[0].id);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const fetchMessages = async (convId) => {
        try {
            const res = await fetch(`http://localhost:5001/conversations/${convId}/messages`);
            const data = await res.json();
            setMessages(data.map(m => ({
                from: m.sender === 'user' ? 'user' : 'ai',
                text: m.text,
                time: new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                isUser: m.sender === 'user'
            })));
        } catch (err) {
            console.error(err);
        }
    };

    const handleNewChat = async () => {
        try {
            const res = await fetch('http://localhost:5001/conversations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: user.id, title: 'New Consultation' })
            });
            const data = await res.json();
            setHistory([{ id: data.id, title: data.title, created_at: new Date().toISOString() }, ...history]);
            setCurrentConversationId(data.id);
            setIsHistoryView(false);
        } catch (err) {
            console.error(err);
        }
    };

    const handleSendMessage = async () => {
        if (!chatQuery.trim()) return;

        const text = chatQuery;
        setChatQuery('');

        let convId = currentConversationId;

        // Create conversation if none exists
        if (!convId) {
            try {
                const res = await fetch('http://localhost:5001/conversations', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ user_id: user.id, title: text.substring(0, 30) + '...' })
                });
                const data = await res.json();
                convId = data.id;
                setCurrentConversationId(convId);
                setHistory([{ id: data.id, title: data.title, created_at: new Date().toISOString() }, ...history]);
            } catch (err) {
                console.error("Failed to create conversation:", err);
                return;
            }
        }

        // Optimistic UI update
        const newMsg = { from: 'user', text: text, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), isUser: true };
        setMessages(prev => [...prev, newMsg]);

        // Save to DB
        try {
            await fetch(`http://localhost:5001/conversations/${convId}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sender: 'user', text: text })
            });

            // Simulate AI Processing & Trigger Analysis
            // Check if this looks like a procurement query
            const isProcurementQuery = text.toLowerCase().includes('concrete') ||
                text.toLowerCase().includes('steel') ||
                text.toLowerCase().includes('budget') ||
                text.toLowerCase().includes('quote') ||
                text.length > 20;

            if (isProcurementQuery) {
                // Trigger global analysis (this updates the main view)
                // We don't await this because we want to keep chatting, but it might navigate away.
                // If we are already on a dashboard page, runAnalysis updates the context.
                // runAnalysis(text); 
                // NOTE: runAnalysis navigates to /budget. If the user is chatting, this might be jarring.
                // Let's ask the user or just notify them.

                // For now, let's assume the chat is an "Assistant" that helps RUN things.
                const aiText = "I'm analyzing your project requirements based on this input. Updating the dashboard...";
                await fetch(`http://localhost:5001/conversations/${convId}/messages`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ sender: 'ai', text: aiText })
                });
                setMessages(prev => [...prev, { from: 'ai', text: aiText, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), isUser: false }]);

                // Run the actual analysis
                // We use a small timeout to let the UI update first
                setTimeout(() => {
                    // This will update procurementData and navigate to /budget
                    // The context function handles the API call
                    // We need to access runAnalysis from context which we have
                    // But we rely on 'user' being present, which it is.
                    // We already grabbed runAnalysis from context props
                }, 100);

                // Using props from component
                await runAnalysis(text);

            } else {
                // Generic chat response
                const aiText = "I've logged that note. Is there anything specific you need for the procurement schedule?";

                await fetch(`http://localhost:5001/conversations/${convId}/messages`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ sender: 'ai', text: aiText })
                });

                setTimeout(() => {
                    setMessages(prev => [...prev, { from: 'ai', text: aiText, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), isUser: false }]);
                }, 500);
            }

        } catch (err) {
            console.error("Message handling error:", err);
            setMessages(prev => [...prev, { from: 'ai', text: "Error connecting to server.", time: new Date().toLocaleTimeString(), isUser: false }]);
        }
    };

    const isActive = (path) => location.pathname === path;

    return (
        <div className="flex flex-col h-screen overflow-hidden bg-background-light dark:bg-background-dark text-warning-black font-display">
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
                        <div className="flex items-center gap-2">
                            <div className="w-9 h-9 rounded-full bg-primary/10 border-2 border-primary overflow-hidden flex items-center justify-center">
                                <User className="text-primary w-5 h-5" />
                            </div>
                            <div className="hidden md:block text-xs text-right">
                                <p className="font-bold">{user?.name || 'Guest'}</p>
                                <button onClick={logout} className="text-red-500 hover:underline flex items-center gap-1">
                                    <LogOut className="w-3 h-3" /> Sign Out
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <main className="flex flex-1 overflow-hidden">
                {/* Sidebar Chat */}
                <aside className="w-[350px] border-r border-gray-200 bg-white flex flex-col hidden md:flex shrink-0 transition-all duration-300">
                    <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                        <div className="flex items-center gap-2">
                            <MessageSquare className="text-primary w-4 h-4" />
                            <span className="font-bold text-sm uppercase tracking-wider">Procurement Assistant</span>
                        </div>
                        <div className="flex gap-1">
                            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setIsHistoryView(!isHistoryView)} title="History">
                                <History className="w-4 h-4 text-gray-500" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={handleNewChat} title="New Chat">
                                <Plus className="w-4 h-4 text-gray-500" />
                            </Button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-6 custom-scrollbar relative">
                        {isHistoryView ? (
                            <div className="space-y-2">
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Chat History</h3>
                                {history.map(chat => (
                                    <div
                                        key={chat.id}
                                        onClick={() => { setCurrentConversationId(chat.id); setIsHistoryView(false); }}
                                        className={cn("p-3 rounded-lg cursor-pointer border hover:border-primary transition-all", currentConversationId === chat.id ? "bg-primary/5 border-primary" : "bg-white border-gray-100")}
                                    >
                                        <p className="font-medium text-sm truncate">{chat.title}</p>
                                        <p className="text-[10px] text-gray-400 mt-1">{new Date(chat.created_at).toLocaleDateString()}</p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <>
                                {messages.length === 0 && (
                                    <div className="text-center text-gray-400 text-sm mt-10 p-4">
                                        <p>No messages yet.</p>
                                        <p>Start a new consultation.</p>
                                    </div>
                                )}
                                {messages.map((msg, idx) => (
                                    <div key={idx} className={cn("flex flex-col gap-2", msg.isUser ? "items-end" : "items-start")}>
                                        <div className={cn("p-4 rounded-xl max-w-[90%] text-sm font-medium shadow-sm transition-all", msg.isUser ? "bg-primary text-white rounded-tr-none hover:shadow-md" : "bg-caution text-warning-black rounded-tl-none border-2 border-warning-black shadow-[4px_4px_0px_0px_rgba(18,18,18,1)] hover:translate-x-1")}>
                                            {msg.text}
                                        </div>
                                        <span className="text-[10px] text-gray-400 font-bold uppercase">{msg.from === 'user' ? 'You' : 'HardHat AI'} • {msg.time}</span>
                                    </div>
                                ))}
                                <div ref={messagesEndRef} />
                            </>
                        )}
                    </div>

                    <div className="p-4 bg-white border-t border-gray-200">
                        <div className="relative">
                            <input
                                className="w-full bg-gray-100 border-2 border-gray-200 rounded-lg py-3 px-4 text-sm focus:border-primary focus:outline-none transition-all pr-10"
                                placeholder={isHistoryView ? "Go back to chat..." : "Ask about materials..."}
                                type="text"
                                value={chatQuery}
                                onChange={(e) => setChatQuery(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                disabled={isHistoryView}
                            />
                            <button onClick={handleSendMessage} disabled={isHistoryView} className="absolute right-2 top-2 bg-warning-black text-white p-1.5 rounded-md hover:bg-primary transition-colors disabled:opacity-50">
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
