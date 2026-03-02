# Quick Start - Audio & Image Features

## 🎤 Audio Transcription (NO API KEY NEEDED!)

### Method 1: Live Recording (Recommended - FREE)
```
1. Click "Record Audio" button
2. Allow microphone when prompted
3. Speak clearly for 10-30 seconds
4. Click "Stop Recording"
5. Click "Analyze Audio"
6. Get instant scam detection results!
```

**Works in:** Chrome, Edge, Opera, Brave
**Cost:** FREE
**API Key:** Not required

### Method 2: Upload Audio File
```
1. Click "Upload Audio File"
2. Select MP3, WAV, M4A, or WebM file
3. Click "Analyze Audio"
4. Get audio quality analysis
```

**Without API Key:**
- ✅ Audio quality metrics
- ✅ AI voice detection
- ✅ Pitch analysis
- ❌ Automatic transcription (need Whisper API)

**With Whisper API Key:**
- ✅ Everything above
- ✅ Automatic transcription
- ✅ Multi-language support

---

## 📸 Image Text Extraction (NO API KEY NEEDED!)

### Screenshot Analysis (FREE)
```
1. Go to "Screenshot Analyzer"
2. Click "Upload Screenshot" or drag & drop
3. Wait for OCR to extract text (5-10 seconds)
4. Get scam detection results automatically!
```

**Supported:** JPG, PNG, WebP, BMP, GIF
**Cost:** FREE
**API Key:** Not required
**Processing:** In-browser (Tesseract.js)

---

## 🚨 Incident Management

### Mark Incident as Resolved
```
1. Go to "Incidents" page
2. Click on an incident to expand
3. Review mitigation steps
4. Click "Mark as Resolved" button
5. Incident status updates to "Resolved"
```

**Fixed:** Now properly updates database and shows status change

---

## 🛡️ Threat Monitoring

### View and Filter Threats
```
1. Go to "Threats" page
2. View stats at top (Total, Critical, High, Medium, Low, Active)
3. Click filter buttons to see specific severity levels
4. Stats remain accurate across all filters
```

**Fixed:** Stats now calculate correctly regardless of filter

---

## ⚙️ Optional Setup (Enhanced Features)

### Add Whisper API for Uploaded Audio Files

**Only needed if you want to transcribe uploaded audio files**

1. Get API key from https://platform.openai.com/api-keys
2. Create/edit `.env.local` in project root:
   ```bash
   NEXT_PUBLIC_OPENAI_API_KEY=sk-your-key-here
   ```
3. Restart application:
   ```bash
   npm run dev
   ```

**Cost:** $0.006 per minute of audio (~$0.06 for 10 minutes)

---

## 🎯 Feature Matrix

| Feature | API Key Required | Cost | Browser Support |
|---------|-----------------|------|-----------------|
| Live Audio Recording | ❌ No | FREE | Chrome, Edge |
| Audio File Analysis | ❌ No | FREE | All browsers |
| Audio File Transcription | ✅ Yes (Whisper) | Paid | All browsers |
| Image OCR | ❌ No | FREE | All browsers |
| Scam Detection | ❌ No | FREE | All browsers |
| Incident Management | ❌ No | FREE | All browsers |
| Threat Monitoring | ❌ No | FREE | All browsers |

---

## 💡 Pro Tips

### For Best Audio Results:
- Use Chrome or Edge browser
- Speak clearly and at normal pace
- Minimize background noise
- Keep recordings under 2 minutes
- Use "Record Audio" for free transcription

### For Best Image Results:
- Use clear, high-resolution images
- Ensure good contrast (dark text on light background)
- Avoid blurry or compressed images
- PNG format recommended
- Crop to focus on text area

### For Incident Management:
- Review mitigation steps before resolving
- Add resolution notes for documentation
- Check console if update fails
- Verify database permissions in Supabase

### For Threat Monitoring:
- Use filters to focus on high-priority threats
- Stats show overall picture regardless of filter
- Real-time updates via Supabase subscriptions
- Export data for reporting (coming soon)

---

## 🔧 Troubleshooting

### "Microphone access denied"
→ Allow microphone in browser settings

### "No speech detected"
→ Speak louder and closer to microphone

### "No text detected in image"
→ Use clearer image with readable text

### "Failed to resolve incident"
→ Check browser console and database permissions

### "Failed to load threats"
→ Run migration scripts in Supabase SQL Editor

---

## 📚 More Information

- **Full Documentation:** See `AUDIO_IMAGE_FEATURES.md`
- **Fixes Applied:** See `FIXES_APPLIED.md`
- **Setup Guide:** See `SETUP_GUIDE.md`
- **Database Setup:** See `supabase-guardianai-migration.sql`

---

## ✅ Summary

**You can use ALL core features WITHOUT any API keys:**
- ✅ Live audio transcription (Web Speech API)
- ✅ Image text extraction (Tesseract.js)
- ✅ Scam detection
- ✅ Incident management
- ✅ Threat monitoring

**Optional:** Add Whisper API key only for uploaded audio file transcription.

**Everything else works out of the box!** 🎉
