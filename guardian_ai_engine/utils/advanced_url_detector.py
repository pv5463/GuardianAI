"""Advanced URL Detection with Typosquatting, Reputation Checks, and ML Classification"""
import re
import requests
import hashlib
import json
import os
from typing import Dict, List, Tuple, Optional
from urllib.parse import urlparse
from difflib import SequenceMatcher
import numpy as np
from datetime import datetime, timedelta
import asyncio
import aiohttp
import logging

logger = logging.getLogger(__name__)

class AdvancedURLDetector:
    """Advanced URL threat detection with multiple security layers"""
    
    # Trusted domains database
    TRUSTED_DOMAINS = {
        'google.com', 'facebook.com', 'amazon.com', 'microsoft.com', 
        'apple.com', 'paypal.com', 'netflix.com', 'twitter.com',
        'instagram.com', 'linkedin.com', 'youtube.com', 'github.com',
        'stackoverflow.com', 'reddit.com', 'wikipedia.org', 'gmail.com',
        'outlook.com', 'yahoo.com', 'dropbox.com', 'adobe.com'
    }
    
    # Suspicious TLDs
    SUSPICIOUS_TLDS = {
        'tk', 'ml', 'ga', 'cf', 'gq', 'xyz', 'top', 'work', 'click',
        'download', 'stream', 'science', 'racing', 'party', 'review'
    }
    
    # Phishing keywords
    PHISHING_KEYWORDS = {
        'login', 'signin', 'verify', 'secure', 'account', 'update',
        'confirm', 'suspended', 'locked', 'expired', 'urgent',
        'immediate', 'action', 'required', 'click', 'here'
    }
    
    def __init__(self):
        self.reputation_cache = {}
        self.cache_expiry = timedelta(hours=1)
    
    def _clean_expired_cache(self):
        """Remove expired cache entries"""
        current_time = datetime.now()
        expired_keys = [
            key for key, value in self.reputation_cache.items()
            if current_time - value['timestamp'] > self.cache_expiry
        ]
        for key in expired_keys:
            del self.reputation_cache[key]
        
        if expired_keys:
            logger.info(f"Cleaned {len(expired_keys)} expired cache entries")
        
    def similarity(self, a: str, b: str) -> float:
        """Calculate similarity between two strings using SequenceMatcher"""
        return SequenceMatcher(None, a, b).ratio()
    
    def check_typosquatting(self, domain: str) -> Tuple[bool, str, float]:
        """Check for typosquatting against trusted domains"""
        domain = domain.lower().strip()
        
        # Remove www. prefix for comparison
        normalized_domain = domain.replace('www.', '')
        
        for trusted in self.TRUSTED_DOMAINS:
            # Check both with and without www
            score = self.similarity(normalized_domain, trusted)
            
            # High similarity but not exact match = potential typosquatting
            # Exclude exact matches (including www variants)
            if 0.75 < score < 1.0 and normalized_domain != trusted:
                return True, trusted, score
                
        return False, "", 0.0
    
    def extract_domain_features(self, url: str) -> Dict[str, float]:
        """Extract comprehensive features from URL for ML classification"""
        try:
            parsed = urlparse(url.lower())
            domain = parsed.netloc or parsed.path.split('/')[0]
            path = parsed.path
            query = parsed.query
            
            # Basic domain features
            domain_length = len(domain)
            subdomain_count = len(domain.split('.')) - 2 if '.' in domain else 0
            
            # TLD analysis
            tld = domain.split('.')[-1] if '.' in domain else ''
            suspicious_tld = tld in self.SUSPICIOUS_TLDS
            
            # Character analysis
            digit_count = sum(c.isdigit() for c in domain)
            special_char_count = sum(c in '-_@' for c in domain)
            
            # IP address check
            is_ip = bool(re.match(r'\d+\.\d+\.\d+\.\d+', domain))
            
            # URL structure analysis
            path_length = len(path)
            query_length = len(query)
            url_length = len(url)
            
            # Suspicious patterns
            has_phishing_keywords = any(keyword in url.lower() for keyword in self.PHISHING_KEYWORDS)
            has_multiple_subdomains = subdomain_count > 2
            has_suspicious_chars = bool(re.search(r'[0-9]{4,}|[a-z]{20,}', domain))
            
            # Protocol analysis
            has_https = parsed.scheme == 'https'
            
            # Port analysis
            has_non_standard_port = parsed.port not in [None, 80, 443]
            
            return {
                'domain_length': float(domain_length),
                'subdomain_count': float(subdomain_count),
                'suspicious_tld': float(suspicious_tld),
                'digit_count': float(digit_count),
                'special_char_count': float(special_char_count),
                'is_ip': float(is_ip),
                'path_length': float(path_length),
                'query_length': float(query_length),
                'url_length': float(url_length),
                'has_phishing_keywords': float(has_phishing_keywords),
                'has_multiple_subdomains': float(has_multiple_subdomains),
                'has_suspicious_chars': float(has_suspicious_chars),
                'has_https': float(has_https),
                'has_non_standard_port': float(has_non_standard_port)
            }
            
        except Exception as e:
            logger.error(f"Feature extraction error: {e}")
            return {}
    
    async def check_reputation_apis(self, url: str) -> Dict[str, any]:
        """Check URL against multiple reputation APIs"""
        results = {
            'virustotal': {'safe': True, 'score': 0},
            'google_safe_browsing': {'safe': True, 'score': 0},
            'phishtank': {'safe': True, 'score': 0}
        }
        
        # Check cache first - use normalized URL for cache key
        normalized_url = url.lower().strip()
        url_hash = hashlib.md5(normalized_url.encode()).hexdigest()
        
        # Clean expired cache entries
        self._clean_expired_cache()
        
        if url_hash in self.reputation_cache:
            cache_entry = self.reputation_cache[url_hash]
            if datetime.now() - cache_entry['timestamp'] < self.cache_expiry:
                logger.info(f"Using cached reputation for: {url}")
                return cache_entry['results']
            else:
                # Remove expired entry
                del self.reputation_cache[url_hash]
        
        try:
            # Simulate API calls (replace with actual API keys in production)
            async with aiohttp.ClientSession() as session:
                # VirusTotal simulation
                vt_score = self._simulate_virustotal_check(url)
                results['virustotal'] = {
                    'safe': vt_score < 2,
                    'score': vt_score,
                    'details': f"{vt_score}/70 engines flagged as malicious"
                }
                
                # Google Safe Browsing simulation
                gsb_threat = self._simulate_google_safe_browsing(url)
                results['google_safe_browsing'] = {
                    'safe': not gsb_threat,
                    'score': 50 if gsb_threat else 0,
                    'details': "Flagged as phishing" if gsb_threat else "Clean"
                }
                
                # PhishTank simulation
                pt_phish = self._simulate_phishtank_check(url)
                results['phishtank'] = {
                    'safe': not pt_phish,
                    'score': 60 if pt_phish else 0,
                    'details': "Listed in PhishTank database" if pt_phish else "Not in database"
                }
        
        except Exception as e:
            logger.error(f"Reputation API error: {e}")
        
        # Cache results with URL for debugging
        self.reputation_cache[url_hash] = {
            'url': normalized_url,
            'results': results,
            'timestamp': datetime.now()
        }
        
        logger.info(f"Cached reputation results for: {url}")
        
        return results
    
    def _simulate_virustotal_check(self, url: str) -> int:
        """Simulate VirusTotal API response"""
        # Simple heuristic for demo
        suspicious_indicators = 0
        
        if any(word in url.lower() for word in ['phish', 'scam', 'fake', 'malware']):
            suspicious_indicators += 5
        
        if not url.startswith('https://'):
            suspicious_indicators += 2
            
        if re.search(r'\d+\.\d+\.\d+\.\d+', url):
            suspicious_indicators += 3
            
        return min(suspicious_indicators, 10)
    
    def _simulate_google_safe_browsing(self, url: str) -> bool:
        """Simulate Google Safe Browsing API"""
        dangerous_patterns = [
            r'bit\.ly/[a-z0-9]{6}phish',
            r'tinyurl\.com/.*login',
            r'[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}.*bank'
        ]
        
        return any(re.search(pattern, url.lower()) for pattern in dangerous_patterns)
    
    def _simulate_phishtank_check(self, url: str) -> bool:
        """Simulate PhishTank database check"""
        # Known phishing patterns
        phishing_indicators = [
            'paypaI.com',  # Capital I instead of l
            'arnazon.com',  # r instead of m
            'microsft.com',  # missing o
            'goog1e.com',   # 1 instead of l
        ]
        
        domain = urlparse(url.lower()).netloc
        return any(indicator in domain for indicator in phishing_indicators)
    
    def calculate_ml_risk_score(self, features: Dict[str, float]) -> Tuple[float, List[str]]:
        """Calculate risk score using feature-based ML approach"""
        score = 0.0
        reasons = []
        
        # Weighted scoring based on features
        if features.get('is_ip', 0):
            score += 35
            reasons.append("Uses IP address instead of domain name")
        
        if features.get('suspicious_tld', 0):
            score += 25
            reasons.append("Suspicious top-level domain")
        
        if features.get('has_phishing_keywords', 0):
            score += 20
            reasons.append("Contains phishing-related keywords")
        
        if features.get('subdomain_count', 0) > 2:
            score += 15
            reasons.append("Excessive number of subdomains")
        
        if not features.get('has_https', 0):
            score += 20
            reasons.append("No HTTPS encryption")
        
        if features.get('domain_length', 0) > 30:
            score += 10
            reasons.append("Unusually long domain name")
        
        if features.get('special_char_count', 0) > 3:
            score += 10
            reasons.append("Excessive special characters")
        
        if features.get('has_suspicious_chars', 0):
            score += 15
            reasons.append("Suspicious character patterns")
        
        if features.get('has_non_standard_port', 0):
            score += 10
            reasons.append("Non-standard port usage")
        
        return min(score, 100), reasons
    
    async def comprehensive_url_analysis(self, url: str) -> Dict[str, any]:
        """Perform comprehensive URL threat analysis"""
        try:
            logger.info(f"Starting comprehensive analysis for URL: {url}")
            
            # Parse URL - preserve original case for display
            original_url = url
            parsed = urlparse(url.lower())
            domain = parsed.netloc or parsed.path.split('/')[0]
            
            logger.info(f"Extracted domain: {domain}")
            
            # Initialize results with unique timestamp
            analysis_result = {
                'url': original_url,
                'domain': domain,
                'timestamp': datetime.now().isoformat(),
                'analysis_id': hashlib.md5(f"{url}{datetime.now().timestamp()}".encode()).hexdigest()[:8],
                'risk_score': 0,
                'risk_level': 'Low',
                'classification': 'safe',
                'threats_detected': [],
                'recommendations': [],
                'details': {}
            }
            
            # 1. Typosquatting Detection
            logger.info(f"Checking typosquatting for domain: {domain}")
            is_typosquat, similar_domain, similarity_score = self.check_typosquatting(domain)
            if is_typosquat:
                logger.warning(f"Typosquatting detected! {domain} similar to {similar_domain} ({similarity_score:.2%})")
                analysis_result['risk_score'] += 40
                analysis_result['threats_detected'].append('typosquatting')
                analysis_result['details']['typosquatting'] = {
                    'similar_to': similar_domain,
                    'similarity_score': similarity_score,
                    'warning': f"Domain highly similar to trusted domain '{similar_domain}'"
                }
                analysis_result['recommendations'].append(f"Verify if you meant to visit '{similar_domain}'")
            else:
                logger.info(f"No typosquatting detected for: {domain}")
            
            # 2. Feature Extraction and ML Classification
            logger.info(f"Extracting features for ML classification")
            features = self.extract_domain_features(url)
            ml_score, ml_reasons = self.calculate_ml_risk_score(features)
            logger.info(f"ML analysis score: {ml_score}, reasons: {len(ml_reasons)}")
            analysis_result['risk_score'] += ml_score * 0.6  # Weight ML score
            analysis_result['details']['ml_analysis'] = {
                'features': features,
                'reasons': ml_reasons,
                'score': ml_score
            }
            
            # 3. Reputation API Checks
            logger.info(f"Checking reputation APIs")
            reputation_results = await self.check_reputation_apis(url)
            reputation_score = 0
            
            for api, result in reputation_results.items():
                if not result['safe']:
                    reputation_score += result['score']
                    analysis_result['threats_detected'].append(f"{api}_flagged")
                    logger.warning(f"{api} flagged URL as unsafe: {result.get('details', '')}")
            
            logger.info(f"Reputation score: {reputation_score}")
            analysis_result['risk_score'] += reputation_score * 0.4  # Weight reputation score
            analysis_result['details']['reputation'] = reputation_results
            
            # 4. Final Risk Assessment
            final_score = min(analysis_result['risk_score'], 100)
            analysis_result['risk_score'] = round(final_score, 2)
            
            logger.info(f"Final risk score for {url}: {final_score}")
            
            if final_score <= 30:
                analysis_result['risk_level'] = 'Low'
                analysis_result['classification'] = 'safe'
            elif final_score <= 60:
                analysis_result['risk_level'] = 'Medium'
                analysis_result['classification'] = 'suspicious'
            else:
                analysis_result['risk_level'] = 'High'
                analysis_result['classification'] = 'dangerous'
            
            # 5. Generate Recommendations
            if analysis_result['classification'] == 'dangerous':
                analysis_result['recommendations'].extend([
                    "Do not visit this website",
                    "Report as phishing if received via email/SMS",
                    "Scan your device for malware if already visited"
                ])
            elif analysis_result['classification'] == 'suspicious':
                analysis_result['recommendations'].extend([
                    "Exercise caution when visiting",
                    "Do not enter personal information",
                    "Verify URL authenticity through official channels"
                ])
            
            return analysis_result
            
        except Exception as e:
            logger.error(f"Comprehensive analysis error: {e}")
            return {
                'url': url,
                'error': str(e),
                'risk_score': 50,
                'risk_level': 'Medium',
                'classification': 'unknown'
            }


