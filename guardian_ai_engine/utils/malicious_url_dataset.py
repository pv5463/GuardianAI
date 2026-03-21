"""Malicious URL Dataset Integration using Kaggle Hub"""
import pandas as pd
import numpy as np
import os
import logging
from typing import Dict, List, Tuple, Optional
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics import classification_report, accuracy_score
import joblib
from urllib.parse import urlparse
import re
from pathlib import Path

logger = logging.getLogger(__name__)

class MaliciousURLDatasetManager:
    """Manage and train models using malicious URL datasets"""
    
    def __init__(self, dataset_path: Optional[str] = None):
        self.dataset_path = dataset_path
        self.model = None
        self.vectorizer = None
        self.feature_names = []
        
        # URL feature patterns
        self.suspicious_patterns = [
            r'bit\.ly', r'tinyurl', r'goo\.gl', r't\.co',  # URL shorteners
            r'\d+\.\d+\.\d+\.\d+',  # IP addresses
            r'[0-9]{4,}',  # Long numbers
            r'[a-z]{20,}',  # Long strings
            r'[-_]{3,}',  # Multiple dashes/underscores
        ]
        
    def download_kaggle_dataset(self) -> str:
        """Download malicious URLs dataset from Kaggle"""
        try:
            import kagglehub
            
            # Download latest version
            path = kagglehub.dataset_download("sid321axn/malicious-urls-dataset")
            print(f"Path to dataset files: {path}")
            
            self.dataset_path = path
            return path
            
        except ImportError:
            logger.error("kagglehub not installed. Install with: pip install kagglehub")
            raise
        except Exception as e:
            logger.error(f"Error downloading dataset: {e}")
            raise
    
    def load_cybersecurity_threats_csv(self, csv_path: str) -> pd.DataFrame:
        """Load Global_cybersecurity_threats.csv file"""
        try:
            df = pd.read_csv(csv_path)
            logger.info(f"Loaded cybersecurity threats CSV with {len(df)} records")
            
            # Standardize column names
            df.columns = df.columns.str.lower().str.strip()
            
            # Expected columns: url, label, threat_type, etc.
            if 'url' not in df.columns:
                # Try to find URL column with different names
                url_columns = [col for col in df.columns if 'url' in col.lower() or 'link' in col.lower()]
                if url_columns:
                    df['url'] = df[url_columns[0]]
                else:
                    raise ValueError("No URL column found in CSV")
            
            # Create label column if not exists
            if 'label' not in df.columns:
                if 'malicious' in df.columns:
                    df['label'] = df['malicious'].astype(int)
                elif 'threat_type' in df.columns:
                    df['label'] = (df['threat_type'] != 'benign').astype(int)
                else:
                    # Default to 50/50 split for demo
                    df['label'] = np.random.choice([0, 1], size=len(df))
                    logger.warning("No label column found, using random labels for demo")
            
            return df
            
        except Exception as e:
            logger.error(f"Error loading CSV: {e}")
            raise
    
    def load_kaggle_dataset(self) -> pd.DataFrame:
        """Load the downloaded Kaggle malicious URLs dataset"""
        try:
            if not self.dataset_path:
                self.download_kaggle_dataset()
            
            # Look for CSV files in the dataset directory
            dataset_dir = Path(self.dataset_path)
            csv_files = list(dataset_dir.glob("*.csv"))
            
            if not csv_files:
                raise FileNotFoundError("No CSV files found in dataset directory")
            
            # Load the first CSV file
            df = pd.read_csv(csv_files[0])
            logger.info(f"Loaded Kaggle dataset with {len(df)} records")
            
            # Standardize columns
            df.columns = df.columns.str.lower().str.strip()
            
            # Ensure we have url and label columns
            if 'url' not in df.columns:
                url_cols = [col for col in df.columns if any(term in col.lower() for term in ['url', 'link', 'domain'])]
                if url_cols:
                    df['url'] = df[url_cols[0]]
            
            if 'label' not in df.columns:
                label_cols = [col for col in df.columns if any(term in col.lower() for term in ['label', 'class', 'type', 'malicious'])]
                if label_cols:
                    df['label'] = df[label_cols[0]]
                    # Convert to binary if needed
                    if df['label'].dtype == 'object':
                        df['label'] = (df['label'].str.lower().isin(['malicious', 'phishing', 'malware', '1', 'bad'])).astype(int)
            
            return df
            
        except Exception as e:
            logger.error(f"Error loading Kaggle dataset: {e}")
            raise
    
    def extract_url_features(self, url: str) -> Dict[str, float]:
        """Extract comprehensive features from URL"""
        try:
            parsed = urlparse(url.lower())
            domain = parsed.netloc or parsed.path.split('/')[0]
            
            features = {
                # Basic URL structure
                'url_length': len(url),
                'domain_length': len(domain),
                'path_length': len(parsed.path),
                'query_length': len(parsed.query),
                
                # Character analysis
                'digit_count': sum(c.isdigit() for c in url),
                'letter_count': sum(c.isalpha() for c in url),
                'special_char_count': sum(c in '!@#$%^&*()_+-=[]{}|;:,.<>?' for c in url),
                'dot_count': url.count('.'),
                'dash_count': url.count('-'),
                'underscore_count': url.count('_'),
                'slash_count': url.count('/'),
                
                # Subdomain analysis
                'subdomain_count': len(domain.split('.')) - 2 if '.' in domain else 0,
                
                # Protocol and port
                'has_https': float(parsed.scheme == 'https'),
                'has_port': float(parsed.port is not None),
                'non_standard_port': float(parsed.port not in [None, 80, 443] if parsed.port else False),
                
                # Suspicious patterns
                'has_ip': float(bool(re.search(r'\d+\.\d+\.\d+\.\d+', url))),
                'has_shortener': float(any(re.search(pattern, url) for pattern in self.suspicious_patterns[:4])),
                'suspicious_tld': float(any(tld in domain for tld in ['.tk', '.ml', '.ga', '.cf'])),
                
                # Content analysis
                'has_login_keywords': float(any(word in url.lower() for word in ['login', 'signin', 'auth'])),
                'has_security_keywords': float(any(word in url.lower() for word in ['secure', 'verify', 'confirm'])),
                'has_urgency_keywords': float(any(word in url.lower() for word in ['urgent', 'immediate', 'expire'])),
                
                # Entropy (randomness measure)
                'domain_entropy': self._calculate_entropy(domain),
                'path_entropy': self._calculate_entropy(parsed.path),
            }
            
            # Ratios
            if len(url) > 0:
                features['digit_ratio'] = features['digit_count'] / len(url)
                features['special_char_ratio'] = features['special_char_count'] / len(url)
            else:
                features['digit_ratio'] = 0
                features['special_char_ratio'] = 0
            
            return features
            
        except Exception as e:
            logger.error(f"Feature extraction error for URL {url}: {e}")
            return {}
    
    def _calculate_entropy(self, text: str) -> float:
        """Calculate Shannon entropy of text"""
        if not text:
            return 0
        
        # Count character frequencies
        char_counts = {}
        for char in text:
            char_counts[char] = char_counts.get(char, 0) + 1
        
        # Calculate entropy
        entropy = 0
        text_length = len(text)
        for count in char_counts.values():
            probability = count / text_length
            if probability > 0:
                entropy -= probability * np.log2(probability)
        
        return entropy
    
    def prepare_training_data(self, df: pd.DataFrame) -> Tuple[np.ndarray, np.ndarray, List[str]]:
        """Prepare feature matrix and labels for training"""
        try:
            features_list = []
            labels = []
            
            logger.info("Extracting features from URLs...")
            
            for idx, row in df.iterrows():
                if idx % 1000 == 0:
                    logger.info(f"Processed {idx}/{len(df)} URLs")
                
                url = str(row['url'])
                label = int(row['label'])
                
                # Extract features
                url_features = self.extract_url_features(url)
                
                if url_features:  # Only add if feature extraction succeeded
                    features_list.append(url_features)
                    labels.append(label)
            
            # Convert to DataFrame for easier handling
            features_df = pd.DataFrame(features_list)
            
            # Get feature names
            feature_names = list(features_df.columns)
            
            # Convert to numpy arrays
            X = features_df.values
            y = np.array(labels)
            
            logger.info(f"Prepared {len(X)} samples with {len(feature_names)} features")
            
            return X, y, feature_names
            
        except Exception as e:
            logger.error(f"Error preparing training data: {e}")
            raise
    
    def train_model(self, X: np.ndarray, y: np.ndarray, feature_names: List[str]) -> Dict[str, any]:
        """Train Random Forest model on URL features"""
        try:
            # Split data
            X_train, X_test, y_train, y_test = train_test_split(
                X, y, test_size=0.2, random_state=42, stratify=y
            )
            
            # Train Random Forest
            self.model = RandomForestClassifier(
                n_estimators=100,
                max_depth=20,
                min_samples_split=5,
                min_samples_leaf=2,
                random_state=42,
                n_jobs=-1
            )
            
            logger.info("Training Random Forest model...")
            self.model.fit(X_train, y_train)
            
            # Evaluate
            y_pred = self.model.predict(X_test)
            accuracy = accuracy_score(y_test, y_pred)
            
            # Feature importance
            feature_importance = dict(zip(feature_names, self.model.feature_importances_))
            top_features = sorted(feature_importance.items(), key=lambda x: x[1], reverse=True)[:10]
            
            self.feature_names = feature_names
            
            results = {
                'accuracy': accuracy,
                'classification_report': classification_report(y_test, y_pred),
                'feature_importance': feature_importance,
                'top_features': top_features,
                'model_trained': True
            }
            
            logger.info(f"Model trained with accuracy: {accuracy:.4f}")
            
            return results
            
        except Exception as e:
            logger.error(f"Error training model: {e}")
            raise
    
    def predict_url(self, url: str) -> Dict[str, any]:
        """Predict if URL is malicious"""
        try:
            if not self.model:
                raise ValueError("Model not trained yet")
            
            # Extract features
            features = self.extract_url_features(url)
            
            if not features:
                return {
                    'url': url,
                    'error': 'Feature extraction failed',
                    'risk_score': 50,
                    'classification': 'unknown'
                }
            
            # Prepare feature vector
            feature_vector = np.array([[features.get(name, 0) for name in self.feature_names]])
            
            # Predict
            probabilities = self.model.predict_proba(feature_vector)[0]
            malicious_prob = probabilities[1] if len(probabilities) > 1 else probabilities[0]
            
            risk_score = malicious_prob * 100
            classification = 'malicious' if malicious_prob > 0.5 else 'safe'
            
            # Get feature contributions
            feature_contributions = []
            if hasattr(self.model, 'feature_importances_'):
                for name, importance in zip(self.feature_names, self.model.feature_importances_):
                    if importance > 0.01 and features.get(name, 0) > 0:
                        feature_contributions.append({
                            'feature': name,
                            'value': features.get(name, 0),
                            'importance': importance
                        })
            
            return {
                'url': url,
                'risk_score': round(risk_score, 2),
                'classification': classification,
                'malicious_probability': round(malicious_prob, 4),
                'features': features,
                'feature_contributions': sorted(feature_contributions, 
                                              key=lambda x: x['importance'], reverse=True)[:5]
            }
            
        except Exception as e:
            logger.error(f"Prediction error: {e}")
            return {
                'url': url,
                'error': str(e),
                'risk_score': 50,
                'classification': 'unknown'
            }
    
    def save_model(self, model_path: str = "models/malicious_url_model.pkl"):
        """Save trained model and feature names"""
        try:
            os.makedirs(os.path.dirname(model_path), exist_ok=True)
            
            model_data = {
                'model': self.model,
                'feature_names': self.feature_names,
                'vectorizer': self.vectorizer
            }
            
            joblib.dump(model_data, model_path)
            logger.info(f"Model saved to {model_path}")
            
        except Exception as e:
            logger.error(f"Error saving model: {e}")
            raise
    
    def load_model(self, model_path: str = "models/malicious_url_model.pkl"):
        """Load trained model"""
        try:
            model_data = joblib.load(model_path)
            self.model = model_data['model']
            self.feature_names = model_data['feature_names']
            self.vectorizer = model_data.get('vectorizer')
            
            logger.info(f"Model loaded from {model_path}")
            
        except Exception as e:
            logger.error(f"Error loading model: {e}")
            raise

