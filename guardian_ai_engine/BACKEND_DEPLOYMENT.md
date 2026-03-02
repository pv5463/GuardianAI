# Guardian AI Backend Engine - Deployment Guide

## Quick Start (Windows)

### Step 1: Train Models

```bash
cd guardian_ai_engine
python train_all_models.py
```

This will train all three models automatically.

### Step 2: Start Server

```bash
python main.py
```

Server runs at: http://localhost:8000

---

## Detailed Setup

### Option 1: Automated Training (Recommended)

```bash
# Navigate to engine directory
cd guardian_ai_engine

# Train all models at once
python train_all_models.py

# Start server
python main.py
```

### Option 2: Manual Training

```bash
cd guardian_ai_engine

# Train each model individually
python -m training.train_login_model
python -m training.train_url_model
python -m training.train_sms_model

# Start server
python main.py
```

### Option 3: Use Batch File (Windows)

Double-click `install_windows.bat` - it does everything automatically.

---

## Deployment Options

### 1. Local Development

**Start Server:**
```bash
python main.py
```

**Access:**
- API: http://localhost:8000
- Docs: http://localhost:8000/docs
- Health: http://localhost:8000/health

---

### 2. Production (Systemd - Linux)

**Create service file:**
```bash
sudo nano /etc/systemd/system/guardian-ai.service
```

**Add content:**
```ini
[Unit]
Description=Guardian AI Threat Detection Engine
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/guardian_ai_engine
Environment="PATH=/opt/guardian_ai_engine/venv/bin"
ExecStart=/opt/guardian_ai_engine/venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
Restart=always

[Install]
WantedBy=multi-user.target
```

**Enable and start:**
```bash
sudo systemctl enable guardian-ai
sudo systemctl start guardian-ai
sudo systemctl status guardian-ai
```

---

### 3. Docker Deployment

**Build image:**
```bash
cd guardian_ai_engine
docker build -t guardian-ai-engine:latest .
```

**Run container:**
```bash
docker run -d \
  --name guardian-ai \
  -p 8000:8000 \
  --restart unless-stopped \
  guardian-ai-engine:latest
```

**Or use docker-compose:**
```bash
docker-compose up -d
```

**View logs:**
```bash
docker logs -f guardian-ai
```

---

### 4. Cloud Deployment

#### AWS EC2

1. **Launch Instance:**
   - Ubuntu 22.04 LTS
   - t3.small or larger
   - Open port 8000 in security group

2. **Setup:**
```bash
# SSH into instance
ssh -i your-key.pem ubuntu@your-ec2-ip

# Install dependencies
sudo apt update
sudo apt install python3.11 python3.11-venv python3-pip -y

# Clone repository
git clone https://github.com/yourusername/guardian-ai.git
cd guardian-ai/guardian_ai_engine

# Create virtual environment
python3.11 -m venv venv
source venv/bin/activate

# Install packages
pip install -r requirements.txt

# Train models
python train_all_models.py

# Start server
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

3. **Setup Nginx (Optional):**
```bash
sudo apt install nginx -y
sudo nano /etc/nginx/sites-available/guardian-ai
```

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/guardian-ai /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### Google Cloud Run

```bash
# Build and deploy
gcloud run deploy guardian-ai \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 8000
```

#### Azure Container Instances

```bash
# Build image
docker build -t guardian-ai-engine .

# Push to Azure Container Registry
az acr login --name yourregistry
docker tag guardian-ai-engine yourregistry.azurecr.io/guardian-ai-engine
docker push yourregistry.azurecr.io/guardian-ai-engine

# Deploy
az container create \
  --resource-group guardian-ai-rg \
  --name guardian-ai-engine \
  --image yourregistry.azurecr.io/guardian-ai-engine \
  --dns-name-label guardian-ai \
  --ports 8000
```

#### Heroku

```bash
# Create Procfile
echo "web: uvicorn main:app --host 0.0.0.0 --port \$PORT" > Procfile

# Deploy
heroku create guardian-ai-engine
git push heroku main
```

#### Railway

1. Connect GitHub repository
2. Select `guardian_ai_engine` as root directory
3. Add build command: `python train_all_models.py`
4. Add start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Deploy

---

## Integration with Next.js Frontend

### Step 1: Update Environment Variables

**In your Next.js project root, edit `.env.local`:**

```bash
# Local development
NEXT_PUBLIC_AI_ENGINE_URL=http://localhost:8000

# Production
NEXT_PUBLIC_AI_ENGINE_URL=https://your-backend-domain.com
```

### Step 2: Create API Client

**Create `lib/aiEngineClient.ts`:**

```typescript
const AI_ENGINE_URL = process.env.NEXT_PUBLIC_AI_ENGINE_URL || 'http://localhost:8000';

