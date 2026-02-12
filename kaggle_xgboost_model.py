# ============================================================
# XGBoost GPU Model for CTAI CTD Hackathon
# Predicts: MasterItemNo (Multi-class Classification) & QtyShipped (Regression)
# FIXED: Compatible with modern XGBoost GPU configuration
# ============================================================

import os
import numpy as np
import pandas as pd
import warnings
import re
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import accuracy_score, f1_score, mean_squared_error, mean_absolute_error, r2_score
import xgboost as xgb
import joblib

warnings.filterwarnings('ignore')

# ============================================================
# 1. DATA LOADING AND CLEANING FUNCTIONS
# ============================================================

def clean_numeric_value(value):
    """Clean numeric values - handles commas, currency symbols, trailing characters."""
    if pd.isna(value) or value == '' or value is None:
        return np.nan
    if isinstance(value, (int, float)):
        return float(value)
    
    value = str(value)
    
    # Handle newlines - return default
    if '\n' in value:
        return np.nan
    
    # Remove commas
    value = value.replace(',', '')
    
    # Remove trailing dashes
    while value.endswith('-'):
        value = value[:-1]
    
    # Handle EA suffix (e.g., "100 EA")
    if ' EA' in value.upper():
        value = value.upper().replace(' EA', '').strip()
    
    # Remove currency symbols and other non-numeric chars (keep digits, dots, minus)
    value = re.sub(r'[^\d.\-]', '', value)
    
    # Handle empty string after cleaning
    if value == '' or value == '-':
        return np.nan
    
    try:
        return float(value)
    except:
        return np.nan


def load_data():
    """Load train and test datasets."""
    print("=" * 70)
    print("LOADING DATA")
    print("=" * 70)
    
    train_path = '/kaggle/input/ctai-ctd-hackathon/train.csv'
    test_path = '/kaggle/input/ctai-ctd-hackathon/test.csv'
    
    # Load with date parsing
    train = pd.read_csv(
        train_path,
        parse_dates=['CONSTRUCTION_START_DATE', 'SUBSTANTIAL_COMPLETION_DATE', 'invoiceDate'],
        date_format='mixed'
    )
    
    test = pd.read_csv(
        test_path,
        parse_dates=['CONSTRUCTION_START_DATE', 'SUBSTANTIAL_COMPLETION_DATE', 'invoiceDate'],
        date_format='mixed'
    )
    
    print(f"Train shape: {train.shape}")
    print(f"Test shape: {test.shape}")
    print(f"Train columns: {list(train.columns)}")
    
    return train, test


def clean_data(df, is_train=True):
    """Clean and preprocess a single dataframe."""
    df = df.copy()
    
    # ===== Clean Numeric Columns =====
    numeric_cols_to_clean = [
        'invoiceTotal', 'UnitPrice', 'ExtendedPrice', 'ExtendedQuantity',
        'SIZE_BUILDINGSIZE', 'NUMFLOORS', 'NUMROOMS', 'NUMBEDS',
        'REVISED_ESTIMATE', 'MW'
    ]
    
    for col in numeric_cols_to_clean:
        if col in df.columns:
            df[col] = df[col].apply(clean_numeric_value)
    
    # Clean QtyShipped for training data
    if is_train and 'QtyShipped' in df.columns:
        df['QtyShipped'] = df['QtyShipped'].apply(clean_numeric_value)
    
    return df


# ============================================================
# 2. FEATURE ENGINEERING
# ============================================================

def extract_date_features(df, col_name, prefix):
    """Extract multiple features from a date column."""
    if col_name not in df.columns:
        return df
    
    df[f'{prefix}_year'] = df[col_name].dt.year.fillna(0).astype(int)
    df[f'{prefix}_month'] = df[col_name].dt.month.fillna(0).astype(int)
    df[f'{prefix}_quarter'] = df[col_name].dt.quarter.fillna(0).astype(int)
    df[f'{prefix}_dayofweek'] = df[col_name].dt.dayofweek.fillna(0).astype(int)
    df[f'{prefix}_day'] = df[col_name].dt.day.fillna(0).astype(int)
    
    return df


