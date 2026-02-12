"""
N8N Webhook Vendor Service
Fetches vendor and material data from the n8n webhook API.
Database (ctai.db) is kept as fallback but disabled for testing.
"""

import json
import requests
import sqlite3
import os
from typing import List, Dict, Any

# N8N Webhook URL
N8N_WEBHOOK_URL = "https://confidently-esterifiable-mira.ngrok-free.dev/webhook/0fbf86c9-bdd9-4b20-8414-14e63ae14b8c"

# Set to True to enable DB fallback when n8n is unavailable
USE_DB_FALLBACK = False

# Path to the database
DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "ctai.db")


def fetch_vendors_from_n8n(query: str, location: str = "", timeout: int = 30) -> List[Dict]:
    """
    Call the n8n webhook with a material/product query and return raw response.
    
    Args:
        query: The material or product search term (e.g., "cement", "concrete")
        location: Optional location to include in the search (e.g., "Navi Mumbai")
        timeout: Request timeout in seconds
        
    Returns:
        List of raw vendor/product dicts from n8n
    """
    # Send product_name and location as separate params (n8n webhook expects this)
    params = {"product_name": query}
    if location:
        params["location"] = location
    print(f"[n8n] Sending to webhook: product_name='{query}', location='{location}'")
    
    try:
        response = requests.get(
            N8N_WEBHOOK_URL,
            params=params,
            timeout=timeout
        )
        
        if response.status_code == 200:
            data = response.json()
            print(f"[n8n] Raw response for '{query}': {json.dumps(data, indent=2, default=str)[:2000]}")
            # n8n may return a list directly or wrap in an object
            if isinstance(data, list):
                print(f"[n8n] Got {len(data)} items (list)")
                return data
            elif isinstance(data, dict):
                # Handle wrapped responses
                result = data.get("output", [data])
                print(f"[n8n] Got {len(result) if isinstance(result, list) else 1} items (dict)")
                return result
            return []
        else:
            print(f"[n8n] API error: {response.status_code} - {response.text[:200]}")
            return []
            
    except requests.exceptions.Timeout:
        print(f"[n8n] Request timed out for query: {query}")
        return []
    except requests.exceptions.ConnectionError:
        print(f"[n8n] Connection error - webhook may be down")
        return []
    except Exception as e:
        print(f"[n8n] Unexpected error: {e}")
        return []


def parse_n8n_vendor_response(raw_data: List[Dict]) -> List[Dict]:
    """
    Transform n8n webhook response into the app's standard vendor format.
    
    Input format (from n8n):
    {
        "output": {
            "product_details": {
                "material_category": "Concrete",
                "product_type": "General",
                ...
            },
            "seller_details": {
                "company_name": "...",
                "contact_person": "...",
                "address": { "city": "...", "state": "...", "pincode": "...", ... },
                "links": { "google_maps": "...", "profile_url": "..." }
            }
        }
    }
    
    Output format (app standard):
    {
        "vendor": "Company Name",
        "product": "Product Type",
        "category": "Material Category",
        "location": "City, State",
        "contact_person": "...",
        "pincode": "...",
        "google_maps_url": "...",
        "profile_url": "...",
        ...
    }
    """
    vendors = []
    
    for item in raw_data:
        try:
            # Handle both wrapped {"output": {...}} and direct format
            output = item.get("output", item)
            
            product_details = output.get("product_details", {})
            seller_details = output.get("seller_details", {})
            address = seller_details.get("address", {})
            links = seller_details.get("links", {})
            
            company_name = seller_details.get("company_name", "N/A")
            # Clean up company name - remove "SELLER CONTACT DETAILS" prefix
            if company_name and company_name.startswith("SELLER CONTACT DETAILS"):
                company_name = company_name.replace("SELLER CONTACT DETAILS", "").strip()
            
            city = address.get("city", "")
            state = address.get("state", "")
            location = f"{city}, {state}" if city and state else city or state or "N/A"
            
            vendor_entry = {
                "vendor": company_name,
                "product": product_details.get("product_type", "General"),
                "category": product_details.get("material_category", "N/A"),
                "location": location,
                "contact_person": seller_details.get("contact_person", "N/A"),
                "pincode": address.get("pincode", "N/A"),
                "full_address": address.get("full_text", "N/A"),
                "google_maps_url": links.get("google_maps", ""),
                "profile_url": links.get("profile_url", ""),
                "availability": product_details.get("availability", "N/A"),
                "packaging_type": product_details.get("packaging_type", "N/A"),
                "grade": product_details.get("grade", "N/A"),
                "material": product_details.get("material", "N/A"),
                "rating": "N/A",
                "gst": "N/A",
                "relevance_score": 0.0,
                "url": links.get("profile_url", ""),
            }
            
            vendors.append(vendor_entry)
            
        except Exception as e:
            print(f"[n8n] Error parsing vendor entry: {e}")
            continue
    
    return vendors


