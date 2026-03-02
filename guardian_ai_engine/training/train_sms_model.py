"""Train SMS scam detection model"""
import pandas as pd
import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report
import joblib
import os
import sys
from pathlib import Path

# Add parent directory to path
parent_dir = Path(__file__).parent.parent
sys.path.insert(0, str(parent_dir))

def create_synthetic_sms_data():
    """Create synthetic SMS training data"""
    np.random.seed(42)
    
    # Legitimate messages
    legit_messages = [
        "Hi, are you free for dinner tonight?",
        "Meeting scheduled for 3pm tomorrow",
        "Thanks for your help today",
        "Can you pick up milk on your way home?",
        "Happy birthday! Hope you have a great day",
    ] * 100
    
    # Scam messages
    scam_messages = [
        "URGENT! Your bank account has been suspended. Click here immediately to verify: http://fake-bank.tk",
        "Congratulations! You've won $5000 cash prize! Claim now at www.scam-prize.ml",
        "FINAL NOTICE: Your payment is overdue. Act now to avoid legal action. Call immediately!",
        "Your Amazon account will be blocked. Verify your card details here urgently.",
        "FREE MONEY! Limited time offer! Click this link now to claim your reward!",
    ] * 100
    
    # Create dataframe
    data = []
    for msg in legit_messages:
        data.append({'text': msg, 'label': 0})
    for msg in scam_messages:
        data.append({'text': msg, 'label': 1})
    
    return pd.DataFrame(data)

def train_model():
    """Train and save SMS scam detection model"""
    from utils.feature_extraction import SMSFeatureExtractor
    
    print("Creating synthetic SMS training data...")
    df = create_synthetic_sms_data()
    
    # Save dataset
    os.makedirs('training/data', exist_ok=True)
    df.to_csv('training/data/sms_dataset.csv', index=False)
    print(f"Dataset saved: {len(df)} samples")
    
    # Extract features
    print("\nExtracting features...")
    extractor = SMSFeatureExtractor()
    features_list = []
    for text in df['text']:
        features_list.append(extractor.extract(text))
    
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
    print(classification_report(y_test, y_pred, target_names=['Legitimate', 'Scam']))
    
    # Save model
    os.makedirs('models', exist_ok=True)
    joblib.dump(model, 'models/sms_model.pkl')
    joblib.dump(list(X.columns), 'models/sms_features.pkl')
    print("\nModel saved to models/sms_model.pkl")
    
    return model

if __name__ == "__main__":
    train_model()
