import joblib
import pandas as pd
import numpy as np
import warnings

# Suppress Version Warnings
warnings.filterwarnings('ignore')

try:
    print("Loading numeric_imputer.pkl...")
    numeric_imputer = joblib.load('numeric_imputer.pkl')
    print("numeric_imputer loaded successfully")
    
    # Create dummy data for numeric imputer
    # Based on app.py: ['ExtendedQuantity', 'UnitPrice', 'ExtendedPrice', 'invoiceTotal']
    dummy_numeric = np.array([[10, 20, 30, 40], [0, 0, 0, 0]])
    print("Transforming with numeric_imputer...")
    numeric_imputer.transform(dummy_numeric)
    print("numeric_imputer transform successful")

except Exception as e:
    print(f"Error numeric_imputer: {e}")

try:
    print("Loading date_imputer.pkl...")
    date_imputer = joblib.load('date_imputer.pkl')
    print("date_imputer loaded successfully")

    # Create dummy data for date imputer
    # Based on app.py: 'construction_duration_days', 'invoice_year', ...
    # date_feature_names loaded from disk in app.py
    date_features = ['construction_duration_days', 'invoice_year', 'invoice_month', 'invoice_day', 'invoice_dayofweek', 'invoice_quarter']
    dummy_date = pd.DataFrame(np.zeros((2, 6)), columns=date_features)
    print("Transforming with date_imputer...")
    date_imputer.transform(dummy_date)
    print("date_imputer transform successful")

except Exception as e:
    print(f"Error date_imputer: {e}")