# Example usage and training pipeline
if __name__ == "__main__":
    # Initialize dataset manager
    manager = MaliciousURLDatasetManager()
    
    try:
        # Download Kaggle dataset
        print("Downloading malicious URLs dataset...")
        dataset_path = manager.download_kaggle_dataset()
        
        # Load dataset
        print("Loading dataset...")
        df = manager.load_kaggle_dataset()
        
        # Prepare training data
        print("Preparing training data...")
        X, y, feature_names = manager.prepare_training_data(df)
        
        # Train model
        print("Training model...")
        results = manager.train_model(X, y, feature_names)
        
        print(f"Training completed with accuracy: {results['accuracy']:.4f}")
        print("\nTop features:")
        for feature, importance in results['top_features']:
            print(f"  {feature}: {importance:.4f}")
        
        # Save model
        manager.save_model()
        
        # Test predictions
        test_urls = [
            "https://google.com",
            "http://bit.ly/phish123",
            "https://secure-paypal-verify.tk/login",
            "http://192.168.1.1/malware"
        ]
        
        print("\nTesting predictions:")
        for url in test_urls:
            result = manager.predict_url(url)
            print(f"{url}: {result['classification']} (score: {result['risk_score']})")
            
    except Exception as e:
        print(f"Error in training pipeline: {e}")