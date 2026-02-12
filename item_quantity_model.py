# ============================================================
# Item & Quantity Prediction Model
# Predicts: MasterItemNo (Classification) & QtyShipped (Regression)
# Uses ONLY project context features (no invoice/price data)
# ============================================================

import os
import numpy as np
import pandas as pd
import warnings
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import accuracy_score, f1_score, mean_squared_error, mean_absolute_error, r2_score
import xgboost as xgb
import joblib

warnings.filterwarnings('ignore')

# ============================================================
# 1. CONFIGURATION - FEATURES TO USE
# ============================================================

# Features to EXCLUDE (not predictive - identifiers, outcomes, or targets)
EXCLUDE_FEATURES = [
    'id',                    # Row identifier
    'invoiceId',             # Invoice identifier
    'invoiceDate',           # Outcome timestamp
    'invoiceTotal',          # Derived from item/quantity
    'ExtendedPrice',         # Price outcome
    'UnitPrice',             # Price outcome
    'ItemDescription',       # Target-related (maps to MasterItemNo)
    'ExtendedQuantity',      # Alternative target
    'MasterItemNo',          # Target variable
    'QtyShipped',            # Target variable
]

# Features to KEEP (project context)
KEEP_FEATURES = [
    # Location
    'PROJECT_CITY', 'STATE', 'PROJECT_COUNTRY',
    # Project identification
    'PROJECTNUMBER',
    # Project type
    'CORE_MARKET', 'PROJECT_TYPE',
    # Project size
    'SIZE_BUILDINGSIZE', 'NUMFLOORS', 'NUMROOMS', 'NUMBEDS', 'MW',
    # Timeline
    'CONSTRUCTION_START_DATE', 'SUBSTANTIAL_COMPLETION_DATE',
    # Budget
    'REVISED_ESTIMATE',
    # Units (hints about item category)
    'UOM', 'PriceUOM',
]


# ============================================================
# 2. DATA LOADING AND CLEANING
# ============================================================

def load_data(train_path='train.csv', test_path='test.csv'):
    """Load train and test datasets."""
    print("=" * 70)
    print("LOADING DATA")
    print("=" * 70)
    
    train = pd.read_csv(
        train_path,
        parse_dates=['CONSTRUCTION_START_DATE', 'SUBSTANTIAL_COMPLETION_DATE'],
        date_format='mixed'
    )
    
    test = pd.read_csv(
        test_path,
        parse_dates=['CONSTRUCTION_START_DATE', 'SUBSTANTIAL_COMPLETION_DATE'],
        date_format='mixed'
    )
    
    print(f"Train shape: {train.shape}")
    print(f"Test shape: {test.shape}")
    
    return train, test


def clean_numeric(value):
    """Clean numeric values."""
    if pd.isna(value) or value == '' or value is None:
        return np.nan
    if isinstance(value, (int, float)):
        return float(value)
    
    value = str(value).replace(',', '').strip()
    if value == '' or value == '-':
        return np.nan
    
    try:
        return float(value)
    except:
        return np.nan


# ============================================================
# 3. FEATURE ENGINEERING (Project Context Only)
# ============================================================

def extract_date_features(df, col_name, prefix):
    """Extract features from date column."""
    if col_name not in df.columns:
        return df
    
    df[f'{prefix}_year'] = df[col_name].dt.year.fillna(0).astype(int)
    df[f'{prefix}_month'] = df[col_name].dt.month.fillna(0).astype(int)
    df[f'{prefix}_quarter'] = df[col_name].dt.quarter.fillna(0).astype(int)
    df[f'{prefix}_dayofweek'] = df[col_name].dt.dayofweek.fillna(0).astype(int)
    
    return df


