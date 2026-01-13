import pandas as pd
import numpy as np
import joblib
from sklearn.impute import SimpleImputer
import warnings

warnings.filterwarnings('ignore')

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

def prepare_date_features(df, date_feature_names):
    """Prepare date features from dataframe"""
    date_features_list = []
    
    for _, row in df.iterrows():
        feats = {}
        # Construction duration
        try:
            start_str = row.get('CONSTRUCTION_START_DATE', '')
            end_str = row.get('SUBSTANTIAL_COMPLETION_DATE', '')
            if pd.notna(start_str) and pd.notna(end_str):
                start_date = pd.to_datetime(start_str, errors='coerce')
                end_date = pd.to_datetime(end_str, errors='coerce')
                if not pd.isna(start_date) and not pd.isna(end_date):
                    duration = (end_date - start_date).days
                    feats['construction_duration_days'] = duration
        except:
            pass
            
        # Invoice date features
        try:
            invoice_str = row.get('invoiceDate', '')
            if pd.notna(invoice_str):
                invoice_date = pd.to_datetime(invoice_str, errors='coerce')
                if not pd.isna(invoice_date):
                    feats['invoice_year'] = invoice_date.year
                    feats['invoice_month'] = invoice_date.month
                    feats['invoice_day'] = invoice_date.day
                    feats['invoice_dayofweek'] = invoice_date.dayofweek
                    feats['invoice_quarter'] = invoice_date.quarter
        except:
            pass
            
        # Fill row
        row_data = []
        for feature in date_feature_names:
            row_data.append(feats.get(feature, np.nan))
        date_features_list.append(row_data)
        
    return np.array(date_features_list)

def main():
    print("Loading data...")
    df = pd.read_csv('clean_train_full.csv')
    
    # 1. Retrain Numeric Imputer
    print("\nRetraining Numeric Imputer...")
    numeric_features = ['ExtendedQuantity', 'UnitPrice', 'ExtendedPrice', 'invoiceTotal']
    
    # Extract and clean numeric values
    numeric_data = []
    for _, row in df.iterrows():
        row_vals = []
        for feat in numeric_features:
            val = row.get(feat, 0)
            cleaned = clean_numeric_value(val, replace_zero_epsilon=(feat in ['UnitPrice', 'ExtendedPrice']))
            if cleaned is None or np.isnan(cleaned):
                cleaned = 0
            row_vals.append(cleaned)
        numeric_data.append(row_vals)
    
    numeric_data = np.array(numeric_data)
    
    # Apply log1p (as done in run.py)
    # Note: run.py does: numeric_values = [np.log1p(x) if x >= 0 else 0 for x in numeric_values]
    # We apply this vector-wise
    numeric_data = np.where(numeric_data >= 0, np.log1p(numeric_data), 0)
    
    # Initialize and fit SimpleImputer
    # Assuming mean strategy (default) or check original if possible. 
    # Usually SimpleImputer() defaults to mean. Let's stick to default which is robust.
    numeric_imputer = SimpleImputer(strategy='mean')
    numeric_imputer.fit(numeric_data)
    
    print("Saving numeric_imputer.pkl...")
    joblib.dump(numeric_imputer, 'numeric_imputer.pkl')
    print("Done.")

    # 2. Retrain Date Imputer
    print("\nRetraining Date Imputer...")
    
    # Load date feature names if available, else define them
    try:
        date_feature_names = joblib.load('date_feature_names.pkl')
    except:
        date_feature_names = [
            'construction_duration_days', 'invoice_year', 'invoice_month', 
            'invoice_day', 'invoice_dayofweek', 'invoice_quarter'
        ]
        
    X_date = prepare_date_features(df, date_feature_names)
    
    # Fit SimpleImputer
    date_imputer = SimpleImputer(strategy='mean')
    date_imputer.fit(X_date)
    
    print("Saving date_imputer.pkl...")
    joblib.dump(date_imputer, 'date_imputer.pkl')
    print("Done.")

if __name__ == "__main__":
    main()
