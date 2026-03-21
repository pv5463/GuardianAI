// Background service worker
const API_URL = 'http://localhost:8000';

// Cache for analyzed URLs
const urlCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'THREAT_DETECTED') {
    handleThreatDetected(message.data, sender.tab);
  }
  return true;
});

// Handle threat detection
function handleThreatDetected(data, tab) {
  const riskLevel = getRiskLevel(data.risk_score);
  
  // Update icon based on risk level
  updateIcon(riskLevel, tab.id);
  
  // Show notification for high/critical risks
  if (riskLevel === 'High' || riskLevel === 'Critical') {
    showNotification(data, tab);
  }
  
  // Cache result
  urlCache.set(data.url, {
    ...data,
    timestamp: Date.now()
  });
}

// Get risk level
function getRiskLevel(score) {
  if (score < 30) return 'Low';
  if (score < 60) return 'Medium';
  if (score < 85) return 'High';
  return 'Critical';
}

// Update extension icon
function updateIcon(riskLevel, tabId) {
  let color, text;
  
  switch (riskLevel) {
    case 'Low':
      color = '#10b981';
      text = '✓';
      break;
    case 'Medium':
      color = '#f59e0b';
      text = '!';
      break;
    case 'High':
    case 'Critical':
      color = '#ef4444';
      text = '⚠';
      break;
    default:
      color = '#6b7280';
      text = '';
  }
  
  chrome.action.setBadgeText({ text, tabId });
  chrome.action.setBadgeBackgroundColor({ color, tabId });
}

// Show notification
function showNotification(data, tab) {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/icon128.png',
    title: '⚠️ Guardian AI Alert',
    message: `High risk website detected!\nRisk Score: ${data.risk_score}%\n${tab.url}`,
    priority: 2,
    requireInteraction: true
  });
}

// Clean old cache entries
setInterval(() => {
  const now = Date.now();
  for (const [url, data] of urlCache.entries()) {
    if (now - data.timestamp > CACHE_DURATION) {
      urlCache.delete(url);
    }
  }
}, 60000); // Clean every minute

// Listen for tab updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    // Reset badge when page loads
    chrome.action.setBadgeText({ text: '', tabId });
  }
});
