"""AI Voice Deepfake Detection - Fast & Explainable"""
import numpy as np
import logging
from typing import Dict, List, Tuple
import io

logger = logging.getLogger(__name__)

class VoiceDeepfakeDetector:
    """Detect AI-generated voices using audio feature analysis"""
    
    def __init__(self):
        self.sample_rate = 16000  # Standard sample rate
        
    def analyze_audio(self, audio_data: bytes, filename: str) -> Dict:
        """
        Analyze audio for AI-generated voice detection
        Fast heuristic-based approach for demo
        """
        try:
            # Try to import librosa (optional dependency)
            try:
                import librosa
                import soundfile as sf
                has_librosa = True
            except ImportError:
                logger.warning("Librosa not available, using basic analysis")
                has_librosa = False
            
            if has_librosa:
                # Load and preprocess audio
                audio, sr = self._load_audio(audio_data, filename)
                
                # Extract features
                features = self._extract_features(audio, sr)
                
                # Analyze for AI patterns
                risk_score, classification, confidence, detected_features, explanation = \
                    self._analyze_ai_patterns(features)
            else:
                # Fallback: Basic analysis without librosa
                risk_score = 50.0
                classification = "Unable to Analyze"
                confidence = "Low"
                detected_features = ["Audio analysis requires librosa library"]
                explanation = ["Install librosa for full voice analysis: pip install librosa"]
            
            # Determine recommended action
            if risk_score >= 70:
                recommended_action = "⚠️ HIGH RISK: This voice shows strong AI-generated patterns. Verify caller identity through official channels before taking any action."
            elif risk_score >= 40:
                recommended_action = "⚠️ MEDIUM RISK: Voice shows some suspicious patterns. Exercise caution and verify caller identity."
            else:
                recommended_action = "✅ LOW RISK: Voice appears natural, but always verify identity for sensitive requests."
            
            return {
                'risk_score': round(risk_score, 2),
                'classification': classification,
                'confidence': confidence,
                'features_detected': detected_features,
                'explanation': explanation,
                'recommended_action': recommended_action,
                'audio_duration': features.get('duration', 0) if has_librosa else 0,
                'sample_rate': sr if has_librosa else 0
            }
            
        except Exception as e:
            logger.error(f"Voice analysis error: {e}")
            return {
                'risk_score': 50.0,
                'classification': 'Analysis Error',
                'confidence': 'Low',
                'features_detected': [f'Error: {str(e)}'],
                'explanation': ['Unable to analyze audio file. Please ensure it is a valid audio format.'],
                'recommended_action': 'Unable to determine. Verify caller through official channels.',
                'audio_duration': 0,
                'sample_rate': 0
            }
    
    def _load_audio(self, audio_data: bytes, filename: str):
        """Load and preprocess audio"""
        import librosa
        import soundfile as sf
        
        # Load audio from bytes
        audio_file = io.BytesIO(audio_data)
        
        try:
            # Try loading with soundfile first
            audio, sr = sf.read(audio_file)
            
            # Convert to mono if stereo
            if len(audio.shape) > 1:
                audio = np.mean(audio, axis=1)
            
            # Resample to standard rate
            if sr != self.sample_rate:
                audio = librosa.resample(audio, orig_sr=sr, target_sr=self.sample_rate)
                sr = self.sample_rate
            
        except Exception as e:
            logger.warning(f"Soundfile failed, trying librosa: {e}")
            audio_file.seek(0)
            audio, sr = librosa.load(audio_file, sr=self.sample_rate, mono=True)
        
        # Normalize audio
        audio = librosa.util.normalize(audio)
        
        # Trim silence
        audio, _ = librosa.effects.trim(audio, top_db=20)
        
        return audio, sr
    
    def _extract_features(self, audio: np.ndarray, sr: int) -> Dict[str, float]:
        """Extract voice features for AI detection"""
        import librosa
        
        features = {}
        
        try:
            # Duration
            features['duration'] = len(audio) / sr
            
            # MFCC (Mel Frequency Cepstral Coefficients)
            mfcc = librosa.feature.mfcc(y=audio, sr=sr, n_mfcc=13)
            features['mfcc_mean'] = float(np.mean(mfcc))
            features['mfcc_std'] = float(np.std(mfcc))
            features['mfcc_variation'] = float(np.std(np.std(mfcc, axis=1)))
            
            # Pitch (F0) analysis
            pitches, magnitudes = librosa.piptrack(y=audio, sr=sr)
            pitch_values = []
            for t in range(pitches.shape[1]):
                index = magnitudes[:, t].argmax()
                pitch = pitches[index, t]
                if pitch > 0:
                    pitch_values.append(pitch)
            
            if pitch_values:
                features['pitch_mean'] = float(np.mean(pitch_values))
                features['pitch_std'] = float(np.std(pitch_values))
                features['pitch_range'] = float(np.max(pitch_values) - np.min(pitch_values))
                features['pitch_variation'] = float(np.std(pitch_values) / (np.mean(pitch_values) + 1e-6))
            else:
                features['pitch_mean'] = 0
                features['pitch_std'] = 0
                features['pitch_range'] = 0
                features['pitch_variation'] = 0
            
            # Energy/Amplitude
            rms = librosa.feature.rms(y=audio)[0]
            features['energy_mean'] = float(np.mean(rms))
            features['energy_std'] = float(np.std(rms))
            features['energy_variation'] = float(np.std(rms) / (np.mean(rms) + 1e-6))
            
            # Zero Crossing Rate (speech rhythm)
            zcr = librosa.feature.zero_crossing_rate(audio)[0]
            features['zcr_mean'] = float(np.mean(zcr))
            features['zcr_std'] = float(np.std(zcr))
            
            # Spectral features
            spectral_centroids = librosa.feature.spectral_centroid(y=audio, sr=sr)[0]
            features['spectral_centroid_mean'] = float(np.mean(spectral_centroids))
            features['spectral_centroid_std'] = float(np.std(spectral_centroids))
            
            spectral_rolloff = librosa.feature.spectral_rolloff(y=audio, sr=sr)[0]
            features['spectral_rolloff_mean'] = float(np.mean(spectral_rolloff))
            
            # Tempo/Rhythm
            tempo, _ = librosa.beat.beat_track(y=audio, sr=sr)
            features['tempo'] = float(tempo)
            
        except Exception as e:
            logger.error(f"Feature extraction error: {e}")
            # Return default features
            features = {
                'duration': len(audio) / sr,
                'mfcc_variation': 0,
                'pitch_variation': 0,
                'energy_variation': 0
            }
        
        return features
    
    def _analyze_ai_patterns(self, features: Dict[str, float]) -> Tuple[float, str, str, List[str], List[str]]:
        """
        Analyze features for AI-generated voice patterns
        Returns: (risk_score, classification, confidence, detected_features, explanation)
        """
        risk_score = 0.0
        detected_features = []
        explanation = []
        
        # Check duration
        if features.get('duration', 0) < 1:
            explanation.append("⚠️ Audio too short for reliable analysis")
            return 50.0, "Insufficient Data", "Low", ["Audio too short"], explanation
        
        # 1. Pitch Variation Analysis (AI voices often have low variation)
        pitch_var = features.get('pitch_variation', 0)
        if pitch_var < 0.05:  # Very low variation
            risk_score += 30
            detected_features.append("Very low pitch variation (AI trait)")
            explanation.append("Voice shows unnaturally consistent pitch - common in AI-generated speech")
        elif pitch_var < 0.10:
            risk_score += 15
            detected_features.append("Low pitch variation")
            explanation.append("Pitch consistency is slightly higher than natural human speech")
        else:
            detected_features.append("Natural pitch variation")
        
        # 2. MFCC Variation (AI voices have different spectral patterns)
        mfcc_var = features.get('mfcc_variation', 0)
        if mfcc_var < 5.0:  # Low spectral variation
            risk_score += 25
            detected_features.append("Low spectral variation (AI trait)")
            explanation.append("Voice spectral patterns show AI-like consistency")
        elif mfcc_var > 15.0:  # Very high variation (also suspicious)
            risk_score += 10
            detected_features.append("Unusual spectral patterns")
        else:
            detected_features.append("Normal spectral patterns")
        
        # 3. Energy Variation (AI voices often have consistent energy)
        energy_var = features.get('energy_variation', 0)
        if energy_var < 0.3:  # Very consistent energy
            risk_score += 20
            detected_features.append("Consistent energy levels (AI trait)")
            explanation.append("Voice energy is unnaturally stable - humans show more variation")
        else:
            detected_features.append("Natural energy variation")
        
        # 4. Zero Crossing Rate (speech rhythm)
        zcr_std = features.get('zcr_std', 0)
        if zcr_std < 0.01:  # Very consistent rhythm
            risk_score += 15
            detected_features.append("Unnatural speech rhythm")
            explanation.append("Speech rhythm shows AI-like regularity")
        else:
            detected_features.append("Natural speech rhythm")
        
        # 5. Pitch Range (AI voices often have limited range)
        pitch_range = features.get('pitch_range', 0)
        if pitch_range < 50:  # Very narrow pitch range
            risk_score += 10
            detected_features.append("Limited pitch range")
            explanation.append("Voice pitch range is narrower than typical human speech")
        
        # Determine classification and confidence
        if risk_score >= 70:
            classification = "Likely AI-Generated Voice"
            confidence = "High"
        elif risk_score >= 40:
            classification = "Possibly AI-Generated Voice"
            confidence = "Medium"
        else:
            classification = "Likely Human Voice"
            confidence = "Medium" if risk_score > 20 else "High"
        
        # Add positive indicators if low risk
        if risk_score < 40:
            explanation.append("Voice shows natural human speech characteristics")
            explanation.append("Pitch and energy variations are within normal human range")
        
        return risk_score, classification, confidence, detected_features, explanation

# Example usage
if __name__ == "__main__":
    detector = VoiceDeepfakeDetector()
    print("Voice Deepfake Detector initialized")
    print("Ready to analyze audio files for AI-generated voice detection")