def engineer_features(train_df, test_df):
    """Engineer features for both train and test datasets."""
    print("\n" + "=" * 70)
    print("FEATURE ENGINEERING")
    print("=" * 70)
    
    # Store targets
    y_master_item = train_df['MasterItemNo'].copy()
    y_qty = train_df['QtyShipped'].copy()
    
    # Store IDs
    train_ids = train_df['id'].copy()
    test_ids = test_df['id'].copy()
    
    # Mark datasets
    train_df['_is_train'] = 1
    test_df['_is_train'] = 0
    
    # Drop targets from train for combining
    train_df = train_df.drop(columns=['MasterItemNo', 'QtyShipped'], errors='ignore')
    
    # Combine for consistent processing
    combined = pd.concat([train_df, test_df], axis=0, ignore_index=True)
    
    # ===== EXCLUDED FEATURES (Not predictive) =====
    # Drop invoice-related and price features - they are outcomes, not predictors
    exclude_cols = ['invoiceId', 'invoiceDate', 'invoiceTotal', 
                    'UnitPrice', 'ExtendedPrice', 'ExtendedQuantity',
                    'ItemDescription']  # ItemDescription maps to target
    combined = combined.drop(columns=[c for c in exclude_cols if c in combined.columns], errors='ignore')
    print(f"Excluded features: {exclude_cols}")
    
    # ===== Date Features (Project Timeline Only) =====
    print("Extracting project date features...")
    combined = extract_date_features(combined, 'CONSTRUCTION_START_DATE', 'start')
    combined = extract_date_features(combined, 'SUBSTANTIAL_COMPLETION_DATE', 'complete')
    
    # Project duration
    if 'CONSTRUCTION_START_DATE' in combined.columns and 'SUBSTANTIAL_COMPLETION_DATE' in combined.columns:
        combined['project_duration_days'] = (
            combined['SUBSTANTIAL_COMPLETION_DATE'] - combined['CONSTRUCTION_START_DATE']
        ).dt.days
        combined['project_duration_days'] = combined['project_duration_days'].fillna(0)
    
    # Drop original date columns
    date_cols = ['CONSTRUCTION_START_DATE', 'SUBSTANTIAL_COMPLETION_DATE']
    combined = combined.drop(columns=date_cols, errors='ignore')
    
    # ===== Size-based Features (Project Context) =====
    print("Creating project size features...")
    combined['size_per_floor'] = np.where(
        combined['NUMFLOORS'] > 0,
        combined['SIZE_BUILDINGSIZE'] / combined['NUMFLOORS'],
        combined['SIZE_BUILDINGSIZE']
    )
    combined['rooms_per_floor'] = np.where(
        combined['NUMFLOORS'] > 0,
        combined['NUMROOMS'] / combined['NUMFLOORS'],
        combined['NUMROOMS']
    )
    combined['beds_per_room'] = np.where(
        combined['NUMROOMS'] > 0,
        combined['NUMBEDS'] / combined['NUMROOMS'],
        combined['NUMBEDS']
    )
    combined['mw_per_sqft'] = np.where(
        combined['SIZE_BUILDINGSIZE'] > 0,
        combined['MW'] / combined['SIZE_BUILDINGSIZE'],
        0
    )
    
    # ===== Log Transforms for Skewed Features =====
    print("Applying log transforms...")
    log_cols = ['SIZE_BUILDINGSIZE', 'REVISED_ESTIMATE']
    for col in log_cols:
        if col in combined.columns:
            combined[f'{col}_log'] = np.log1p(combined[col].fillna(0).clip(lower=0))
    
    # ===== Binary Indicators (Project Context) =====
    print("Creating binary indicators...")
    combined['is_large_project'] = (combined['SIZE_BUILDINGSIZE'] > combined['SIZE_BUILDINGSIZE'].quantile(0.75)).astype(int)
    combined['is_multi_floor'] = (combined['NUMFLOORS'] > 1).astype(int)
    combined['has_many_rooms'] = (combined['NUMROOMS'] > combined['NUMROOMS'].quantile(0.75)).astype(int)
    combined['has_beds'] = (combined['NUMBEDS'] > 0).astype(int)
    
    # ===== Encode Categorical Variables (Project Context Only) =====
    print("Encoding categorical variables...")
    # REMOVED: invoiceId (not predictive)
    categorical_cols = ['PROJECTNUMBER', 'PROJECT_CITY', 'STATE', 'PROJECT_COUNTRY', 
                        'CORE_MARKET', 'PROJECT_TYPE', 'UOM', 'PriceUOM']
    
    label_encoders = {}
    for col in categorical_cols:
        if col in combined.columns:
            combined[col] = combined[col].fillna('UNKNOWN').astype(str)
            le = LabelEncoder()
            combined[f'{col}_encoded'] = le.fit_transform(combined[col])
            label_encoders[col] = le
            combined = combined.drop(columns=[col])
    
    # ===== Handle Remaining Object Columns =====
    object_cols = combined.select_dtypes(include=['object']).columns.tolist()
    for col in object_cols:
        if col != '_is_train':
            combined = combined.drop(columns=[col], errors='ignore')
    
    # ===== Handle Missing Values =====
    print("Handling missing values...")
    numeric_cols = combined.select_dtypes(include=[np.number]).columns
    for col in numeric_cols:
        if col != '_is_train':
            combined[col] = combined[col].replace([np.inf, -np.inf], np.nan)
            combined[col] = combined[col].fillna(combined[col].median())
    
    # ===== Split Back to Train/Test =====
    is_train_mask = combined['_is_train'] == 1
    X_train = combined[is_train_mask].drop(columns=['id', '_is_train'], errors='ignore')
    X_test = combined[~is_train_mask].drop(columns=['id', '_is_train'], errors='ignore')
    
    # Ensure same columns
    common_cols = X_train.columns.intersection(X_test.columns)
    X_train = X_train[common_cols]
    X_test = X_test[common_cols]
    
    # Final NaN/Inf check
    X_train = X_train.fillna(0).replace([np.inf, -np.inf], 0)
    X_test = X_test.fillna(0).replace([np.inf, -np.inf], 0)
    
    print(f"\nFinal feature shape - Train: {X_train.shape}, Test: {X_test.shape}")
    print(f"Features used (project context only): {list(X_train.columns)}")
    
    return X_train, X_test, y_master_item, y_qty, train_ids, test_ids


