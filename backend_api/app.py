
import json
import os
import re
from typing import List, Dict, Any
import pandas as pd
from sentence_transformers import SentenceTransformer
import faiss
import numpy as np
import requests
from datetime import datetime
import joblib
import warnings
import traceback
from scipy import sparse
from dotenv import load_dotenv
import time
import matplotlib.pyplot as plt
from dateutil.relativedelta import relativedelta
from flask import Flask, request, jsonify
from flask_cors import CORS

warnings.filterwarnings('ignore')

# Load environment variables
load_dotenv()

app = Flask(__name__)
# Allow specific origin with all methods and headers
CORS(app, resources={r"/*": {"origins": ["http://localhost:5173", "http://localhost:3000"]}}, supports_credentials=True)

@app.before_request
def handle_preflight():
    if request.method == "OPTIONS":
        response = app.make_default_options_response()
        response.headers.add("Access-Control-Allow-Headers", "Content-Type,Authorization")
        response.headers.add("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS")
        return response

class IndiaMART_RAG:
    def __init__(self, json_dir: str = "json", embedding_model: str = "sentence-transformers/all-MiniLM-L6-v2"):
        self.json_dir = json_dir
        self.embedding_model_name = embedding_model
        # Lazy load model to avoid heavy startup if possible, or keep it if speed is needed
        self.embedding_model = SentenceTransformer(embedding_model)
        self.index = None
        self.documents = []
        self.metadata = []
        self.groq_api_key = os.getenv("GROQ_API_KEY")
        if not self.groq_api_key:
            print("Groq API key missing. Set GROQ_API_KEY in .env file.")

    def _call_groq_api(self, prompt: str, max_tokens: int = 1024) -> str:
        """Helper to call Groq API with optimized token handling and rate limit delay"""
        time.sleep(2)
        if len(prompt) > 3000:
            prompt = prompt[:3000] + "\n... (truncated to fit token limit)"
            print(f"Prompt truncated to ~750 tokens to avoid context length issues.")

        try:
            headers = {
                "Authorization": f"Bearer {self.groq_api_key}",
                "Content-Type": "application/json"
            }
            payload = {
                "model": "llama-3.1-8b-instant",
                "messages": [{"role": "user", "content": prompt}],
                "max_tokens": max_tokens,
                "temperature": 0.7
            }
            response = requests.post("https://api.groq.com/openai/v1/chat/completions", headers=headers, json=payload)
            response.raise_for_status()
            data = response.json()
            if 'choices' in data and len(data['choices']) > 0:
                return data['choices'][0]['message']['content']
            else:
                print("Invalid API response format.")
                return "Error: Invalid API response."
        except requests.exceptions.HTTPError as e:
            error_msg = f"API HTTP Error: {str(e)} - {e.response.text}"
            if e.response.status_code == 400:
                error_msg += f" - Possible context length issue. Prompt length: {len(prompt)} chars."
            elif e.response.status_code == 401:
                error_msg += " - Invalid API key."
            elif e.response.status_code == 429:
                error_msg += " - Rate limit exceeded. Retrying after delay..."
                time.sleep(10)
                return self._call_groq_api(prompt, max_tokens)
            print(error_msg)
            return f"Error: {error_msg}"
        except Exception as e:
            print(f"General Error: {str(e)}")
            return f"Error: {str(e)}"

    def generate_response(self, query: str, context: List[Dict[str, Any]], requirements: Dict[str, Any] = None, material_estimates: List[Dict[str, Any]] = None) -> str:
        context_text = ""
        for i, result in enumerate(context[:1]):
            doc_str = f"Title: {result['metadata']['title']}\nURL: {result['metadata']['url']}\nDetails: {json.dumps(result['metadata']['details'], separators=(',', ':'))[:200]}"
            context_text += f"Document {i+1}:\n{doc_str[:300]}\n\n"

        if material_estimates:
            context_text += "Materials Needed:\n" + "\n".join([f"- {m['Material/Equipment']}: {m['Quantity']}" for m in material_estimates])

        prompt = f"""
Assistant for construction procurement. Use context from IndiaMART database.
Context:
{context_text}
Query: {query}
Instructions:
- Use only context info.
- Output in structured format:
Products:
1. Name: [name]
   Brand: [brand]
   Availability: [availability]
   Location: [location]
   Vendor: [vendor]
   URL: [url]

Vendors:
1. Company Name: [company]
   Address: [address]
   GST Status: [gst]
   Rating: [rating]
- Be concise and factual.
Answer:
"""
        return self._call_groq_api(prompt, max_tokens=512)

    def load_and_process_json_files(self):
        print("Loading JSON files...")
        json_files = [f for f in os.listdir(self.json_dir) if f.endswith('.json')]
        
        for json_file in json_files:
            file_path = os.path.join(self.json_dir, json_file)
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    
                    if isinstance(data, list):
                        for item in data:
                            self._process_item(item)
                    else:
                        self._process_item(data)
                        
            except Exception as e:
                print(f"Error loading {json_file}: {str(e)}")
                
        print(f"Loaded {len(self.documents)} documents")
    
    def _process_item(self, item: Dict[str, Any]):
        text_parts = []
        
        title = item.get('title', '')
        if title:
            text_parts.append(f"Title: {title}")
        
        details = item.get('details', {})
        if details and isinstance(details, dict):
            for key, value in details.items():
                if value:
                    text_parts.append(f"{key}: {value}")
        
        description = item.get('description', '')
        if description:
            text_parts.append(f"Description: {description}")
        
        seller_info = item.get('seller_info', {})
        if seller_info and isinstance(seller_info, dict):
            for key, value in seller_info.items():
                if key != 'error' and value != 'Seller information not available' and value:
                    text_parts.append(f"Seller {key}: {value}")
        
        company_info = item.get('company_info', {})
        if company_info and isinstance(company_info, dict):
            for key, value in company_info.items():
                if value:
                    text_parts.append(f"Company {key}: {value}")
        
        text = " ".join(text_parts)
        
        if text.strip():
            self.documents.append(text)
            self.metadata.append({
                'url': item.get('url', ''),
                'title': item.get('title', ''),
                'description': item.get('description', ''),
                'details': item.get('details', {}),
                'seller_info': item.get('seller_info', {}),
                'company_info': item.get('company_info', {}),
                'reviews': item.get('reviews', [])
            })
    
    def build_faiss_index(self):
        if not self.documents:
            print("No documents to index!")
            return
            
        print("Building FAISS index...")
        embeddings = self.embedding_model.encode(self.documents, show_progress_bar=True)
        dimension = embeddings.shape[1]
        self.index = faiss.IndexFlatL2(dimension)
        self.index.add(np.array(embeddings).astype('float32'))
        print("FAISS index built successfully")
    
    def search(self, query: str, k: int = 5) -> List[Dict[str, Any]]:
        if self.index is None or len(self.documents) == 0:
            raise ValueError("Index not built or no documents loaded")
        
        k = min(k, len(self.documents))
        query_embedding = self.embedding_model.encode([query])
        distances, indices = self.index.search(np.array(query_embedding).astype('float32'), k)
        
        results = []
        for i, idx in enumerate(indices[0]):
            if idx < len(self.metadata):
                results.append({
                    'document': self.documents[idx],
                    'metadata': self.metadata[idx],
                    'distance': float(distances[0][i])
                })
        return results
    
    def filter_by_criteria(self, results: List[Dict[str, Any]], query: str) -> List[Dict[str, Any]]:
        filtered_results = []
        for result in results:
            metadata = result['metadata']
            company_info = metadata.get('company_info', {})
            details = metadata.get('details', {})
            
            if "in " in query.lower() or "navi mumbai" in query.lower():
                location_match = re.search(r'in\s+([\w\s]+)$', query.lower())
                location = "navi mumbai" if "navi mumbai" in query.lower() else None
                if location_match and not location:
                    location = location_match.group(1).strip()
                
                if location:
                    address = str(company_info.get('full_address', '')).lower() + " " + str(metadata.get('seller_info', {}).get('full_address', '')).lower()
                    if location not in address:
                        continue
            
            if "gst after 2017" in query.lower():
                gst_date = company_info.get('gst_registration_date', '')
                if gst_date:
                    try:
                        date_obj = datetime.strptime(gst_date, '%d-%m-%Y')
                        if date_obj.year <= 2017:
                            continue
                    except ValueError:
                        continue
                else:
                    continue
            
            if "high rating" in query.lower() or "rating" in query.lower():
                reviews = metadata.get('reviews', [])
                overall_rating = None
                for review in reviews:
                    if review.get('type') == 'overall_rating':
                        try:
                            overall_rating = float(review.get('value', 0))
                            break
                        except (ValueError, TypeError):
                            pass
                
                if overall_rating is None or overall_rating < 4.0:
                    continue
            
            if "available in stock" in query.lower() or "in stock" in query.lower():
                availability = str(details.get('availability', '')).lower()
                if 'in stock' not in availability:
                    continue
            
            if "fire retardant" in query.lower() or "fireproof" in query.lower():
                details_text = str(details).lower() + " " + str(metadata.get('description', '')).lower()
                if 'fire retardant' not in details_text and 'fireproof' not in details_text:
                    continue
            
            filtered_results.append(result)
        return filtered_results
    
    def extract_project_requirements(self, query: str) -> Dict[str, Any]:
        requirements = {
            "power_capacity": None,
            "built_up_area": None,
            "project_volume": None,
            "location": None,
            "materials": {}
        }
        
        power_match = re.search(r'(\d+)\s*Mega?Watt', query, re.IGNORECASE)
        if power_match:
            requirements["power_capacity"] = float(power_match.group(1))
        
        area_match = re.search(r'(\d+)\s*Lacs?\s*SquareFoot', query, re.IGNORECASE)
        if area_match:
            requirements["built_up_area"] = float(area_match.group(1)) * 100000
        
        volume_match = re.search(r'(\d+)\s*Cr\s*(in\s*Rupees)?', query, re.IGNORECASE)
        if volume_match:
            requirements["project_volume"] = float(volume_match.group(1)) * 10000000
        
        location_match = re.search(r'in\s+([\w\s]+)$', query, re.IGNORECASE)
        if location_match:
            requirements["location"] = location_match.group(1).strip()
        
        if "navi mumbai" in query.lower():
            requirements["location"] = "Navi Mumbai"
        
        return requirements
    
    def estimate_material_requirements(self, requirements: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Estimate material requirements using LLM based on project specs"""
        prompt = f"""
        Project Requirements:
        {json.dumps(requirements, indent=2)}
        
        Based on Indian Construction Standards, estimate the key materials required for this project.
        Include major categories like Cement, Steel, Sand, Bricks, Electrical (Transformers, Cables), Plumbing, etc.
        
        Output valid JSON list of objects with these keys:
        - "Material/Equipment": Name of material
        - "Quantity": Estimated quantity with unit (e.g., "5000 Bags", "100 Tons")
        - "Unit Cost (Rupees)": Estimated cost in Crores or Lakhs (e.g. "0.5 Crores")
        - "Notes": Basis of estimation
        
        Provide at least 5-7 distinct material categories relevant to the project size.
        Example:
        [
            {{"Material/Equipment": "Cement", "Quantity": "50000 Bags", "Unit Cost (Rupees)": "1.5 Crores", "Notes": "Based on 0.4 bags/sqft"}},
            {{"Material/Equipment": "TMT Steel Bars", "Quantity": "500 Tons", "Unit Cost (Rupees)": "2.5 Crores", "Notes": "Standard reinforcement ratio"}}
        ]
        """
        try:
            response_json = self._call_groq_api(prompt, max_tokens=1024)
            # Clean up response to ensure JSON
            if "```json" in response_json:
                response_json = response_json.split("```json")[1].split("```")[0]
            elif "```" in response_json:
                response_json = response_json.split("```")[1].split("```")[0]
                
            estimates = json.loads(response_json.strip())
            return estimates if isinstance(estimates, list) else []
        except Exception as e:
            print(f"Error estimating materials: {e}")
            # Fallback to simple logic if LLM fails
            materials = []
            if requirements.get("built_up_area"):
                area = requirements["built_up_area"]
                materials.append({
                    "Material/Equipment": "Cement (Fallback)",
                    "Quantity": f"{area * 0.4:.0f} Bags",
                    "Unit Cost (Rupees)": "Unknown",
                    "Notes": "Fallback Estimate"
                })
            return materials
    
    def format_material_table(self, materials: List[Dict[str, Any]]) -> str:
        if not materials:
            return ""
        table = "| Material/Equipment | Quantity | Unit Cost (Rupees) |\n"
        table += "|-------------------|----------|-------------------|\n"
        for material in materials:
            table += f"| {material['Material/Equipment']} | {material['Quantity']} | {material['Unit Cost (Rupees)']} |\n"
        return table
    
    def query(self, query: str, k: int = 10, apply_filters: bool = True) -> Dict[str, Any]:
        requirements = self.extract_project_requirements(query)
        material_estimates = []
        
        if any([requirements["power_capacity"], requirements["built_up_area"], requirements["project_volume"]]):
            material_estimates = self.estimate_material_requirements(requirements)
        
        search_results = self.search(query, k=k)
        
        if apply_filters:
            filtered_results = self.filter_by_criteria(search_results, query)
        else:
            filtered_results = search_results
        
        response = self.generate_response(query, filtered_results, requirements, material_estimates)
        sources = [result['metadata']['url'] for result in filtered_results if result['metadata']['url']]
        
        return {
            'answer': response,
            'sources': sources,
            'num_results': len(filtered_results),
            'material_estimates': material_estimates
        }

# Global instance
rag = None

def init_rag():
    global rag
    if rag is None:
        try:
            rag = IndiaMART_RAG(json_dir="json")  # Ensure this matches directory structure
            rag.load_and_process_json_files()
            rag.build_faiss_index()
            print("RAG System Initialized")
        except Exception as e:
            print(f"RAG init error: {e}")

# ML Helpers
def check_files():
    files = [
        'deterministic_mapping_full.pkl', 'xgb_regressor_full.pkl',
        'xgb_classifier_full.pkl', 'label_encoder_full.pkl', 'class_mapping_full.pkl',
        'tfidf_vectorizer.pkl', 'numeric_imputer.pkl', 'date_imputer.pkl',
        'categorical_mapping.pkl', 'date_feature_names.pkl', 'numeric_feature_names.pkl'
    ]
    available = []
    missing = []
    for file in files:
        if os.path.exists(file):
            available.append(file)
        else:
            missing.append(file)
    return available, missing

def clean_numeric_value(value, clip_negative=True, replace_zero_epsilon=False):
    if isinstance(value, str):
        value = (value.replace(',', '').replace('$','').replace(' ','').replace(' ', ''))
        try:
            value = float(value)
        except:
            value = np.nan
    if clip_negative and value is not None and value < 0:
        value = 0
    if replace_zero_epsilon and value is not None and value <= 0:
        value = 0.01
    return value

def clean_text_value(text):
    if pd.isna(text) or text is None:
        return "missing"
    text = str(text).strip().lower()
    text = text.replace('\n', ' ').replace('\r', ' ')
    text = ''.join([c if c.isalnum() or c.isspace() else ' ' for c in text])
    text = ' '.join(text.split())
    return text

def convert_to_serializable(obj):
    if isinstance(obj, (np.integer, np.int64)):
        return int(obj)
    elif isinstance(obj, (np.floating, np.float64)):
        return float(obj)
    elif isinstance(obj, np.ndarray):
        return obj.tolist()
    elif isinstance(obj, dict):
        return {k: convert_to_serializable(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [convert_to_serializable(i) for i in obj]
    return obj

def prepare_date_features(input_data, date_feature_names):
    date_features = {}
    if 'CONSTRUCTION_START_DATE' in input_data and 'SUBSTANTIAL_COMPLETION_DATE' in input_data:
        try:
            start_str = input_data.get('CONSTRUCTION_START_DATE', '')
            end_str = input_data.get('SUBSTANTIAL_COMPLETION_DATE', '')
            if start_str and end_str:
                start_date = pd.to_datetime(start_str, errors='coerce')
                end_date = pd.to_datetime(end_str, errors='coerce')
                if not pd.isna(start_date) and not pd.isna(end_date):
                    date_features['construction_duration_days'] = (end_date - start_date).days
        except:
            pass
    if 'invoiceDate' in input_data:
        try:
            invoice_str = input_data.get('invoiceDate', '')
            if invoice_str:
                invoice_date = pd.to_datetime(invoice_str, errors='coerce')
                if not pd.isna(invoice_date):
                    date_features['invoice_year'] = invoice_date.year
                    date_features['invoice_month'] = invoice_date.month
                    date_features['invoice_day'] = invoice_date.day
                    date_features['invoice_dayofweek'] = invoice_date.dayofweek
                    date_features['invoice_quarter'] = invoice_date.quarter
        except:
            pass
    
    date_df = pd.DataFrame(columns=date_feature_names)
    for feature in date_feature_names:
        if feature in date_features:
            date_df.at[0, feature] = date_features[feature]
        else:
            date_df.at[0, feature] = np.nan
    return date_df

def prepare_features(input_data, tfidf_vectorizer, numeric_imputer, date_imputer, categorical_mapping, date_feature_names):
    cleaned_desc = clean_text_value(input_data.get('ItemDescription', ''))
    X_text = tfidf_vectorizer.transform([cleaned_desc])
    numeric_features = ['ExtendedQuantity', 'UnitPrice', 'ExtendedPrice', 'invoiceTotal']
    numeric_values = []
    for feat in numeric_features:
        value = input_data.get(feat, 0)
        cleaned_value = clean_numeric_value(value, replace_zero_epsilon=(feat in ['UnitPrice', 'ExtendedPrice']))
        if cleaned_value is None or np.isnan(cleaned_value):
            cleaned_value = 0
        numeric_values.append(cleaned_value)
    
    numeric_values = [np.log1p(x) if x >= 0 else 0 for x in numeric_values]
    X_numeric = numeric_imputer.transform([numeric_values])
    date_df = prepare_date_features(input_data, date_feature_names)
    X_date = date_imputer.transform(date_df)
    
    cat_cols = ['PROJECT_CITY', 'STATE', 'PROJECT_COUNTRY', 'CORE_MARKET', 'PROJECT_TYPE', 'UOM']
    cat_features = []
    for c in cat_cols:
        value = str(input_data.get(c, 'missing')).lower().strip()
        if c in categorical_mapping:
            top_categories = categorical_mapping[c]
            if value in top_categories:
                cat_features.extend([1 if value == cat else 0 for cat in top_categories])
                cat_features.append(0)
            else:
                cat_features.extend([0] * len(top_categories))
                cat_features.append(1)
    
    X_categorical = np.array([cat_features])
    X_combined = sparse.hstack([X_text, sparse.csr_matrix(X_numeric), sparse.csr_matrix(X_date), sparse.csr_matrix(X_categorical)]).tocsr()
    return X_combined

def run_ml_prediction(input_data: Dict[str, Any]) -> Dict[str, Any]:
    try:
        available_files, missing_files = check_files()
        if 'tfidf_vectorizer.pkl' not in available_files:
            return {'error': 'TFIDF vectorizer missing'}
        
        tfidf_vectorizer = joblib.load('tfidf_vectorizer.pkl')
        numeric_imputer = joblib.load('numeric_imputer.pkl')
        date_imputer = joblib.load('date_imputer.pkl')
        categorical_mapping = joblib.load('categorical_mapping.pkl')
        det_items = joblib.load('deterministic_mapping_full.pkl') if 'deterministic_mapping_full.pkl' in available_files else pd.Series()
        date_feature_names = joblib.load('date_feature_names.pkl') if 'date_feature_names.pkl' in available_files else [
            'construction_duration_days', 'invoice_year', 'invoice_month', 'invoice_day', 'invoice_dayofweek', 'invoice_quarter']
        
        regression_available = 'xgb_regressor_full.pkl' in available_files
        if regression_available:
            xgb_regressor = joblib.load('xgb_regressor_full.pkl')
        
        classification_available = all(f in available_files for f in ['xgb_classifier_full.pkl', 'label_encoder_full.pkl', 'class_mapping_full.pkl'])
        if classification_available:
            xgb_classifier = joblib.load('xgb_classifier_full.pkl')
            label_encoder = joblib.load('label_encoder_full.pkl')
            class_mapping = joblib.load('class_mapping_full.pkl')
        
        X_features = prepare_features(input_data, tfidf_vectorizer, numeric_imputer, date_imputer, categorical_mapping, date_feature_names)
        cleaned_desc = clean_text_value(input_data.get('ItemDescription', ''))
        
        if cleaned_desc in det_items.index:
            master_item_no = det_items[cleaned_desc]
            prediction_method = "deterministic"
        elif classification_available:
            X_dense = X_features.toarray()
            pred_encoded = xgb_classifier.predict(X_dense)
            pred_processed = label_encoder.inverse_transform(pred_encoded)
            master_item_no = class_mapping.get(pred_processed[0], 'unknown')
            prediction_method = "classification_model"
        else:
            master_item_no = "unknown"
            prediction_method = "no_model"
        
        if regression_available:
            X_dense = X_features.toarray()
            qty_shipped = xgb_regressor.predict(X_dense)[0]
            qty_shipped = max(1, int(qty_shipped))
        else:
            extended_qty = clean_numeric_value(input_data.get('ExtendedQuantity', 1))
            qty_shipped = max(1, int(extended_qty)) if extended_qty else 1
            
        result = {'master_item_no': master_item_no, 'qty_shipped': qty_shipped, 'prediction_method': prediction_method}
        return convert_to_serializable(result)
    except Exception as e:
        return {'error': str(e)}

def generate_ml_input(query: str, material: str, groq_api_key: str) -> Dict[str, Any]:
    prompt = f"""
Project: {query}
Material: {material}
Generate a valid JSON dictionary with double quotes around all keys and string values. Structure:
{{
  "ItemDescription": "description with {material}",
  "ExtendedQuantity": 100,
  "UnitPrice": 1000,
  "ExtendedPrice": 100000,
  "invoiceTotal": 1000000,
  "CONSTRUCTION_START_DATE": "2026-01-01",
  "SUBSTANTIAL_COMPLETION_DATE": "2026-12-31",
  "invoiceDate": "2025-09-14",
  "PROJECT_CITY": "Navi Mumbai",
  "STATE": "Maharashtra",
  "PROJECT_COUNTRY": "India",
  "CORE_MARKET": "Construction",
  "PROJECT_TYPE": "Commercial",
  "UOM": "Units",
  "Material": "{material}"
}}
Output only JSON.
"""
    if len(prompt) > 3000: prompt = prompt[:3000] + "\n... (truncated)"
    try:
        headers = {"Authorization": f"Bearer {groq_api_key}", "Content-Type": "application/json"}
        payload = {"model": "llama-3.1-8b-instant", "messages": [{"role": "user", "content": prompt}], "max_tokens": 512}
        response = requests.post("https://api.groq.com/openai/v1/chat/completions", headers=headers, json=payload)
        response.raise_for_status()
        data = response.json()
        if 'choices' in data:
            content = data['choices'][0]['message']['content'].strip()
            content = re.sub(r"(\w+):", r'"\1":', content)
            content = content.replace("'", '"')
            json_match = re.search(r'\{.*\}', content, re.DOTALL)
            if json_match:
                return json.loads(json_match.group())
        return {'error': 'Failed to parse JSON from API response'}
    except Exception as e:
        return {'error': f"ML input generation error: {str(e)}"}

def generate_timeline(materials: List[Dict], query: str, groq_api_key: str) -> str:
    material_list = "\n".join([f"- {m['Material/Equipment']}: {m['Quantity']}" for m in materials[:1]])
    prompt = f"""
Date: September 14, 2025
Project: {query[:100]}
Materials:
{material_list}
Generate procurement timeline in this exact structured Markdown format.
Output of Procurement Timeline:
1. Electrical Equipment
| Item | Lead Time | Order By | Delivery Window | Notes |
|------|-----------|----------|-----------------|-------|
| Transformers | 50 weeks | Feb 1, 2026 | Dec 2026 | Potential delays |
Use typical lead times.
"""
    try:
        headers = {"Authorization": f"Bearer {groq_api_key}", "Content-Type": "application/json"}
        payload = {"model": "llama-3.1-8b-instant", "messages": [{"role": "user", "content": prompt}], "max_tokens": 512}
        response = requests.post("https://api.groq.com/openai/v1/chat/completions", headers=headers, json=payload)
        response.raise_for_status()
        data = response.json()
        return data['choices'][0]['message']['content']
    except Exception as e:
        return f"Error: {str(e)}"

def generate_schedule(materials: List[Dict], query: str, groq_api_key: str) -> str:
    material_list = "\n".join([f"- {m['Material/Equipment']}: {m['Quantity']}" for m in materials[:1]])
    prompt = f"""
Date: September 14, 2025
Project: {query[:100]}
Materials:
{material_list}
Generate construction schedule in this exact structured Markdown format.
WBS Level 2: 1. Design & Engineering
| ID | Task | Duration | Start | Finish | Notes |
|----|------|----------|-------|--------|-------|
| 1.1 | Conceptual Design | 30 days | 01-Jan-2026 | 30-Jan-2026 | 30% Design |
"""
    try:
        headers = {"Authorization": f"Bearer {groq_api_key}", "Content-Type": "application/json"}
        payload = {"model": "llama-3.1-8b-instant", "messages": [{"role": "user", "content": prompt}], "max_tokens": 512}
        response = requests.post("https://api.groq.com/openai/v1/chat/completions", headers=headers, json=payload)
        response.raise_for_status()
        data = response.json()
        return data['choices'][0]['message']['content']
    except Exception as e:
        return f"Error: {str(e)}"
    
def extract_vendor_details(answer: str) -> List[Dict[str, str]]:
    """Extract list of vendors from RAG answer"""
    vendors = []
    # Pattern to match "1. Company Name: ... Rating: ..." blocks
    # Looking for blocks that might look like:
    # 1. Company Name: XYZ
    #    Address: ...
    #    GST Status: ...
    #    Rating: ...
    
    # We'll split by "Company Name:" to find segments
    segments = answer.split("Company Name:")
    for segment in segments[1:]: # Skip first empty chunk
        try:
            company = segment.split("\n")[0].strip()
            
            address = "N/A"
            address_match = re.search(r'Address:(.*?)(?:GST|Rating|\n\w+:|$)', segment, re.DOTALL)
            if address_match:
                address = address_match.group(1).strip()
                
            gst = "N/A"
            gst_match = re.search(r'GST Status:(.*?)(?:Rating|\n\w+:|$)', segment, re.DOTALL)
            if gst_match:
                gst = gst_match.group(1).strip()
                
            rating = "N/A"
            rating_match = re.search(r'Rating:(.*?)(?:\n|$)', segment)
            if rating_match:
                rating = rating_match.group(1).strip()

            vendors.append({
                "company": company,
                "address": address,
                "gst": gst,
                "rating": rating
            })
        except Exception as e:
            continue
            
    return vendors

# Routes
@app.route('/chat', methods=['POST'])
def chat():
    if not rag:
        init_rag()
    data = request.json
    query = data.get('query')
    if not query:
        return jsonify({"error": "No query provided"}), 400
    
    try:
        result = rag.query(query)
        
        # Enriched response with vendor extraction
        material_estimates = result.get('material_estimates', [])
        vendor_details = []
        # Get top 3 materials for vendor search
        for mat in material_estimates[:3]:
             vendor_query = f"""Find 3 distinct suppliers for {mat['Material/Equipment']} in Navi Mumbai.
             List them with Company Name, Address, GST, and Rating.
             Format:
             1. Company Name: ...
                Address: ...
                GST Status: ...
                Rating: ...
             """
             try:
                 # Increase k to get more potential vendor docs
                 vendor_result = rag.query(vendor_query, k=3, apply_filters=False)
                 vendors = extract_vendor_details(vendor_result['answer'])
                 
                 for v in vendors:
                     vendor_details.append({
                         "material": mat['Material/Equipment'],
                         "vendor": f"Company: {v['company']}, Rating: {v['rating']}" 
                     })
             except Exception as e:
                 print(f"Vendor fetch error: {e}")

        result['vendor_details'] = vendor_details
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/predict', methods=['POST'])
def predict():
    data = request.json
    query = data.get('query')
    material = data.get('material')
    if not query or not material:
        return jsonify({"error": "Missing query or material"}), 400
    
    print(f"Predict called with query: {query}, material: {material}")
    ml_input = generate_ml_input(query, material, rag.groq_api_key if rag else os.getenv("GROQ_API_KEY"))
    if 'error' in ml_input:
        print(f"ML Input Generation Error: {ml_input['error']}")
        return jsonify(ml_input), 500 # Propagate error
        
    prediction = run_ml_prediction(ml_input)
    print(f"Prediction result: {prediction}")
    return jsonify(prediction)

@app.route('/schedule', methods=['POST'])
def schedule():
    data = request.json
    query = data.get('query')
    materials = data.get('materials', [])
    if not query:
        return jsonify({"error": "Missing query"}), 400
        
    timeline = generate_timeline(materials, query, rag.groq_api_key if rag else os.getenv("GROQ_API_KEY"))
    schedule = generate_schedule(materials, query, rag.groq_api_key if rag else os.getenv("GROQ_API_KEY"))
    
    return jsonify({
        "timeline_markdown": timeline,
        "schedule_markdown": schedule
    })

if __name__ == '__main__':
    init_rag() # pre-initialize
    app.run(host='0.0.0.0', port=5001, debug=True)
