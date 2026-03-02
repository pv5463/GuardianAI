"""Train all models at once"""
import sys
import os

# Change to guardian_ai_engine directory
os.chdir(os.path.dirname(os.path.abspath(__file__)))

print("=" * 60)
print("Guardian AI Engine - Training All Models")
print("=" * 60)

# Train login model
print("\n[1/3] Training Login Anomaly Detection Model...")
print("-" * 60)
try:
    from training import train_login_model
    train_login_model.train_model()
    print("✓ Login model trained successfully")
except Exception as e:
    print(f"✗ Login model training failed: {e}")
    sys.exit(1)

# Train URL model
print("\n[2/3] Training URL Phishing Detection Model...")
print("-" * 60)
try:
    from training import train_url_model
    train_url_model.train_model()
    print("✓ URL model trained successfully")
except Exception as e:
    print(f"✗ URL model training failed: {e}")
    sys.exit(1)

# Train SMS model
print("\n[3/3] Training SMS Scam Detection Model...")
print("-" * 60)
try:
    from training import train_sms_model
    train_sms_model.train_model()
    print("✓ SMS model trained successfully")
except Exception as e:
    print(f"✗ SMS model training failed: {e}")
    sys.exit(1)

print("\n" + "=" * 60)
print("✓ All models trained successfully!")
print("=" * 60)
print("\nYou can now start the server:")
print("  python main.py")
print("\nOr test the API:")
print("  python test_api.py")
