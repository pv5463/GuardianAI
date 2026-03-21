# 🚀 Quick Start - Guardian AI Chrome Extension

## What You Have

A fully functional Chrome Extension that:
- ✅ Scans websites automatically in real-time
- ✅ Shows risk scores with premium UI
- ✅ Displays warning banners on dangerous sites
- ✅ Updates badge icon based on threat level
- ✅ Caches results for fast performance
- ✅ Sends notifications for high-risk sites

## 3-Step Installation

### Step 1: Generate Icons (1 minute)

**Windows:**
```bash
# Double-click this file:
generate-icons.bat
```

**Or manually:**
1. Open `icons/generate-icons.html` in your browser
2. Click "Download" under each icon
3. Save as `icon16.png`, `icon48.png`, `icon128.png` in `icons/` folder

### Step 2: Start Backend (30 seconds)

```bash
cd guardian_ai_engine
uvicorn main:app --reload
```

Verify: http://localhost:8000/docs

### Step 3: Load Extension (30 seconds)

1. Open Chrome → `chrome://extensions/`
2. Enable "Developer mode" (top-right)
3. Click "Load unpacked"
4. Select `guardian-extension` folder
5. Done! 🎉

## Test It

1. Click the Guardian AI icon in Chrome toolbar
2. Visit `https://google.com` → Should show LOW risk (green)
3. Visit `https://googl.com` → Should show HIGHER risk (yellow/red)
4. High-risk sites will show a red warning banner

## What Each File Does

| File | Purpose |
|------|---------|
| `manifest.json` | Extension configuration |
| `popup.html` | Popup window structure |
| `popup.js` | Popup logic & API calls |
| `content.js` | Page scanning & warnings |
| `background.js` | Notifications & badges |
| `styles.css` | Premium dark theme |

## Features

### Automatic Scanning
Every website you visit is automatically analyzed for threats.

### Risk Levels
- 🟢 **Green (✓)** - Safe (0-30%)
- 🟡 **Yellow (!)** - Caution (30-60%)
- 🔴 **Red (⚠)** - Danger (60-100%)

### Warning Banner
High-risk sites show a red banner with:
- Risk score
- "Go Back" button
- "Proceed Anyway" button

### Smart Caching
Results cached for 5 minutes to reduce API calls.

## Troubleshooting

**"Extension failed to load"**
→ Generate the icon PNG files first

**"API request failed"**
→ Make sure backend is running on port 8000

**Badge not showing**
→ Reload extension from chrome://extensions/

## Need Help?

- Full docs: `README.md`
- Installation guide: `INSTALLATION.md`
- Technical details: `../CHROME_EXTENSION_COMPLETE.md`

---

**You're protected! 🛡️**

Guardian AI is now monitoring your browsing for phishing threats.
