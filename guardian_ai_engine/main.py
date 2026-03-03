"""Guardian AI Threat Detection Engine - FastAPI Server"""
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, validator
from typing import List, Optional
import joblib
import numpy as np
import os
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from utils.feature_extraction import (
    LoginFeatureExtractor,
    URLFeatureExtractor,
    SMSFeatureExtractor
)

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

@app.on_event("startup")
async def load_models():
    try:
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
        
        print("Guardian AI Engine ready")
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

class SMSRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=1000, description="SMS text to analyze")
    
    @validator('text')
    def validate_text(cls, v):
        if not v or len(v.strip()) == 0:
            raise ValueError('Text cannot be empty')
        return v.strip()

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

@app.get("/")
async def root():
    return {
        "service": "Guardian AI Threat Detection Engine",
        "version": "1.0.0",
        "endpoints": {
            "health": "/health",
            "login_detection": "/predict/login",
            "url_detection": "/predict/url",
            "sms_detection": "/predict/sms"
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