# ============================================================
# 3. TARGET PREPARATION - FIXED FOR RARE CLASSES
# ============================================================

def prepare_targets(y_master_item, y_qty, X_train):
    """Prepare and encode target variables with handling for rare classes."""
    print("\n" + "=" * 70)
    print("PREPARING TARGETS")
    print("=" * 70)
    
    # ===== Classification Target =====
    # Fill missing MasterItemNo with 'UNKNOWN'
    y_master_item = y_master_item.fillna('UNKNOWN').astype(str)
    
    # Count class frequencies
    class_counts = y_master_item.value_counts()
    
    # Filter rare classes (less than 2 samples) - map to 'RARE_CLASS'
    rare_classes = class_counts[class_counts < 2].index.tolist()
    print(f"Found {len(rare_classes)} rare classes with <2 samples, grouping them...")
    
    y_master_item_grouped = y_master_item.copy()
    y_master_item_grouped = y_master_item_grouped.replace(rare_classes, 'RARE_CLASS')
    
    # Encode MasterItemNo
    master_encoder = LabelEncoder()
    y_cls_encoded = master_encoder.fit_transform(y_master_item_grouped)
    
    n_classes = len(master_encoder.classes_)
    print(f"Number of unique MasterItemNo classes (after grouping): {n_classes}")
    
    # Show class distribution
    class_counts_encoded = pd.Series(y_cls_encoded).value_counts()
    print(f"Class distribution - Min: {class_counts_encoded.min()}, Max: {class_counts_encoded.max()}, Median: {class_counts_encoded.median()}")
    
    # ===== Regression Target =====
    y_reg = y_qty.copy()
    y_reg = y_reg.fillna(y_reg.median())
    y_reg = np.clip(y_reg, 0, None)  # Ensure non-negative
    
    print(f"QtyShipped range: [{y_reg.min():.2f}, {y_reg.max():.2f}]")
    print(f"QtyShipped mean: {y_reg.mean():.2f}, median: {y_reg.median():.2f}")
    
    # Store original labels for final prediction mapping
    return y_cls_encoded, y_reg, master_encoder, y_master_item


# ============================================================
# 4. MODEL TRAINING - FIXED FOR MODERN XGBOOST GPU
# ============================================================

