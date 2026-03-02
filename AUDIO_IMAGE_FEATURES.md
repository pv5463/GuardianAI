# Audio Transcription & Image Text Extraction - No API Keys Required

Guardian AI includes powerful audio transcription and image text extraction features that work WITHOUT requiring external API keys for basic functionality.

## Audio Transcription Features

### 1. Live Recording with Web Speech API (FREE - No API Key)

**How it works:**
- Uses browser's built-in Web Speech Recognition API
- Works in Chrome, Edge, and other Chromium-based browsers
- Completely free, no API keys needed
- Real-time transcription as you speak

**To use:**
1. Click "Record Audio" button
2. Allow microphone permissions when prompted
3. Speak clearly into your microphone
4. Click "Stop Recording" when done
5. Click "Analyze Audio" to get scam detection results

**Supported browsers:**
- ✅ Google Chrome (recommended)
- ✅ Microsoft Edge
- ✅ Opera
- ✅ Brave
- ❌ Firefox (limited support)
- ❌ Safari (limited support)

**Features:**
- Real-time speech-to-text
- Scam detection analysis
- AI voice detection
- Audio quality metrics
- Deepfake likelihood scoring

### 2. File Upload with Whisper API (Optional - Requires API Key)

**How it works:**
- Upload pre-recorded audio files (MP3, WAV, M4A, WebM)
- Uses OpenAI Whisper API for transcription
- Higher accuracy for uploaded files
- Supports multiple languages

**Setup (Optional):**
1. Get API key from https://platform.openai.com/api-keys
2. Add to `.env.local`:
   ```
   NEXT_PUBLIC_OPENAI_API_KEY=your-api-key-here
   ```
3. Restart the application

**Without API key:**
- Audio analysis still works (pitch, AI detection, quality metrics)
- Manual transcription option available
- Use "Record Audio" feature for free transcription

## Image Text Extraction (OCR)

### Tesseract.js - No API Key Required

**How it works:**
- Uses Tesseract.js for Optical Character Recognition (OCR)
- Runs entirely in the browser
- No external API calls
- Completely free

**To use:**
1. Go to Screenshot Analyzer
2. Click "Upload Screenshot" or drag & drop image
3. System automatically extracts text from image
4. Analyzes extracted text for scam indicators

**Supported formats:**
- ✅ JPG/JPEG
- ✅ PNG
- ✅ WebP
- ✅ BMP
- ✅ GIF

**Features:**
- Automatic text extraction
- Progress indicator during OCR
- Scam detection on extracted text
- Threat breakdown analysis
- Psychological tactics detection

**Tips for best results:**
- Use clear, high-resolution images
- Ensure text is readable and not blurry
- Good lighting in screenshots
- Avoid heavily compressed images

## Feature Comparison

| Feature | Live Recording | File Upload (No API) | File Upload (With Whisper) | Image OCR |
|---------|---------------|---------------------|---------------------------|-----------|
| Cost | FREE | FREE | Paid (OpenAI) | FREE |
| API Key Required | ❌ No | ❌ No | ✅ Yes | ❌ No |
| Browser Support | Chrome/Edge | All | All | All |
| Accuracy | Good | N/A | Excellent | Good |
| Languages | English | N/A | 50+ languages | 100+ languages |
| Processing | Real-time | Audio analysis only | Cloud-based | Browser-based |

## Troubleshooting

### Audio Recording Issues

**"Microphone access denied"**
- Solution: Allow microphone permissions in browser settings
- Chrome: Settings → Privacy and security → Site Settings → Microphone
- Edge: Settings → Cookies and site permissions → Microphone

**"No speech detected"**
- Solution: Speak clearly and closer to microphone
- Check microphone is working in system settings
- Try a different microphone if available

**"Speech recognition not supported"**
- Solution: Use Chrome or Edge browser
- Alternative: Upload audio file with Whisper API key
- Or manually transcribe and paste text

### Image OCR Issues

