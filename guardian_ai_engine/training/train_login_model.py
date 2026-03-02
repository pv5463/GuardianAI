"""Train login anomaly detection model"""
import pandas as pd
import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, roc_auc_score
import joblib
import os

def create_synthetic_data():
    """Create synthetic training data for login behavior"""
    np.random.seed(42)
    n_samples = 1000
    
    data = []
    
    # Normal logins (60%)
    for _ in range(600):
        data.append({
            'failed_attempts': np.random.randint(0, 2),
            'country_changed': 0,
            'role_access_attempt': 0,
            'login_gap_minutes': np.random.randint(60, 1440),
            'label': 'normal'
        })
    
    # Brute force attacks (20%)
    for _ in range(200):
        data.append({
            'failed_attempts': np.random.randint(5, 15),
            'country_changed': np.random.choice([0, 1]),
            'role_access_attempt': np.random.randint(0, 2),
            'login_gap_minutes': np.random.randint(1, 10),
            'label': 'brute_force'
        })
    
    # Impossible travel (10%)
    for _ in range(100):
        data.append({
            'failed_attempts': np.random.randint(0, 3),
            'country_changed': 1,
            'role_access_attempt': 0,
            'login_gap_minutes': np.random.randint(5, 60),
            'label': 'impossible_travel'
        })
    
    # Privilege abuse (10%)
    for _ in range(100):
        data.append({
            'failed_attempts': np.random.randint(0, 3),
            'country_changed': np.random.choice([0, 1]),
            'role_access_attempt': np.random.randint(1, 5),
            'login_gap_minutes': np.random.randint(30, 300),
            'label': 'privilege_abuse'
        })
    
    return pd.DataFrame(data)

def train_model():
    """Train and save the login anomaly detection model"""
    print("Creating synthetic training data...")
    df = create_synthetic_data()
    
    # Save dataset
    os.makedirs('training/data', exist_ok=True)
    df.to_csv('training/data/login_behavior_dataset.csv', index=False)
    print(f"Dataset saved: {len(df)} samples")
    
    # Prepare features and labels
    feature_cols = ['failed_attempts', 'country_changed', 'role_access_attempt', 'login_gap_minutes']
    X = df[feature_cols]
    y = df['label']
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
    
    # Train model
    print("\nTraining Logistic Regression model...")
    model = LogisticRegression(max_iter=1000, random_state=42, class_weight='balanced')
    model.fit(X_train, y_train)
    
    # Evaluate
    y_pred = model.predict(X_test)
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred))
    
    # Save model
    os.makedirs('models', exist_ok=True)
    joblib.dump(model, 'models/login_model.pkl')
    joblib.dump(feature_cols, 'models/login_features.pkl')
    print("\nModel saved to models/login_model.pkl")
    
    return model

if __name__ == "__main__":
    train_model()
