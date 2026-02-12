import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/layouts/DashboardLayout';
import { Button } from "@/components/ui/button";
import { Plus, Search, Filter, AlertTriangle, ArrowRight, Star, Loader2, MapPin, User, ExternalLink, ChevronDown, ChevronUp, Package } from 'lucide-react';
import { cn } from "@/lib/utils";
import { useProcurement } from '@/context/ProcurementContext';

const MaterialsVendors = () => {
    const { procurementData, isLoading } = useProcurement();
    const navigate = useNavigate();

    const [expandedMaterial, setExpandedMaterial] = useState(null);
    const [vendorsLoading, setVendorsLoading] = useState(false);

    if (isLoading) {
        return (
            <DashboardLayout>
                <div className="h-full flex items-center justify-center">
                    <Loader2 className="w-10 h-10 animate-spin text-primary" />
                </div>
            </DashboardLayout>
        );
    }

    if (!procurementData) {
        return (
            <DashboardLayout>
                <div className="h-full flex items-center justify-center">
                    <p className="text-gray-500 font-bold">No analysis data found. Run an analysis from the home page first.</p>
                </div>
            </DashboardLayout>
        );
    }

    const materials = procurementData.material_requirements || [];
    const vendorRecommendations = procurementData.vendor_recommendations || {};

    // Flatten all vendors from recommendations for the "Preferred Vendors" grid
    const allVendors = [];
    Object.entries(vendorRecommendations).forEach(([materialName, vendors]) => {
        if (Array.isArray(vendors)) {
            vendors.forEach((v) => {
                allVendors.push({ ...v, materialName });
            });
        }
    });

    // De-duplicate by vendor name
    const seen = new Set();
    const uniqueVendors = allVendors.filter((v) => {
        const key = v.vendor || v.product || '';
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });

    const toggleMaterial = (materialName) => {
        setExpandedMaterial(expandedMaterial === materialName ? null : materialName);
    };

    return (
        <DashboardLayout>
            <div className="flex flex-col gap-8">
                {/* Header */}
                <div className="flex items-end justify-between">
                    <div>
                        <h1 className="text-4xl font-black tracking-tight text-warning-black uppercase">Materials & Vendors</h1>
                        <p className="text-primary font-medium mt-1">Vendor data sourced live from n8n • {uniqueVendors.length} vendors found</p>
                    </div>
                    <Button
                        onClick={() => navigate('/')}
                        className="bg-primary hover:bg-primary/90 text-white px-6 py-6 h-auto rounded-lg font-black text-sm uppercase tracking-widest gap-2 shadow-lg hover:shadow-primary/20 transition-all active:scale-95"
                    >
                        <Search className="w-5 h-5" /> New Analysis
                    </Button>
                </div>

                {/* Preferred Vendors Grid — from n8n */}
                <section>
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-[22px] font-black uppercase tracking-tight text-warning-black">
                            Recommended Vendors
                            <span className="text-sm font-medium text-amber-600 normal-case ml-3">from n8n API</span>
                        </h3>
                    </div>
                    {uniqueVendors.length === 0 ? (
                        <div className="bg-gray-50 border border-dashed border-gray-300 rounded-xl p-8 text-center text-gray-400 font-medium">
                            No vendor data yet. Run an analysis to fetch vendors.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {uniqueVendors.map((vendor, idx) => (
                                <div
                                    key={idx}
                                    className="bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col group hover:shadow-xl hover:shadow-amber-500/10 transition-all"
                                >
                                    <div className="bg-amber-300 px-4 py-2 flex items-center justify-between border-b border-gray-200">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-warning-black truncate max-w-[180px]">
                                            {vendor.category || vendor.materialName}
                                        </span>
                                        <div className="flex items-center gap-1">
                                            <Star className="w-3 h-3 fill-current text-white" />
                                            <span className="text-[10px] font-black uppercase text-white">
                                                {vendor.rating !== 'N/A' ? vendor.rating : '4.5'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="p-5 flex-1 flex flex-col">
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="w-12 h-12 bg-amber-50 rounded-lg border border-amber-200 flex items-center justify-center">
                                                <Package className="w-6 h-6 text-amber-500" />
                                            </div>
                                            <span className="text-[10px] font-black px-2 py-0.5 rounded uppercase bg-green-100 text-green-700">
                                                n8n
                                            </span>
                                        </div>
                                        <h4 className="text-base font-black uppercase tracking-tight mb-1 leading-snug">
                                            {vendor.vendor || vendor.product || 'Unknown Vendor'}
                                        </h4>
                                        <div className="flex items-center gap-1 text-xs text-amber-700 font-medium mb-1">
                                            <MapPin className="w-3 h-3" />
                                            {vendor.location || 'N/A'}
                                        </div>
                                        {vendor.contact_person && vendor.contact_person !== 'N/A' && (
                                            <div className="flex items-center gap-1 text-xs text-gray-500 mb-3">
                                                <User className="w-3 h-3" />
                                                {vendor.contact_person}
                                            </div>
                                        )}

                                        <div className="mt-auto flex gap-2">
                                            {vendor.google_maps_url && (
                                                <a
                                                    href={vendor.google_maps_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="flex-1"
                                                >
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="w-full border-amber-300 text-amber-700 font-black uppercase text-[10px] tracking-widest hover:bg-amber-50 gap-1"
                                                    >
                                                        <MapPin className="w-3 h-3" /> Map
                                                    </Button>
                                                </a>
                                            )}
                                            {vendor.url && (
                                                <a
                                                    href={vendor.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="flex-1"
                                                >
                                                    <Button
                                                        size="sm"
                                                        className="w-full bg-warning-black text-white hover:bg-primary uppercase font-black text-[10px] tracking-widest gap-1"
                                                    >
                                                        <ExternalLink className="w-3 h-3" /> Profile
                                                    </Button>
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* Materials Table with Expandable Vendor Rows */}
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                    <div className="bg-amber-300 text-white px-6 py-4 flex items-center justify-between">
                        <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2 text-warning-black">
                            <AlertTriangle className="w-4 h-4" /> Materials & Vendor Mapping
                        </h3>
                        <div className="flex gap-4 text-[10px] font-bold uppercase text-warning-black">
                            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-primary"></span> Low Stock</span>
                            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500"></span> On Order</span>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-200">
                                    {['Material', 'Category', 'Stock', 'Unit Cost', 'Lead Time', 'Vendors', 'Action'].map((h, i) => (
                                        <th key={i} className="px-6 py-4 text-[11px] font-black uppercase tracking-wider text-amber-700">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {materials.map((item, idx) => {
                                    const materialVendors = vendorRecommendations[item.material] || [];
                                    const isExpanded = expandedMaterial === item.material;
                                    return (
                                        <React.Fragment key={idx}>
                                            <tr
                                                className={cn(
                                                    "border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer",
                                                    isExpanded && "bg-amber-50"
                                                )}
                                                onClick={() => toggleMaterial(item.material)}
                                            >
                                                <td className="px-6 py-5">
                                                    <div className="flex items-center gap-3">
                                                        <div className={cn("w-1 h-8 rounded-full", item.stock_status === 'Low Stock' ? "bg-primary" : item.stock_status === 'On Order' ? "bg-amber-500" : "bg-green-500")}></div>
                                                        <div>
                                                            <p className="font-black text-warning-black">{item.material}</p>
                                                            <p className="text-[10px] text-amber-700 font-bold">{item.sku_id}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <span className="px-3 py-1 bg-white border border-gray-200 rounded text-[10px] font-black uppercase">
                                                        {item.category_tag || "General"}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-5 font-bold">
                                                    {item.stock_level}
                                                    {item.stock_status === 'Low Stock' && <span className="text-[10px] block text-primary/70 uppercase">Reorder</span>}
                                                </td>
                                                <td className="px-6 py-5 font-bold">{item.unit_cost}</td>
                                                <td className="px-6 py-5 font-medium">{item.estimated_lead_time}</td>
                                                <td className="px-6 py-5">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-black text-amber-600">{materialVendors.length}</span>
                                                        {materialVendors.length > 0 && (
                                                            isExpanded
                                                                ? <ChevronUp className="w-4 h-4 text-amber-500" />
                                                                : <ChevronDown className="w-4 h-4 text-gray-400" />
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    {item.stock_status === 'Low Stock' ? (
                                                        <Button size="sm" className="bg-amber-400 text-white font-black uppercase text-[10px] tracking-widest hover:bg-primary">
                                                            Restock
                                                        </Button>
                                                    ) : (
                                                        <Button variant="outline" size="sm" className="border-warning-black text-warning-black font-black uppercase text-[10px] tracking-widest">
                                                            Details
                                                        </Button>
                                                    )}
                                                </td>
                                            </tr>

                                            {/* Expanded vendor details */}
                                            {isExpanded && materialVendors.length > 0 && (
                                                <tr>
                                                    <td colSpan={7} className="px-6 py-4 bg-amber-50/50 border-b border-amber-200">
                                                        <div className="text-[11px] font-black uppercase tracking-widest text-amber-700 mb-3">
                                                            Vendors for {item.material} ({materialVendors.length})
                                                        </div>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                                            {materialVendors.map((v, vIdx) => (
                                                                <div key={vIdx} className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
                                                                    <h5 className="font-black text-sm uppercase mb-1 truncate">
                                                                        {v.vendor || v.product || 'Vendor'}
                                                                    </h5>
                                                                    <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                                                                        <MapPin className="w-3 h-3" />
                                                                        {v.location || 'N/A'}
                                                                    </div>
                                                                    {v.contact_person && v.contact_person !== 'N/A' && (
                                                                        <div className="flex items-center gap-1 text-xs text-gray-400 mb-2">
                                                                            <User className="w-3 h-3" />
                                                                            {v.contact_person}
                                                                        </div>
                                                                    )}
                                                                    <div className="flex gap-2 mt-2">
                                                                        {v.google_maps_url && (
                                                                            <a href={v.google_maps_url} target="_blank" rel="noopener noreferrer" className="flex-1">
                                                                                <Button variant="outline" size="sm" className="w-full text-[9px] font-black uppercase gap-1 h-7">
                                                                                    <MapPin className="w-3 h-3" /> Map
                                                                                </Button>
                                                                            </a>
                                                                        )}
                                                                        {v.url && (
                                                                            <a href={v.url} target="_blank" rel="noopener noreferrer" className="flex-1">
                                                                                <Button size="sm" className="w-full bg-warning-black text-white text-[9px] font-black uppercase gap-1 h-7 hover:bg-primary">
                                                                                    <ExternalLink className="w-3 h-3" /> View
                                                                                </Button>
                                                                            </a>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default MaterialsVendors;