# Global detector instance
_detector_instance = None

def get_detector():
    """Get or create the global detector instance"""
    global _detector_instance
    if _detector_instance is None:
        _detector_instance = AdvancedURLDetector()
    return _detector_instance


async def analyze_url_advanced(url: str) -> dict:
    """
    Wrapper function for comprehensive URL analysis
    
    Args:
        url: URL to analyze
        
    Returns:
        Dictionary with analysis results including risk_score, classification, etc.
    """
    detector = get_detector()
    return await detector.comprehensive_url_analysis(url)


def get_recommendations(risk_score: float, threats: List[str]) -> List[str]:
    """
    Get security recommendations based on risk score and detected threats
    
    Args:
        risk_score: Risk score (0-100)
        threats: List of detected threats
        
    Returns:
        List of recommendation strings
    """
    recommendations = []
    
    if risk_score >= 85:
        recommendations.append("🚨 DO NOT proceed to this website")
        recommendations.append("Close this tab immediately")
        recommendations.append("Run a security scan on your device")
    elif risk_score >= 60:
        recommendations.append("⚠️ Exercise extreme caution")
        recommendations.append("Do not enter any personal information")
        recommendations.append("Verify the URL carefully before proceeding")
    elif risk_score >= 30:
        recommendations.append("⚡ Be cautious when interacting with this site")
        recommendations.append("Verify the site's authenticity")
        recommendations.append("Avoid entering sensitive information")
    else:
        recommendations.append("✓ This site appears to be safe")
        recommendations.append("Always verify URLs before entering credentials")
    
    # Threat-specific recommendations
    if any('typosquatting' in t.lower() for t in threats):
        recommendations.append("📝 Double-check the domain spelling")
        recommendations.append("Compare with the official website URL")
    
    if any('ssl' in t.lower() or 'certificate' in t.lower() for t in threats):
        recommendations.append("🔒 SSL certificate issue detected")
        recommendations.append("Do not enter payment information")
    
    if any('suspicious' in t.lower() for t in threats):
        recommendations.append("🔍 Suspicious patterns detected")
        recommendations.append("Verify the site through official channels")
    
    if any('phishing' in t.lower() for t in threats):
        recommendations.append("🎣 Potential phishing attempt")
        recommendations.append("Report this site to authorities")
    
    return recommendations


# Example usage and testing
if __name__ == "__main__":
    async def test_detector():
        detector = AdvancedURLDetector()
        
        test_urls = [
            "https://google.com",
            "http://googl.com",
            "https://paypaI.com/login",
            "http://192.168.1.1/bank",
            "https://secure-amazon-update.tk/verify"
        ]
        
        for url in test_urls:
            print(f"\nAnalyzing: {url}")
            result = await detector.comprehensive_url_analysis(url)
            print(f"Risk Score: {result['risk_score']}")
            print(f"Classification: {result['classification']}")
            print(f"Threats: {result['threats_detected']}")
    
    asyncio.run(test_detector())