**"No text detected in image"**
- Solution: Ensure image contains readable text
- Try a clearer/higher resolution image
- Check image is not too dark or blurry

**"Failed to extract text"**
- Solution: Refresh page and try again
- Try a different image format (PNG recommended)
- Ensure image file is not corrupted

### Whisper API Issues

**"Invalid OpenAI API key"**
- Solution: Check API key is correct in `.env.local`
- Ensure no extra spaces in the key
- Verify key is active on OpenAI platform

**"Quota exceeded"**
- Solution: Check OpenAI account billing
- System will fallback to audio analysis only
- Use "Record Audio" feature as free alternative

## Privacy & Security

### Audio Recording
- Audio is processed locally in browser for live recording
- Uploaded files are stored in Supabase Storage (encrypted)
- Whisper API calls are made directly to OpenAI (if configured)
- No audio data is shared with third parties

### Image OCR
- OCR processing happens entirely in your browser
- Images are stored in Supabase Storage (encrypted)
- No image data is sent to external services
- Tesseract.js runs client-side

## Performance Tips

### For Audio
- Use live recording for best performance (no upload time)
- Keep recordings under 2 minutes for faster processing
- Speak clearly and at normal pace
- Minimize background noise

### For Images
- Use PNG format for best OCR results
- Keep image size under 5MB for faster processing
- Ensure good contrast between text and background
- Crop image to focus on text area

## Advanced Features

### Audio Analysis Metrics
- **Average Pitch**: Voice frequency analysis
- **Pitch Variation**: Natural speech patterns
- **AI Detection**: Identifies synthetic voices
- **Quality Metrics**: Clarity, naturalness, consistency
- **Deepfake Score**: Likelihood of AI-generated voice

### Scam Detection
- **Urgency Tactics**: Time pressure indicators
- **Authority Impersonation**: Fake official claims
- **Financial Pressure**: Payment demands
- **OTP Requests**: Security code phishing
- **Emotional Manipulation**: Fear/urgency tactics
- **Secrecy Pressure**: "Don't tell anyone" warnings

## API Key Setup (Optional)

### OpenAI Whisper API

1. **Get API Key:**
   - Visit https://platform.openai.com/api-keys
   - Sign up or log in
   - Create new API key
   - Copy the key (starts with `sk-`)

2. **Add to Project:**
   - Create or edit `.env.local` in project root
   - Add line: `NEXT_PUBLIC_OPENAI_API_KEY=sk-your-key-here`
   - Save file

3. **Restart Application:**
   ```bash
   # Stop the dev server (Ctrl+C)
   # Start again
   npm run dev
   ```

4. **Verify:**
   - Upload an audio file
   - Should see "Transcribing with Whisper API..."
   - Transcription will be more accurate

### Pricing (OpenAI Whisper)
- $0.006 per minute of audio
- Example: 10 minutes = $0.06
- Very affordable for occasional use

## Recommendations

### For Best Experience:

1. **Use Live Recording** when possible (free, fast, accurate)
2. **Use Image OCR** for screenshots (free, no setup)
3. **Add Whisper API** only if you need to transcribe many uploaded files
4. **Keep Chrome/Edge** as primary browser for audio features

### For Organizations:

1. **Live Recording**: Perfect for real-time scam call detection
2. **Image OCR**: Great for analyzing phishing screenshots
3. **Whisper API**: Consider for high-volume audio file processing
4. **No API Keys**: Start with free features, add Whisper later if needed

## Support

If you encounter issues:
1. Check browser console for error messages
2. Verify microphone/camera permissions
3. Try different browser (Chrome recommended)
4. Check `.env.local` configuration
5. Restart application after config changes

## Summary

✅ **Audio transcription works WITHOUT API keys** (live recording)
✅ **Image text extraction works WITHOUT API keys** (Tesseract.js)
✅ **Whisper API is optional** (only for uploaded audio files)
✅ **All core features are free** (no external dependencies)

You can use Guardian AI's audio and image analysis features immediately without any API keys or external services!
