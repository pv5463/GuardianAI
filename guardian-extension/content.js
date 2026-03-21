// Content script for real-time URL detection
const API_URL = 'http://localhost:8000';

// Check if warning banner already exists
let warningBanner = null;

// Analyze current page URL
async function analyzeCurrentPage() {
  const url = window.location.href;
  
  // Skip analysis for certain URLs
  if (url.startsWith('chrome://') || url.startsWith('chrome-extension://') || url.startsWith('about:')) {
    return;
  }
  
  try {
    // Check cache first
    const cached = await chrome.storage.local.get(url);
    if (cached[url] && (Date.now() - cached[url].timestamp < 300000)) {
      handleThreatResult(cached[url]);
      return;
    }
    
    // Call API
    const response = await fetch(`${API_URL}/analyze-url-advanced`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url })
    });
    
    if (!response.ok) {
      console.error('Guardian AI: API request failed');
      return;
    }
    
    const data = await response.json();
    
    // Store in cache
    await chrome.storage.local.set({ 
      [url]: { 
        ...data, 
        timestamp: Date.now() 
      } 
    });
    
    // Handle threat
    handleThreatResult(data);
    
    // Send to background script
    chrome.runtime.sendMessage({
      type: 'THREAT_DETECTED',
      data: { url, ...data }
    });
    
  } catch (error) {
    console.error('Guardian AI: Analysis error', error);
  }
}

// Handle threat result
function handleThreatResult(data) {
  const riskLevel = getRiskLevel(data.risk_score);
  
  // Show warning for high and critical risks
  if (riskLevel === 'High' || riskLevel === 'Critical') {
    showWarningBanner(data);
  } else {
    removeWarningBanner();
  }
}

// Get risk level
function getRiskLevel(score) {
  if (score < 30) return 'Low';
  if (score < 60) return 'Medium';
  if (score < 85) return 'High';
  return 'Critical';
}

// Show warning banner
function showWarningBanner(data) {
  // Remove existing banner
  removeWarningBanner();
  
  // Create banner
  warningBanner = document.createElement('div');
  warningBanner.id = 'guardian-ai-warning';
  warningBanner.innerHTML = `
    <div class="guardian-warning-content">
      <div class="guardian-warning-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke-width="2"/>
          <line x1="12" y1="9" x2="12" y2="13" stroke-width="2"/>
          <line x1="12" y1="17" x2="12.01" y2="17" stroke-width="2"/>
        </svg>
      </div>
      <div class="guardian-warning-text">
        <strong>⚠️ High Risk Website Detected</strong>
        <p>This site may be a phishing attempt. Risk Score: ${data.risk_score}%</p>
      </div>
      <div class="guardian-warning-actions">
        <button class="guardian-btn guardian-btn-danger" id="guardian-go-back">Go Back</button>
        <button class="guardian-btn guardian-btn-secondary" id="guardian-proceed">Proceed Anyway</button>
      </div>
      <button class="guardian-close" id="guardian-close">×</button>
    </div>
  `;
  
  // Add styles
  const style = document.createElement('style');
  style.textContent = `
    #guardian-ai-warning {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      background: linear-gradient(135deg, #dc2626, #ef4444);
      color: white;
      padding: 16px 20px;
      z-index: 999999;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
      animation: slideDown 0.5s ease-out;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    
    @keyframes slideDown {
      from {
        transform: translateY(-100%);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }
    
    .guardian-warning-content {
      max-width: 1200px;
      margin: 0 auto;
      display: flex;
      align-items: center;
      gap: 16px;
      position: relative;
    }
    
    .guardian-warning-icon {
      flex-shrink: 0;
    }
    
    .guardian-warning-icon svg {
      width: 32px;
      height: 32px;
      animation: pulse 2s ease-in-out infinite;
    }
    
    @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.8; transform: scale(1.1); }
    }
    
    .guardian-warning-text {
      flex: 1;
    }
    
    .guardian-warning-text strong {
      display: block;
      font-size: 16px;
      margin-bottom: 4px;
    }
    
    .guardian-warning-text p {
      margin: 0;
      font-size: 13px;
      opacity: 0.9;
    }
    
    .guardian-warning-actions {
      display: flex;
      gap: 10px;
    }
    
    .guardian-btn {
      padding: 8px 16px;
      border: none;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }
    
    .guardian-btn-danger {
      background: white;
      color: #dc2626;
    }
    
    .guardian-btn-danger:hover {
      background: #f3f4f6;
      transform: translateY(-1px);
    }
    
    .guardian-btn-secondary {
      background: rgba(255, 255, 255, 0.2);
      color: white;
      border: 1px solid rgba(255, 255, 255, 0.3);
    }
    
    .guardian-btn-secondary:hover {
      background: rgba(255, 255, 255, 0.3);
    }
    
    .guardian-close {
      position: absolute;
      top: -8px;
      right: -8px;
      width: 28px;
      height: 28px;
      border: none;
      background: rgba(0, 0, 0, 0.3);
      color: white;
      border-radius: 50%;
      font-size: 20px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
    }
    
    .guardian-close:hover {
      background: rgba(0, 0, 0, 0.5);
      transform: rotate(90deg);
    }
  `;
  
  document.head.appendChild(style);
  document.body.insertBefore(warningBanner, document.body.firstChild);
  
  // Add event listeners
  document.getElementById('guardian-go-back').addEventListener('click', () => {
    window.history.back();
  });
  
  document.getElementById('guardian-proceed').addEventListener('click', () => {
    removeWarningBanner();
  });
  
  document.getElementById('guardian-close').addEventListener('click', () => {
    removeWarningBanner();
  });
}

// Remove warning banner
function removeWarningBanner() {
  if (warningBanner) {
    warningBanner.remove();
    warningBanner = null;
  }
}

// Initialize
analyzeCurrentPage();

// Listen for URL changes (for SPAs)
let lastUrl = window.location.href;
new MutationObserver(() => {
  const currentUrl = window.location.href;
  if (currentUrl !== lastUrl) {
    lastUrl = currentUrl;
    analyzeCurrentPage();
  }
}).observe(document, { subtree: true, childList: true });
