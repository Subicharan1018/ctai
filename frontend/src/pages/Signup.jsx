import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useProcurement } from '../context/ProcurementContext';

const Signup = () => {
    const [name, setName] = useState('');
    const [company, setCompany] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [projectType, setProjectType] = useState('');
    const [error, setError] = useState('');
    const { register } = useProcurement();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        const result = await register({
            name,
            email,
            password,
            company,
            project_type: projectType
        });

        if (result.success) {
            navigate('/login');
        } else {
            setError(result.error);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-6 text-warning-black font-display signup-bg">
            <div className="max-w-5xl w-full bg-white border border-[#eadbcd] rounded-2xl shadow-2xl flex flex-col md:flex-row overflow-hidden">
                <div className="flex-1 p-10 md:p-16 border-b md:border-b-0 md:border-r border-[#eadbcd]">
                    <div className="flex items-center gap-3 mb-10">
                        <div className="bg-primary size-10 rounded flex items-center justify-center text-white shadow-sm">
                            <span className="material-symbols-outlined">construction</span>
                        </div>
                        <div>
                            <h1 className="text-warning-black text-lg font-black uppercase tracking-tighter">Construction AI</h1>
                            <p className="text-primary text-[10px] font-bold uppercase tracking-widest leading-none">Procurement Platform</p>
                        </div>
                    </div>
                    <div className="mb-8">
                        <h2 className="text-3xl font-black uppercase tracking-tight mb-2">Request Access</h2>
                        <p className="text-[#a17345] font-medium">Join the next generation of construction procurement.</p>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
                            {error}
                        </div>
                    )}

                    <form className="space-y-5" onSubmit={handleSubmit}>
                        <div>
                            <label className="block text-[11px] font-black uppercase tracking-wider text-[#a17345] mb-1.5" htmlFor="name">Full Name</label>
                            <input
                                className="w-full px-4 py-3 rounded-lg border-2 border-[#eadbcd] focus:border-primary focus:ring-0 outline-none transition-all text-sm font-medium"
                                id="name"
                                placeholder="John Doe"
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-[11px] font-black uppercase tracking-wider text-[#a17345] mb-1.5" htmlFor="email">Professional Email</label>
                            <input
                                className="w-full px-4 py-3 rounded-lg border-2 border-[#eadbcd] focus:border-primary focus:ring-0 outline-none transition-all text-sm font-medium"
                                id="email"
                                placeholder="j.doe@buildcorp.com"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-[11px] font-black uppercase tracking-wider text-[#a17345] mb-1.5" htmlFor="password">Password</label>
                            <input
                                className="w-full px-4 py-3 rounded-lg border-2 border-[#eadbcd] focus:border-primary focus:ring-0 outline-none transition-all text-sm font-medium"
                                id="password"
                                placeholder="••••••••"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-[11px] font-black uppercase tracking-wider text-[#a17345] mb-1.5" htmlFor="company">Company Name</label>
                                <input
                                    className="w-full px-4 py-3 rounded-lg border-2 border-[#eadbcd] focus:border-primary focus:ring-0 outline-none transition-all text-sm font-medium"
                                    id="company"
                                    placeholder="BuildCorp Industries"
                                    type="text"
                                    value={company}
                                    onChange={(e) => setCompany(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-black uppercase tracking-wider text-[#a17345] mb-1.5" htmlFor="project-type">Project Type</label>
                                <select
                                    className="w-full px-4 py-3 rounded-lg border-2 border-[#eadbcd] focus:border-primary focus:ring-0 outline-none transition-all text-sm font-medium bg-white appearance-none"
                                    id="project-type"
                                    value={projectType}
                                    onChange={(e) => setProjectType(e.target.value)}
                                >
                                    <option disabled value="">Select project focus...</option>
                                    <option>Commercial Infrastructure</option>
                                    <option>Residential Development</option>
                                    <option>Industrial/Manufacturing</option>
                                    <option>Civic/Government</option>
                                </select>
                            </div>
                        </div>

                        <div className="pt-4">
                            <button className="w-full bg-caution text-warning-black py-4 rounded-lg font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-caution/20 hover:shadow-caution/40 hover:-translate-y-0.5 active:scale-95 transition-all" type="submit">
                                Create Account <span className="material-symbols-outlined">arrow_forward</span>
                            </button>
                            <p className="text-center mt-6 text-xs font-medium text-[#a17345]">
                                Already have an account? <Link to="/login" className="text-primary font-black uppercase hover:underline">Log In</Link>
                            </p>
                        </div>
                    </form>
                </div>
                <div className="w-full md:w-[400px] bg-warning-black p-10 md:p-16 flex flex-col justify-center relative overflow-hidden">
                    <div className="absolute -top-10 -right-10 w-40 h-40 border-8 border-primary/10 rounded-full"></div>
                    <div className="absolute -bottom-20 -left-20 w-60 h-60 border-[16px] border-caution/5 rounded-full"></div>
                    <div className="relative z-10">
                        <h3 className="text-white text-2xl font-black uppercase tracking-tight mb-8">Why Join?</h3>
                        <ul className="space-y-8">
                            <li className="flex gap-4">
                                <span className="material-symbols-outlined text-caution caution-fill shrink-0">check_circle</span>
                                <div>
                                    <h4 className="text-white font-black uppercase text-sm tracking-wide">AI Procurement</h4>
                                    <p className="text-white/60 text-xs mt-1 leading-relaxed">Automated vendor selection and material bidding driven by industry-specific LLMs.</p>
                                </div>
                            </li>
                            <li className="flex gap-4">
                                <span className="material-symbols-outlined text-caution caution-fill shrink-0">check_circle</span>
                                <div>
                                    <h4 className="text-white font-black uppercase text-sm tracking-wide">Real-time Analytics</h4>
                                    <p className="text-white/60 text-xs mt-1 leading-relaxed">Track price fluctuations, lead times, and inventory levels across all job sites.</p>
                                </div>
                            </li>
                            <li className="flex gap-4">
                                <span className="material-symbols-outlined text-caution caution-fill shrink-0">check_circle</span>
                                <div>
                                    <h4 className="text-white font-black uppercase text-sm tracking-wide">Vendor Network</h4>
                                    <p className="text-white/60 text-xs mt-1 leading-relaxed">Access to over 5,000 verified heavy industry suppliers with rated reliability.</p>
                                </div>
                            </li>
                            <li className="flex gap-4">
                                <span className="material-symbols-outlined text-caution caution-fill shrink-0">check_circle</span>
                                <div>
                                    <h4 className="text-white font-black uppercase text-sm tracking-wide">Risk Management</h4>
                                    <p className="text-white/60 text-xs mt-1 leading-relaxed">Predictive alerts for supply chain disruptions and logistical bottlenecks.</p>
                                </div>
                            </li>
                        </ul>
                        <div className="mt-12 p-6 bg-white/5 rounded-xl border border-white/10">
                            <p className="text-white/80 italic text-sm font-medium">"This platform reduced our procurement overhead by 30% in the first quarter alone."</p>
                            <div className="mt-4 flex items-center gap-3">
                                <div className="size-8 rounded-full bg-cover bg-center border border-primary/40" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCS0bjWSWM-y9p-1stl654jmPLrUeQgnsKKze3sxO9oaei3qqERudKi71cR5tMFjYgE0boJJ3L06_AiDlnbky_ZJzeTjScAgIdwkZV7hOG39txOGl7UHnnADS3JQNhgksgUNZg5E7_qlAYt7GbbdAlGJ0lghjYK_XFDdNC_2Y5EYFL2WRhCq_FPKTInykTn2C27YEa2Lc8g7NYDu8WmT-4hTYxNer1vkQD00aGFdNeaWfVggadA5SRAWqYenvDkQhrHFuVP1InpVts')" }}></div>
                                <div>
                                    <p className="text-white font-bold text-[10px] uppercase">Marcus Thorne</p>
                                    <p className="text-caution text-[9px] font-bold uppercase">Senior Operations Director</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <style jsx>{`
                .signup-bg {
                    background-color: #ffffff;
                    background-image: linear-gradient(#e5e7eb 1px, transparent 1px),
                                      linear-gradient(90deg, #e5e7eb 1px, transparent 1px);
                    background-size: 40px 40px;
                }
                .caution-fill {
                    font-variation-settings: 'FILL' 1;
                }
            `}</style>
        </div>
    );
};

export default Signup;
