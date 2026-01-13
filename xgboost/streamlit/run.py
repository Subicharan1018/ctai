import pandas as pd
import numpy as np
import joblib
from datetime import datetime
import warnings
import os
import traceback
from scipy import sparse
warnings.filterwarnings('ignore')

def check_files():
    """Check which files are available"""
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
    """Clean a single numeric value"""
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
    """Clean a single text value"""
    if pd.isna(text) or text is None:
        return "missing"
    
    text = str(text).strip().lower()
    text = text.replace('\n', ' ').replace('\r', ' ')
    text = ''.join([c if c.isalnum() or c.isspace() else ' ' for c in text])
    text = ' '.join(text.split())  # Remove extra spaces
    
    return text

def prepare_date_features(input_data, date_feature_names):
    """Prepare date features in the same way as during training"""
    date_features = {}
    
    # Construction duration
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
    
    # Invoice date features
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
    
    # Create DataFrame with all expected columns
    date_df = pd.DataFrame(columns=date_feature_names)
    
    # Fill in available values
    for feature in date_feature_names:
        if feature in date_features:
            date_df[feature] = [date_features[feature]]
        else:
            date_df[feature] = [np.nan]
    
    return date_df

def prepare_features(input_data, tfidf_vectorizer, numeric_imputer, date_imputer, 
                    categorical_mapping, date_feature_names):
    """Prepare features in the same way as during training"""
    # 1. Text features (TF-IDF)
    cleaned_desc = clean_text_value(input_data.get('ItemDescription', ''))
    X_text = tfidf_vectorizer.transform([cleaned_desc])
    
    # 2. Numeric features
    numeric_features = ['ExtendedQuantity', 'UnitPrice', 'ExtendedPrice', 'invoiceTotal']
    numeric_values = []
    
    for feat in numeric_features:
        value = input_data.get(feat, 0)
        cleaned_value = clean_numeric_value(value, replace_zero_epsilon=(feat in ['UnitPrice', 'ExtendedPrice']))
        if cleaned_value is None or np.isnan(cleaned_value):
            cleaned_value = 0
        numeric_values.append(cleaned_value)
    
    # Apply log1p transformation
    numeric_values = [np.log1p(x) if x >= 0 else 0 for x in numeric_values]
    X_numeric = numeric_imputer.transform([numeric_values])
    
    # 3. Date features
    date_df = prepare_date_features(input_data, date_feature_names)
    X_date = date_imputer.transform(date_df)
    
    # 4. Categorical features
    cat_cols = ['PROJECT_CITY', 'STATE', 'PROJECT_COUNTRY', 'CORE_MARKET', 'PROJECT_TYPE', 'UOM']
    cat_features = []
    
    for c in cat_cols:
        value = str(input_data.get(c, 'missing')).lower().strip()
        if c in categorical_mapping:
            top_categories = categorical_mapping[c]
            # Create one-hot encoding
            if value in top_categories:
                # This value is in top categories
                cat_features.extend([1 if value == cat else 0 for cat in top_categories])
                cat_features.append(0)  # not "other"
            else:
                # This value is "other"
                cat_features.extend([0] * len(top_categories))
                cat_features.append(1)
        else:
            # No mapping available, skip this feature
            pass
    
    X_categorical = np.array([cat_features])
    
    # Combine all features
    X_combined = sparse.hstack([
        X_text,
        sparse.csr_matrix(X_numeric),
        sparse.csr_matrix(X_date),
        sparse.csr_matrix(X_categorical)
    ]).tocsr()
    
    return X_combined

def get_user_input():
    """Get input from user with clear instructions"""
    print("=" * 50)
    print("ITEM PREDICTION SYSTEM")
    print("=" * 50)
    print("Please provide the following information (press Enter to skip any field):")
    print()
    
    inputs = {}
    
    # Required field
    inputs['ItemDescription'] = input("Item Description (required): ").strip()
    if not inputs['ItemDescription']:
        print("Item Description is required!")
        return None
    
    # Numeric fields
    print("\nNumeric Fields:")
    for field in ['ExtendedQuantity', 'UnitPrice', 'ExtendedPrice', 'invoiceTotal']:
        value = input(f"{field} (optional): ").strip()
        if value:
            inputs[field] = value
        else:
            inputs[field] = '0'  # Default to 0 if not provided
    
    # Date fields
    print("\nDate Fields (format: YYYY-MM-DD or any readable format):")
    for field in ['CONSTRUCTION_START_DATE', 'SUBSTANTIAL_COMPLETION_DATE', 'invoiceDate']:
        value = input(f"{field} (optional): ").strip()
        if value:
            inputs[field] = value
    
    # Categorical fields
    print("\nCategorical Fields:")
    for field in ['PROJECT_CITY', 'STATE', 'PROJECT_COUNTRY', 'CORE_MARKET', 'PROJECT_TYPE', 'UOM']:
        value = input(f"{field} (optional): ").strip()
        if value:
            inputs[field] = value
    
    return inputs

