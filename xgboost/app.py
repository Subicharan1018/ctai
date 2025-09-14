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
import streamlit as st
from dotenv import load_dotenv
import time  # Added for rate limit handling
import matplotlib.pyplot as plt  # Added for Gantt chart
from dateutil.relativedelta import relativedelta  # For date calculations

warnings.filterwarnings('ignore')

# Load environment variables
load_dotenv()

class IndiaMART_RAG:
    def __init__(self, json_dir: str = "json", embedding_model: str = "sentence-transformers/all-MiniLM-L6-v2"):
        self.json_dir = json_dir
        self.embedding_model_name = embedding_model
        self.embedding_model = SentenceTransformer(embedding_model)
        self.index = None
        self.documents = []
        self.metadata = []
        self.groq_api_key = os.getenv("GROQ_API_KEY")
        if not self.groq_api_key:
            raise ValueError("Groq API key missing. Set GROQ_API_KEY in .env file. Get a key from https://console.groq.com/keys")

    def _call_groq_api(self, prompt: str, max_tokens: int = 1024) -> str:
        """Helper to call Groq API with optimized token handling and rate limit delay"""
        time.sleep(2)  # Increased delay to 2 seconds to avoid 429 errors
        # Truncate prompt to ~3000 chars (~750 tokens) to stay safe
        if len(prompt) > 3000:
            prompt = prompt[:3000] + "\n... (truncated to fit token limit)"
            st.warning(f"Prompt truncated to ~750 tokens to avoid context length issues.")

        try:
            headers = {
                "Authorization": f"Bearer {self.groq_api_key}",
                "Content-Type": "application/json"
            }
            payload = {
                "model": "llama-3.1-8b-instant",  # Updated to current supported model
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
                st.error("Invalid API response format.")
                return "Error: Invalid API response."
        except requests.exceptions.HTTPError as e:
            error_msg = f"API HTTP Error: {str(e)} - {e.response.text}"  # Added response.text for full error details
            if e.response.status_code == 400:
                error_msg += f" - Possible context length issue. Prompt length: {len(prompt)} chars."
            elif e.response.status_code == 401:
                error_msg += " - Invalid API key."
            elif e.response.status_code == 429:
                error_msg += " - Rate limit exceeded. Retrying after delay..."
                time.sleep(10)  # Longer backoff for rate limit
                return self._call_groq_api(prompt, max_tokens)  # Retry once
            st.error(error_msg)
            return f"Error: {error_msg}"
        except Exception as e:
            st.error(f"General Error: {str(e)}")
            return f"Error: {str(e)}"

    def generate_response(self, query: str, context: List[Dict[str, Any]], requirements: Dict[str, Any] = None, material_estimates: List[Dict[str, Any]] = None) -> str:
        """Generate response using Groq API with minimal context"""
        # Limit to 1 document to reduce tokens
        context_text = ""
        for i, result in enumerate(context[:1]):
            doc_str = f"Title: {result['metadata']['title']}\nURL: {result['metadata']['url']}\nDetails: {json.dumps(result['metadata']['details'], separators=(',', ':'))[:200]}"
            context_text += f"Document {i+1}:\n{doc_str[:300]}\n\n"

        if material_estimates:
            context_text += "Materials:\n" + "\n".join([f"{m['Material/Equipment']}: {m['Quantity']}" for m in material_estimates[:1]])

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
        """Load all JSON files from the directory and process them"""
        st.write("Loading JSON files...")
       
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
                st.error(f"Error loading {json_file}: {str(e)}")
               
        st.write(f"Loaded {len(self.documents)} documents")
   
    def _process_item(self, item: Dict[str, Any]):
        """Process a single item from JSON and add to documents"""
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
        """Build FAISS index from documents"""
        if not self.documents:
            st.error("No documents to index!")
            return
           
        st.write("Building FAISS index...")
       
        embeddings = self.embedding_model.encode(self.documents, show_progress_bar=True)
       
        dimension = embeddings.shape[1]
        self.index = faiss.IndexFlatL2(dimension)
        self.index.add(np.array(embeddings).astype('float32'))
       
        st.write("FAISS index built successfully")
   
    def search(self, query: str, k: int = 5) -> List[Dict[str, Any]]:
        """Search for similar documents to the query"""
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
        """Apply additional filtering based on query criteria"""
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
        """Extract project requirements from the query"""
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
        """Estimate material requirements based on project specifications"""
        materials = []
       
        if requirements.get("built_up_area"):
            area = requirements["built_up_area"]
           
            cement_bags = area * 0.4
            cement_cubic_meters = cement_bags / 30
            materials.append({
                "Material/Equipment": "Cement",
                "Quantity": f"{cement_cubic_meters:.0f} Cubic Meters",
                "Unit Cost (Rupees)": f"{(cement_cubic_meters * 6000 / 100000):.2f} Crores",
                "Notes": "Based on standard construction norms (0.4 bags per square foot)"
            })
           
            bricks = area * 8
            materials.append({
                "Material/Equipment": "Bricks",
                "Quantity": f"{bricks:.0f} Units",
                "Unit Cost (Rupees)": f"{(bricks * 0.08 / 100000):.2f} Crores",
                "Notes": "Based on standard construction norms (8 bricks per square foot)"
            })
       
        if requirements.get("power_capacity"):
            power = requirements["power_capacity"]
           
            switchgear_lineups = max(5, power / 2.5)
            materials.append({
                "Material/Equipment": "Medium Voltage Switchgear",
                "Quantity": f"{switchgear_lineups:.0f} LineUps",
                "Unit Cost (Rupees)": f"{switchgear_lineups * 0.2:.2f} Crores",
                "Notes": f"Based on power capacity of {power} MW"
            })
           
            transformer_units = max(3, power / 5)
            transformer_capacity = power / transformer_units
            materials.append({
                "Material/Equipment": "Transformers",
                "Quantity": f"{transformer_units:.0f} Units ({transformer_capacity:.1f}MVA)",
                "Unit Cost (Rupees)": f"{transformer_units * 6.67:.2f} Crores",
                "Notes": f"Based on power capacity of {power} MW"
            })
           
            cooling_units = max(10, power * 2)
            materials.append({
                "Material/Equipment": "Chillers / CRAHs / CRACs",
                "Quantity": f"{cooling_units:.0f} Units",
                "Unit Cost (Rupees)": f"{cooling_units * 0.3:.2f} Crores",
                "Notes": f"Based on power capacity of {power} MW"
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
       
        final_response = response
        if material_estimates:
            table = self.format_material_table(material_estimates)
            final_response += f"\n\n{table}"
       
        return {
            'answer': final_response,
            'sources': sources,
            'num_results': len(filtered_results),
            'material_estimates': material_estimates
        }

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
        value = (value.replace(',', '')
                  .replace('$','')
                  .replace(' ','')
                  .replace(' ', ''))
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
                    duration = (end_date - start_date).days
                    date_features['construction_duration_days'] = duration
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

def prepare_features(input_data, tfidf_vectorizer, numeric_imputer, date_imputer,
                    categorical_mapping, date_feature_names):
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
   
    X_combined = sparse.hstack([
        X_text,
        sparse.csr_matrix(X_numeric),
        sparse.csr_matrix(X_date),
        sparse.csr_matrix(X_categorical)
    ]).tocsr()
   
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
            'construction_duration_days', 'invoice_year', 'invoice_month',
            'invoice_day', 'invoice_dayofweek', 'invoice_quarter'
        ]
       
        regression_available = 'xgb_regressor_full.pkl' in available_files
        if regression_available:
            xgb_regressor = joblib.load('xgb_regressor_full.pkl')
       
        classification_available = all(f in available_files for f in ['xgb_classifier_full.pkl', 'label_encoder_full.pkl', 'class_mapping_full.pkl'])
        if classification_available:
            xgb_classifier = joblib.load('xgb_classifier_full.pkl')
            label_encoder = joblib.load('label_encoder_full.pkl')
            class_mapping = joblib.load('class_mapping_full.pkl')
       
        X_features = prepare_features(input_data, tfidf_vectorizer, numeric_imputer,
                                      date_imputer, categorical_mapping, date_feature_names)
       
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
       
        return {
            'master_item_no': master_item_no,
            'qty_shipped': qty_shipped,
            'prediction_method': prediction_method
        }
       
    except Exception as e:
        return {'error': str(e)}

def generate_ml_input(query: str, material: str, groq_api_key: str) -> Dict[str, Any]:
    prompt = f"""
Project: {query}
Material: {material}
Generate a valid JSON dictionary with double quotes around all keys and string values. Do not use single quotes. Use this structure:
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
  "UOM": "Units"
}}
Output only the JSON object, nothing else.
"""
    if len(prompt) > 3000:
        prompt = prompt[:3000] + "\n... (truncated)"
    
    try:
        headers = {
            "Authorization": f"Bearer {groq_api_key}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": "llama-3.1-8b-instant",  # Updated to current supported model
            "messages": [{"role": "user", "content": prompt}],
            "max_tokens": 512
        }
        response = requests.post("https://api.groq.com/openai/v1/chat/completions", headers=headers, json=payload)
        response.raise_for_status()
        data = response.json()
        if 'choices' in data and len(data['choices']) > 0:
            content = data['choices'][0]['message']['content'].strip()
            # Attempt to fix common JSON issues
            content = re.sub(r"(\w+):", r'"\1":', content)  # Add quotes to keys if missing
            content = content.replace("'", '"')  # Replace single quotes with double
            json_match = re.search(r'\{.*\}', content, re.DOTALL)
            if json_match:
                try:
                    return json.loads(json_match.group())
                except json.JSONDecodeError as je:
                    st.error(f"JSON decode error: {str(je)}. Content: {content}")
                    return {'error': 'Failed to parse JSON from API response'}
        return {'error': 'Failed to parse JSON from API response'}
    except Exception as e:
        st.error(f"ML input generation error: {str(e)}")
        return {
            "ItemDescription": f"{material} for construction",
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
            "UOM": "Units"
        }

def generate_timeline(materials: List[Dict], query: str, groq_api_key: str) -> str:
    material_list = "\n".join([f"- {m['Material/Equipment']}: {m['Quantity']}" for m in materials[:1]])
    prompt = f"""
Date: September 14, 2025
Project: {query[:100]}
Materials:
{material_list}
Generate procurement timeline in this exact structured Markdown format. Do not add extra text or notes outside the tables. Ensure tables are properly formatted with no empty rows:
Output of Procurement Timeline:
1. Electrical Equipment
| Item | Lead Time | Order By | Delivery Window | Notes |
|------|-----------|----------|-----------------|-------|
| Transformers | 50 weeks | Feb 1, 2026 | Dec 2026 | Potential delays |

2. Mechanical Equipment
| Item | Lead Time | Order By | Delivery Window | Notes |
|------|-----------|----------|-----------------|-------|
| Cement | In-stock | Immediate | Immediate | Standard material |

Use industry-standard lead times. Only include relevant items from materials.
"""
    if len(prompt) > 3000:
        prompt = prompt[:3000] + "\n... (truncated)"
    
    try:
        headers = {
            "Authorization": f"Bearer {groq_api_key}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": "llama-3.1-8b-instant",  # Updated to current supported model
            "messages": [{"role": "user", "content": prompt}],
            "max_tokens": 512
        }
        response = requests.post("https://api.groq.com/openai/v1/chat/completions", headers=headers, json=payload)
        response.raise_for_status()
        data = response.json()
        if 'choices' in data and len(data['choices']) > 0:
            return data['choices'][0]['message']['content']
        st.error("Invalid API response for timeline.")
        return "Error: Invalid API response."
    except Exception as e:
        st.error(f"Timeline generation error: {str(e)}")
        return f"Error: {str(e)}"

def generate_schedule(materials: List[Dict], query: str, groq_api_key: str) -> str:
    material_list = "\n".join([f"- {m['Material/Equipment']}: {m['Quantity']}" for m in materials[:1]])
    prompt = f"""
Date: September 14, 2025
Project: {query[:100]}
Materials:
{material_list}
Generate construction schedule in this exact structured Markdown format. Do not add extra text or notes outside the tables. Ensure tables are properly formatted with no empty rows:
Output of Integrated with Construction Project Schedule:
WBS Level 2: 1. Design & Engineering
| ID | Task | Duration | Start | Finish | Notes |
|----|------|----------|-------|--------|-------|
| 1.1 | Conceptual Design | 30 days | 01-Jan-2026 | 30-Jan-2026 | 30% Design |

WBS Level 2: 2. Mech & Electrical Installations
| ID | Task | Duration | Start | Finish | Notes |
|----|------|----------|-------|--------|-------|
| 2.1 | Transformer Installation | 15 days | 01-Dec-2026 | 15-Dec-2026 | |

Use typical construction timelines. Only include relevant items from materials.
"""
    if len(prompt) > 3000:
        prompt = prompt[:3000] + "\n... (truncated)"
    
    try:
        headers = {
            "Authorization": f"Bearer {groq_api_key}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": "llama-3.1-8b-instant",  # Updated to current supported model
            "messages": [{"role": "user", "content": prompt}],
            "max_tokens": 512
        }
        response = requests.post("https://api.groq.com/openai/v1/chat/completions", headers=headers, json=payload)
        response.raise_for_status()
        data = response.json()
        if 'choices' in data and len(data['choices']) > 0:
            return data['choices'][0]['message']['content']
        st.error("Invalid API response for schedule.")
        return "Error: Invalid API response."
    except Exception as e:
        st.error(f"Schedule generation error: {str(e)}")
        return f"Error: {str(e)}"

def extract_vendor_details(answer: str) -> str:
    """Improved extraction of vendor details from RAG answer"""
    # Use regex to parse structured output from LLM
    vendor_match = re.search(r'Vendors:\s*1\.\s*Company Name: (.*?)\s*Address: (.*?)\s*GST Status: (.*?)\s*Rating: (.*)', answer, re.DOTALL)
    if vendor_match:
        company = vendor_match.group(1).strip()
        address = vendor_match.group(2).strip()
        gst = vendor_match.group(3).strip()
        rating = vendor_match.group(4).strip()
        return f"Company: {company}, Address: {address}, GST: {gst}, Rating: {rating}"
    return "Unknown Vendor"

def plot_gantt_chart(schedule_text: str):
    """Parse schedule text and plot Gantt chart"""
    # Simple parsing of schedule tables
    tasks = []
    lines = schedule_text.split('\n')
    current_section = ""
    for line in lines:
        if line.startswith('WBS Level 2:'):
            current_section = line
        elif line.startswith('| ID |') or line.startswith('|----|'):
            continue
        elif line.startswith('|') and '|' in line:
            parts = [p.strip() for p in line.split('|')[1:-1]]
            if len(parts) >= 5:
                task = parts[1]
                duration = parts[2]
                start = parts[3]
                finish = parts[4]
                tasks.append({'Section': current_section, 'Task': task, 'Start': start, 'Finish': finish, 'Duration': duration})
    
    # Convert to dates (example parsing, assume format DD-MMM-YYYY)
    start_dates = []
    durations = []
    task_names = []
    for task in tasks:
        try:
            start_date = datetime.strptime(task['Start'], '%d-%b-%Y')
            finish_date = datetime.strptime(task['Finish'], '%d-%b-%Y')
            duration_days = (finish_date - start_date).days
            start_dates.append(start_date)
            durations.append(duration_days)
            task_names.append(task['Task'])
        except:
            pass
    
    if not task_names:
        return None
    
    fig, ax = plt.subplots(figsize=(10, len(task_names) * 0.5))
    ax.barh(task_names, durations, left=start_dates, height=0.4, color='orange', label='Procurement')
    # Add installation as blue
    for i in range(len(durations)):
        install_start = start_dates[i] + relativedelta(days=durations[i])
        ax.barh(task_names[i], 30, left=install_start, height=0.4, color='blue', label='Installation' if i == 0 else "")
    
    ax.set_xlabel('Timeline')
    ax.set_title('Overlapping Gantt: Procurement vs Installation (All Equipment)')
    ax.legend()
    plt.gca().invert_yaxis()
    return fig

def main():
    st.title("Construction Procurement Assistant")
    st.write("Enter project details to get material estimates, vendor information, and schedules.")
    
    if 'rag' not in st.session_state:
        try:
            st.session_state.rag = IndiaMART_RAG()
            st.session_state.rag.load_and_process_json_files()
            st.session_state.rag.build_faiss_index()
        except Exception as e:
            st.error(f"Initialization error: {str(e)}")
            return
    
    query = st.text_area("Enter Project Details",
                         placeholder="e.g., 25 MegaWatt, 2 Lacs SquareFoot Built Up Area, Project Volume of 1875 Cr in Rupees, Build in Navi Mumbai Area",
                         height=100)
    
    if st.button("Generate Procurement Plan"):
        if not query:
            st.error("Please enter project details.")
            return
        
        with st.spinner("Processing query..."):
            try:
                result = st.session_state.rag.query(query)
                
                st.subheader("Query Results")
                st.write(f"**Answer:**\n{result['answer']}")
                
                if result['sources']:
                    st.subheader("Sources")
                    for source in result['sources'][:3]:
                        st.write(f"- {source}")
                
                material_estimates = result.get('material_estimates', [])
                if material_estimates:
                    st.subheader("Prediction Model")
                    for mat in material_estimates[:3]:  # Limit to 3 to reduce API calls
                        ml_input = generate_ml_input(query, mat['Material/Equipment'], st.session_state.rag.groq_api_key)
                        prediction = run_ml_prediction(ml_input)
                        if 'error' not in prediction:
                            qty = prediction['qty_shipped']
                            parts = mat['Quantity'].split()
                            if len(parts) > 1:
                                parts[0] = str(qty)
                                mat['Quantity'] = ' '.join(parts)
                            st.write(f"ML Prediction for {mat['Material/Equipment']}: Quantity updated to {mat['Quantity']}")
                        else:
                            st.error(f"ML Error for {mat['Material/Equipment']}: {prediction['error']}")
                    
                    st.write("\n**Material Estimates:**")
                    st.markdown(st.session_state.rag.format_material_table(material_estimates))
                    
                    st.subheader("Vendor Identification")
                    vendor_table = "| Material/Equipment | Quantity | Unit | Vendor/Manufacturers |\n|--------------------|----------|------|----------------------|\n"
                    for mat in material_estimates[:3]:  # Limit to 3 to reduce API calls
                        vendor_query = f"Find suppliers for {mat['Material/Equipment']} in Navi Mumbai with high ratings GST after 2017"
                        try:
                            vendor_result = st.session_state.rag.query(vendor_query, k=3)
                            vendor = extract_vendor_details(vendor_result['answer'])
                        except Exception as e:
                            vendor = f"Error: {str(e)}"
                        vendor_table += f"| {mat['Material/Equipment']} | {mat['Quantity']} | - | {vendor} |\n"
                    st.markdown(vendor_table)
                    
                    st.subheader("Procurement Timeline")
                    timeline_text = generate_timeline(material_estimates, query, st.session_state.rag.groq_api_key)
                    st.markdown(timeline_text)
                    
                    st.subheader("Integrated Project Schedule")
                    schedule_text = generate_schedule(material_estimates, query, st.session_state.rag.groq_api_key)
                    st.markdown(schedule_text)
                    
                    # Generate and display Gantt chart
                    st.subheader("Overlapping Gantt: Procurement vs Installation (All Equipment)")
                    fig = plot_gantt_chart(schedule_text)
                    if fig:
                        st.pyplot(fig)
                    else:
                        st.write("Unable to generate Gantt chart from schedule.")
                
            except Exception as e:
                st.error(f"Error processing query: {str(e)}")

if __name__ == "__main__":
    main()