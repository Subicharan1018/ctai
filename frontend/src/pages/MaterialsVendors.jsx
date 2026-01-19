import React from 'react';
import DashboardLayout from '@/layouts/DashboardLayout';
import { Button } from "@/components/ui/button";
import { Plus, Search, Filter, AlertTriangle, ArrowRight, Star } from 'lucide-react';
import { cn } from "@/lib/utils";

const MaterialsVendors = () => {
    return (
        <DashboardLayout>
            <div className="flex flex-col gap-8">
                {/* Header */}
                <div className="flex items-end justify-between">
                    <div>
                        <h1 className="text-4xl font-black tracking-tight text-warning-black uppercase">Materials & Inventory</h1>
                        <p className="text-primary font-medium mt-1">Real-time supply chain tracking and stock management.</p>
                    </div>
                    <Button className="bg-primary hover:bg-primary/90 text-white px-6 py-6 h-auto rounded-lg font-black text-sm uppercase tracking-widest gap-2 shadow-lg hover:shadow-primary/20 transition-all active:scale-95">
                        <Plus className="w-5 h-5" /> New Request
                    </Button>
                </div>

                {/* Materials Table Section */}
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                    <div className="bg-amber-300 text-white px-6 py-4 flex items-center justify-between">
                        <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2 text-warning-black">
                            <AlertTriangle className="w-4 h-4" /> Live Inventory Status
                        </h3>
                        <div className="flex gap-4 text-[10px] font-bold uppercase text-warning-black">
                            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-primary"></span> Low Stock</span>
                            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500"></span> Delayed</span>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-200">
                                    {['Item Description', 'Category', 'Current Stock', 'Unit Cost', 'Est. Lead Time', 'Action'].map((h, i) => (
                                        <th key={i} className="px-6 py-4 text-[11px] font-black uppercase tracking-wider text-amber-700">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="border-b border-gray-100 bg-primary/5 hover:bg-primary/10 transition-colors">
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-1 h-8 bg-primary rounded-full"></div>
                                            <div>
                                                <p className="font-black text-warning-black">Structural Steel (I-Beam)</p>
                                                <p className="text-[10px] text-amber-700 font-bold">SKU-HEB-400</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5"><span className="px-3 py-1 bg-white border border-gray-200 rounded text-[10px] font-black uppercase">Metalwork</span></td>
                                    <td className="px-6 py-5 text-primary font-black">12 Tons <span className="text-[10px] block text-primary/70 uppercase">Reorder point</span></td>
                                    <td className="px-6 py-5 font-bold">$1,240.00</td>
                                    <td className="px-6 py-5 font-medium">14 Days</td>
                                    <td className="px-6 py-5">
                                        <Button size="sm" className="bg-amber-400 text-white font-black uppercase text-[10px] tracking-widest hover:bg-primary">Restock</Button>
                                    </td>
                                </tr>
                                {[
                                    { name: 'Portland Cement (Grade 43)', sku: 'SKU-CEM-G43', cat: 'Masonry', stock: '450 Bags', cost: '$18.50', lead: '2 Days' },
                                    { name: 'Copper Wiring (2.5mm)', sku: 'SKU-ELC-WIR', cat: 'Electrical', stock: '1,200m', cost: '$4.20', lead: '5 Days' }
                                ].map((item, idx) => (
                                    <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-1 h-8 bg-transparent"></div>
                                                <div>
                                                    <p className="font-black text-warning-black">{item.name}</p>
                                                    <p className="text-[10px] text-amber-700 font-bold">{item.sku}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5"><span className="px-3 py-1 bg-white border border-gray-200 rounded text-[10px] font-black uppercase">{item.cat}</span></td>
                                        <td className="px-6 py-5 font-bold">{item.stock}</td>
                                        <td className="px-6 py-5 font-bold">{item.cost}</td>
                                        <td className="px-6 py-5 font-medium">{item.lead}</td>
                                        <td className="px-6 py-5">
                                            <Button variant="outline" size="sm" className="border-warning-black text-warning-black font-black uppercase text-[10px] tracking-widest">Details</Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Vendors Grid */}
                <section>
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-[22px] font-black uppercase tracking-tight text-warning-black">Preferred Vendors</h3>
                        <a href="#" className="text-sm font-black text-primary hover:underline uppercase tracking-widest flex items-center gap-1">
                            Directory <ArrowRight className="w-4 h-4" />
                        </a>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[
                            { name: 'IronWorks Industrial', type: 'Steel Specialist', rating: '4.9', verified: 'green', desc: 'Heavy structural steel, custom fabrication.', orders: '142', lead: '4.2 Days' },
                            { name: 'Titan ReadyMix', type: 'Bulk Concrete', rating: '4.7', verified: 'green', desc: 'Global supplier of Portland cement.', orders: '89', lead: '2.1 Days' },
                            { name: 'VoltSource Systems', type: 'Electrical Supply', rating: '4.5', verified: 'blue', desc: 'Commercial wiring and lighting solutions.', orders: '12', lead: '5.5 Days' }
                        ].map((vendor, idx) => (
                            <div key={idx} className="bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col group hover:shadow-xl hover:shadow-amber-500/10 transition-all">
                                <div className="bg-amber-300 px-4 py-2 flex items-center justify-between border-b border-gray-200">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-warning-black">{vendor.type}</span>
                                    <div className="flex items-center gap-1">
                                        <Star className="w-3 h-3 fill-current text-white" />
                                        <span className="text-[10px] font-black uppercase text-white">{vendor.rating}</span>
                                    </div>
                                </div>
                                <div className="p-5 flex-1">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="w-14 h-14 bg-gray-50 rounded border border-gray-200 flex items-center justify-center font-bold text-xs text-gray-400">Logo</div>
                                        <span className={cn("text-[10px] font-black px-2 py-0.5 rounded uppercase", vendor.verified === 'green' ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700")}>Verified</span>
                                    </div>
                                    <h4 className="text-lg font-black uppercase tracking-tight mb-1">{vendor.name}</h4>
                                    <p className="text-xs text-amber-700 mb-4 font-medium">{vendor.desc}</p>
                                    <div className="grid grid-cols-2 gap-4 mb-6">
                                        <div><p className="text-[9px] font-black uppercase text-amber-700 leading-none mb-1">Orders</p><p className="text-sm font-bold">{vendor.orders} Completed</p></div>
                                        <div><p className="text-[9px] font-black uppercase text-amber-700 leading-none mb-1">Avg. Lead</p><p className="text-sm font-bold">{vendor.lead}</p></div>
                                    </div>
                                    <Button className="w-full bg-warning-black text-white hover:bg-primary uppercase font-black text-xs tracking-widest">Request Quote</Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </DashboardLayout>
    );
};

export default MaterialsVendors;