def engineer_features(train_df, test_df):
    """Engineer features using ONLY project context."""
    print("\n" + "=" * 70)
    print("FEATURE ENGINEERING (Project Context Only)")
    print("=" * 70)
    
    # Store targets from training data
    y_master_item = train_df['MasterItemNo'].copy()
    y_qty = train_df['QtyShipped'].copy()
    
    # Store IDs
    train_ids = train_df['id'].copy()
    test_ids = test_df['id'].copy()
    
    # Create product lookup (MasterItemNo -> ItemDescription)
    product_lookup = train_df.groupby('MasterItemNo')['ItemDescription'].first().to_dict()
    
    # Mark datasets
    train_df = train_df.copy()
    test_df = test_df.copy()
    train_df['_is_train'] = 1
    test_df['_is_train'] = 0
    
    # Combine for consistent processing
    combined = pd.concat([train_df, test_df], axis=0, ignore_index=True)
    
    # ===== Date Features =====
    print("Extracting date features...")
    combined = extract_date_features(combined, 'CONSTRUCTION_START_DATE', 'start')
    combined = extract_date_features(combined, 'SUBSTANTIAL_COMPLETION_DATE', 'complete')
    
    # Project duration
    if 'CONSTRUCTION_START_DATE' in combined.columns and 'SUBSTANTIAL_COMPLETION_DATE' in combined.columns:
        combined['project_duration_days'] = (
            combined['SUBSTANTIAL_COMPLETION_DATE'] - combined['CONSTRUCTION_START_DATE']
        ).dt.days.fillna(0)
    
    # ===== Size-based Features =====
    print("Creating size-based features...")
    combined['SIZE_BUILDINGSIZE'] = combined['SIZE_BUILDINGSIZE'].apply(clean_numeric).fillna(0)
    combined['NUMFLOORS'] = combined['NUMFLOORS'].apply(clean_numeric).fillna(0)
    combined['NUMROOMS'] = combined['NUMROOMS'].apply(clean_numeric).fillna(0)
    combined['NUMBEDS'] = combined['NUMBEDS'].apply(clean_numeric).fillna(0)
    combined['MW'] = combined['MW'].apply(clean_numeric).fillna(0)
    combined['REVISED_ESTIMATE'] = combined['REVISED_ESTIMATE'].apply(clean_numeric).fillna(0)
    
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
    
    # ===== Log Transforms =====
    print("Applying log transforms...")
    for col in ['SIZE_BUILDINGSIZE', 'REVISED_ESTIMATE']:
        combined[f'{col}_log'] = np.log1p(combined[col].clip(lower=0))
    
    # ===== Binary Indicators =====
    print("Creating binary indicators...")
    combined['is_large_project'] = (combined['SIZE_BUILDINGSIZE'] > combined['SIZE_BUILDINGSIZE'].quantile(0.75)).astype(int)
    combined['is_multi_floor'] = (combined['NUMFLOORS'] > 1).astype(int)
    combined['has_rooms'] = (combined['NUMROOMS'] > 0).astype(int)
    combined['has_beds'] = (combined['NUMBEDS'] > 0).astype(int)
    
    # ===== Encode Categorical Variables =====
    print("Encoding categorical variables...")
    categorical_cols = ['PROJECTNUMBER', 'PROJECT_CITY', 'STATE', 'PROJECT_COUNTRY', 
                        'CORE_MARKET', 'PROJECT_TYPE', 'UOM', 'PriceUOM']
    
    for col in categorical_cols:
        if col in combined.columns:
            combined[col] = combined[col].fillna('UNKNOWN').astype(str)
            le = LabelEncoder()
            combined[f'{col}_encoded'] = le.fit_transform(combined[col])
    
    # ===== Select Final Features =====
    feature_cols = [
        # Encoded categorical
        'PROJECTNUMBER_encoded', 'PROJECT_CITY_encoded', 'STATE_encoded',
        'PROJECT_COUNTRY_encoded', 'CORE_MARKET_encoded', 'PROJECT_TYPE_encoded',
        'UOM_encoded', 'PriceUOM_encoded',
        # Numeric
        'SIZE_BUILDINGSIZE', 'NUMFLOORS', 'NUMROOMS', 'NUMBEDS', 'MW', 'REVISED_ESTIMATE',
        # Derived
        'size_per_floor', 'rooms_per_floor', 'beds_per_room',
        'SIZE_BUILDINGSIZE_log', 'REVISED_ESTIMATE_log',
        'project_duration_days',
        # Date features
        'start_year', 'start_month', 'start_quarter', 'start_dayofweek',
        'complete_year', 'complete_month', 'complete_quarter', 'complete_dayofweek',
        # Binary
        'is_large_project', 'is_multi_floor', 'has_rooms', 'has_beds',
        # Marker
        '_is_train'
    ]
    
    # Keep only existing columns
    feature_cols = [c for c in feature_cols if c in combined.columns]
    combined = combined[feature_cols]
    
    # ===== Handle Missing Values =====
    print("Handling missing values...")
    for col in combined.columns:
        if col != '_is_train':
            combined[col] = combined[col].replace([np.inf, -np.inf], np.nan)
            combined[col] = combined[col].fillna(0)
    
    # ===== Split Back =====
    is_train_mask = combined['_is_train'] == 1
    X_train = combined[is_train_mask].drop(columns=['_is_train'])
    X_test = combined[~is_train_mask].drop(columns=['_is_train'])
    
    print(f"\nFinal feature shape - Train: {X_train.shape}, Test: {X_test.shape}")
    print(f"Features used: {list(X_train.columns)}")
    
    return X_train, X_test, y_master_item, y_qty, train_ids, test_ids, product_lookup


