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
    """Create synthetic SMS training data with realistic examples"""
    np.random.seed(42)
    
    # Legitimate messages - varied and realistic
    legit_messages = [
        "Hi, are you free for dinner tonight?",
        "Meeting scheduled for 3pm tomorrow",
        "Thanks for your help today",
        "Can you pick up milk on your way home?",
        "Happy birthday! Hope you have a great day",
        "Your package will arrive tomorrow between 2-4 PM",
        "Reminder: Doctor appointment on Friday at 10am",
        "Great job on the presentation today!",
        "Let's catch up this weekend",
        "The report is ready for review",
        # Legitimate bank messages (important!)
        "Dear Customer, we are committed to keeping your account secure. Remember that our bank never asks for your OTP, PIN, or password through email or messages.",
        "Security reminder: Never share your banking credentials with anyone. Contact our official support if you notice suspicious activity.",
        "Your monthly statement is now available. Log in to your account through our official app to view it.",
        "Thank you for banking with us. For assistance, visit our nearest branch or call our official helpline.",
        "Important: We never ask for sensitive information via email or SMS. Stay safe and report suspicious messages.",
        "Your transaction of $50 was successful. If you did not make this transaction, please contact us immediately through official channels.",
        "Account update: Your new debit card will arrive in 5-7 business days. Activate it through our secure mobile app.",
        "Scheduled maintenance: Our online banking will be unavailable on Sunday 2-4 AM. We apologize for any inconvenience.",
        "Thank you for your payment. Your account balance is $1,234.56. For details, log in to your account.",
        "Security tip: Enable two-factor authentication for added protection. Visit our website for instructions.",
    ] * 50
    
    # Scam messages - realistic phishing attempts
    scam_messages = [
        "URGENT! Your bank account has been suspended. Click here immediately to verify: http://fake-bank.tk",
        "Congratulations! You've won $5000 cash prize! Claim now at www.scam-prize.ml",
        "FINAL NOTICE: Your payment is overdue. Act now to avoid legal action. Call immediately!",
        "Your Amazon account will be blocked. Verify your card details here urgently.",
        "FREE MONEY! Limited time offer! Click this link now to claim your reward!",
        "ALERT: Suspicious activity detected. Enter your PIN and OTP here to secure account: http://phishing-site.com",
        "Your account will be closed in 24 hours. Verify now by providing your ATM card number and CVV.",
        "You have won a lottery! Send us your bank details to claim $10,000 prize money.",
        "URGENT: Update your KYC details immediately or your account will be blocked. Click: http://fake-kyc.tk",
        "Your card has been blocked. Share your OTP to unblock: http://scam-unblock.ml",
        "Congratulations! You are selected for a government refund. Provide your account number to receive $2000.",
        "IMMEDIATE ACTION REQUIRED: Verify your identity by sharing your password and PIN.",
        "Your package is held at customs. Pay $50 fee now to release: http://fake-customs.com",
        "Bank Alert: Unusual login detected. Click here and enter your full card details to secure account.",
        "You have inherited $500,000. Send processing fee of $100 to claim your inheritance.",
        "URGENT: Your credit score is dropping. Fix it now by paying $200: http://scam-credit.tk",
        "Tax refund pending! Claim $1500 by providing your bank account and routing number.",
        "Your Netflix account expired. Update payment details here: http://fake-netflix.ml",
        "FINAL WARNING: Legal action will be taken. Pay outstanding amount immediately or face arrest.",
        "Verify your PayPal account now or it will be permanently suspended. Enter your password here.",
    ] * 50
    
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
