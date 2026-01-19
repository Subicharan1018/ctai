import json
import os
import re
from typing import List, Dict, Any
from datetime import datetime, timedelta
import pandas as pd
from sentence_transformers import SentenceTransformer
import faiss
import numpy as np
import requests
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import time

load_dotenv()

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": ["http://localhost:5173", "http://localhost:3000"]}})

class ConstructionProcurementSystem:
    def __init__(self, json_dir: str = "json"):
        self.json_dir = json_dir
        self.embedding_model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
        self.index = None
        self.documents = []
        self.metadata = []
        self.groq_api_key = os.getenv("GROQ_API_KEY")
        
        # Material estimation factors (per sqft for typical construction in India) - FALLBACK
        self.material_factors = {
            "cement": {"unit": "Bags (50kg)", "per_sqft": 0.45, "unit_cost": 380},  # INR 380/bag
            "steel": {"unit": "Kg", "per_sqft": 4.5, "unit_cost": 65},            # INR 65/kg
            "sand": {"unit": "Cubic Feet", "per_sqft": 1.8, "unit_cost": 55},     # INR 55/cft
            "aggregate": {"unit": "Cubic Feet", "per_sqft": 2.2, "unit_cost": 48}, # INR 48/cft
            "bricks": {"unit": "Pieces", "per_sqft": 12, "unit_cost": 12},        # INR 12/piece
            "tiles": {"unit": "Sqft", "per_sqft": 1.2, "unit_cost": 120},         # INR 120/sqft
            "paint": {"unit": "Liters", "per_sqft": 0.18, "unit_cost": 450},      # INR 450/liter
            "electrical_wire": {"unit": "Meters", "per_sqft": 3.5, "unit_cost": 45}, # INR 45/m
            "plumbing_pipe": {"unit": "Meters", "per_sqft": 1.8, "unit_cost": 180}, # INR 180/m
            "doors": {"unit": "Units", "per_sqft": 0.005, "unit_cost": 15000},    # INR 15k/door
            "windows": {"unit": "Units", "per_sqft": 0.01, "unit_cost": 12000},   # INR 12k/window
        }
        
        # Map JSON files to material categories for RAG
        self.material_categories = {
            "cement": ["cement.json", "cement_links.json"],
            "concrete": ["concrete_links.json"],
            "aggregate": ["aggregate_links.json"],
            "sand": ["sand_links.json"],
            "tiles": ["tiles_links.json"],
            "aac_blocks": ["aac_blocks_links.json"],
            "windows": ["windows_links.json"],
            "doors": ["fire_rated_doors_links.json"],
            "false_ceiling": ["false_ceiling_links.json"],
            "raised_flooring": ["raised_flooring_links.json"],
            "insulation": ["insulation_links.json"],
            "ducting": ["ducting_links.json"],
            "chillers": ["chillers_links.json"],
            "cooling_tower": ["cooling_tower_links.json"],
            "pumps": ["pumps_links.json", "waterpump_links.json", "chilled_waterpump_links.json", "fire_pump_links.json"],
            "cables": ["cable_links.json"],
            "lv_panel": ["LV_panel_links.json"],
            "ht_switchgear": ["ht_switch_gear_links.json"],
            "transformer": ["power_transformer_links.json"],
            "diesel_generator": ["diesel_generator_links.json"],
            "ups_battery": ["ups_batter_links.json"],
            "earthing": ["earthing_links.json"],
            "busduct": ["busduct_cabletrays_links.json"],
            "structured_cabling": ["Structured_Cabling_links.json"],
            "server_racks": ["server_racks_links.json"],
            "cctv": ["cctv_links.json"],
            "fire_detection": ["fire_detection_links.json"],
            "sprinkler": ["sprinkler_links.json"],
            "hydrant": ["hydrant_links.json"],
            "clean_agent": ["clean_agent_links.json"],
            "water_storage": ["water_storage_links.json"],
            "water_supply_piping": ["water_supply_piping_links.json"],
            "drainage_piping": ["drainage_piping_links.json"],
            "sanitary_fixtures": ["sanitary_fixtures_links.json"],
            "valves_fittings": ["valves_fittings_links.json"],
            "grout": ["grout_links.json"],
            "acoustic_partition": ["acoustic_partition_links.json"]
        }

    def load_json_files(self):
        """Load all JSON files from directory"""
        print("Loading JSON files...")
        json_files = [f for f in os.listdir(self.json_dir) if f.endswith('.json')]
        
        for json_file in json_files:
            file_path = os.path.join(self.json_dir, json_file)
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    
                    if isinstance(data, list):
                        for item in data:
                            self._process_item(item, json_file)
                    else:
                        self._process_item(data, json_file)
                        
            except Exception as e:
                print(f"Error loading {json_file}: {str(e)}")
                
        print(f"Loaded {len(self.documents)} products from vendors")
    
    def _process_item(self, item: Dict[str, Any], source_file: str):
        """Process each product item for searchability"""
        text_parts = []
        
        title = item.get('title', '')
        if title:
            text_parts.append(f"Product: {title}")
        
        details = item.get('details', {})
        if details and isinstance(details, dict):
            for key, value in details.items():
                if value:
                    text_parts.append(f"{key}: {value}")
        
        description = item.get('description', '')
        if description:
            text_parts.append(f"Description: {description[:200]}")
        
        seller_info = item.get('seller_info', {})
        company_info = item.get('company_info', {})
        
        # Extract location
        address = seller_info.get('full_address', '')
        if address:
            text_parts.append(f"Location: {address}")
        
        text = " ".join(text_parts)
        
        if text.strip():
            self.documents.append(text)
            self.metadata.append({
                'url': item.get('url', ''),
                'title': title,
                'details': details,
                'seller_info': seller_info,
                'company_info': company_info,
                'reviews': item.get('reviews', []),
                'source_file': source_file,
                'location': address
            })
    
    def build_index(self):
        """Build FAISS index for semantic search"""
        if not self.documents:
            print("No documents to index!")
            return
            
        print("Building search index...")
        embeddings = self.embedding_model.encode(self.documents, show_progress_bar=True)
        dimension = embeddings.shape[1]
        self.index = faiss.IndexFlatL2(dimension)
        self.index.add(np.array(embeddings).astype('float32'))
        print("Index built successfully")
    
    def call_groq_api(self, prompt: str, system_prompt: str = "") -> str:
        """Call Groq API for AI analysis"""
        if not self.groq_api_key:
            return None
            
        try:
            headers = {
                "Authorization": f"Bearer {self.groq_api_key}",
                "Content-Type": "application/json"
            }
            
            messages = []
            if system_prompt:
                messages.append({"role": "system", "content": system_prompt})
            messages.append({"role": "user", "content": prompt})
            
            data = {
                "model": "llama-3.1-8b-instant",
                "messages": messages,
                "temperature": 0.3,
                "max_tokens": 2000
            }
            
            response = requests.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers=headers,
                json=data,
                timeout=30
            )
            
            if response.status_code == 200:
                return response.json()["choices"][0]["message"]["content"]
            else:
                print(f"Groq API error: {response.status_code} - {response.text}")
                return None
                
        except Exception as e:
            print(f"Groq API call failed: {e}")
            return None
    
    def analyze_project_with_ai(self, query: str, project_details: Dict) -> Dict:
        """Use AI to analyze project and determine required materials"""
        
        # Get all available material categories
        available_categories = list(self.material_categories.keys())
        
        system_prompt = """You are an expert construction procurement analyst. 
Analyze the project requirements and return a JSON response with required materials.
Only use materials from the available categories provided.
Be practical and specific based on project type (data center, commercial, industrial, residential)."""

        prompt = f"""Project Query: {query}

Project Details:
- Built Area: {project_details.get('built_area_sqft', 0):,} sqft
- Project Type: {project_details.get('project_type', 'commercial')}
- Power Capacity: {project_details.get('power_capacity_mw', 'N/A')} MW
- Budget: {project_details.get('project_volume_cr', 'N/A')} Crores

Available Material Categories:
{json.dumps(available_categories, indent=2)}

Based on this project (appears to be a data center/power project given the MW specification), 
return a JSON object with the following structure:
{{
    "project_analysis": "Brief analysis of what this project needs",
    "recommended_materials": [
        {{
            "category": "category_name from available list",
            "search_query": "specific search term for finding products",
            "priority": "high/medium/low",
            "reason": "why this material is needed"
        }}
    ]
}}

For a 25MW data center project, focus on:
- Electrical systems (transformers, HT switchgear, cables, UPS, generators)
- Cooling systems (chillers, cooling towers, pumps, ducting)
- Building materials (concrete, raised flooring, false ceiling)
- Fire safety (fire detection, sprinkler, clean agent)
- IT infrastructure (structured cabling, server racks)

Return ONLY the JSON object, no other text."""

        ai_response = self.call_groq_api(prompt, system_prompt)
        
        if ai_response:
            try:
                # Extract JSON from response
                json_match = re.search(r'\{[\s\S]*\}', ai_response)
                if json_match:
                    return json.loads(json_match.group())
            except json.JSONDecodeError:
                print("Failed to parse AI response as JSON")
        
        # Fallback: Return default materials based on project type
        return self._get_fallback_materials(project_details)
    
    def _get_fallback_materials(self, project_details: Dict) -> Dict:
        """Fallback material recommendations when AI is unavailable"""
        power_mw = project_details.get('power_capacity_mw')
        
        # If it's a power/data center project
        if power_mw and power_mw > 0:
            return {
                "project_analysis": "Data center/power infrastructure project requiring electrical and cooling systems",
                "recommended_materials": [
                    {"category": "transformer", "search_query": "power transformer", "priority": "high", "reason": "Power distribution"},
                    {"category": "ht_switchgear", "search_query": "HT switchgear panel", "priority": "high", "reason": "High voltage switching"},
                    {"category": "lv_panel", "search_query": "LV panel board", "priority": "high", "reason": "Low voltage distribution"},
                    {"category": "diesel_generator", "search_query": "diesel generator DG set", "priority": "high", "reason": "Backup power"},
                    {"category": "ups_battery", "search_query": "UPS battery system", "priority": "high", "reason": "Uninterrupted power"},
                    {"category": "cables", "search_query": "power cable armoured", "priority": "high", "reason": "Electrical wiring"},
                    {"category": "chillers", "search_query": "water cooled chiller", "priority": "high", "reason": "Cooling system"},
                    {"category": "cooling_tower", "search_query": "cooling tower FRP", "priority": "high", "reason": "Heat rejection"},
                    {"category": "pumps", "search_query": "chilled water pump", "priority": "medium", "reason": "Water circulation"},
                    {"category": "ducting", "search_query": "HVAC ducting", "priority": "medium", "reason": "Air distribution"},
                    {"category": "raised_flooring", "search_query": "raised access floor", "priority": "medium", "reason": "Cable management"},
                    {"category": "fire_detection", "search_query": "fire alarm system", "priority": "high", "reason": "Fire safety"},
                    {"category": "clean_agent", "search_query": "clean agent fire suppression", "priority": "high", "reason": "Server room protection"},
                    {"category": "structured_cabling", "search_query": "structured cabling cat6", "priority": "medium", "reason": "Network infrastructure"},
                    {"category": "server_racks", "search_query": "server rack cabinet", "priority": "medium", "reason": "Equipment housing"},
                ]
            }
        else:
            # Standard construction project
            return {
                "project_analysis": "Commercial/residential construction project",
                "recommended_materials": [
                    {"category": "cement", "search_query": "OPC cement 53 grade", "priority": "high", "reason": "Structural work"},
                    {"category": "concrete", "search_query": "ready mix concrete", "priority": "high", "reason": "Foundation and structure"},
                    {"category": "aggregate", "search_query": "construction aggregate", "priority": "high", "reason": "Concrete mix"},
                    {"category": "tiles", "search_query": "vitrified floor tiles", "priority": "medium", "reason": "Flooring"},
                    {"category": "windows", "search_query": "aluminium windows", "priority": "medium", "reason": "Facade"},
                    {"category": "false_ceiling", "search_query": "gypsum false ceiling", "priority": "medium", "reason": "Interior finish"},
                    {"category": "cables", "search_query": "electrical wire cable", "priority": "high", "reason": "Electrical wiring"},
                    {"category": "sanitary_fixtures", "search_query": "sanitary fittings", "priority": "medium", "reason": "Plumbing"},
                ]
            }
    
    def search_vendors(self, material_query: str, location: str = "", k: int = 5) -> List[Dict]:
        """Search for vendors based on material and location"""
        if self.index is None:
            return []
        
        # Construct search query - prioritize Indian cities if no location
        if not location:
            location = "Mumbai OR Delhi OR Bangalore OR Chennai OR Hyderabad"
        
        search_query = f"{material_query} {location}"
        
        k = min(k, len(self.documents))
        query_embedding = self.embedding_model.encode([search_query])
        distances, indices = self.index.search(np.array(query_embedding).astype('float32'), k * 3)
        
        results = []
        seen_companies = set()
        
        for i, idx in enumerate(indices[0]):
            if len(results) >= k:
                break
                
            if idx < len(self.metadata):
                meta = self.metadata[idx]
                
                # Get company name to avoid duplicates
                company = meta.get('seller_info', {}).get('contact_person', '') or meta.get('seller_info', {}).get('seller_name', '')
                if company in seen_companies:
                    continue
                seen_companies.add(company)
                
                # Extract rating
                rating = "N/A"
                reviews = meta.get('reviews', [])
                for review in reviews:
                    if review.get('type') == 'overall_rating':
                        rating = review.get('value', 'N/A')
                        break
                
                results.append({
                    'product': meta.get('title', 'N/A'),
                    'vendor': company or meta.get('seller_info', {}).get('seller_name', 'N/A'),
                    'location': meta.get('location', 'N/A') or meta.get('seller_info', {}).get('location', 'N/A'),
                    'gst': meta.get('company_info', {}).get('gst', 'N/A'),
                    'rating': rating,
                    'url': meta.get('url', ''),
                    'availability': meta.get('details', {}).get('availability', 'N/A'),
                    'relevance_score': round(float(distances[0][i]), 2)
                })
        
        return results
    
    def estimate_materials_fallback(self, built_area_sqft: float, project_type: str = "residential") -> List[Dict]:
        """Fallback: Estimate material requirements based on built area using hardcoded formulas"""
        materials = []
        
        # Adjust factors based on project type
        type_multiplier = {
            "residential": 1.0,
            "commercial": 1.3,
            "industrial": 1.5,
            "data_center": 1.8
        }.get(project_type.lower(), 1.0)
        
        for material, factors in self.material_factors.items():
            quantity = built_area_sqft * factors["per_sqft"] * type_multiplier
            total_cost = quantity * factors["unit_cost"]
            
            materials.append({
                "material": material.title(),
                "quantity": round(quantity, 2),
                "unit": factors["unit"],
                "unit_cost": factors["unit_cost"],
                "total_cost": round(total_cost, 2),
                "cost_in_lakhs": round(total_cost / 100000, 2)
            })
        
        return materials
    
    def calculate_budget_breakdown(self, materials: List[Dict], built_area_sqft: float, project_volume_cr: float = None) -> Dict:
        """Calculate detailed budget breakdown with Indian context (GST)"""
        material_cost = sum(m['total_cost'] for m in materials)
        
        # Standard construction cost components (as % of material cost) for Indian market
        labor_cost = material_cost * 0.35  # Labor is relatively cheaper
        equipment_cost = material_cost * 0.10
        overhead = material_cost * 0.12
        contractor_profit = material_cost * 0.10
        
        subtotal = material_cost + labor_cost + equipment_cost + overhead + contractor_profit
        gst_cost = subtotal * 0.18  # 18% GST standard
        
        total_cost = subtotal + gst_cost
        
        # If project volume is specified, scale the budget to match
        if project_volume_cr:
            target_total = project_volume_cr * 10000000  # Convert Cr to Rupees
            if total_cost > 0:
                scale_factor = target_total / total_cost
                material_cost *= scale_factor
                labor_cost *= scale_factor
                equipment_cost *= scale_factor
                overhead *= scale_factor
                contractor_profit *= scale_factor
                gst_cost *= scale_factor
                total_cost = target_total
        
        return {
            "material_cost": round(material_cost, 2),
            "labor_cost": round(labor_cost, 2),
            "equipment_cost": round(equipment_cost, 2),
            "overhead": round(overhead, 2),
            "contractor_profit": round(contractor_profit, 2),
            "gst_cost": round(gst_cost, 2),  # New field
            "total_cost": round(total_cost, 2),
            "cost_per_sqft": round(total_cost / built_area_sqft, 2) if built_area_sqft > 0 else 0,
            "total_cost_in_crores": round(total_cost / 10000000, 2),
            "breakdown_percentage": {
                "materials": round((material_cost / total_cost) * 100, 1) if total_cost > 0 else 0,
                "labor": round((labor_cost / total_cost) * 100, 1) if total_cost > 0 else 0,
                "equipment": round((equipment_cost / total_cost) * 100, 1) if total_cost > 0 else 0,
                "gst": round((gst_cost / total_cost) * 100, 1) if total_cost > 0 else 0, # New field
                "overhead_profit": round(((overhead + contractor_profit) / total_cost) * 100, 1) if total_cost > 0 else 0
            }
        }
    
    def generate_schedule(self, built_area_sqft: float, project_type: str = "commercial", power_mw: float = None) -> Dict:
        """Generate project schedule for Gantt chart with frontend-compatible fields"""
        
        # Base duration in months
        if built_area_sqft <= 50000:
            base_months = 12
        elif built_area_sqft <= 200000:
            base_months = 18
        else:
            base_months = 24
        
        if power_mw and power_mw > 10:
            base_months = int(base_months * 1.3)
        
        start_date = datetime.now()
        
        # Enhanced phases config with 'owner' and 'status' simulation
        phases_config = [
            {"name": "Site Preparation", "percent": 0.08, "owner": "Civil Team", "color": "#3B82F6"},
            {"name": "Foundation Work", "percent": 0.12, "owner": "Structural Eng", "color": "#6366F1"},
            {"name": "Structural Framework", "percent": 0.20, "owner": "Project Mgr", "color": "#8B5CF6"},
            {"name": "MEP & Services", "percent": 0.15, "owner": "MEP Lead", "color": "#EC4899"},
            {"name": "Building Envelope", "percent": 0.12, "owner": "Architect", "color": "#F59E0B"},
            {"name": "Interior Finishing", "percent": 0.18, "owner": "Interior Des", "color": "#10B981"},
            {"name": "Testing & Comm.", "percent": 0.10, "owner": "QA Team", "color": "#06B6D4"},
            {"name": "Handover", "percent": 0.05, "owner": "Client Rel", "color": "#EF4444"},
        ]
        
        total_days = base_months * 30
        phases = []
        current_date = start_date
        
        # For visualization scale (approx 1000px width for total duration)
        pixels_per_day = 1000 / total_days
        
        for i, config in enumerate(phases_config):
            duration = int(total_days * config["percent"])
            end_date = current_date + timedelta(days=duration)
            
            # Simulate status based on phase index
            if i == 0:
                status = "complete"
                progress = 100
            elif i == 1:
                status = "active"
                progress = 45
            elif i == 2:
                status = "critical" # Simulate a delay/critical path
                progress = 10
            else:
                status = "future"
                progress = 0
                
            # Calculate visual bars
            days_from_start = (current_date - start_date).days
            bar_start = f"{int(days_from_start * pixels_per_day)}px"
            bar_width = f"{int(duration * pixels_per_day)}px"
            
            phases.append({
                "id": f"phase_{i+1}",
                "name": config["name"],
                "owner": config["owner"],
                "startDate": current_date.strftime("%Y-%m-%d"),
                "endDate": end_date.strftime("%Y-%m-%d"),
                "duration": duration,
                "progress": progress,
                "status": status,
                "color": config["color"],
                "barStart": bar_start,
                "barWidth": bar_width,
                "barLabel": f"{config['name']} ({duration}d)"
            })
            
            current_date = end_date
        
        return {
            "phases": phases,
            "total_duration": total_days,
            "total_months": base_months,
            "start_date": start_date.strftime("%Y-%m-%d"),
            "end_date": current_date.strftime("%Y-%m-%d")
        }
    
    def generate_procurement_report(self, query: str) -> Dict:
        """Generate comprehensive procurement report using AI + RAG"""
        
        # Extract project details from query using regex
        area_match = re.search(
            r'(\d+(?:\.\d+)?)\s*(lacs?|lakhs?|lac)?\s*(sqft|squarefoot|square\s*foot|square\s*feet|sq\.?\s*ft)',
            query, re.IGNORECASE
        )
        
        volume_match = re.search(
            r'(?:project\s*volume\s*(?:of\s*)?)?(\d+(?:\.\d+)?)\s*(cr|crore|crores?)(?:\s*(?:in\s*)?rupees?)?',
            query, re.IGNORECASE
        )
        
        location_match = re.search(
            r'(?:build\s*)?in\s+([a-zA-Z][a-zA-Z\s]+?)(?:\s+area|\s*$|,)',
            query, re.IGNORECASE
        )
        
        type_match = re.search(r'(residential|commercial|industrial|data\s*center)', query, re.IGNORECASE)
        power_match = re.search(r'(\d+(?:\.\d+)?)\s*(megawatt|mw|mega\s*watt)', query, re.IGNORECASE)
        
        # Parse built area
        built_area = 50000  # Default
        if area_match:
            built_area = float(area_match.group(1))
            if area_match.group(2) and any(x in area_match.group(2).lower() for x in ['lac', 'lakh']):
                built_area *= 100000
        
        # Parse project volume (in Crores)
        project_volume_cr = None
        if volume_match:
            project_volume_cr = float(volume_match.group(1))
        
        # Parse power capacity
        power_mw = None
        if power_match:
            power_mw = float(power_match.group(1))
        
        location = location_match.group(1).strip() if location_match else "Navi Mumbai"
        project_type = type_match.group(1) if type_match else ("data_center" if power_mw else "commercial")
        
        project_details = {
            "built_area_sqft": built_area,
            "location": location,
            "project_type": project_type,
            "power_capacity_mw": power_mw,
            "project_volume_cr": project_volume_cr
        }
        
        # Use AI to analyze and determine required materials
        ai_analysis = self.analyze_project_with_ai(query, project_details)
        
        # Fetch materials using RAG based on AI recommendations
        materials = []
        vendor_mapping = {}
        
        recommended_materials = ai_analysis.get("recommended_materials", [])
        
        # Helper to generate mock inventory data
        import random
        def get_inventory_status():
            status = random.choice(['In Stock', 'Low Stock', 'On Order'])
            stock = f"{random.randint(50, 5000)}"
            lead = f"{random.randint(2, 14)} Days"
            sku = f"SKU-{random.choice(['IND', 'BOM', 'DEL'])}-{random.randint(100, 999)}"
            return status, stock, lead, sku

        for material_info in recommended_materials:
            category = material_info.get("category", "")
            search_query = material_info.get("search_query", category)
            priority = material_info.get("priority", "medium")
            
            # Search for vendors using RAG
            vendors = self.search_vendors(search_query, location, k=3)
            
            status, stock, lead, sku = get_inventory_status()
            
            if vendors:
                vendor_mapping[category.replace("_", " ").title()] = vendors
                
                # Create material entry
                materials.append({
                    "material": category.replace("_", " ").title(),
                    "quantity": "As per specification",
                    "unit": "Units",
                    "unit_cost": f"₹ {random.randint(100, 5000)}", # Mock unit cost
                    "total_cost": 0,
                    "cost_in_lakhs": 0,
                    "priority": priority,
                    "reason": material_info.get("reason", ""),
                    "vendor_count": len(vendors),
                    # Inventory fields for frontend
                    "stock_level": f"{stock} Units",
                    "stock_status": status,
                    "estimated_lead_time": lead,
                    "sku_id": sku,
                    "category_tag": "Construction" 
                })
        
        # If no AI recommendations or vendors found, use fallback
        if not materials:
            materials_fallback = self.estimate_materials_fallback(built_area, project_type)
            for material in materials_fallback:
                # Add inventory fields to fallback data
                status, stock, lead, sku = get_inventory_status()
                material.update({
                    "stock_level": f"{stock}",
                    "stock_status": status,
                    "estimated_lead_time": lead,
                    "sku_id": sku,
                    "category_tag": "Material"
                })
                materials.append(material)
                
                # Search vendors for fallback
                vendors = self.search_vendors(material['material'], location, k=3)
                vendor_mapping[material['material']] = vendors
        
        # Calculate budget using fallback formulas (scaled to project volume if specified)
        fallback_materials = self.estimate_materials_fallback(built_area, project_type)
        budget = self.calculate_budget_breakdown(fallback_materials, built_area, project_volume_cr)
        
        # Generate project schedule
        schedule = self.generate_schedule(built_area, project_type, power_mw)
        
        return {
            "project_details": project_details,
            "ai_analysis": ai_analysis.get("project_analysis", ""),
            "material_requirements": materials,
            "budget_breakdown": budget,
            "vendor_recommendations": vendor_mapping,
            "schedule": schedule
        }

# Global instance
system = None

def init_system():
    global system
    if system is None:
        try:
            system = ConstructionProcurementSystem(json_dir="json")
            system.load_json_files()
            system.build_index()
            print("Procurement System Initialized")
        except Exception as e:
            print(f"System init error: {e}")

@app.route('/procurement', methods=['POST'])
def procurement():
    """Main endpoint for procurement analysis"""
    if not system:
        init_system()
    
    data = request.json
    query = data.get('query', '')
    
    if not query:
        return jsonify({"error": "No query provided"}), 400
    
    try:
        report = system.generate_procurement_report(query)
        return jsonify(report)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/search_vendors', methods=['POST'])
def search_vendors():
    """Search vendors for specific material"""
    if not system:
        init_system()
    
    data = request.json
    material = data.get('material', '')
    location = data.get('location', '')
    
    if not material:
        return jsonify({"error": "Material not specified"}), 400
    
    try:
        vendors = system.search_vendors(material, location, k=10)
        return jsonify({"vendors": vendors})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "healthy", "documents_loaded": len(system.documents) if system else 0})

if __name__ == '__main__':
    init_system()
    app.run(host='0.0.0.0', port=5001, debug=True)