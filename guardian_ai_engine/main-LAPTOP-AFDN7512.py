"""Guardian AI Threat Detection Engine - FastAPI Server"""
from fastapi import FastAPI, HTTPException, Request, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, validator
from typing import List, Optional, Dict
import joblib
import numpy as np
import os
import asyncio
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from utils.feature_extraction import (
    LoginFeatureExtractor,
    URLFeatureExtractor,
    SMSFeatureExtractor
)
from utils.advanced_url_detector import AdvancedURLDetector
from utils.deepfake_detector import DeepfakePatternDetector
from utils.malicious_url_dataset import MaliciousURLDatasetManager
from utils.email_phishing_detector import EmailPhishingDetector

app = FastAPI(
    title="Guardian AI Threat Detection Engine",
    description="Production-ready AI engine for cybersecurity threat detection",
    version="1.0.0"
)

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

models = {}
advanced_detectors = {}

@app.on_event("startup")
async def load_models():
    try:
        # Load traditional ML models
        if os.path.exists('models/login_model.pkl'):
            models['login'] = joblib.load('models/login_model.pkl')
            models['login_features'] = joblib.load('models/login_features.pkl')
            print("✓ Login model loaded")
        
        if os.path.exists('models/url_model.pkl'):
            models['url'] = joblib.load('models/url_model.pkl')
            models['url_features'] = joblib.load('models/url_features.pkl')
            print("✓ URL model loaded")
        
        if os.path.exists('models/sms_model.pkl'):
            models['sms'] = joblib.load('models/sms_model.pkl')
            models['sms_features'] = joblib.load('models/sms_features.pkl')
            print("✓ SMS model loaded")
        
        # Initialize advanced detectors
        advanced_detectors['url'] = AdvancedURLDetector()
        print("✓ Advanced URL detector initialized")
        
        advanced_detectors['deepfake'] = DeepfakePatternDetector()
        print("✓ Deepfake pattern detector initialized")
        
        advanced_detectors['email'] = EmailPhishingDetector()
        print("✓ Email phishing detector initialized")
        
        advanced_detectors['malicious_url'] = MaliciousURLDatasetManager()
        # Try to load pre-trained malicious URL model
        try:
            advanced_detectors['malicious_url'].load_model()
            print("✓ Malicious URL dataset model loaded")
        except:
            print("⚠ Malicious URL model not found - will use rule-based detection")
        
        print("Guardian AI Engine ready with advanced threat detection")
    except Exception as e:
        print(f"Warning: Could not load models - {e}")

class LoginRequest(BaseModel):
    failed_attempts: int = Field(..., ge=0, description="Number of failed login attempts")
    country_changed: bool = Field(..., description="Whether login country changed")
    role_access_attempt: int = Field(..., ge=0, description="Privilege escalation attempts")
    login_gap_minutes: int = Field(..., ge=0, description="Minutes since last login")
    
    @validator('failed_attempts', 'role_access_attempt', 'login_gap_minutes')
    def validate_positive(cls, v):
        if v < 0:
            raise ValueError('Value must be non-negative')
        return v

class URLRequest(BaseModel):
    url: str = Field(..., min_length=1, max_length=2048, description="URL to analyze")
    
    @validator('url')
    def validate_url(cls, v):
        if not v or len(v.strip()) == 0:
            raise ValueError('URL cannot be empty')
        return v.strip()

class ImageAnalysisRequest(BaseModel):
    image_data: Optional[str] = Field(None, description="Base64 encoded image data")
    image_url: Optional[str] = Field(None, description="URL to image for analysis")
    
    @validator('image_data', 'image_url')
    def validate_image_input(cls, v, values):
        if not values.get('image_data') and not v:
            raise ValueError('Either image_data or image_url must be provided')
        return v

class SMSRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=1000, description="SMS text to analyze")
    
    @validator('text')
    def validate_text(cls, v):
        if not v or len(v.strip()) == 0:
            raise ValueError('Text cannot be empty')
        return v.strip()

class AdvancedURLRequest(BaseModel):
    url: str = Field(..., min_length=1, max_length=2048, description="URL for comprehensive analysis")
    include_reputation_check: bool = Field(True, description="Include reputation API checks")
    
    @validator('url')
    def validate_url(cls, v):
        if not v or len(v.strip()) == 0:
            raise ValueError('URL cannot be empty')
        return v.strip()

