"""Email Phishing Detection with Advanced Feature Extraction"""
import re
from typing import Dict, List, Tuple
from urllib.parse import urlparse
import logging

logger = logging.getLogger(__name__)

class EmailPhishingDetector:
    """Detect phishing attempts in email content"""
    
    # Urgency indicators
    URGENCY_WORDS = {
        'urgent', 'immediately', 'verify', 'update', 'confirm', 'act now',
        'expire', 'limited time', 'hurry', 'quick', 'asap', 'final notice',
        'suspended', 'blocked', 'locked', 'unauthorized', 'unusual activity'
    }
    
    # Suspicious keywords
    SUSPICIOUS_KEYWORDS = {
        'bank', 'login', 'password', 'otp', 'pin', 'cvv', 'ssn',
        'account', 'credit card', 'debit card', 'security', 'verify',
        'confirm', 'update', 'click here', 'reset', 'suspended'
    }
    
    # Financial lures
    FINANCIAL_LURES = {
        'prize', 'winner', 'won', 'cash', 'money', 'reward', 'refund',
        'claim', 'free', 'gift', 'lottery', 'inheritance', 'million'
    }
    
    # Legitimate indicators
    LEGITIMACY_INDICATORS = {
        'unsubscribe', 'privacy policy', 'terms of service', 'contact us',
        'customer support', 'official', 'do not reply', 'automated message'
    }
    
    def __init__(self):
        self.common_misspellings = {
            'paypal': ['paypa1', 'paypai', 'paypa11'],
            'amazon': ['arnazon', 'amazom', 'amaz0n'],
            'microsoft': ['microsft', 'micros0ft', 'rnicrosoft'],
            'google': ['googl', 'gooogle', 'g00gle'],
            'apple': ['app1e', 'appl3', 'appie']
        }
    
    def extract_features(self, subject: str, body: str) -> Dict[str, float]:
        """Extract comprehensive features from email"""
        combined_text = f"{subject} {body}".lower()
        
        features = {
            # Urgency detection
            'urgency_count': self._count_matches(combined_text, self.URGENCY_WORDS),
            'urgency_in_subject': self._count_matches(subject.lower(), self.URGENCY_WORDS),
            
            # Suspicious keywords
            'suspicious_keyword_count': self._count_matches(combined_text, self.SUSPICIOUS_KEYWORDS),
            
            # Financial lures
            'financial_lure_count': self._count_matches(combined_text, self.FINANCIAL_LURES),
            
            # Legitimacy indicators
            'legitimacy_count': self._count_matches(combined_text, self.LEGITIMACY_INDICATORS),
            
            # Link analysis
            'link_count': len(re.findall(r'http[s]?://|www\.', combined_text)),
            'suspicious_link': float(self._has_suspicious_link(combined_text)),
            
            # Text characteristics
            'excessive_caps': float(self._check_excessive_caps(subject + body)),
            'exclamation_count': float(combined_text.count('!')),
            'spelling_anomalies': float(self._check_spelling_anomalies(combined_text)),
            
            # Requests for action
            'requests_sensitive_info': float(self._requests_sensitive_info(combined_text)),
            'has_attachment_mention': float('attachment' in combined_text or 'attached' in combined_text),
            
            # Length analysis
            'subject_length': float(len(subject)),
            'body_length': float(len(body)),
            'subject_word_count': float(len(subject.split())),
        }
        
        return features
    
    def _count_matches(self, text: str, word_set: set) -> float:
        """Count how many words from set appear in text"""
        return float(sum(1 for word in word_set if word in text))
    
    def _has_suspicious_link(self, text: str) -> bool:
        """Check for suspicious links"""
        urls = re.findall(r'http[s]?://[^\s]+', text)
        
        for url in urls:
            try:
                parsed = urlparse(url)
                domain = parsed.netloc.lower()
                
                # Check for IP addresses
                if re.match(r'\d+\.\d+\.\d+\.\d+', domain):
                    return True
                
                # Check for suspicious TLDs
                suspicious_tlds = ['.tk', '.ml', '.ga', '.cf', '.gq', '.xyz', '.top']
                if any(domain.endswith(tld) for tld in suspicious_tlds):
                    return True
                
                # Check for URL shorteners
                shorteners = ['bit.ly', 'tinyurl', 'goo.gl', 't.co']
                if any(shortener in domain for shortener in shorteners):
                    return True
                
            except Exception:
                continue
        
        return False
    
    def _check_excessive_caps(self, text: str) -> bool:
        """Check for excessive capital letters"""
        if not text:
            return False
        
        caps_count = sum(1 for c in text if c.isupper())
        total_letters = sum(1 for c in text if c.isalpha())
        
        if total_letters == 0:
            return False
        
        caps_ratio = caps_count / total_letters
        return caps_ratio > 0.4
    
    def _check_spelling_anomalies(self, text: str) -> bool:
        """Check for common phishing misspellings"""
        for correct, misspellings in self.common_misspellings.items():
            for misspelling in misspellings:
                if misspelling in text:
                    return True
        return False
    
    def _requests_sensitive_info(self, text: str) -> bool:
        """Check if email requests sensitive information"""
        patterns = [
            r'(enter|provide|send|share|confirm|verify).*(password|pin|otp|cvv|ssn|account number)',
            r'(click|tap).*(verify|confirm|update|secure)',
            r'(update|verify).*(payment|billing|card|account)'
        ]
        
        return any(re.search(pattern, text, re.IGNORECASE) for pattern in patterns)
    
    def analyze_email(self, subject: str, body: str) -> Dict:
        """Perform comprehensive email phishing analysis"""
        logger.info(f"Analyzing email with subject: {subject[:50]}...")
        
        # Extract features
        features = self.extract_features(subject, body)
        
        # Calculate risk score
        risk_score, explanation, keywords_detected = self._calculate_risk_score(
            features, subject, body
        )
        
        # Extract links
        combined_text = f"{subject} {body}"
        links_found = re.findall(r'http[s]?://[^\s]+', combined_text)
        
        # Determine classification
        if risk_score >= 70:
            classification = "Phishing Email"
            risk_level = "High"
            recommended_action = "Do not click any links. Delete this email immediately and report as phishing."
        elif risk_score >= 40:
            classification = "Suspicious Email"
            risk_level = "Medium"
            recommended_action = "Exercise caution. Verify sender through official channels before taking any action."
        else:
            classification = "Legitimate Email"
            risk_level = "Low"
            recommended_action = "Email appears safe, but always verify sender identity for sensitive requests."
        
        return {
            'risk_score': round(risk_score, 2),
            'risk_level': risk_level,
            'classification': classification,
            'explanation': explanation,
            'keywords_detected': keywords_detected,
            'links_found': len(links_found),
            'links': links_found[:3],  # First 3 links
            'recommended_action': recommended_action,
            'features': features
        }
    
    def _calculate_risk_score(self, features: Dict[str, float], 
                             subject: str, body: str) -> Tuple[float, List[str], List[str]]:
        """Calculate risk score with detailed explanation"""
        score = 0.0
        explanation = []
        keywords_detected = []
        combined_text = f"{subject} {body}".lower()
        
        # Check legitimacy first
        if features['legitimacy_count'] >= 2:
            score -= 20
            explanation.append("Contains legitimacy indicators (unsubscribe, privacy policy)")
        
        # Urgency in subject (high weight)
        if features['urgency_in_subject'] > 0:
            score += 25
            explanation.append(f"Urgent language in subject line")
            keywords_detected.extend([w for w in self.URGENCY_WORDS if w in subject.lower()])
        
        # General urgency
        if features['urgency_count'] > 2:
            score += 20
            explanation.append(f"Multiple urgency indicators detected ({int(features['urgency_count'])})")
        
        # Requests sensitive information (critical)
        if features['requests_sensitive_info']:
            score += 35
            explanation.append("⚠️ Requests sensitive information (password/PIN/OTP)")
            keywords_detected.append("sensitive_info_request")
        
        # Suspicious keywords
        if features['suspicious_keyword_count'] > 3:
            score += 20
            explanation.append(f"Multiple suspicious keywords ({int(features['suspicious_keyword_count'])})")
            keywords_detected.extend([w for w in self.SUSPICIOUS_KEYWORDS if w in combined_text])
        
        # Financial lures
        if features['financial_lure_count'] > 0:
            score += 15
            explanation.append("Contains financial lures (prize, money, reward)")
            keywords_detected.extend([w for w in self.FINANCIAL_LURES if w in combined_text])
        
        # Link analysis
        if features['link_count'] > 0:
            score += 10
            explanation.append(f"Contains {int(features['link_count'])} link(s)")
        
        if features['suspicious_link']:
            score += 25
            explanation.append("⚠️ Contains suspicious link (IP address, suspicious TLD, or URL shortener)")
        
        # Text characteristics
        if features['excessive_caps']:
            score += 10
            explanation.append("Excessive use of capital letters")
        
        if features['exclamation_count'] > 3:
            score += 8
            explanation.append(f"Excessive exclamation marks ({int(features['exclamation_count'])})")
        
        if features['spelling_anomalies']:
            score += 20
            explanation.append("⚠️ Spelling anomalies detected (possible brand impersonation)")
        
        # Subject length anomaly
        if features['subject_length'] > 100:
            score += 5
            explanation.append("Unusually long subject line")
        
        # Ensure we have some explanation
        if not explanation:
            explanation.append("No significant phishing indicators detected")
        
        # Remove duplicates from keywords
        keywords_detected = list(set(keywords_detected))[:10]
        
        return min(score, 100), explanation, keywords_detected

# Example usage
if __name__ == "__main__":
    detector = EmailPhishingDetector()
    
    # Test phishing email
    result = detector.analyze_email(
        subject="URGENT: Verify your bank account immediately",
        body="Your account will be suspended. Click here to verify: http://fake-bank.tk"
    )
    
    print("Phishing Email Test:")
    print(f"Risk Score: {result['risk_score']}")
    print(f"Classification: {result['classification']}")
    print(f"Explanation: {result['explanation']}")
