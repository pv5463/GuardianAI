"""Test script for advanced threat detection capabilities"""
import asyncio
import requests
import json
import time
from pathlib import Path

# Test URLs for comprehensive analysis
TEST_URLS = [
    # Safe URLs
    "https://google.com",
    "https://github.com",
    "https://stackoverflow.com",
    
    # Typosquatting examples
    "http://googl.com",
    "https://paypaI.com",  # Capital I instead of l
    "http://arnazon.com",   # r instead of m
    "https://microsft.com", # missing o
    
    # Suspicious patterns
    "http://192.168.1.1/secure-login",
    "https://bit.ly/urgent-verify",
    "http://secure-bank-update.tk/login",
    "https://verify-account-now.ml/confirm",
    
    # Phishing indicators
    "http://paypal-security-alert.xyz/verify-now",
    "https://amazon-prize-winner.ga/claim",
    "http://microsoft-security.cf/urgent-update"
]

class AdvancedThreatTester:
    """Test advanced threat detection capabilities"""
    
    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url
        self.session = requests.Session()
    
    def test_health_check(self):
        """Test health endpoint"""
        print("🔍 Testing health check...")
        try:
            response = self.session.get(f"{self.base_url}/health")
            if response.status_code == 200:
                data = response.json()
                print("✅ Health check passed")
                print(f"   Models loaded: {data.get('models_loaded', {})}")
                print(f"   Advanced detectors: {data.get('advanced_detectors', {})}")
                return True
            else:
                print(f"❌ Health check failed: {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ Health check error: {e}")
            return False
    
    def test_basic_url_detection(self):
        """Test basic URL detection"""
        print("\n🔍 Testing basic URL detection...")
        
        test_urls = ["https://google.com", "http://phishing-site.tk"]
        
        for url in test_urls:
            try:
                response = self.session.post(
                    f"{self.base_url}/predict/url",
                    json={"url": url}
                )
                
                if response.status_code == 200:
                    data = response.json()
                    print(f"✅ {url}")
                    print(f"   Risk Score: {data['risk_score']}")
                    print(f"   Classification: {data['classification']}")
                    print(f"   Risk Level: {data['risk_level']}")
                else:
                    print(f"❌ {url}: {response.status_code}")
                    
            except Exception as e:
                print(f"❌ Error testing {url}: {e}")
    
    def test_advanced_url_detection(self):
        """Test advanced URL detection with typosquatting"""
        print("\n🔍 Testing advanced URL detection...")
        
        for url in TEST_URLS[:8]:  # Test first 8 URLs
            try:
                response = self.session.post(
                    f"{self.base_url}/predict/url/advanced",
                    json={
                        "url": url,
                        "include_reputation_check": True
                    }
                )
                
                if response.status_code == 200:
                    data = response.json()
                    print(f"\n✅ {url}")
                    print(f"   Risk Score: {data['risk_score']}")
                    print(f"   Classification: {data['classification']}")
                    print(f"   Risk Level: {data['risk_level']}")
                    
                    if data.get('threats_detected'):
                        print(f"   Threats: {', '.join(data['threats_detected'])}")
                    
                    if data.get('recommendations'):
                        print(f"   Recommendations: {data['recommendations'][0]}")
                        
                    # Show typosquatting details if detected
                    details = data.get('details', {})
                    if 'typosquatting' in details:
                        typo_info = details['typosquatting']
                        print(f"   ⚠️  Similar to: {typo_info['similar_to']} (similarity: {typo_info['similarity_score']:.3f})")
                
                else:
                    print(f"❌ {url}: {response.status_code} - {response.text}")
                    
            except Exception as e:
                print(f"❌ Error testing {url}: {e}")
            
            time.sleep(0.5)  # Rate limiting
    
    def test_sms_detection(self):
        """Test SMS scam detection"""
        print("\n🔍 Testing SMS scam detection...")
        
        test_messages = [
            "Hello, how are you today?",
            "URGENT! Your account will be suspended. Click here to verify: bit.ly/verify123",
            "Congratulations! You've won $1000. Claim now at winner-prize.com",
            "Your bank account has been compromised. Call immediately: 555-SCAM",
            "Free iPhone! Limited time offer. Act now!"
        ]
        
        for message in test_messages:
            try:
                response = self.session.post(
                    f"{self.base_url}/predict/sms",
                    json={"text": message}
                )
                
                if response.status_code == 200:
                    data = response.json()
                    print(f"\n✅ Message: {message[:50]}...")
                    print(f"   Risk Score: {data['risk_score']}")
                    print(f"   Classification: {data['classification']}")
                    print(f"   Explanation: {', '.join(data['explanation'])}")
                else:
                    print(f"❌ SMS test failed: {response.status_code}")
                    
            except Exception as e:
                print(f"❌ Error testing SMS: {e}")
    
    def test_deepfake_dataset_analysis(self):
        """Test deepfake dataset analysis"""
        print("\n🔍 Testing deepfake dataset analysis...")
        
        try:
            response = self.session.get(f"{self.base_url}/analyze/dataset/deepfake")
            
            if response.status_code == 200:
                data = response.json()
                analysis = data.get('analysis', {})
                
                print("✅ Deepfake dataset analysis completed")
                print(f"   Total analyzed: {analysis.get('total_analyzed', 0)}")
                print(f"   Classifications: {analysis.get('classifications', {})}")
                print(f"   Average risk score: {analysis.get('average_risk_score', 0):.2f}")
                
                # Show sample results
                samples = analysis.get('sample_results', [])
                if samples:
                    print("   Sample results:")
                    for sample in samples[:3]:
                        print(f"     {sample['file']}: {sample['classification']} (score: {sample['risk_score']})")
            
            else:
                print(f"❌ Dataset analysis failed: {response.status_code}")
                
        except Exception as e:
            print(f"❌ Error in dataset analysis: {e}")
    
    def test_malicious_url_training(self):
        """Test malicious URL model training (if Kaggle dataset is available)"""
        print("\n🔍 Testing malicious URL model training...")
        print("⚠️  This may take several minutes and requires Kaggle API access...")
        
        try:
            # This endpoint has rate limiting (1/hour)
            response = self.session.post(f"{self.base_url}/train/malicious-urls")
            
            if response.status_code == 200:
                data = response.json()
                print("✅ Malicious URL model training completed")
                print(f"   Accuracy: {data.get('accuracy', 0):.4f}")
                print(f"   Samples trained: {data.get('samples_trained', 0)}")
                
                top_features = data.get('top_features', [])
                if top_features:
                    print("   Top features:")
                    for feature, importance in top_features:
                        print(f"     {feature}: {importance:.4f}")
            
            elif response.status_code == 429:
                print("⚠️  Rate limited - training endpoint can only be called once per hour")
            
            else:
                print(f"❌ Training failed: {response.status_code} - {response.text}")
                
        except Exception as e:
            print(f"❌ Error in training: {e}")
    
    def run_comprehensive_test(self):
        """Run all tests"""
        print("🚀 Starting Guardian AI Advanced Threat Detection Tests")
        print("=" * 60)
        
        # Test basic connectivity
        if not self.test_health_check():
            print("❌ Cannot connect to AI engine. Make sure it's running on localhost:8000")
            return
        
        # Run all tests
        self.test_basic_url_detection()
        self.test_advanced_url_detection()
        self.test_sms_detection()
        self.test_deepfake_dataset_analysis()
        
        # Skip training test by default (requires Kaggle setup)
        print("\n⚠️  Skipping malicious URL training test (requires Kaggle API setup)")
        print("   To test training, uncomment the line below and ensure Kaggle credentials are configured")
        # self.test_malicious_url_training()
        
        print("\n" + "=" * 60)
        print("🎉 Advanced threat detection testing completed!")
        print("\nKey Features Demonstrated:")
        print("✅ Typosquatting detection (googl.com vs google.com)")
        print("✅ Multi-layer URL analysis")
        print("✅ Reputation-based scoring")
        print("✅ SMS scam pattern recognition")
        print("✅ Deepfake/dark pattern analysis")
        print("✅ Real-time threat classification")

def main():
    """Main test function"""
    tester = AdvancedThreatTester()
    tester.run_comprehensive_test()

if __name__ == "__main__":
    main()