def train_classifier(X_train, y_train, X_val, y_val, n_classes):
    """Train XGBoost classifier for MasterItemNo prediction using DMatrix."""
    print("\n" + "=" * 70)
    print("TRAINING XGBOOST CLASSIFIER (MasterItemNo)")
    print("=" * 70)
    
    # Create DMatrix with GPU support
    dtrain = xgb.DMatrix(X_train, label=y_train)
    dval = xgb.DMatrix(X_val, label=y_val)
    
    # Parameters for multi-class classification - FIXED for modern XGBoost
    params = {
        'objective': 'multi:softmax',
        'num_class': n_classes,
        'tree_method': 'hist',  # Changed from 'gpu_hist'
        'device': 'cuda',  # Added: explicit GPU device specification
        'max_depth': 10,
        'eta': 0.05,
        'subsample': 0.8,
        'colsample_bytree': 0.8,
        'min_child_weight': 3,
        'gamma': 0.1,
        'alpha': 0.1,
        'lambda': 1.0,
        'seed': 42,
        'verbosity': 1
    }
    
    watchlist = [(dtrain, 'train'), (dval, 'eval')]
    
    print("Training classifier...")
    clf = xgb.train(
        params,
        dtrain,
        num_boost_round=500,
        evals=watchlist,
        early_stopping_rounds=50,
        verbose_eval=100
    )
    
    # Evaluate
    y_val_pred = clf.predict(dval)
    accuracy = accuracy_score(y_val, y_val_pred)
    f1_macro = f1_score(y_val, y_val_pred, average='macro', zero_division=0)
    f1_weighted = f1_score(y_val, y_val_pred, average='weighted', zero_division=0)
    
    print(f"\n>>> Classification Validation Metrics:")
    print(f"    Accuracy: {accuracy:.4f}")
    print(f"    F1 Macro: {f1_macro:.4f}")
    print(f"    F1 Weighted: {f1_weighted:.4f}")
    
    return clf, accuracy, clf.best_iteration


def train_regressor(X_train, y_train, X_val, y_val):
    """Train XGBoost regressor for QtyShipped prediction using DMatrix."""
    print("\n" + "=" * 70)
    print("TRAINING XGBOOST REGRESSOR (QtyShipped)")
    print("=" * 70)
    
    # Create DMatrix with GPU support
    dtrain = xgb.DMatrix(X_train, label=y_train)
    dval = xgb.DMatrix(X_val, label=y_val)
    
    # Parameters for regression - FIXED for modern XGBoost
    params = {
        'objective': 'reg:squarederror',
        'tree_method': 'hist',  # Changed from 'gpu_hist'
        'device': 'cuda',  # Added: explicit GPU device specification
        'max_depth': 10,
        'eta': 0.05,
        'subsample': 0.8,
        'colsample_bytree': 0.8,
        'min_child_weight': 3,
        'gamma': 0.1,
        'alpha': 0.1,
        'lambda': 1.0,
        'seed': 42,
        'verbosity': 1
    }
    
    watchlist = [(dtrain, 'train'), (dval, 'eval')]
    
    print("Training regressor...")
    reg = xgb.train(
        params,
        dtrain,
        num_boost_round=500,
        evals=watchlist,
        early_stopping_rounds=50,
        verbose_eval=100
    )
    
    # Evaluate
    y_val_pred = reg.predict(dval)
    rmse = np.sqrt(mean_squared_error(y_val, y_val_pred))
    mae = mean_absolute_error(y_val, y_val_pred)
    r2 = r2_score(y_val, y_val_pred)
    
    print(f"\n>>> Regression Validation Metrics:")
    print(f"    RMSE: {rmse:.4f}")
    print(f"    MAE: {mae:.4f}")
    print(f"    R² Score: {r2:.4f}")
    
    return reg, rmse, reg.best_iteration