class EmailPhishingRequest(BaseModel):
    subject: str = Field(..., min_length=1, max_length=500, description="Email subject line")
    body: str = Field(..., min_length=1, max_length=10000, description="Email body content")
    
    @validator('subject', 'body')
    def validate_content(cls, v):
        if not v or len(v.strip()) == 0:
            raise ValueError('Email content cannot be empty')
        return v.strip()

class EmailPhishingResponse(BaseModel):
    risk_score: float
    risk_level: str
    classification: str
    explanation: List[str]
    keywords_detected: List[str]
    links_found: int
    links: Optional[List[str]] = None
    recommended_action: str
    incident_required: bool

class AdvancedThreatResponse(BaseModel):
    risk_score: float
    risk_level: str
    classification: str
    explanation: List[str]
    incident_required: bool
    probability: Optional[float] = None
    threats_detected: Optional[List[str]] = None
    recommendations: Optional[List[str]] = None
    details: Optional[Dict] = None

class ThreatResponse(BaseModel):
    risk_score: float
    risk_level: str
    classification: str
    explanation: List[str]
    incident_required: bool
    probability: Optional[float] = None

def calculate_risk_level(score: float) -> str:
    if score <= 30:
        return "Low"
    elif score <= 60:
        return "Medium"
    else:
        return "High"

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "models_loaded": {
            "login": "login" in models,
            "url": "url" in models,
            "sms": "sms" in models
        },
        "advanced_detectors": {
            "url_detector": "url" in advanced_detectors,
            "deepfake_detector": "deepfake" in advanced_detectors,
            "malicious_url_detector": "malicious_url" in advanced_detectors
        }
    }