export async function detectLoginThreat(data: {
  failed_attempts: number;
  country_changed: boolean;
  role_access_attempt: number;
  login_gap_minutes: number;
}) {
  const response = await fetch(`${AI_ENGINE_URL}/predict/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  
  if (!response.ok) {
    throw new Error('Login threat detection failed');
  }
  
  return response.json();
}

export async function detectPhishingURL(url: string) {
  const response = await fetch(`${AI_ENGINE_URL}/predict/url`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url })
  });
  
  if (!response.ok) {
    throw new Error('URL detection failed');
  }
  
  return response.json();
}

export async function detectSMSScam(text: string) {
  const response = await fetch(`${AI_ENGINE_URL}/predict/sms`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text })
  });
  
  if (!response.ok) {
    throw new Error('SMS detection failed');
  }
  
  return response.json();
}

export async function checkEngineHealth() {
  const response = await fetch(`${AI_ENGINE_URL}/health`);
  return response.json();
}
```

### Step 3: Use in Components

```typescript
import { detectLoginThreat, detectPhishingURL, detectSMSScam } from '@/lib/aiEngineClient';

// In your component
const handleAnalyze = async () => {
  try {
    const result = await detectSMSScam(messageText);
    console.log('Risk Score:', result.risk_score);
    console.log('Classification:', result.classification);
    console.log('Explanation:', result.explanation);
  } catch (error) {
    console.error('Analysis failed:', error);
  }
};
```

---

## Monitoring & Maintenance

### Health Check

```bash
curl http://localhost:8000/health
```

**Expected response:**
```json
{
  "status": "healthy",
  "models_loaded": {
    "login": true,
    "url": true,
    "sms": true
  }
}
```

### View Logs

**Systemd:**
```bash
sudo journalctl -u guardian-ai -f
```

**Docker:**
```bash
docker logs -f guardian-ai
```

**PM2:**
```bash
pm2 logs guardian-ai
```

### Restart Service

**Systemd:**
```bash
sudo systemctl restart guardian-ai
```

**Docker:**
```bash
docker restart guardian-ai
```

**PM2:**
```bash
pm2 restart guardian-ai
```

---

## Performance Tuning

### Workers Configuration

```bash
# Calculate optimal workers: (2 x CPU cores) + 1
# For 4 cores: (2 x 4) + 1 = 9 workers

uvicorn main:app --workers 9 --host 0.0.0.0 --port 8000
```

### Using Gunicorn

```bash
pip install gunicorn

gunicorn main:app \
  -w 4 \
  -k uvicorn.workers.UvicornWorker \
  --bind 0.0.0.0:8000 \
  --timeout 120
```

---

## Security

### 1. Environment Variables

```bash
export GUARDIAN_AI_SECRET_KEY="your-secret-key"
export GUARDIAN_AI_ALLOWED_ORIGINS="https://yourdomain.com"
```

### 2. Update CORS in main.py

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://yourdomain.com"],  # Specific domain
    allow_credentials=True,
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)
```

### 3. Enable HTTPS

Use Nginx with Let's Encrypt:

```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d your-domain.com
```

### 4. Firewall

```bash
sudo ufw allow 8000/tcp
sudo ufw enable
```

---

## Troubleshooting

### Models Not Loading

```bash
# Retrain models
cd guardian_ai_engine
python train_all_models.py

# Verify models exist
ls -la models/
# Should see: login_model.pkl, url_model.pkl, sms_model.pkl
```

### Port Already in Use

```bash
# Windows
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# Linux
lsof -i :8000
kill -9 <PID>
```

### Import Errors

```bash
# Ensure you're in the correct directory
cd guardian_ai_engine

# Reinstall dependencies
pip install -r requirements.txt

# Run from correct location
python main.py
```

### Memory Issues

```bash
# Reduce workers
uvicorn main:app --workers 2 --host 0.0.0.0 --port 8000
```

---

## Testing

### Test API Endpoints

```bash
# Health check
curl http://localhost:8000/health

# Login detection
curl -X POST http://localhost:8000/predict/login \
  -H "Content-Type: application/json" \
  -d '{"failed_attempts": 5, "country_changed": true, "role_access_attempt": 2, "login_gap_minutes": 3}'

# URL detection
curl -X POST http://localhost:8000/predict/url \
  -H "Content-Type: application/json" \
  -d '{"url": "http://paypal-verify.tk/login"}'

# SMS detection
curl -X POST http://localhost:8000/predict/sms \
  -H "Content-Type: application/json" \
  -d '{"text": "URGENT! Your bank account suspended. Click here now!"}'
```

### Run Test Script

```bash
python test_api.py
```

---

## Backup & Recovery

### Backup Models

```bash
tar -czf models-backup-$(date +%Y%m%d).tar.gz models/
```

### Restore Models

```bash
tar -xzf models-backup-20260301.tar.gz
```

---

## Summary

**Quick Start:**
```bash
cd guardian_ai_engine
python train_all_models.py
python main.py
```

**Production:**
- Use Docker or systemd
- Configure Nginx reverse proxy
- Enable HTTPS
- Set up monitoring
- Configure firewall

**Integration:**
- Add `NEXT_PUBLIC_AI_ENGINE_URL` to `.env.local`
- Create API client in Next.js
- Use in components

**Maintenance:**
- Monitor health endpoint
- Check logs regularly
- Backup models
- Update dependencies

---

## Support

For issues:
1. Check logs
2. Verify models are trained
3. Test health endpoint
4. Check network connectivity
5. Review error messages

**API Documentation:** http://localhost:8000/docs