def train_final_models(X_train, y_cls, y_reg, n_classes, best_clf_iter, best_reg_iter):
    """Train final models on full training data using DMatrix."""
    print("\n" + "=" * 70)
    print("TRAINING FINAL MODELS ON FULL DATA")
    print("=" * 70)
    
    # Create DMatrix for full training data
    dtrain_cls = xgb.DMatrix(X_train, label=y_cls)
    dtrain_reg = xgb.DMatrix(X_train, label=y_reg)
    
    # Final Classifier - FIXED for modern XGBoost
    clf_params = {
        'objective': 'multi:softmax',
        'num_class': n_classes,
        'tree_method': 'hist',  # Changed from 'gpu_hist'
        'device': 'cuda',  # Added: explicit GPU device specification
        'max_depth': 10,
        'eta': 0.05,
        'subsample': 0.8,
        'colsample_bytree': 0.8,
        'min_child_weight': 3,
        'gamma': 0.1,
        'alpha': 0.1,
        'lambda': 1.0,
        'seed': 42,
        'verbosity': 1
    }
    
    print(f"Training final classifier ({best_clf_iter + 50} rounds)...")
    clf_final = xgb.train(
        clf_params,
        dtrain_cls,
        num_boost_round=best_clf_iter + 50,
        verbose_eval=100
    )
    
    # Final Regressor - FIXED for modern XGBoost
    reg_params = {
        'objective': 'reg:squarederror',
        'tree_method': 'hist',  # Changed from 'gpu_hist'
        'device': 'cuda',  # Added: explicit GPU device specification
        'max_depth': 10,
        'eta': 0.05,
        'subsample': 0.8,
        'colsample_bytree': 0.8,
        'min_child_weight': 3,
        'gamma': 0.1,
        'alpha': 0.1,
        'lambda': 1.0,
        'seed': 42,
        'verbosity': 1
    }
    
    print(f"Training final regressor ({best_reg_iter + 50} rounds)...")
    reg_final = xgb.train(
        reg_params,
        dtrain_reg,
        num_boost_round=best_reg_iter + 50,
        verbose_eval=100
    )
    
    print("Final training complete!")
    
    return clf_final, reg_final


def save_models(clf, reg, master_encoder, product_lookup, output_dir='models'):
    """Save trained models and artifacts for later use."""
    print("\n" + "=" * 70)
    print("SAVING MODELS")
    print("=" * 70)
    
    # Create models directory if it doesn't exist
    os.makedirs(output_dir, exist_ok=True)
    
    # Save XGBoost models in native JSON format (recommended)
    clf_path = os.path.join(output_dir, 'xgb_classifier_masteritemno.json')
    reg_path = os.path.join(output_dir, 'xgb_regressor_qtyshipped.json')
    clf.save_model(clf_path)
    reg.save_model(reg_path)
    print(f"Saved XGBoost classifier to: {clf_path}")
    print(f"Saved XGBoost regressor to: {reg_path}")
    
    # Save label encoder
    encoder_path = os.path.join(output_dir, 'label_encoder.joblib')
    joblib.dump(master_encoder, encoder_path)
    print(f"Saved label encoder to: {encoder_path}")
    
    # Save product lookup dictionary
    lookup_path = os.path.join(output_dir, 'product_lookup.joblib')
    joblib.dump(product_lookup, lookup_path)
    print(f"Saved product lookup to: {lookup_path}")
    
    print(f"\nAll models saved to '{output_dir}/' directory:")
    for f in os.listdir(output_dir):
        file_path = os.path.join(output_dir, f)
        size_kb = os.path.getsize(file_path) / 1024
        print(f"  - {f} ({size_kb:.1f} KB)")
    
    return clf_path, reg_path, encoder_path, lookup_path


def load_models(model_dir='models'):
    """Load saved models and artifacts."""
    print("Loading saved models...")
    
    # Load XGBoost models
    clf = xgb.Booster()
    clf.load_model(os.path.join(model_dir, 'xgb_classifier_masteritemno.json'))
    
    reg = xgb.Booster()
    reg.load_model(os.path.join(model_dir, 'xgb_regressor_qtyshipped.json'))
    
    # Load label encoder and product lookup
    master_encoder = joblib.load(os.path.join(model_dir, 'label_encoder.joblib'))
    product_lookup = joblib.load(os.path.join(model_dir, 'product_lookup.joblib'))
    
    print("Models loaded successfully!")
    return clf, reg, master_encoder, product_lookup


# ============================================================
# 5. CREATE MASTERITEMNO -> ITEMDESCRIPTION MAPPING
# ============================================================

