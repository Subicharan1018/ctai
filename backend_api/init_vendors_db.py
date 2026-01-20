import sqlite3
import json
import os
from typing import Dict, Any

DB_NAME = "ctai.db"
JSON_DIR = "json"

def get_db_connection():
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    return conn

def init_vendors_table():
    conn = get_db_connection()
    c = conn.cursor()
    
    # Create vendors table
    c.execute('''
        CREATE TABLE IF NOT EXISTS vendors (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            category TEXT,
            location TEXT,
            rating TEXT,
            gst TEXT,
            verified BOOLEAN DEFAULT 1,
            contact_person TEXT,
            email TEXT,
            phone TEXT,
            website TEXT,
            UNIQUE(name, location)
        )
    ''')
    
    conn.commit()
    conn.close()
    print("Vendors table initialized.")

def populate_vendors():
    conn = get_db_connection()
    c = conn.cursor()
    
    json_files = [f for f in os.listdir(JSON_DIR) if f.endswith('.json')]
    print(f"Found {len(json_files)} JSON files to process.")
    
    unique_vendors = {} # Key: (name, location) -> vendor_data

    for json_file in json_files:
        category = json_file.replace('_links.json', '').replace('.json', '').replace('_', ' ').title()
        file_path = os.path.join(JSON_DIR, json_file)
        
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                
                items = data if isinstance(data, list) else [data]
                
                for item in items:
                    seller_info = item.get('seller_info', {})
                    company_info = item.get('company_info', {})
                    
                    name = seller_info.get('seller_name') or seller_info.get('contact_person')
                    if not name:
                        continue
                        
                    location = seller_info.get('location') or seller_info.get('full_address', '')
                    # Simple cleanup for location (take city/state if possible, or just first part)
                    if location and ',' in location:
                         location = location.split(',')[-1].strip() # approximate city/state
                    
                    if not location:
                        location = "Unknown"

                    key = (name, location)
                    
                    if key not in unique_vendors:
                        # Extract rating
                        rating = "4.5" # Default
                        reviews = item.get('reviews', [])
                        for review in reviews:
                            if review.get('type') == 'overall_rating':
                                rating = review.get('value', '4.5')
                                break
                        
                        unique_vendors[key] = {
                            "name": name,
                            "category": category, # Initial category, might be overwritten if multi-category vendor
                            "location": location,
                            "rating": rating,
                            "gst": company_info.get('gst', 'N/A'),
                            "contact_person": seller_info.get('contact_person', ''),
                            "email": seller_info.get('email', ''),
                            "phone": seller_info.get('phone', ''),
                            "website": item.get('url', '')
                        }
                    else:
                        # If vendor already exists, maybe update category to show they sell multiple things? 
                        # For now, just keep first found category or append
                        current_cat = unique_vendors[key]["category"]
                        if category not in current_cat:
                             unique_vendors[key]["category"] = f"{current_cat}, {category}"

        except Exception as e:
            print(f"Error processing {json_file}: {str(e)}")
            
    # Insert into DB
    count = 0
    for vendor in unique_vendors.values():
        try:
            c.execute('''
                INSERT OR IGNORE INTO vendors 
                (name, category, location, rating, gst, contact_person, email, phone, website)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                vendor['name'], 
                vendor['category'], 
                vendor['location'], 
                vendor['rating'], 
                vendor['gst'],
                vendor['contact_person'],
                vendor['email'],
                vendor['phone'],
                vendor['website']
            ))
            if c.rowcount > 0:
                count += 1
        except Exception as e:
            print(f"Error inserting {vendor['name']}: {e}")
            
    conn.commit()
    conn.close()
    print(f"Successfully inserted {count} unique vendors.")

if __name__ == "__main__":
    init_vendors_table()
    populate_vendors()
