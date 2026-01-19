import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const LandingPage = () => {
    const navigate = useNavigate();
    const [query, setQuery] = useState('');

    const handleRunAnalysis = () => {
        // Navigate to budget breakdown with query
        navigate('/budget', { state: { query } });
    };

    return (
        <div className="bg-background-light font-display text-warning-black selection:bg-caution min-h-screen relative overflow-x-hidden">
            {/* Grid Background */}
            <div className="absolute inset-0 grid-bg pointer-events-none z-0" style={{
                backgroundImage: 'radial-gradient(#e5e7eb 1px, transparent 1px)',
                backgroundSize: '24px 24px'
            }}></div>

            {/* Navigation */}
            <header className="sticky top-0 z-50 border-b-2 border-warning-black bg-white/90 backdrop-blur-md">
                <div className="max-w-[1440px] mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-warning-black flex items-center justify-center rounded">
                            <span className="material-symbols-outlined text-caution text-2xl">construction</span>
                        </div>
                        <h2 className="text-xl font-bold tracking-tighter uppercase italic">CONSTRUCTION AI</h2>
                    </div>
                    <nav className="hidden md:flex items-center gap-10">
                        <a href="#" className="text-xs font-bold uppercase tracking-widest hover:text-primary transition-colors">Estimator</a>
                        <a href="#" className="text-xs font-bold uppercase tracking-widest hover:text-primary transition-colors">Supply Chain</a>
                        <a href="#" className="text-xs font-bold uppercase tracking-widest hover:text-primary transition-colors">RFP Logic</a>
                        <a href="#" className="text-xs font-bold uppercase tracking-widest hover:text-primary transition-colors">Pricing Data</a>
                    </nav>
                    <div className="flex items-center gap-4">
                        <button className="hidden sm:block text-xs font-bold uppercase tracking-widest px-4 py-2 border-2 border-warning-black hover:bg-warning-black hover:text-white transition-all">
                            Log In
                        </button>
                        <button className="bg-caution text-warning-black px-6 py-2 text-xs font-black uppercase tracking-widest border-2 border-warning-black industrial-shadow-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all" style={{ boxShadow: '2px 2px 0px 0px rgba(0,0,0,1)' }}>
                            Request Access
                        </button>
                    </div>
                </div>
            </header>

            <main className="relative z-10 max-w-[1200px] mx-auto px-6 py-12 lg:py-20">
                {/* Hero */}
                <section className="flex flex-col items-center text-center mb-24">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-warning-black text-caution text-[10px] font-bold uppercase tracking-[0.2em] mb-8 rounded">
                        <span className="material-symbols-outlined text-sm">precision_manufacturing</span>
                        Next-Gen Heavy Industry Intelligence
                    </div>
                    <h1 className="text-7xl md:text-9xl font-black italic uppercase tracking-tighter mb-6 leading-[0.85] gradient-text bg-clip-text text-transparent bg-gradient-to-r from-primary to-caution">
                        CONSTRUCTION AI
                    </h1>
                    <p className="max-w-2xl text-lg md:text-xl font-medium text-slate-600 mb-12 leading-relaxed">
                        The high-precision intelligence engine for <span className="text-warning-black font-bold border-b-2 border-caution">automated procurement</span> and real-time material logistics.
                    </p>

                    {/* Input Area */}
                    <div className="w-full max-w-4xl glass-panel p-2 rounded-xl border-2 border-warning-black mb-4 bg-white/70 backdrop-blur-md" style={{ boxShadow: '4px 4px 0px 0px rgba(0,0,0,1)' }}>
                        <div className="flex flex-col md:flex-row items-stretch gap-2">
                            <div className="flex-1 relative group">
                                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary">terminal</span>
                                <input
                                    type="text"
                                    className="w-full h-16 bg-white/50 border-none pl-14 pr-6 text-lg font-medium placeholder:text-slate-400 focus:ring-2 focus:ring-primary rounded-lg transition-all outline-none"
                                    placeholder="Source 500 tons of structural steel for project 'Omega' in Berlin..."
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                />
                            </div>
                            <Button
                                onClick={handleRunAnalysis}
                                className="h-16 px-10 bg-warning-black text-caution font-black uppercase tracking-widest text-sm flex items-center justify-center gap-3 hover:bg-primary hover:text-white transition-colors rounded-lg"
                            >
                                Run Analysis
                                <span className="material-symbols-outlined">bolt</span>
                            </Button>
                        </div>
                    </div>
                    <div className="flex gap-6 text-[11px] font-bold uppercase tracking-widest text-slate-400">
                        <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">check_circle</span> 24 Active RFPs</span>
                        <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">check_circle</span> Market Live</span>
                        <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">check_circle</span> ISO Certified</span>
                    </div>
                </section>

                {/* Features */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24">
                    {[
                        { icon: 'description', title: 'Analyze RFP', desc: 'Upload technical specifications to identify pricing anomalies and procurement risks instantly.' },
                        { icon: 'monitoring', title: 'Market Pricing Index', desc: 'Live indexing of steel, concrete, and timber prices across 40+ global construction hubs.' },
                        { icon: 'warning_amber', title: 'Supply Chain Risks', desc: 'Predictive modeling for logistics bottlenecks and material lead-time fluctuations.' }
                    ].map((feature, idx) => (
                        <div key={idx} className="bg-white border-2 border-warning-black p-8 group hover:-translate-y-1 transition-transform relative overflow-hidden" style={{ boxShadow: '4px 4px 0px 0px rgba(0,0,0,1)' }}>
                            <div className="absolute top-0 right-0 w-12 h-12 opacity-10" style={{
                                backgroundImage: 'repeating-linear-gradient(-45deg, #FFD700, #FFD700 10px, #121212 10px, #121212 20px)'
                            }}></div>
                            <span className="material-symbols-outlined text-4xl text-primary mb-6">{feature.icon}</span>
                            <h3 className="text-xl font-bold uppercase italic mb-3">{feature.title}</h3>
                            <p className="text-sm text-slate-500 leading-relaxed mb-6">{feature.desc}</p>
                            <div className="h-1 w-12 bg-caution"></div>
                        </div>
                    ))}
                </div>

                {/* Footer Preview */}
                <footer className="w-full border-t border-warning-black/10 pt-12 flex flex-col items-center">
                    <p className="text-center text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-12">Integrated with Global Industry Standards</p>
                    <div className="flex flex-wrap justify-center items-center gap-12 md:gap-24 opacity-30 grayscale">
                        <div className="text-2xl font-black italic tracking-tighter">BUILD-CORP</div>
                        <div className="text-2xl font-black italic tracking-tighter">MAX-PRO</div>
                        <div className="text-2xl font-black italic tracking-tighter">INTL-GRID</div>
                        <div className="text-2xl font-black italic tracking-tighter">IRON-HUB</div>
                    </div>
                </footer>
            </main>
        </div>
    );
};

export default LandingPage;
