"""Feature extraction utilities for threat detection"""
import re
from typing import Dict, List
from urllib.parse import urlparse

class LoginFeatureExtractor:
    """Extract features from login behavior data"""
    
    @staticmethod
    def extract(data: Dict) -> Dict[str, float]:
        """Extract numerical features from login data"""
        return {
            'failed_attempts': float(data.get('failed_attempts', 0)),
            'country_changed': float(data.get('country_changed', False)),
            'role_access_attempt': float(data.get('role_access_attempt', 0)),
            'login_gap_minutes': float(data.get('login_gap_minutes', 0))
        }
    
    @staticmethod
    def explain_features(features: Dict[str, float], weights: List[float], feature_names: List[str]) -> List[str]:
        """Generate human-readable explanations"""
        explanations = []
        feature_impact = [(name, features.get(name, 0) * weight) 
                         for name, weight in zip(feature_names, weights)]
        feature_impact.sort(key=lambda x: abs(x[1]), reverse=True)
        
        for name, impact in feature_impact[:3]:
            if abs(impact) > 0.1:
                if name == 'failed_attempts' and features.get(name, 0) > 3:
                    explanations.append("Multiple failed login attempts detected")
                elif name == 'country_changed' and features.get(name, 0) == 1:
                    explanations.append("Login from different country (impossible travel)")
                elif name == 'role_access_attempt' and features.get(name, 0) > 0:
                    explanations.append("Privilege escalation attempt detected")
                elif name == 'login_gap_minutes' and features.get(name, 0) < 5:
                    explanations.append("Suspicious rapid login attempts")
        
        return explanations if explanations else ["Normal login pattern"]


class URLFeatureExtractor:
    """Extract features from URLs for phishing detection"""
    
    SUSPICIOUS_TLDS = {'tk', 'ml', 'ga', 'cf', 'gq', 'xyz', 'top', 'work'}
    BRAND_KEYWORDS = {'paypal', 'amazon', 'microsoft', 'google', 'apple', 
                      'facebook', 'netflix', 'bank', 'secure', 'account', 
                      'verify', 'update', 'login'}
    
    @staticmethod
    def extract(url: str) -> Dict[str, float]:
        """Extract features from URL"""
        parsed = urlparse(url.lower())
        domain = parsed.netloc or parsed.path.split('/')[0]
        
        # Count subdomains
        subdomain_count = len(domain.split('.')) - 2 if '.' in domain else 0
        
        # Check for brand keywords in suspicious contexts
        contains_brand = any(keyword in domain for keyword in URLFeatureExtractor.BRAND_KEYWORDS)
        
        # Check TLD
        tld = domain.split('.')[-1] if '.' in domain else ''
        suspicious_tld = tld in URLFeatureExtractor.SUSPICIOUS_TLDS
        
        return {
            'has_https': float(parsed.scheme == 'https'),
            'domain_length': float(len(domain)),
            'suspicious_tld': float(suspicious_tld),
            'contains_brand_keyword': float(contains_brand),
            'subdomain_count': float(subdomain_count),
            'has_ip': float(bool(re.match(r'\d+\.\d+\.\d+\.\d+', domain))),
            'special_char_count': float(sum(c in '@-_' for c in domain))
        }
    
    @staticmethod
    def calculate_risk_score(features: Dict[str, float]) -> tuple[float, List[str]]:
        """Calculate risk score using weighted features"""
        reasons = []
        score = 0.0
        
        if not features['has_https']:
            score += 25
            reasons.append("No HTTPS encryption")
        
        if features['suspicious_tld']:
            score += 30
            reasons.append("Suspicious domain extension")
        
        if features['contains_brand_keyword']:
            score += 20
            reasons.append("Contains brand impersonation keywords")
        
        if features['subdomain_count'] > 2:
            score += 15
            reasons.append("Excessive subdomains")
        
        if features['has_ip']:
            score += 35
            reasons.append("IP address instead of domain name")
        
        if features['domain_length'] > 30:
            score += 10
            reasons.append("Unusually long domain name")
        
        if features['special_char_count'] > 2:
            score += 10
            reasons.append("Excessive special characters")
        
        return min(score, 100), reasons if reasons else ["URL appears safe"]