def create_product_lookup(train_df):
    """Create mapping from MasterItemNo to ItemDescription for IndiaMART search."""
    print("\n" + "=" * 70)
    print("CREATING PRODUCT LOOKUP TABLE")
    print("=" * 70)
    
    # Get most common ItemDescription for each MasterItemNo
    mapping = train_df.groupby('MasterItemNo')['ItemDescription'].agg(
        lambda x: x.mode().iloc[0] if len(x.mode()) > 0 else x.iloc[0]
    ).to_dict()
    
    print(f"Created mapping for {len(mapping)} unique MasterItemNo values")
    print("\nSample mappings:")
    for i, (master, desc) in enumerate(list(mapping.items())[:5]):
        print(f"  {master} -> {str(desc)[:50]}...")
    
    return mapping


# ============================================================
# 6. MAIN EXECUTION
# ============================================================

if __name__ == "__main__":
    print("=" * 70)
    print("CTAI CTD HACKATHON - XGBoost GPU Solution")
    print("Predicting: MasterItemNo (Classification) & QtyShipped (Regression)")
    print("With Product Name Lookup for IndiaMART Search")
    print("=" * 70)
    
    # ----- Load Data -----
    train_df, test_df = load_data()
    
    # ----- Create Product Lookup BEFORE cleaning -----
    # (Need original ItemDescription and MasterItemNo)
    product_lookup = create_product_lookup(train_df)
    
    # ----- Clean Data -----
    print("\n" + "=" * 70)
    print("CLEANING DATA")
    print("=" * 70)
    train_df = clean_data(train_df, is_train=True)
    test_df = clean_data(test_df, is_train=False)
    
    # Drop rows with missing QtyShipped (can't train on these)
    train_df_clean = train_df.dropna(subset=['QtyShipped'])
    print(f"Training samples after dropping NaN QtyShipped: {len(train_df_clean)}")
    
    # ----- Feature Engineering -----
    X_train, X_test, y_master_item, y_qty, train_ids, test_ids = engineer_features(train_df_clean, test_df)
    
    # ----- Prepare Targets with Rare Class Handling -----
    y_cls_encoded, y_reg, master_encoder, y_original = prepare_targets(y_master_item, y_qty, X_train)
    n_classes = len(master_encoder.classes_)
    
    # ----- Train/Validation Split -----
    print("\n" + "=" * 70)
    print("CREATING TRAIN/VALIDATION SPLIT")
    print("=" * 70)
    
    # Reset index for proper alignment
    X_train = X_train.reset_index(drop=True)
    y_cls_encoded = np.array(y_cls_encoded)
    y_reg = np.array(y_reg)
    
    # Split indices
    indices = np.arange(len(X_train))
    train_idx, val_idx = train_test_split(indices, test_size=0.15, random_state=42, shuffle=True)
    
    X_train_split = X_train.iloc[train_idx]
    X_val = X_train.iloc[val_idx]
    y_cls_train = y_cls_encoded[train_idx]
    y_cls_val = y_cls_encoded[val_idx]
    y_reg_train = y_reg[train_idx]
    y_reg_val = y_reg[val_idx]
    
    print(f"Training set: {len(X_train_split)} samples")
    print(f"Validation set: {len(X_val)} samples")
    
    # ----- Train Classifier -----
    clf, clf_accuracy, best_clf_iter = train_classifier(X_train_split.values, y_cls_train, X_val.values, y_cls_val, n_classes)
    
    # ----- Train Regressor -----
    reg, reg_rmse, best_reg_iter = train_regressor(X_train_split.values, y_reg_train, X_val.values, y_reg_val)
    
    # ----- Train Final Models on Full Data -----
    clf_final, reg_final = train_final_models(X_train.values, y_cls_encoded, y_reg, n_classes, best_clf_iter, best_reg_iter)
    
    # ----- Save Models -----
    save_models(clf_final, reg_final, master_encoder, product_lookup)
    
    # ----- Generate Predictions -----
    print("\n" + "=" * 70)
    print("GENERATING PREDICTIONS")
    print("=" * 70)
    
    # Create DMatrix for test data
    dtest = xgb.DMatrix(X_test.values)
    
    # Predict MasterItemNo
    test_cls_pred = clf_final.predict(dtest)
    test_master_item_pred = master_encoder.inverse_transform(test_cls_pred.astype(int))
    
    # Predict QtyShipped
    test_qty_pred = reg_final.predict(dtest)
    test_qty_pred = np.maximum(test_qty_pred, 0)  # Ensure non-negative
    test_qty_pred = np.round(test_qty_pred, 2)
    
    print(f"Predictions generated for {len(test_ids)} test samples")
    
    # ----- Lookup Product Names for IndiaMART -----
    print("\n" + "=" * 70)
    print("LOOKING UP PRODUCT NAMES FOR INDIAMART SEARCH")
    print("=" * 70)
    
    # Map MasterItemNo to ItemDescription
    product_names = []
    for master_item in test_master_item_pred:
        if master_item in product_lookup:
            product_names.append(product_lookup[master_item])
        else:
            product_names.append(f"Unknown product: {master_item}")
    
    print(f"Mapped {len(product_names)} products for IndiaMART search")
    
    # ----- Create Submission File -----
    print("\n" + "=" * 70)
    print("CREATING SUBMISSION FILE")
    print("=" * 70)
    
    submission = pd.DataFrame({
        'id': test_ids,
        'MasterItemNo': test_master_item_pred,
        'QtyShipped': test_qty_pred
    })
    
    # Validate submission
    assert submission['id'].notna().all(), "id has NaN values!"
    assert submission['MasterItemNo'].notna().all(), "MasterItemNo has NaN values!"
    assert submission['QtyShipped'].notna().all(), "QtyShipped has NaN values!"
    assert (submission['QtyShipped'] >= 0).all(), "QtyShipped has negative values!"
    
    # Save submission for Kaggle
    submission_path = 'submission.csv'
    submission.to_csv(submission_path, index=False)
    
    print(f"\nSubmission saved to: {submission_path}")
    print(f"Shape: {submission.shape}")
    
    # ----- Create IndiaMART Search File -----
    print("\n" + "=" * 70)
    print("CREATING INDIAMART SEARCH FILE")
    print("=" * 70)
    
    indiamart_df = pd.DataFrame({
        'id': test_ids,
        'MasterItemNo': test_master_item_pred,
        'ProductName_for_IndiaMART': product_names,
        'Quantity': test_qty_pred
    })
    
    # Clean product names for search (remove newlines)
    indiamart_df['ProductName_for_IndiaMART'] = indiamart_df['ProductName_for_IndiaMART'].str.replace('\n', ' ', regex=False)
    indiamart_df['ProductName_for_IndiaMART'] = indiamart_df['ProductName_for_IndiaMART'].str.strip()
    
    indiamart_path = 'indiamart_search.csv'
    indiamart_df.to_csv(indiamart_path, index=False)
    
    print(f"IndiaMART search file saved to: {indiamart_path}")
    print(f"\nSample IndiaMART search data (first 10 rows):")
    print(indiamart_df[['ProductName_for_IndiaMART', 'Quantity']].head(10).to_string(index=False))
    
    # ----- Summary Statistics -----
    print("\n" + "=" * 70)
    print("SUBMISSION SUMMARY")
    print("=" * 70)
    
    print(f"Total test samples: {len(submission)}")
    print(f"Unique MasterItemNo values: {submission['MasterItemNo'].nunique()}")
    print(f"QtyShipped range: [{submission['QtyShipped'].min():.2f}, {submission['QtyShipped'].max():.2f}]")
    print(f"QtyShipped mean: {submission['QtyShipped'].mean():.2f}")
    print(f"QtyShipped median: {submission['QtyShipped'].median():.2f}")
    
    print("\nFirst 10 predictions:")
    print(submission.head(10))
    
    print("\nMasterItemNo distribution (top 10):")
    print(submission['MasterItemNo'].value_counts().head(10))
    
    # ----- Feature Importance -----
    print("\n" + "=" * 70)
    print("TOP 20 IMPORTANT FEATURES (Classification)")
    print("=" * 70)
    
    importance_dict = clf_final.get_score(importance_type='gain')
    feature_importance = pd.DataFrame({
        'feature': list(importance_dict.keys()),
        'importance': list(importance_dict.values())
    }).sort_values('importance', ascending=False)
    
    print(feature_importance.head(20).to_string(index=False))
    
    print("\n" + "=" * 70)
    print("COMPLETE!")
    print("Files saved:")
    print(f"  1. submission.csv - For Kaggle submission")
    print(f"  2. indiamart_search.csv - Product names + quantities for IndiaMART search")
    print("=" * 70)