def main():
    """Main function to run the prediction system"""
    try:
        print("Checking available files...")
        available_files, missing_files = check_files()
        
        print("Available files:")
        for file in available_files:
            print(f"  ✓ {file}")
        
        if missing_files:
            print("\nMissing files:")
            for file in missing_files:
                print(f"  ✗ {file}")
        
        # Load all required preprocessing objects
        print("\nLoading preprocessing objects...")
        tfidf_vectorizer = joblib.load('tfidf_vectorizer.pkl')
        numeric_imputer = joblib.load('numeric_imputer.pkl')
        date_imputer = joblib.load('date_imputer.pkl')
        categorical_mapping = joblib.load('categorical_mapping.pkl')
        det_items = joblib.load('deterministic_mapping_full.pkl')
        
        # Load date feature names
        if os.path.exists('date_feature_names.pkl'):
            date_feature_names = joblib.load('date_feature_names.pkl')
        else:
            # Fallback if file doesn't exist
            date_feature_names = [
                'construction_duration_days', 'invoice_year', 'invoice_month', 
                'invoice_day', 'invoice_dayofweek', 'invoice_quarter'
            ]
        
        # Try to load regression model
        regression_available = False
        if 'xgb_regressor_full.pkl' in available_files:
            print("Loading regression model...")
            try:
                xgb_regressor = joblib.load('xgb_regressor_full.pkl')
                regression_available = True
                print("Regression model loaded successfully!")
            except Exception as e:
                print(f"Error loading regression model: {e}")
                regression_available = False
        else:
            print("Regression model not available")
        
        # Try to load classification model
        classification_available = False
        if 'xgb_classifier_full.pkl' in available_files:
            print("Loading classification model...")
            try:
                xgb_classifier = joblib.load('xgb_classifier_full.pkl')
                label_encoder = joblib.load('label_encoder_full.pkl')
                class_mapping = joblib.load('class_mapping_full.pkl')
                classification_available = True
                print("Classification model loaded successfully!")
            except Exception as e:
                print(f"Error loading classification model: {e}")
                classification_available = False
        else:
            print("Classification model not available")
        
        # Get user input
        user_input = get_user_input()
        if user_input is None:
            return
        
        # Prepare features for both models
        print("Preparing features...")
        X_features = prepare_features(user_input, tfidf_vectorizer, numeric_imputer, 
                                     date_imputer, categorical_mapping, date_feature_names)
        
        print(f"Prepared features shape: {X_features.shape}")
        
        # Classification prediction
        cleaned_desc = clean_text_value(user_input['ItemDescription'])
        
        if cleaned_desc in det_items.index:
            master_item_no = det_items[cleaned_desc]
            print(f"Using deterministic mapping for: {cleaned_desc}")
            prediction_method = "deterministic"
        elif classification_available:
            try:
                # Convert to dense for XGBoost
                X_dense = X_features.toarray()
                pred_encoded = xgb_classifier.predict(X_dense)
                pred_processed = label_encoder.inverse_transform(pred_encoded)
                master_item_no = class_mapping.get(pred_processed[0], 'unknown')
                print(f"Using classification model prediction")
                prediction_method = "classification_model"
            except Exception as e:
                print(f"Error in classification prediction: {e}")
                master_item_no = "unknown"
                prediction_method = "error"
        else:
            master_item_no = "unknown"
            prediction_method = "no_model"
            print("Item description not found and classification model not available")
        
        # Regression prediction
        if regression_available:
            try:
                # Convert to dense for XGBoost
                X_dense = X_features.toarray()
                qty_shipped = xgb_regressor.predict(X_dense)[0]
                qty_shipped = max(1, int(qty_shipped))
                print(f"Predicted quantity using regression model: {qty_shipped}")
            except Exception as e:
                print(f"Error in regression prediction: {e}")
                # Fallback: use ExtendedQuantity if available
                extended_qty = clean_numeric_value(user_input.get('ExtendedQuantity', 1))
                qty_shipped = max(1, int(extended_qty)) if extended_qty else 1
                print(f"Using ExtendedQuantity as fallback: {qty_shipped}")
        else:
            # Use ExtendedQuantity as fallback
            extended_qty = clean_numeric_value(user_input.get('ExtendedQuantity', 1))
            qty_shipped = max(1, int(extended_qty)) if extended_qty else 1
            print(f"Using ExtendedQuantity (regression model not available): {qty_shipped}")
        
        # Display results
        print("\n" + "=" * 50)
        print("PREDICTION RESULTS")
        print("=" * 50)
        print(f"Item Description: {user_input['ItemDescription']}")
        print(f"Prediction Method: {prediction_method}")
        print(f"Predicted Master Item No: {master_item_no}")
        print(f"Predicted Quantity Shipped: {qty_shipped}")
        print("=" * 50)
        
    except Exception as e:
        print(f"Error during prediction: {e}")
        print("Full traceback:")
        traceback.print_exc()

if __name__ == "__main__":
    main()