@app.post("/predict/login", response_model=ThreatResponse)
@limiter.limit("100/minute")
async def predict_login(request: Request, data: LoginRequest):
    try:
        extractor = LoginFeatureExtractor()
        features = extractor.extract(data.dict())
        
        if 'login' not in models:
            raise HTTPException(status_code=503, detail="Login model not available")
        
        feature_vector = np.array([[features[f] for f in models['login_features']]])
        
        probabilities = models['login'].predict_proba(feature_vector)[0]
        predicted_class = models['login'].classes_[np.argmax(probabilities)]
        max_probability = float(np.max(probabilities))
        
        risk_score = max_probability * 100
        
        if hasattr(models['login'], 'coef_'):
            weights = models['login'].coef_[np.argmax(probabilities)]
            explanations = extractor.explain_features(features, weights, models['login_features'])
        else:
            explanations = ["Anomaly detected based on login pattern"]
        
        return ThreatResponse(
            risk_score=round(risk_score, 2),
            risk_level=calculate_risk_level(risk_score),
            classification=predicted_class,
            explanation=explanations,
            incident_required=risk_score > 60,
            probability=round(max_probability, 4)
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")

@app.post("/predict/url", response_model=ThreatResponse)
@limiter.limit("100/minute")
async def predict_url(request: Request, data: URLRequest):
    try:
        extractor = URLFeatureExtractor()
        features = extractor.extract(data.url)
        
        if 'url' in models:
            feature_vector = np.array([[features[f] for f in models['url_features']]])
            probabilities = models['url'].predict_proba(feature_vector)[0]
            phishing_prob = float(probabilities[1])
            risk_score = phishing_prob * 100
            classification = "phishing" if phishing_prob > 0.5 else "safe"
            _, reasons = extractor.calculate_risk_score(features)
        else:
            risk_score, reasons = extractor.calculate_risk_score(features)
            classification = "phishing" if risk_score > 50 else "safe"
        
        return ThreatResponse(
            risk_score=round(risk_score, 2),
            risk_level=calculate_risk_level(risk_score),
            classification=classification,
            explanation=reasons,
            incident_required=risk_score > 60
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")

@app.post("/predict/url/advanced", response_model=AdvancedThreatResponse)
@limiter.limit("50/minute")
async def predict_url_advanced(request: Request, data: AdvancedURLRequest):
    """Advanced URL analysis with typosquatting, reputation checks, and ML classification"""
    try:
        if 'url' not in advanced_detectors:
            raise HTTPException(status_code=503, detail="Advanced URL detector not available")
        
        # Perform comprehensive analysis
        analysis = await advanced_detectors['url'].comprehensive_url_analysis(data.url)
        
        # Also check with malicious URL dataset if available
        if 'malicious_url' in advanced_detectors and advanced_detectors['malicious_url'].model:
            ml_result = advanced_detectors['malicious_url'].predict_url(data.url)
            analysis['details']['ml_dataset_analysis'] = ml_result
            
            # Combine scores (weighted average)
            ml_score = ml_result.get('risk_score', 0)
            combined_score = (analysis['risk_score'] * 0.7) + (ml_score * 0.3)
            analysis['risk_score'] = min(combined_score, 100)
        
        # Update risk level based on final score
        if analysis['risk_score'] <= 30:
            analysis['risk_level'] = 'Low'
        elif analysis['risk_score'] <= 60:
            analysis['risk_level'] = 'Medium'
        else:
            analysis['risk_level'] = 'High'
        
        return AdvancedThreatResponse(
            risk_score=round(analysis['risk_score'], 2),
            risk_level=analysis['risk_level'],
            classification=analysis['classification'],
            explanation=analysis.get('threats_detected', []),
            incident_required=analysis['risk_score'] > 60,
            threats_detected=analysis.get('threats_detected', []),
            recommendations=analysis.get('recommendations', []),
            details=analysis.get('details', {})
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Advanced URL analysis error: {str(e)}")

@app.post("/predict/deepfake", response_model=AdvancedThreatResponse)
@limiter.limit("20/minute")
async def predict_deepfake(request: Request, file: UploadFile = File(...)):
    """Analyze uploaded image for deepfake and dark patterns"""
    try:
        if 'deepfake' not in advanced_detectors:
            raise HTTPException(status_code=503, detail="Deepfake detector not available")
        
        # Save uploaded file temporarily
        import tempfile
        with tempfile.NamedTemporaryFile(delete=False, suffix='.jpg') as tmp_file:
            content = await file.read()
            tmp_file.write(content)
            tmp_file_path = tmp_file.name
        
        try:
            # Analyze image
            analysis = advanced_detectors['deepfake'].detect_dark_patterns(tmp_file_path)
            
            return AdvancedThreatResponse(
                risk_score=analysis['risk_score'],
                risk_level=calculate_risk_level(analysis['risk_score']),
                classification=analysis['classification'],
                explanation=analysis['analysis']['suspicious_elements'],
                incident_required=analysis['risk_score'] > 60,
                threats_detected=analysis['analysis']['suspicious_elements'],
                recommendations=analysis['analysis'].get('recommendations', []),
                details={
                    'detections': analysis['detections'],
                    'pattern_analysis': analysis['analysis']['pattern_analysis']
                }
            )
        
        finally:
            # Clean up temporary file
            os.unlink(tmp_file_path)
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Deepfake analysis error: {str(e)}")

@app.post("/train/malicious-urls")
@limiter.limit("1/hour")
async def train_malicious_url_model(request: Request):
    """Train malicious URL detection model using Kaggle dataset"""
    try:
        if 'malicious_url' not in advanced_detectors:
            raise HTTPException(status_code=503, detail="Malicious URL manager not available")
        
        manager = advanced_detectors['malicious_url']
        
        # Download and load dataset
        dataset_path = manager.download_kaggle_dataset()
        df = manager.load_kaggle_dataset()
        
        # Prepare training data
        X, y, feature_names = manager.prepare_training_data(df)
        
        # Train model
        results = manager.train_model(X, y, feature_names)
        
        # Save model
        manager.save_model()
        
        return {
            "status": "success",
            "message": "Malicious URL model trained successfully",
            "accuracy": results['accuracy'],
            "samples_trained": len(X),
            "top_features": results['top_features'][:5]
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Training error: {str(e)}")

@app.get("/analyze/dataset/deepfake")
async def analyze_deepfake_dataset():
    """Analyze the deepfake dataset for patterns"""
    try:
        if 'deepfake' not in advanced_detectors:
            raise HTTPException(status_code=503, detail="Deepfake detector not available")
        
        # Batch analyze dataset
        results = advanced_detectors['deepfake'].batch_analyze_dataset(limit=50)
        
        return {
            "status": "success",
            "analysis": results,
            "message": f"Analyzed {results['total_analyzed']} images from deepfake dataset"
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Dataset analysis error: {str(e)}")

@app.post("/predict/sms", response_model=ThreatResponse)
@limiter.limit("100/minute")
async def predict_sms(request: Request, data: SMSRequest):
    try:
        extractor = SMSFeatureExtractor()
        features = extractor.extract(data.text)
        keywords = extractor.extract_keywords(data.text)
        
        if 'sms' not in models:
            raise HTTPException(status_code=503, detail="SMS model not available")
        
        feature_vector = np.array([[features[f] for f in models['sms_features']]])
        
        probabilities = models['sms'].predict_proba(feature_vector)[0]
        scam_probability = float(probabilities[1])
        risk_score = scam_probability * 100
        
        classification = "scam" if scam_probability > 0.5 else "legitimate"
        
        explanations = keywords if keywords else ["No suspicious patterns detected"]
        
        return ThreatResponse(
            risk_score=round(risk_score, 2),
            risk_level=calculate_risk_level(risk_score),
            classification=classification,
            explanation=explanations,
            incident_required=risk_score > 60,
            probability=round(scam_probability, 4)
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")

@app.post("/detect-email-phishing", response_model=EmailPhishingResponse)
@limiter.limit("100/minute")
async def detect_email_phishing(request: Request, data: EmailPhishingRequest):
    """Detect phishing attempts in email content with detailed explanation"""
    try:
        if 'email' not in advanced_detectors:
            raise HTTPException(status_code=503, detail="Email phishing detector not available")
        
        # Analyze email
        result = advanced_detectors['email'].analyze_email(data.subject, data.body)
        
        return EmailPhishingResponse(
            risk_score=result['risk_score'],
            risk_level=result['risk_level'],
            classification=result['classification'],
            explanation=result['explanation'],
            keywords_detected=result['keywords_detected'],
            links_found=result['links_found'],
            links=result.get('links', []),
            recommended_action=result['recommended_action'],
            incident_required=result['risk_score'] > 60
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Email phishing detection error: {str(e)}")

@app.post("/analyze-voice")
@limiter.limit("20/minute")
async def analyze_voice(request: Request, file: UploadFile = File(...)):
    """Analyze uploaded audio for AI-generated voice detection"""
    try:
        # Validate file type
        allowed_extensions = ['.wav', '.mp3', '.m4a', '.ogg', '.flac']
        file_ext = os.path.splitext(file.filename)[1].lower()
        
        if file_ext not in allowed_extensions:
            raise HTTPException(
                status_code=400, 
                detail=f"Unsupported file format. Allowed: {', '.join(allowed_extensions)}"
            )
        
        # Check file size (max 10MB)
        content = await file.read()
        file_size_mb = len(content) / (1024 * 1024)
        
        if file_size_mb > 10:
            raise HTTPException(
                status_code=400,
                detail=f"File too large ({file_size_mb:.1f}MB). Maximum size is 10MB."
            )
        
        # Initialize voice detector if not already done
        if 'voice' not in advanced_detectors:
            from utils.voice_deepfake_detector import VoiceDeepfakeDetector
            advanced_detectors['voice'] = VoiceDeepfakeDetector()
            print("✓ Voice deepfake detector initialized")
        
        # Analyze audio
        result = advanced_detectors['voice'].analyze_audio(content, file.filename)
        
        return {
            'risk_score': result['risk_score'],
            'classification': result['classification'],
            'confidence': result['confidence'],
            'features_detected': result['features_detected'],
            'explanation': result['explanation'],
            'recommended_action': result['recommended_action'],
            'audio_duration': result.get('audio_duration', 0),
            'sample_rate': result.get('sample_rate', 0),
            'filename': file.filename,
            'file_size_mb': round(file_size_mb, 2)
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Voice analysis error: {str(e)}")

@app.get("/")
async def root():
    return {
        "service": "Guardian AI Advanced Threat Detection Engine",
        "version": "3.0.0",
        "features": [
            "Traditional ML-based threat detection",
            "Advanced URL analysis with typosquatting detection",
            "Email phishing detection with explainability",
            "AI voice deepfake detection",
            "Reputation API integration",
            "Deepfake and dark pattern detection",
            "Malicious URL dataset training",
            "Real-time phishing detection",
            "AI-powered threat explanation engine"
        ],
        "endpoints": {
            "health": "/health",
            "login_detection": "/predict/login",
            "url_detection": "/predict/url",
            "advanced_url_detection": "/predict/url/advanced",
            "sms_detection": "/predict/sms",
            "email_phishing_detection": "/detect-email-phishing",
            "voice_deepfake_detection": "/analyze-voice",
            "deepfake_detection": "/predict/deepfake",
            "train_malicious_urls": "/train/malicious-urls",
            "analyze_deepfake_dataset": "/analyze/dataset/deepfake"
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