# ============================================================
# 4. TARGET PREPARATION
# ============================================================

def prepare_targets(y_master_item, y_qty):
    """Prepare target variables."""
    print("\n" + "=" * 70)
    print("PREPARING TARGETS")
    print("=" * 70)
    
    # Classification target: MasterItemNo
    y_master_item = y_master_item.fillna('UNKNOWN').astype(str)
    
    # Handle rare classes (< 2 samples)
    class_counts = y_master_item.value_counts()
    rare_classes = class_counts[class_counts < 2].index.tolist()
    print(f"Rare classes with <2 samples: {len(rare_classes)}")
    
    y_master_grouped = y_master_item.replace(rare_classes, 'RARE_CLASS')
    
    # Encode
    master_encoder = LabelEncoder()
    y_cls = master_encoder.fit_transform(y_master_grouped)
    n_classes = len(master_encoder.classes_)
    print(f"Number of classes: {n_classes}")
    
    # Regression target: QtyShipped
    y_qty = y_qty.apply(clean_numeric)
    y_reg = y_qty.fillna(y_qty.median())
    y_reg = np.clip(y_reg, 0, None)
    
    print(f"QtyShipped range: [{y_reg.min():.2f}, {y_reg.max():.2f}]")
    
    return y_cls, y_reg, master_encoder, n_classes


# ============================================================
# 5. MODEL TRAINING
# ============================================================

def train_classifier(X_train, y_train, X_val, y_val, n_classes):
    """Train XGBoost classifier for MasterItemNo."""
    print("\n" + "=" * 70)
    print("TRAINING CLASSIFIER (MasterItemNo)")
    print("=" * 70)
    
    dtrain = xgb.DMatrix(X_train, label=y_train)
    dval = xgb.DMatrix(X_val, label=y_val)
    
    params = {
        'objective': 'multi:softmax',
        'num_class': n_classes,
        'tree_method': 'hist',
        'max_depth': 8,
        'eta': 0.1,
        'subsample': 0.8,
        'colsample_bytree': 0.8,
        'min_child_weight': 5,
        'seed': 42,
        'verbosity': 1
    }
    
    watchlist = [(dtrain, 'train'), (dval, 'eval')]
    
    clf = xgb.train(
        params, dtrain,
        num_boost_round=300,
        evals=watchlist,
        early_stopping_rounds=30,
        verbose_eval=50
    )
    
    # Evaluate
    y_pred = clf.predict(dval)
    accuracy = accuracy_score(y_val, y_pred)
    f1 = f1_score(y_val, y_pred, average='weighted', zero_division=0)
    
    print(f"\n>>> Classification Metrics:")
    print(f"    Accuracy: {accuracy:.4f}")
    print(f"    F1 Weighted: {f1:.4f}")
    
    return clf, accuracy, clf.best_iteration


def train_regressor(X_train, y_train, X_val, y_val):
    """Train XGBoost regressor for QtyShipped."""
    print("\n" + "=" * 70)
    print("TRAINING REGRESSOR (QtyShipped)")
    print("=" * 70)
    
    dtrain = xgb.DMatrix(X_train, label=y_train)
    dval = xgb.DMatrix(X_val, label=y_val)
    
    params = {
        'objective': 'reg:squarederror',
        'tree_method': 'hist',
        'max_depth': 8,
        'eta': 0.1,
        'subsample': 0.8,
        'colsample_bytree': 0.8,
        'min_child_weight': 5,
        'seed': 42,
        'verbosity': 1
    }
    
    watchlist = [(dtrain, 'train'), (dval, 'eval')]
    
    reg = xgb.train(
        params, dtrain,
        num_boost_round=300,
        evals=watchlist,
        early_stopping_rounds=30,
        verbose_eval=50
    )
    
    # Evaluate
    y_pred = reg.predict(dval)
    rmse = np.sqrt(mean_squared_error(y_val, y_pred))
    mae = mean_absolute_error(y_val, y_pred)
    r2 = r2_score(y_val, y_pred)
    
    print(f"\n>>> Regression Metrics:")
    print(f"    RMSE: {rmse:.4f}")
    print(f"    MAE: {mae:.4f}")
    print(f"    R²: {r2:.4f}")
    
    return reg, rmse, reg.best_iteration


