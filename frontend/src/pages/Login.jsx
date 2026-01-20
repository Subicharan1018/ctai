import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useProcurement } from '../context/ProcurementContext';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useProcurement();
    const navigate = useNavigate();
    const location = useLocation();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        const result = await login(email, password);
        if (!result.success) {
            setError(result.error);
        } else {
            // Check for return location
            const from = location.state?.from?.pathname || '/budget';
            const fromState = location.state?.from?.state;
            navigate(from, { state: fromState, replace: true });
        }
    };

    return (
        <div className="flex h-screen w-full bg-background-light text-warning-black font-display overflow-hidden">
            <div className="hidden lg:block lg:w-1/2 relative">
                <img
                    alt="Modern construction site with cranes and steel structures"
                    className="absolute inset-0 w-full h-full object-cover"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuARfTxPSZnocl27AhjHp0hhsT_ebffnWGba-WRJar3C-dmkiw_jXtciru4ljRaXvd_TJ8bXFlYUgFO64GV_A8dMeoE74yv1VO9B1sPyIU0JhwJA4E8s_7xEbJgCzQXBEWWAU82wPyBcSfoJAFH1q3IggkDd82_hVv0gqbDYRK9KL_4FYoLpYs7dVqWh2Uder4r-OB_-RwvtVfsctzM2h_bX1kGft2Mtqvoyndt-_h97dTdd4elLsjhnpN18QuMcTHgxuY6YL5wWeF4"
                />
                <div className="absolute inset-0 bg-warning-black/20 mix-blend-multiply"></div>
                <div className="absolute bottom-12 left-12 right-12 text-white">
                    <div className="bg-warning-black/80 backdrop-blur-md p-8 rounded-xl border-l-4 border-primary">
                        <h2 className="text-3xl font-black uppercase tracking-tighter mb-2">Build Smarter</h2>
                        <p className="text-gray-200 font-medium">The intelligent procurement layer for modern construction projects. Track materials, manage vendors, and optimize lead times with AI.</p>
                    </div>
                </div>
            </div>
            <div className="w-full lg:w-1/2 grid-pattern flex flex-col items-center justify-center p-8 md:p-12 relative bg-white">
                <div className="w-full max-w-md">
                    <div className="flex items-center gap-4 mb-12">
                        <div className="bg-primary size-12 rounded flex items-center justify-center text-white shadow-lg">
                            <span className="material-symbols-outlined text-3xl">construction</span>
                        </div>
                        <div>
                            <h1 className="text-warning-black text-2xl font-black uppercase tracking-tighter leading-none">Construction AI</h1>
                            <p className="text-primary text-[10px] font-bold uppercase tracking-[0.2em] mt-1">Procurement Assistant</p>
                        </div>
                    </div>
                    <div className="mb-8">
                        <h2 className="text-3xl font-black text-warning-black uppercase tracking-tight">Sign In</h2>
                        <p className="text-gray-500 font-medium mt-1">Welcome back. Enter your credentials to access the hub.</p>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
                            {error}
                        </div>
                    )}

                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div>
                            <label className="block text-[11px] font-black uppercase tracking-widest text-warning-black mb-2" htmlFor="email">Email Address</label>
                            <div className="relative">
                                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl">mail</span>
                                <input
                                    className="w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                                    id="email"
                                    name="email"
                                    placeholder="name@company.com"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="block text-[11px] font-black uppercase tracking-widest text-warning-black" htmlFor="password">Password</label>
                                <a className="text-[11px] font-black uppercase tracking-widest text-warning-black hover:text-primary transition-colors" href="#">Forgot Password?</a>
                            </div>
                            <div className="relative">
                                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl">lock</span>
                                <input
                                    className="w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                                    id="password"
                                    name="password"
                                    placeholder="••••••••"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                        {/* 
                        <div className="flex items-center gap-3">
                            <input className="size-4 text-primary border-gray-300 rounded focus:ring-primary" id="remember" type="checkbox"/>
                            <label className="text-xs font-bold text-gray-600 uppercase" htmlFor="remember">Remember this device</label>
                        </div>
                        */}
                        <button className="w-full bg-primary text-white py-4 rounded-lg font-black text-sm uppercase tracking-[0.15em] shadow-lg shadow-primary/20 hover:bg-warning-black hover:shadow-none transition-all active:scale-[0.98] flex items-center justify-center gap-2" type="submit">
                            Sign In <span className="material-symbols-outlined text-lg">login</span>
                        </button>
                    </form>
                    <div className="mt-12 pt-8 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">New to the platform?</p>
                        <Link to="/signup" className="text-xs font-black uppercase tracking-widest text-warning-black border-b-2 border-caution hover:border-primary transition-all pb-1">Request Access</Link>
                    </div>
                </div>
                <div className="mt-auto pt-8">
                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-[0.2em] text-center">
                        © 2026 Construction AI Systems • Industrial Grade Procurement
                    </p>
                </div>
            </div>

            <style jsx>{`
                .grid-pattern {
                    background-color: #ffffff;
                    background-image: radial-gradient(#e5e7eb 0.5px, transparent 0.5px);
                    background-size: 24px 24px;
                }
            `}</style>
        </div>
    );
};

export default Login;
