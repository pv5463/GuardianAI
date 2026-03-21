# Quick Installation Guide

## Step 1: Generate Icons (2 minutes)

### Method 1: Using the HTML Generator (Easiest)
1. Open `icons/generate-icons.html` in your browser
2. Click "Download" under each icon size
3. Save as `icon16.png`, `icon48.png`, `icon128.png` in the `icons/` folder

### Method 2: Use Placeholder Icons (Fastest for Testing)
1. Find any PNG images (or create simple colored squares)
2. Resize to 16x16, 48x48, and 128x128 pixels
3. Rename to `icon16.png`, `icon48.png`, `icon128.png`
4. Place in `icons/` folder

## Step 2: Start the Backend

Make sure Guardian AI backend is running:

```bash
cd guardian_ai_engine
uvicorn main:app --reload
```

Verify it's running: http://localhost:8000/docs

## Step 3: Load Extension in Chrome

1. Open Chrome
2. Go to `chrome://extensions/`
3. Enable "Developer mode" (top-right toggle)
4. Click "Load unpacked"
5. Select the `guardian-extension` folder
6. Done! ✓

## Step 4: Test It

1. Click the Guardian AI icon in Chrome toolbar
2. Visit any website
3. The extension will automatically scan it
4. Check the popup for risk score

## Troubleshooting

**"Extension failed to load"**
- Make sure all three icon files exist in `icons/` folder
- Check that manifest.json is valid

**"API request failed"**
- Verify backend is running on http://localhost:8000
- Check browser console for errors

**Icons not showing**
- Generate the PNG files using the HTML generator
- Or use any placeholder PNG images temporarily

## Quick Test URLs

Try these to test the extension:

- Safe: `https://google.com` (should show low risk)
- Suspicious: `https://googl.com` (should show higher risk due to typosquatting)

---

That's it! You're protected. 🛡️
