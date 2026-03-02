"""Test script for Guardian AI API endpoints"""
import requests
import json

BASE_URL = "http://localhost:8000"

def test_health():
    """Test health endpoint"""
    print("\n=== Testing Health Endpoint ===")
    response = requests.get(f"{BASE_URL}/health")
    print(f"Status: {response.status_code}")
    print(json.dumps(response.json(), indent=2))

def test_login_detection():
    """Test login anomaly detection"""
    print("\n=== Testing Login Detection ===")
    
    # Test case 1: Brute force attack
    print("\n1. Brute Force Attack:")
    data = {
        "failed_attempts": 8,
        "country_changed": False,
        "role_access_attempt": 0,
        "login_gap_minutes": 2
    }
    response = requests.post(f"{BASE_URL}/predict/login", json=data)
    print(json.dumps(response.json(), indent=2))
    
    # Test case 2: Normal login
    print("\n2. Normal Login:")
    data = {
        "failed_attempts": 0,
        "country_changed": False,
        "role_access_attempt": 0,
        "login_gap_minutes": 240
    }
    response = requests.post(f"{BASE_URL}/predict/login", json=data)
    print(json.dumps(response.json(), indent=2))

def test_url_detection():
    """Test URL phishing detection"""
    print("\n=== Testing URL Detection ===")
    
    # Test case 1: Phishing URL
    print("\n1. Phishing URL:")
    data = {"url": "http://paypal-verify.tk/secure/login"}
    response = requests.post(f"{BASE_URL}/predict/url", json=data)
    print(json.dumps(response.json(), indent=2))
    
    # Test case 2: Safe URL
    print("\n2. Safe URL:")
    data = {"url": "https://www.github.com"}
    response = requests.post(f"{BASE_URL}/predict/url", json=data)
    print(json.dumps(response.json(), indent=2))

def test_sms_detection():
    """Test SMS scam detection"""
    print("\n=== Testing SMS Detection ===")
    
    # Test case 1: Scam SMS
    print("\n1. Scam SMS:")
    data = {
        "text": "URGENT! Your bank account has been suspended. Click here immediately to verify your details!"
    }
    response = requests.post(f"{BASE_URL}/predict/sms", json=data)
    print(json.dumps(response.json(), indent=2))
    
    # Test case 2: Legitimate SMS
    print("\n2. Legitimate SMS:")
    data = {
        "text": "Hi, are you free for dinner tonight? Let me know!"
    }
    response = requests.post(f"{BASE_URL}/predict/sms", json=data)
    print(json.dumps(response.json(), indent=2))

if __name__ == "__main__":
    try:
        test_health()
        test_login_detection()
        test_url_detection()
        test_sms_detection()
        print("\n✓ All tests completed successfully!")
    except requests.exceptions.ConnectionError:
        print("\n✗ Error: Could not connect to server. Make sure it's running on port 8000")
    except Exception as e:
        print(f"\n✗ Error: {e}")
