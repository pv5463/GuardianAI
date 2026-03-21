// API Configuration
const API_URL = 'http://localhost:8000';

// DOM Elements
const currentUrlEl = document.getElementById('currentUrl');
const riskValueEl = document.getElementById('riskValue');
const riskMeterFillEl = document.getElementById('riskMeterFill');
const riskLevelEl = document.getElementById('riskLevel');
const riskSectionEl = document.getElementById('riskSection');
const classificationSectionEl = document.getElementById('classificationSection');
const classificationTextEl = document.getElementById('classificationText');
const explanationSectionEl = document.getElementById('explanationSection');
const explanationListEl = document.getElementById('explanationList');
const rescanBtn = document.getElementById('rescanBtn');
const dashboardBtn = document.getElementById('dashboardBtn');
const loadingOverlay = document.getElementById('loadingOverlay');
const statusIndicator = document.getElementById('statusIndicator');

// Get current tab URL
async function getCurrentTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

// Analyze URL
async function analyzeURL(url) {
  try {
    showLoading(true);
    
    const response = await fetch(`${API_URL}/analyze-url-advanced`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url })
    });

    if (!response.ok) {
      throw new Error('API request failed');
    }

    const data = await response.json();
    displayResults(data);
    
    // Store result in chrome storage
    await chrome.storage.local.set({ 
      [url]: { 
        ...data, 
        timestamp: Date.now() 
      } 
    });
    
    // Update badge
    updateBadge(data.risk_score);
    
    showLoading(false);
    return data;
  } catch (error) {
    console.error('Analysis error:', error);
    showError('Failed to analyze URL. Make sure the AI Engine is running.');
    showLoading(false);
    return null;
  }
}

// Display results
function displayResults(data) {
  // Risk score
  riskValueEl.textContent = `${data.risk_score}%`;
  riskMeterFillEl.style.width = `${data.risk_score}%`;
  
  // Risk level
  const riskLevel = getRiskLevel(data.risk_score);
  riskLevelEl.textContent = `${riskLevel} Risk`;
  
  // Update risk section styling
  riskSectionEl.className = 'risk-section';
  riskSectionEl.classList.add(`risk-${riskLevel.toLowerCase()}`);
  
  // Classification
  if (data.classification) {
    classificationTextEl.textContent = data.classification;
    classificationSectionEl.style.display = 'block';
  }
  
  // Explanation
  if (data.explanation && data.explanation.length > 0) {
    explanationListEl.innerHTML = '';
    data.explanation.forEach(item => {
      const li = document.createElement('li');
      li.textContent = item;
      explanationListEl.appendChild(li);
    });
    explanationSectionEl.style.display = 'block';
  }
  
  // Update status
  updateStatus(riskLevel);
}

// Get risk level
function getRiskLevel(score) {
  if (score < 30) return 'Low';
  if (score < 60) return 'Medium';
  if (score < 85) return 'High';
  return 'Critical';
}

// Update status indicator
function updateStatus(riskLevel) {
  const statusDot = statusIndicator.querySelector('.status-dot');
  const statusText = statusIndicator.querySelector('.status-text');
  
  if (riskLevel === 'Low') {
    statusDot.style.background = '#10b981';
    statusText.textContent = 'Safe';
  } else if (riskLevel === 'Medium') {
    statusDot.style.background = '#f59e0b';
    statusText.textContent = 'Caution';
  } else {
    statusDot.style.background = '#ef4444';
    statusText.textContent = 'Danger';
  }
}

// Update badge
function updateBadge(score) {
  const riskLevel = getRiskLevel(score);
  let color = '#10b981'; // green
  let text = '✓';
  
  if (riskLevel === 'Medium') {
    color = '#f59e0b'; // yellow
    text = '!';
  } else if (riskLevel === 'High' || riskLevel === 'Critical') {
    color = '#ef4444'; // red
    text = '⚠';
  }
  
  chrome.action.setBadgeText({ text });
  chrome.action.setBadgeBackgroundColor({ color });
}

// Show loading
function showLoading(show) {
  if (show) {
    loadingOverlay.classList.add('active');
  } else {
    loadingOverlay.classList.remove('active');
  }
}

// Show error
function showError(message) {
  riskLevelEl.textContent = 'Error';
  riskValueEl.textContent = '--';
  explanationListEl.innerHTML = `<li>${message}</li>`;
  explanationSectionEl.style.display = 'block';
}

// Initialize popup
async function init() {
  try {
    const tab = await getCurrentTab();
    const url = tab.url;
    
    // Display current URL
    currentUrlEl.textContent = url;
    
    // Check if we have cached result
    const cached = await chrome.storage.local.get(url);
    if (cached[url] && (Date.now() - cached[url].timestamp < 300000)) { // 5 minutes cache
      displayResults(cached[url]);
      updateBadge(cached[url].risk_score);
    } else {
      // Analyze URL
      await analyzeURL(url);
    }
  } catch (error) {
    console.error('Initialization error:', error);
    showError('Failed to initialize extension');
  }
}

// Event listeners
rescanBtn.addEventListener('click', async () => {
  const tab = await getCurrentTab();
  await analyzeURL(tab.url);
});

dashboardBtn.addEventListener('click', () => {
  chrome.tabs.create({ url: 'http://localhost:3000/dashboard' });
});

// Initialize on load
document.addEventListener('DOMContentLoaded', init);
