"""Deepfake Pattern Detection using Dark Patterns Dataset"""
import cv2
import numpy as np
import os
import logging
from typing import Dict, List, Tuple, Optional
import json
from pathlib import Path

try:
    import yaml
    YAML_AVAILABLE = True
except ImportError:
    YAML_AVAILABLE = False
    logging.warning("PyYAML not available, using default config")

logger = logging.getLogger(__name__)

class DeepfakePatternDetector:
    """Detect deepfake and dark patterns in images using YOLO-based detection"""
    
    def __init__(self, dataset_path: str = "archive (2)"):
        self.dataset_path = Path(dataset_path)
        self.class_names = ['button', 'checkbox', 'input_field', 'popup', 'qr_code']
        self.confidence_threshold = 0.5
        self.nms_threshold = 0.4
        
        # Load dataset configuration
        self.config = self._load_dataset_config()
        
    def _load_dataset_config(self) -> Dict:
        """Load dataset configuration from data.yaml"""
        try:
            if not YAML_AVAILABLE:
                return {'nc': 5, 'names': self.class_names}
                
            config_path = self.dataset_path / "data.yaml"
            if config_path.exists():
                with open(config_path, 'r') as f:
                    return yaml.safe_load(f)
            else:
                logger.warning("Dataset config not found, using defaults")
                return {
                    'nc': 5,
                    'names': self.class_names
                }
        except Exception as e:
            logger.error(f"Error loading dataset config: {e}")
            return {'nc': 5, 'names': self.class_names}
    
    def preprocess_image(self, image_path: str) -> np.ndarray:
        """Preprocess image for detection"""
        try:
            # Load image
            if isinstance(image_path, str):
                image = cv2.imread(image_path)
            else:
                image = image_path
                
            if image is None:
                raise ValueError("Could not load image")
            
            # Convert BGR to RGB
            image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            
            # Resize to model input size
            image_resized = cv2.resize(image_rgb, (640, 640))
            
            # Normalize
            image_normalized = image_resized.astype(np.float32) / 255.0
            
            return image_normalized
            
        except Exception as e:
            logger.error(f"Image preprocessing error: {e}")
            raise
    
    def detect_dark_patterns(self, image_path: str) -> Dict[str, any]:
        """Detect dark patterns in the given image"""
        try:
            # Preprocess image
            processed_image = self.preprocess_image(image_path)
            
            # Simulate YOLO detection (replace with actual model inference)
            detections = self._simulate_yolo_detection(processed_image)
            
            # Analyze detections for suspicious patterns
            analysis = self._analyze_detections(detections, processed_image)
            
            return {
                'image_path': image_path,
                'detections': detections,
                'analysis': analysis,
                'risk_score': analysis['risk_score'],
                'classification': analysis['classification'],
                'suspicious_elements': analysis['suspicious_elements']
            }
            
        except Exception as e:
            logger.error(f"Dark pattern detection error: {e}")
            return {
                'image_path': image_path,
                'error': str(e),
                'risk_score': 0,
                'classification': 'unknown'
            }
    
    def _simulate_yolo_detection(self, image: np.ndarray) -> List[Dict]:
        """Simulate YOLO object detection (replace with actual model)"""
        detections = []
        
        # Simulate detection based on image characteristics
        height, width = image.shape[:2]
        
        # Detect potential UI elements based on color patterns and shapes
        gray = cv2.cvtColor((image * 255).astype(np.uint8), cv2.COLOR_RGB2GRAY)
        
        # Find contours for potential buttons/UI elements
        edges = cv2.Canny(gray, 50, 150)
        contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        for i, contour in enumerate(contours[:10]):  # Limit to top 10 contours
            # Get bounding box
            x, y, w, h = cv2.boundingRect(contour)
            
            # Filter by size (potential UI elements)
            if w > 20 and h > 10 and w < width * 0.8 and h < height * 0.8:
                # Classify based on aspect ratio and size
                aspect_ratio = w / h
                area = w * h
                
                if aspect_ratio > 2 and area > 1000:  # Likely button
                    class_name = 'button'
                    confidence = 0.7 + np.random.random() * 0.2
                elif aspect_ratio < 1.5 and area < 500:  # Likely checkbox
                    class_name = 'checkbox'
                    confidence = 0.6 + np.random.random() * 0.3
                elif aspect_ratio > 3 and h < 50:  # Likely input field
                    class_name = 'input_field'
                    confidence = 0.65 + np.random.random() * 0.25
                elif area > width * height * 0.1:  # Large area - popup
                    class_name = 'popup'
                    confidence = 0.8 + np.random.random() * 0.15
                else:
                    continue
                
                detections.append({
                    'class': class_name,
                    'confidence': confidence,
                    'bbox': [x, y, x + w, y + h],
                    'area': area
                })
        
        # Add some QR code detection simulation
        if len(detections) > 0 and np.random.random() > 0.7:
            # Simulate QR code detection
            qr_x = int(width * 0.1)
            qr_y = int(height * 0.1)
            qr_size = min(width, height) // 4
            
            detections.append({
                'class': 'qr_code',
                'confidence': 0.85,
                'bbox': [qr_x, qr_y, qr_x + qr_size, qr_y + qr_size],
                'area': qr_size * qr_size
            })
        
        return detections
    
    def _analyze_detections(self, detections: List[Dict], image: np.ndarray) -> Dict[str, any]:
        """Analyze detections for suspicious patterns"""
        analysis = {
            'risk_score': 0,
            'classification': 'safe',
            'suspicious_elements': [],
            'pattern_analysis': {},
            'recommendations': []
        }
        
        if not detections:
            return analysis
        
        # Count elements by type
        element_counts = {}
        for detection in detections:
            class_name = detection['class']
            element_counts[class_name] = element_counts.get(class_name, 0) + 1
        
        analysis['pattern_analysis']['element_counts'] = element_counts
        
        # Analyze suspicious patterns
        risk_score = 0
        
        # 1. Excessive buttons (potential clickbait)
        if element_counts.get('button', 0) > 5:
            risk_score += 25
            analysis['suspicious_elements'].append("Excessive number of buttons detected")
        
        # 2. Multiple popups (aggressive marketing)
        if element_counts.get('popup', 0) > 2:
            risk_score += 30
            analysis['suspicious_elements'].append("Multiple popups detected")
        
        # 3. QR codes in suspicious contexts
        if element_counts.get('qr_code', 0) > 0:
            if element_counts.get('button', 0) > 3:  # QR + many buttons
                risk_score += 20
                analysis['suspicious_elements'].append("QR code with excessive interactive elements")
        
        # 4. Unusual input field patterns
        if element_counts.get('input_field', 0) > 8:
            risk_score += 15
            analysis['suspicious_elements'].append("Excessive input fields (potential data harvesting)")
        
        # 5. Checkbox overuse (potential consent manipulation)
        if element_counts.get('checkbox', 0) > 6:
            risk_score += 10
            analysis['suspicious_elements'].append("Excessive checkboxes (potential consent manipulation)")
        
        # 6. Analyze spatial distribution
        spatial_risk = self._analyze_spatial_distribution(detections, image.shape)
        risk_score += spatial_risk['score']
        analysis['suspicious_elements'].extend(spatial_risk['issues'])
        
        # 7. Color and contrast analysis
        color_risk = self._analyze_color_patterns(detections, image)
        risk_score += color_risk['score']
        analysis['suspicious_elements'].extend(color_risk['issues'])
        
        analysis['risk_score'] = min(risk_score, 100)
        
        # Classify based on risk score
        if analysis['risk_score'] <= 20:
            analysis['classification'] = 'safe'
        elif analysis['risk_score'] <= 50:
            analysis['classification'] = 'suspicious'
        else:
            analysis['classification'] = 'dangerous'
        
        # Generate recommendations
        if analysis['classification'] == 'dangerous':
            analysis['recommendations'] = [
                "High risk of dark patterns detected",
                "Avoid interacting with this interface",
                "Report as potentially deceptive content"
            ]
        elif analysis['classification'] == 'suspicious':
            analysis['recommendations'] = [
                "Exercise caution with this interface",
                "Read all terms carefully before proceeding",
                "Verify legitimacy through official channels"
            ]
        
        return analysis
    
    def _analyze_spatial_distribution(self, detections: List[Dict], image_shape: Tuple) -> Dict[str, any]:
        """Analyze spatial distribution of UI elements"""
        height, width = image_shape[:2]
        risk_score = 0
        issues = []
        
        if not detections:
            return {'score': 0, 'issues': []}
        
        # Calculate element density
        total_area = sum(det['area'] for det in detections)
        screen_area = width * height
        density = total_area / screen_area
        
        if density > 0.3:  # More than 30% of screen covered
            risk_score += 15
            issues.append("High UI element density (cluttered interface)")
        
        # Check for elements clustered in corners (hiding important info)
        corner_elements = 0
        for det in detections:
            x1, y1, x2, y2 = det['bbox']
            center_x, center_y = (x1 + x2) / 2, (y1 + y2) / 2
            
            # Check if in corners
            if (center_x < width * 0.2 or center_x > width * 0.8) and \
               (center_y < height * 0.2 or center_y > height * 0.8):
                corner_elements += 1
        
        if corner_elements > len(detections) * 0.4:
            risk_score += 10
            issues.append("Many elements positioned in corners (potential hiding)")
        
        return {'score': risk_score, 'issues': issues}
    
    def _analyze_color_patterns(self, detections: List[Dict], image: np.ndarray) -> Dict[str, any]:
        """Analyze color patterns for deceptive design"""
        risk_score = 0
        issues = []
        
        try:
            # Convert to HSV for better color analysis
            hsv_image = cv2.cvtColor((image * 255).astype(np.uint8), cv2.COLOR_RGB2HSV)
            
            # Analyze dominant colors
            pixels = hsv_image.reshape(-1, 3)
            
            # Check for excessive red (urgency manipulation)
            red_pixels = np.sum((pixels[:, 0] < 10) | (pixels[:, 0] > 170))
            red_ratio = red_pixels / len(pixels)
            
            if red_ratio > 0.15:  # More than 15% red
                risk_score += 10
                issues.append("Excessive red coloring (urgency manipulation)")
            
            # Check for low contrast (hiding information)
            gray = cv2.cvtColor((image * 255).astype(np.uint8), cv2.COLOR_RGB2GRAY)
            contrast = np.std(gray)
            
            if contrast < 30:  # Low contrast
                risk_score += 5
                issues.append("Low contrast detected (potential information hiding)")
            
        except Exception as e:
            logger.error(f"Color analysis error: {e}")
        
        return {'score': risk_score, 'issues': issues}
    
    def batch_analyze_dataset(self, limit: int = 50) -> Dict[str, any]:
        """Analyze a batch of images from the dataset"""
        results = {
            'total_analyzed': 0,
            'classifications': {'safe': 0, 'suspicious': 0, 'dangerous': 0},
            'common_patterns': {},
            'average_risk_score': 0,
            'sample_results': []
        }
        
        try:
            # Get sample images from train directory
            train_images_path = self.dataset_path / "train" / "images"
            
            if not train_images_path.exists():
                logger.error("Train images directory not found")
                return results
            
            image_files = list(train_images_path.glob("*.jpg")) + list(train_images_path.glob("*.png"))
            
            total_risk_score = 0
            
            for i, image_file in enumerate(image_files[:limit]):
                try:
                    analysis = self.detect_dark_patterns(str(image_file))
                    
                    results['total_analyzed'] += 1
                    results['classifications'][analysis['classification']] += 1
                    total_risk_score += analysis['risk_score']
                    
                    if i < 10:  # Store first 10 as samples
                        results['sample_results'].append({
                            'file': image_file.name,
                            'risk_score': analysis['risk_score'],
                            'classification': analysis['classification'],
                            'elements_detected': len(analysis.get('detections', []))
                        })
                    
                except Exception as e:
                    logger.error(f"Error analyzing {image_file}: {e}")
                    continue
            
            if results['total_analyzed'] > 0:
                results['average_risk_score'] = total_risk_score / results['total_analyzed']
            
        except Exception as e:
            logger.error(f"Batch analysis error: {e}")
        
        return results

# Example usage
if __name__ == "__main__":
    detector = DeepfakePatternDetector()
    
    # Test with a sample image
    print("Testing deepfake pattern detector...")
    
    # Batch analyze dataset
    batch_results = detector.batch_analyze_dataset(limit=20)
    print(f"Batch Analysis Results:")
    print(f"Total analyzed: {batch_results['total_analyzed']}")
    print(f"Classifications: {batch_results['classifications']}")
    print(f"Average risk score: {batch_results['average_risk_score']:.2f}")