import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '@/layouts/DashboardLayout';
import { Button } from "@/components/ui/button";
import { ArrowLeft, MapPin, Phone, Mail, Globe, Star, ShieldCheck, Truck } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for Leaflet marker icons
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Static coordinate mapping removed in favor of dynamic Nominatim API

const VendorDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [vendor, setVendor] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [mapCenter, setMapCenter] = useState([20.5937, 78.9629]); // Default to Center of India
    const [hasLocation, setHasLocation] = useState(false);

    useEffect(() => {
        const fetchVendorDetails = async () => {
            try {
                const response = await fetch(`http://localhost:5001/vendors/${id}`);
                const data = await response.json();

                if (data.error) {
                    console.error("Vendor not found");
                } else {
                    setVendor(data);

                    // Determine coordinates from location string
                    if (data.location) {
                        try {
                            // Use OpenStreetMap Nominatim API for geocoding
                            // Rate limit: 1 request per second strictly needed for free tier, but for this demo it's fine
                            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(data.location)}`);
                            const geoData = await response.json();

                            if (geoData && geoData.length > 0) {
                                setMapCenter([parseFloat(geoData[0].lat), parseFloat(geoData[0].lon)]);
                                setHasLocation(true);
                            }
                        } catch (err) {
                            console.error("Geocoding failed:", err);
                        }
                    }
                }
            } catch (error) {
                console.error("Error fetching vendor details:", error);
            } finally {
                setIsLoading(false);
            }
        };

        if (id) {
            fetchVendorDetails();
        }
    }, [id]);

    if (isLoading) {
        return (
            <DashboardLayout>
                <div className="flex h-full items-center justify-center">
                    <p className="text-gray-500 font-medium animate-pulse">Loading vendor details...</p>
                </div>
            </DashboardLayout>
        );
    }

    if (!vendor) {
        return (
            <DashboardLayout>
                <div className="flex flex-col h-full items-center justify-center gap-4">
                    <p className="text-gray-500 font-bold">Vendor not found.</p>
                    <Button onClick={() => navigate('/materials')} variant="outline">Back to Vendors</Button>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="max-w-6xl mx-auto space-y-6">
                {/* Back Button */}
                <Button
                    variant="ghost"
                    className="pl-0 hover:bg-transparent text-gray-500 hover:text-primary gap-2"
                    onClick={() => navigate('/materials')}
                >
                    <ArrowLeft className="w-4 h-4" /> Back to Materials & Vendors
                </Button>

                {/* Header Section */}
                <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm flex flex-col md:flex-row justify-between md:items-start gap-6">
                    <div className="flex gap-6">
                        <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200">
                            <span className="text-gray-400 font-bold text-xs uppercase text-center p-2">{vendor.name?.substring(0, 20)}</span>
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <h1 className="text-2xl font-black uppercase text-warning-black tracking-tight">{vendor.name}</h1>
                                {vendor.verified && (
                                    <span className="bg-green-100 text-green-700 text-[10px] font-black uppercase px-2 py-0.5 rounded flex items-center gap-1">
                                        <ShieldCheck className="w-3 h-3" /> Verified
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                                <span className="flex items-center gap-1"><MapPin className="w-4 h-4 text-primary" /> {vendor.location || "Location N/A"}</span>
                                <span className="flex items-center gap-1"><Star className="w-4 h-4 text-amber-500 fill-amber-500" /> {vendor.rating} Rating</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <span className="px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-xs font-bold uppercase border border-amber-100">{vendor.category}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col gap-2 min-w-[200px]">
                        <Button className="w-full bg-warning-black text-white hover:bg-primary font-bold uppercase tracking-wider">Request Quote</Button>
                        <Button variant="outline" className="w-full border-gray-200 text-gray-600 font-bold uppercase tracking-wider">Contact Vendor</Button>
                    </div>
                </div>

                {/* Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Details Column */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
                            <h3 className="text-lg font-black uppercase tracking-tight text-warning-black mb-4">Contact Info</h3>
                            <div className="space-y-4">
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                                        <Phone className="w-4 h-4 text-amber-700" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-gray-400 uppercase">Phone</p>
                                        <p className="font-medium text-warning-black">{vendor.phone || "N/A"}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                                        <Mail className="w-4 h-4 text-amber-700" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-gray-400 uppercase">Email</p>
                                        <p className="font-medium text-warning-black break-all">{vendor.email || "N/A"}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                                        <Globe className="w-4 h-4 text-amber-700" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-gray-400 uppercase">Website</p>
                                        <p className="font-medium text-primary hover:underline cursor-pointer truncate max-w-[200px]">{vendor.website || "N/A"}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
                            <h3 className="text-lg font-black uppercase tracking-tight text-warning-black mb-4">Company Details</h3>
                            <div className="space-y-3">
                                <div className="flex justify-between py-2 border-b border-gray-50">
                                    <span className="text-gray-500 text-sm">GST No.</span>
                                    <span className="font-bold text-warning-black">{vendor.gst || "N/A"}</span>
                                </div>
                                <div className="flex justify-between py-2 border-b border-gray-50">
                                    <span className="text-gray-500 text-sm">Contact Person</span>
                                    <span className="font-bold text-warning-black">{vendor.contact_person || "N/A"}</span>
                                </div>
                                <div className="flex justify-between py-2">
                                    <span className="text-gray-500 text-sm">Est. Lead Time</span>
                                    <span className="font-bold text-warning-black">3-5 Days</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Map Column */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden h-full min-h-[400px] flex flex-col">
                            <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                                <h3 className="text-lg font-black uppercase tracking-tight text-warning-black">Location Map</h3>
                                {!hasLocation && <span className="text-xs text-amber-600 font-medium">Exact coordinates not found, showing general area</span>}
                            </div>
                            <div className="flex-1 w-full bg-gray-50 relative z-0">
                                <MapContainer
                                    center={mapCenter}
                                    zoom={hasLocation ? 13 : 5}
                                    style={{ height: '100%', width: '100%', minHeight: '400px' }}
                                    scrollWheelZoom={false}
                                >
                                    <TileLayer
                                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                    />
                                    {hasLocation && (
                                        <Marker position={mapCenter}>
                                            <Popup>
                                                <div className="font-bold">{vendor.name}</div>
                                                <div className="text-xs">{vendor.location}</div>
                                            </Popup>
                                        </Marker>
                                    )}
                                </MapContainer>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default VendorDetails;
