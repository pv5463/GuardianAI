"""Train URL phishing detection model"""
import pandas as pd
import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report
import joblib
import os

def create_synthetic_url_data():
    """Create synthetic URL training data"""
    np.random.seed(42)
    
    # Legitimate URLs
    legit_urls = [
        "https://www.google.com",
        "https://github.com/user/repo",
        "https://stackoverflow.com/questions",
        "https://www.amazon.com/products",
        "https://docs.python.org/3/library",
    ] * 100
    
    # Phishing URLs
    phishing_urls = [
        "http://paypal-verify.tk/login",
        "https://amazon-security.ml/account/update",
        "http://192.168.1.1/bank-login",
        "https://secure-microsoft-account-verify.xyz/confirm",
        "http://apple-id-locked.cf/unlock-now",
    ] * 100
    
    data = []
    for url in legit_urls:
        data.append({'url': url, 'label': 0})
    for url in phishing_urls:
        data.append({'url': url, 'label': 1})
    
    return pd.DataFrame(data)

def train_model():
    """Train and save URL phishing detection model"""
    from utils.feature_extraction import URLFeatureExtractor
    
    print("Creating synthetic URL training data...")
    df = create_synthetic_url_data()
    
    # Save dataset
    os.makedirs('training/data', exist_ok=True)
    df.to_csv('training/data/url_dataset.csv', index=False)
    print(f"Dataset saved: {len(df)} samples")
    
    # Extract features
    print("\nExtracting features...")
    extractor = URLFeatureExtractor()
    features_list = []
    for url in df['url']:
        features_list.append(extractor.extract(url))
    
    X = pd.DataFrame(features_list)
    y = df['label']
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    # Train model
    print("\nTraining Logistic Regression model...")
    model = LogisticRegression(max_iter=1000, random_state=42)
    model.fit(X_train, y_train)
    
    # Evaluate
    y_pred = model.predict(X_test)
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred, target_names=['Safe', 'Phishing']))
    
    # Save model
    os.makedirs('models', exist_ok=True)
    joblib.dump(model, 'models/url_model.pkl')
    joblib.dump(list(X.columns), 'models/url_features.pkl')
    print("\nModel saved to models/url_model.pkl")
    
    return model

if __name__ == "__main__":
    train_model()
