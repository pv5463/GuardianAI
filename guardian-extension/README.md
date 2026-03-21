# Guardian AI Chrome Extension

Real-time AI-powered phishing detection and website security scanner that protects you while browsing.

## Features

- **Real-Time URL Scanning**: Automatically analyzes every website you visit
- **AI-Powered Detection**: Uses advanced machine learning to detect phishing attempts
- **Risk Scoring**: Shows risk percentage with visual indicators
- **Warning Banners**: Displays prominent warnings on high-risk websites
- **Smart Caching**: Caches results for 5 minutes to reduce API calls
- **Badge Indicators**: Extension icon changes color based on threat level
- **Instant Notifications**: Get alerts for high-risk sites
- **Premium UI**: Modern, dark-themed popup with smooth animations

## Prerequisites

Before installing the extension, make sure you have:

1. **Guardian AI Backend Running**
   - The FastAPI backend must be running on `http://localhost:8000`
   - Start it with: `cd guardian_ai_engine && uvicorn main:app --reload`

2. **Chrome Browser**
   - Version 88 or higher (Manifest V3 support)

## Installation

### Step 1: Generate Icon Files

The extension needs PNG icons in three sizes. You can generate them from the SVG:

**Option A: Using Online Converter**
1. Go to https://cloudconvert.com/svg-to-png
2. Upload `icons/icon.svg`
3. Convert to PNG at these sizes:
   - 16x16 → Save as `icon16.png`
   - 48x48 → Save as `icon48.png`
   - 128x128 → Save as `icon128.png`
4. Place all PNG files in the `icons/` folder

**Option B: Using ImageMagick (if installed)**
```bash
cd guardian-extension/icons
magick icon.svg -resize 16x16 icon16.png
magick icon.svg -resize 48x48 icon48.png
magick icon.svg -resize 128x128 icon128.png
```

**Option C: Use Placeholder Icons (Quick Test)**
For quick testing, you can temporarily use any 16x16, 48x48, and 128x128 PNG images and rename them accordingly.

### Step 2: Load Extension in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top-right corner)
3. Click "Load unpacked"
4. Select the `guardian-extension` folder
5. The Guardian AI extension should now appear in your extensions list

### Step 3: Pin the Extension

1. Click the puzzle icon in Chrome toolbar
2. Find "Guardian AI - Phishing Protection"
3. Click the pin icon to keep it visible

## Usage

### Automatic Protection

Once installed, the extension automatically:
- Scans every website you visit
- Updates the badge icon with threat level
- Shows warning banners on high-risk sites
- Caches results to minimize API calls

### Manual Scanning

1. Click the Guardian AI icon in your toolbar
2. View the current page's risk score
3. See AI-powered threat analysis
4. Click "Rescan" to analyze again
5. Click "Dashboard" to open the full web app

### Threat Levels

- **Green (✓)**: Safe - Risk score < 30%
- **Yellow (!)**: Caution - Risk score 30-60%
- **Red (⚠)**: Danger - Risk score > 60%

### Warning Banner

For high-risk sites, a red warning banner appears at the top with:
- Risk score percentage
- "Go Back" button (returns to previous page)
- "Proceed Anyway" button (dismisses warning)
- Close button (×)

## Configuration

### Change API URL

If your backend runs on a different port or domain, update the API URL in:

1. `popup.js` - Line 2:
```javascript
const API_URL = 'http://localhost:8000';
```

2. `content.js` - Line 2:
```javascript
const API_URL = 'http://localhost:8000';
```

3. `background.js` - Line 2:
```javascript
const API_URL = 'http://localhost:8000';
```

### Adjust Cache Duration

Default cache is 5 minutes. To change:

**In popup.js** (Line 103):
```javascript
if (cached[url] && (Date.now() - cached[url].timestamp < 300000)) { // 5 minutes
```

**In content.js** (Line 20):
```javascript
if (cached[url] && (Date.now() - cached[url].timestamp < 300000)) {
```

Change `300000` (milliseconds) to your preferred duration.

## File Structure

```
guardian-extension/
├── manifest.json          # Extension configuration
├── popup.html            # Popup UI structure
├── popup.js              # Popup logic and API calls
├── content.js            # Page analysis and warning injection
├── background.js         # Service worker for notifications
├── styles.css            # Premium dark theme styles
├── icons/
│   ├── icon.svg         # Source SVG icon
│   ├── icon16.png       # 16x16 toolbar icon
│   ├── icon48.png       # 48x48 management icon
│   └── icon128.png      # 128x128 store icon
└── README.md            # This file
```

## Troubleshooting

### Extension Not Working

1. **Check Backend Status**
   - Ensure FastAPI is running: `http://localhost:8000/docs`
   - Test the API endpoint manually

2. **Check Console Errors**
   - Right-click extension icon → "Inspect popup"
   - Check for JavaScript errors in console

3. **Clear Cache**
   - Right-click extension icon → "Manage extension"
   - Click "Clear storage"
   - Reload the extension

### Warning Banner Not Showing

1. Check if the site has a high risk score (> 60%)
2. Open browser console (F12) and look for "Guardian AI" logs
3. Verify content script is injected (check Sources tab)

### Badge Not Updating

1. Reload the extension from `chrome://extensions/`
2. Check background service worker logs
3. Ensure permissions are granted in manifest.json

### API Connection Failed

1. Verify backend is running on correct port
2. Check CORS settings in FastAPI backend
3. Update API_URL in all three JS files if needed

## Performance

- **Response Time**: < 1 second for cached URLs
- **API Calls**: Minimized with 5-minute cache
- **Memory Usage**: < 10MB typical
- **CPU Impact**: Negligible when idle

## Security & Privacy

- **No Data Collection**: Extension doesn't collect or store personal data
- **Local Processing**: All analysis happens via your local backend
- **No External Tracking**: No analytics or third-party services
- **Cache Only**: URLs are cached locally for performance only

## Development

### Testing Changes

1. Make changes to extension files
2. Go to `chrome://extensions/`
3. Click the refresh icon on Guardian AI extension
4. Test the changes

### Debugging

**Popup Debugging:**
- Right-click extension icon → "Inspect popup"

**Content Script Debugging:**
- Open any webpage → F12 → Console
- Look for "Guardian AI" prefixed logs

**Background Script Debugging:**
- Go to `chrome://extensions/`
- Click "Inspect views: service worker"

## API Endpoints Used

The extension uses these Guardian AI backend endpoints:

- `POST /analyze-url-advanced` - Advanced URL analysis with typosquatting detection

**Request Format:**
```json
{
  "url": "https://example.com"
}
```

**Response Format:**
```json
{
  "risk_score": 85,
  "risk_level": "High",
  "classification": "Phishing",
  "explanation": [
    "Suspicious keyword detected",
    "Domain age is very recent"
  ]
}
```

## Future Enhancements

Potential features for future versions:

- [ ] Whitelist/blacklist management
- [ ] Custom risk thresholds
- [ ] Detailed threat history
- [ ] Export scan reports
- [ ] Multi-language support
- [ ] Dark/light theme toggle
- [ ] Keyboard shortcuts
- [ ] Context menu integration

## Support

For issues or questions:

1. Check the troubleshooting section above
2. Review browser console for errors
3. Verify backend is running correctly
4. Check Guardian AI dashboard for system status

## License

Part of the Guardian AI cybersecurity platform.

---

**Stay Protected! 🛡️**

Guardian AI continuously monitors your browsing to keep you safe from phishing attacks and malicious websites.
