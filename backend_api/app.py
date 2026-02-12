import json
import os
import re
from typing import List, Dict, Any
from datetime import datetime, timedelta
import pandas as pd
import requests
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import sqlite3
from werkzeug.security import generate_password_hash, check_password_hash
import time
from n8n_vendor_service import search_vendors_n8n, get_all_vendors_n8n, search_vendors_db, USE_DB_FALLBACK

load_dotenv()

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": ["http://localhost:5173", "http://localhost:3000"]}})

DB_NAME = "ctai.db"

def get_db_connection():
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    c = conn.cursor()
    
    # Users table
    c.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            company TEXT,
            project_type TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Conversations table
    c.execute('''
        CREATE TABLE IF NOT EXISTS conversations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            title TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')
    
    # Messages table
    c.execute('''
        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            conversation_id INTEGER NOT NULL,
            sender TEXT NOT NULL,
            text TEXT NOT NULL,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (conversation_id) REFERENCES conversations (id)
        )
    ''')
    
    conn.commit()
    conn.close()
    print("Database initialized.")

class ConstructionProcurementSystem:
    def __init__(self):
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
        
        # Available material categories for AI analysis
        self.material_categories = {
            "cement": [],
            "concrete": [],
            "aggregate": [],
            "sand": [],
            "tiles": [],
            "aac_blocks": [],
            "windows": [],
            "doors": [],
            "false_ceiling": [],
            "raised_flooring": [],
            "insulation": [],
            "ducting": [],
            "chillers": [],
            "cooling_tower": [],
            "pumps": [],
            "cables": [],
            "lv_panel": [],
            "ht_switchgear": [],
            "transformer": [],
            "diesel_generator": [],
            "ups_battery": [],
            "earthing": [],
            "busduct": [],
            "structured_cabling": [],
            "server_racks": [],
            "cctv": [],
            "fire_detection": [],
            "sprinkler": [],
            "hydrant": [],
            "clean_agent": [],
            "water_storage": [],
            "water_supply_piping": [],
            "drainage_piping": [],
            "sanitary_fixtures": [],
            "valves_fittings": [],
            "grout": [],
            "acoustic_partition": []
        }
    
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
            r'(?:build\s*)?in\s+([a-zA-Z][a-zA-Z\s]+?)(?:\s+area|\s+for\s|\s*$|,)',
            query, re.IGNORECASE
        )
        
        type_match = re.search(r'(residential|commercial|industrial|data\s*center)', query, re.IGNORECASE)
        power_match = re.search(r'(\d+(?:\.\d+)?)\s*(megawatt|mw|mega\s*watt)', query, re.IGNORECASE)
        
        print(f"[DEBUG] Query parsing: '{query}'")
        print(f"[DEBUG]   Location: '{location_match.group(1).strip() if location_match else 'NOT FOUND'}'")
        print(f"[DEBUG]   Power: {power_match.group(1) if power_match else 'N/A'} MW")
        print(f"[DEBUG]   Type: {type_match.group(1) if type_match else 'auto-detect'}")
        
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
            
            # Search for vendors using n8n webhook API
            vendors = search_vendors_n8n(search_query, location, k=3)
            if not vendors:
                # Fallback to DB if n8n returns nothing
                vendors = search_vendors_db(search_query, location, k=3)
            
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
                vendors = search_vendors_n8n(material['material'], location, k=3)
                if not vendors:
                    vendors = search_vendors_db(material['material'], location, k=3)
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
            system = ConstructionProcurementSystem()
            print("Procurement System Initialized (n8n + DB vendors)")
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
    """Search vendors for specific material via n8n webhook API"""
    data = request.json
    material = data.get('material', '')
    location = data.get('location', '')
    
    if not material:
        return jsonify({"error": "Material not specified"}), 400
    
    try:
        # Primary: use n8n webhook API
        vendors = search_vendors_n8n(material, location, k=10)
        
        # Fallback to DB if n8n returns nothing and fallback is enabled
        if not vendors and USE_DB_FALLBACK:
            vendors = search_vendors_db(material, location, k=10)
        
        return jsonify({"vendors": vendors})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/vendors', methods=['GET'])
def get_vendors():
    """Get all vendors from n8n webhook API"""
    query = request.args.get('query', 'construction materials')
    try:
        # Primary: fetch vendors from n8n
        vendors_list = get_all_vendors_n8n(query)
        
        # Fallback to DB if n8n returns nothing and fallback is enabled
        if not vendors_list and USE_DB_FALLBACK:
            conn = get_db_connection()
            try:
                vendors = conn.execute('SELECT * FROM vendors').fetchall()
                vendors_list = [dict(v) for v in vendors]
            finally:
                conn.close()
        
        return jsonify({"vendors": vendors_list})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/vendors/<int:vendor_id>', methods=['GET'])
def get_vendor_details(vendor_id):
    """Get details for a specific vendor"""
    # Fetch all vendors from n8n and find by id
    try:
        vendors = get_all_vendors_n8n()
        vendor = next((v for v in vendors if v.get('id') == vendor_id), None)
        
        if vendor:
            return jsonify(vendor)
        
        # Fallback to DB if not found in n8n and fallback is enabled
        if USE_DB_FALLBACK:
            conn = get_db_connection()
            try:
                vendor = conn.execute('SELECT * FROM vendors WHERE id = ?', (vendor_id,)).fetchone()
                if vendor:
                    return jsonify(dict(vendor))
            finally:
                conn.close()
        
        return jsonify({"error": "Vendor not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "healthy", "mode": "n8n + DB fallback"})

# Authentication Endpoints
@app.route('/register', methods=['POST'])
def register():
    data = request.json
    name = data.get('name')
    email = data.get('email')
    password = data.get('password')
    company = data.get('company')
    project_type = data.get('project_type')
    
    if not email or not password or not name:
        return jsonify({"error": "Missing required fields"}), 400
        
    conn = get_db_connection()
    c = conn.cursor()
    
    try:
        password_hash = generate_password_hash(password)
        c.execute('INSERT INTO users (name, email, password_hash, company, project_type) VALUES (?, ?, ?, ?, ?)',
                  (name, email, password_hash, company, project_type))
        conn.commit()
        user_id = c.lastrowid
        return jsonify({"message": "User registered successfully", "user_id": user_id}), 201
    except sqlite3.IntegrityError:
        return jsonify({"error": "Email already exists"}), 409
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

@app.route('/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('email')
    password = data.get('password')
    
    conn = get_db_connection()
    user = conn.execute('SELECT * FROM users WHERE email = ?', (email,)).fetchone()
    conn.close()
    
    if user and check_password_hash(user['password_hash'], password):
        return jsonify({
            "message": "Login successful",
            "user": {
                "id": user['id'],
                "name": user['name'],
                "email": user['email'],
                "company": user['company']
            }
        }), 200
    else:
        return jsonify({"error": "Invalid email or password"}), 401

# Chat History Endpoints
@app.route('/conversations', methods=['GET', 'POST'])
def handle_conversations():
    conn = get_db_connection()
    
    if request.method == 'GET':
        user_id = request.args.get('user_id')
        if not user_id:
            return jsonify({"error": "User ID required"}), 400
            
        conversations = conn.execute('SELECT * FROM conversations WHERE user_id = ? ORDER BY created_at DESC', (user_id,)).fetchall()
        conn.close()
        return jsonify([dict(c) for c in conversations])
        
    elif request.method == 'POST':
        data = request.json
        user_id = data.get('user_id')
        title = data.get('title', 'New Conversation')
        
        c = conn.cursor()
        c.execute('INSERT INTO conversations (user_id, title) VALUES (?, ?)', (user_id, title))
        conn.commit()
        conv_id = c.lastrowid
        conn.close()
        return jsonify({"id": conv_id, "title": title}), 201

@app.route('/conversations/<int:conversation_id>/messages', methods=['GET', 'POST'])
def handle_messages(conversation_id):
    conn = get_db_connection()
    
    if request.method == 'GET':
        messages = conn.execute('SELECT * FROM messages WHERE conversation_id = ? ORDER BY timestamp ASC', (conversation_id,)).fetchall()
        conn.close()
        return jsonify([dict(m) for m in messages])
        
    elif request.method == 'POST':
        data = request.json
        sender = data.get('sender')
        text = data.get('text')
        
        c = conn.cursor()
        c.execute('INSERT INTO messages (conversation_id, sender, text) VALUES (?, ?, ?)', (conversation_id, sender, text))
        conn.commit()
        msg_id = c.lastrowid
        conn.close()
        return jsonify({"id": msg_id, "status": "saved"}), 201

if __name__ == '__main__':
    init_db()
    init_system()
    app.run(host='0.0.0.0', port=5001, debug=True)