class SMSFeatureExtractor:
    """Extract features from SMS text for scam detection"""
    
    URGENCY_WORDS = {'urgent', 'immediately', 'now', 'expire', 'limited', 
                     'act fast', 'hurry', 'quick', 'asap', 'today only', 'final'}
    MONEY_WORDS = {'prize', 'winner', 'cash', 'money', 'free', 'claim', 
                   'reward', 'refund', 'payment', 'credit', 'debt', 'won', 'lottery'}
    BANK_WORDS = {'bank', 'account', 'card', 'suspended', 'blocked', 
                  'verify', 'confirm', 'security', 'fraud', 'atm', 'cvv', 'kyc'}
    
    # Legitimacy indicators (negative signals for scams)
    LEGITIMACY_WORDS = {'never ask', 'never share', 'official', 'reminder', 
                        'committed', 'thank you', 'visit our', 'contact us',
                        'customer support', 'nearest branch', 'official website',
                        'official app', 'helpline', 'stay safe', 'report suspicious'}
    
    @staticmethod
    def extract(text: str) -> Dict[str, float]:
        """Extract features from SMS text"""
        text_lower = text.lower()
        
        # Count urgency words
        urgency_count = sum(word in text_lower for word in SMSFeatureExtractor.URGENCY_WORDS)
        
        # Count money-related words
        money_count = sum(word in text_lower for word in SMSFeatureExtractor.MONEY_WORDS)
        
        # Count bank-related words
        bank_count = sum(word in text_lower for word in SMSFeatureExtractor.BANK_WORDS)
        
        # Count legitimacy indicators (IMPORTANT!)
        legitimacy_count = sum(phrase in text_lower for phrase in SMSFeatureExtractor.LEGITIMACY_WORDS)
        
        # Check for links
        has_link = bool(re.search(r'http[s]?://|www\.|\w+\.\w{2,}', text_lower))
        
        # Check for excessive caps
        caps_ratio = sum(1 for c in text if c.isupper()) / len(text) if text else 0
        
        # Check for requests to share sensitive info
        requests_sensitive = bool(re.search(r'(enter|share|provide|send).*(pin|otp|password|cvv|card number)', text_lower))
        
        # Check for threats
        has_threat = any(word in text_lower for word in ['blocked', 'suspended', 'closed', 'legal action', 'arrest'])
        
        return {
            'urgency_count': float(urgency_count),
            'money_count': float(money_count),
            'bank_count': float(bank_count),
            'legitimacy_count': float(legitimacy_count),  # NEW: legitimacy signals
            'has_link': float(has_link),
            'excessive_caps': float(caps_ratio > 0.3),
            'exclamation_count': float(text.count('!')),
            'requests_sensitive': float(requests_sensitive),  # NEW: asks for sensitive data
            'has_threat': float(has_threat),  # NEW: threatening language
            'length': float(len(text))
        }
    
    @staticmethod
    def extract_keywords(text: str) -> List[str]:
        """Extract detected keywords for explanation"""
        text_lower = text.lower()
        keywords = []
        
        # Check urgency words
        for word in SMSFeatureExtractor.URGENCY_WORDS:
            if word in text_lower:
                keywords.append(f"urgency: '{word}'")
        
        # Check money words
        for word in SMSFeatureExtractor.MONEY_WORDS:
            if word in text_lower:
                keywords.append(f"money: '{word}'")
        
        # Check banking words
        for word in SMSFeatureExtractor.BANK_WORDS:
            if word in text_lower:
                keywords.append(f"banking: '{word}'")
        
        # Check for sensitive info requests
        if re.search(r'(enter|share|provide|send).*(pin|otp|password|cvv)', text_lower):
            keywords.append("⚠️ requests sensitive information")
        
        return keywords[:10]  # Limit to top 10
    
    @staticmethod
    def extract_keywords(text: str) -> List[str]:
        """Extract suspicious keywords found in text"""
        text_lower = text.lower()
        found = []
        
        for word in SMSFeatureExtractor.URGENCY_WORDS:
            if word in text_lower:
                found.append(f"urgency: '{word}'")
        
        for word in SMSFeatureExtractor.MONEY_WORDS:
            if word in text_lower:
                found.append(f"money: '{word}'")
        
        for word in SMSFeatureExtractor.BANK_WORDS:
            if word in text_lower:
                found.append(f"banking: '{word}'")
        
        if re.search(r'http[s]?://|www\.', text_lower):
            found.append("contains suspicious link")
        
        return found[:5]  # Limit to top 5
