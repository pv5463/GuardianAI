"""Test Email Phishing Detection with Explainability"""
import requests
import json

AI_ENGINE_URL = "http://localhost:8000"

def test_email(subject, body, expected_risk):
    """Test email phishing detection"""
    print(f"\n{'='*70}")
    print(f"Subject: {subject}")
    print(f"Expected Risk: {expected_risk}")
    print('='*70)
    
    response = requests.post(
        f"{AI_ENGINE_URL}/detect-email-phishing",
        json={"subject": subject, "body": body}
    )
    
    if response.status_code == 200:
        result = response.json()
        print(f"\n✅ Risk Score: {result['risk_score']}%")
        print(f"📊 Risk Level: {result['risk_level']}")
        print(f"🎯 Classification: {result['classification']}")
        print(f"\n📝 Explanation:")
        for i, exp in enumerate(result['explanation'], 1):
            print(f"   {i}. {exp}")
        print(f"\n🔍 Keywords Detected: {', '.join(result['keywords_detected'][:5])}")
        print(f"🔗 Links Found: {result['links_found']}")
        print(f"\n💡 Recommended Action:")
        print(f"   {result['recommended_action']}")
        return result
    else:
        print(f"❌ Error: {response.status_code}")
        print(response.text)
        return None

print("="*70)
print("EMAIL PHISHING DETECTION TEST - WITH AI EXPLAINABILITY")
print("="*70)

# Test 1: High-risk phishing email
print("\n\n🔴 TEST 1: HIGH-RISK PHISHING EMAIL")
test_email(
    subject="URGENT: Verify your bank account immediately",
    body="""Dear Customer,
    
We detected unusual activity in your bank account. Your account will be suspended within 24 hours unless you verify your details immediately.

Click the link below and enter your ATM card number, PIN, and OTP to secure your account:
👉 http://secure-bank-verification-alert.tk

If you do not verify now, your account will be permanently blocked.

Bank Security Team""",
    expected_risk="HIGH"
)

# Test 2: Medium-risk suspicious email
print("\n\n🟡 TEST 2: MEDIUM-RISK SUSPICIOUS EMAIL")
test_email(
    subject="Congratulations! You've won a prize",
    body="""Dear Winner,

You have been selected to receive a $5000 cash prize! This is a limited time offer.

Click here to claim your reward now: http://bit.ly/prize123

Act fast before this offer expires!

Prize Distribution Team""",
    expected_risk="MEDIUM"
)

# Test 3: Low-risk legitimate email
print("\n\n🟢 TEST 3: LOW-RISK LEGITIMATE EMAIL")
test_email(
    subject="Your monthly statement is ready",
    body="""Dear Customer,

Your monthly account statement for January 2024 is now available.

To view your statement, please log in to your account through our official mobile app or visit our website.

Remember: We never ask for your password, PIN, or OTP through email or phone calls.

If you have any questions, please contact our customer support or visit your nearest branch.

Thank you for banking with us.

Customer Service Team

Unsubscribe | Privacy Policy | Contact Us""",
    expected_risk="LOW"
)

print("\n\n" + "="*70)
print("✅ EMAIL PHISHING DETECTION TEST COMPLETE")
print("="*70)