def search_vendors_n8n(material_query: str, location: str = "", k: int = 5) -> List[Dict]:
    """
    Search for vendors via n8n webhook, optionally filtering by location.
    
    Args:
        material_query: Material/product to search for (e.g., "concrete", "cement")
        location: Optional location filter (e.g., "Chennai")
        k: Max number of results to return
        
    Returns:
        List of vendor dicts in app standard format
    """
    # Fetch from n8n — include location in the query
    print(f"[n8n] search_vendors_n8n called: material='{material_query}', location='{location}'")
    raw_data = fetch_vendors_from_n8n(material_query, location)
    
    if not raw_data:
        print(f"[n8n] No data returned for query: {material_query}")
        return []
    
    # Parse into standard format
    vendors = parse_n8n_vendor_response(raw_data)
    print(f"[n8n] Parsed {len(vendors)} vendors for '{material_query}':")
    for v in vendors:
        print(f"  - {v['vendor']} | {v['category']} | {v['location']}")
    
    # Location filtering is handled by n8n via the location param — no post-filter needed
    
    # Limit results
    return vendors[:k]


def get_all_vendors_n8n(query: str = "construction materials") -> List[Dict]:
    """
    Fetch all vendors from n8n for the /vendors endpoint.
    
    Args:
        query: General query to fetch vendors
        
    Returns:
        List of vendor dicts with id field added for API compatibility
    """
    raw_data = fetch_vendors_from_n8n(query)
    vendors = parse_n8n_vendor_response(raw_data)
    
    # Add sequential IDs for API compatibility
    for i, vendor in enumerate(vendors, start=1):
        vendor["id"] = i
        vendor["name"] = vendor["vendor"]
        vendor["verified"] = True
        vendor["email"] = ""
        vendor["phone"] = ""
        vendor["website"] = vendor.get("profile_url", "")
    
    return vendors


def search_vendors_db(material_query: str, location: str = "", k: int = 5) -> List[Dict]:
    """
    Fallback: Search vendors from the local ctai.db vendors table.
    Uses LIKE matching on category and name columns.
    
    Args:
        material_query: Material/product to search for
        location: Optional location filter
        k: Max number of results
        
    Returns:
        List of vendor dicts in app standard format
    """
    try:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        
        pattern = f"%{material_query}%"
        
        if location:
            loc_pattern = f"%{location}%"
            rows = conn.execute(
                "SELECT * FROM vendors WHERE (category LIKE ? OR name LIKE ?) AND location LIKE ? LIMIT ?",
                (pattern, pattern, loc_pattern, k)
            ).fetchall()
        else:
            rows = conn.execute(
                "SELECT * FROM vendors WHERE category LIKE ? OR name LIKE ? LIMIT ?",
                (pattern, pattern, k)
            ).fetchall()
        
        conn.close()
        
        vendors = []
        for row in rows:
            vendors.append({
                "vendor": row["name"],
                "product": row["category"] or "General",
                "category": row["category"] or "N/A",
                "location": row["location"] or "N/A",
                "contact_person": row["contact_person"] or "N/A",
                "rating": row["rating"] or "N/A",
                "gst": row["gst"] or "N/A",
                "url": row["website"] or "",
                "google_maps_url": "",
                "profile_url": row["website"] or "",
                "relevance_score": 0.0,
            })
        
        return vendors
        
    except Exception as e:
        print(f"[DB] Error searching vendors: {e}")
        return []