def train_final_models(X_train, y_cls, y_reg, n_classes, best_clf_iter, best_reg_iter):
    """Train final models on full data."""
    print("\n" + "=" * 70)
    print("TRAINING FINAL MODELS ON FULL DATA")
    print("=" * 70)
    
    dtrain_cls = xgb.DMatrix(X_train, label=y_cls)
    dtrain_reg = xgb.DMatrix(X_train, label=y_reg)
    
    # Classifier
    clf_params = {
        'objective': 'multi:softmax',
        'num_class': n_classes,
        'tree_method': 'hist',
        'max_depth': 8,
        'eta': 0.1,
        'subsample': 0.8,
        'colsample_bytree': 0.8,
        'min_child_weight': 5,
        'seed': 42
    }
    
    clf = xgb.train(clf_params, dtrain_cls, num_boost_round=best_clf_iter + 30)
    
    # Regressor
    reg_params = {
        'objective': 'reg:squarederror',
        'tree_method': 'hist',
        'max_depth': 8,
        'eta': 0.1,
        'subsample': 0.8,
        'colsample_bytree': 0.8,
        'min_child_weight': 5,
        'seed': 42
    }
    
    reg = xgb.train(reg_params, dtrain_reg, num_boost_round=best_reg_iter + 30)
    
    print("Final models trained!")
    return clf, reg


# ============================================================
# 6. SAVE MODELS
# ============================================================

def save_models(clf, reg, master_encoder, product_lookup, output_dir='models'):
    """Save models and artifacts."""
    print("\n" + "=" * 70)
    print("SAVING MODELS")
    print("=" * 70)
    
    os.makedirs(output_dir, exist_ok=True)
    
    clf.save_model(os.path.join(output_dir, 'item_classifier.json'))
    reg.save_model(os.path.join(output_dir, 'quantity_regressor.json'))
    joblib.dump(master_encoder, os.path.join(output_dir, 'master_encoder.joblib'))
    joblib.dump(product_lookup, os.path.join(output_dir, 'product_lookup.joblib'))
    
    print(f"Models saved to '{output_dir}/'")
    for f in os.listdir(output_dir):
        size = os.path.getsize(os.path.join(output_dir, f)) / 1024
        print(f"  - {f} ({size:.1f} KB)")


# ============================================================
# 7. MAIN EXECUTION
# ============================================================

if __name__ == "__main__":
    print("=" * 70)
    print("ITEM & QUANTITY PREDICTION MODEL")
    print("Predicts: MasterItemNo (item) & QtyShipped (quantity)")
    print("Using: Project context features ONLY")
    print("=" * 70)
    
    # Load data
    train_df, test_df = load_data()
    
    # Feature engineering
    X_train, X_test, y_master, y_qty, train_ids, test_ids, product_lookup = engineer_features(train_df, test_df)
    
    # Prepare targets
    y_cls, y_reg, master_encoder, n_classes = prepare_targets(y_master, y_qty)
    
    # Train/val split
    X_train = X_train.reset_index(drop=True)
    indices = np.arange(len(X_train))
    train_idx, val_idx = train_test_split(indices, test_size=0.15, random_state=42)
    
    X_tr, X_val = X_train.iloc[train_idx], X_train.iloc[val_idx]
    y_cls_tr, y_cls_val = y_cls[train_idx], y_cls[val_idx]
    y_reg_tr, y_reg_val = y_reg.values[train_idx], y_reg.values[val_idx]
    
    print(f"\nTrain: {len(X_tr)}, Validation: {len(X_val)}")
    
    # Train models
    clf, clf_acc, best_clf = train_classifier(X_tr.values, y_cls_tr, X_val.values, y_cls_val, n_classes)
    reg, reg_rmse, best_reg = train_regressor(X_tr.values, y_reg_tr, X_val.values, y_reg_val)
    
    # Final models
    clf_final, reg_final = train_final_models(X_train.values, y_cls, y_reg.values, n_classes, best_clf, best_reg)
    
    # Save
    save_models(clf_final, reg_final, master_encoder, product_lookup)
    
    # Generate predictions
    print("\n" + "=" * 70)
    print("GENERATING PREDICTIONS")
    print("=" * 70)
    
    dtest = xgb.DMatrix(X_test.values)
    
    test_cls_pred = clf_final.predict(dtest)
    test_master_pred = master_encoder.inverse_transform(test_cls_pred.astype(int))
    
    test_qty_pred = reg_final.predict(dtest)
    test_qty_pred = np.maximum(test_qty_pred, 0).round(2)
    
    # Create submission
    submission = pd.DataFrame({
        'id': test_ids,
        'MasterItemNo': test_master_pred,
        'QtyShipped': test_qty_pred
    })
    
    submission.to_csv('submission.csv', index=False)
    print(f"\nSubmission saved: submission.csv ({len(submission)} rows)")
    print(submission.head(10))
    
    print("\n" + "=" * 70)
    print("COMPLETE!")
    print("=" * 70)
