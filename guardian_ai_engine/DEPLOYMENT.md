# Guardian AI Engine - Deployment Guide

## Local Development

### Setup
```bash
cd guardian_ai_engine
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### Train Models
```bash
python training/train_login_model.py
python training/train_url_model.py
python training/train_sms_model.py
```

### Run Server
```bash
# Development mode with auto-reload
uvicorn main:app --reload --port 8000

# Or using Python directly
python main.py
```

### Test API
```bash
python test_api.py
```

## Docker Deployment

### Build Image
```bash
docker build -t guardian-ai-engine:latest .
```

### Run Container
```bash
docker run -d \
  --name guardian-ai \
  -p 8000:8000 \
  --restart unless-stopped \
  guardian-ai-engine:latest
```

### View Logs
```bash
docker logs -f guardian-ai
```

## Production Deployment

### Option 1: Systemd Service

Create `/etc/systemd/system/guardian-ai.service`:
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

Enable and start:
```bash
sudo systemctl enable guardian-ai
sudo systemctl start guardian-ai
sudo systemctl status guardian-ai
```

### Option 2: Nginx Reverse Proxy

```nginx
server {
    listen 80;
    server_name api.guardian-ai.com;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

### Option 3: PM2 Process Manager

```bash
npm install -g pm2
pm2 start "uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4" --name guardian-ai
pm2 save
pm2 startup
```

## Cloud Deployment

### AWS EC2
1. Launch Ubuntu 22.04 instance (t3.small or larger)
2. Install Python 3.11
3. Clone repository
4. Follow production deployment steps
5. Configure security group (port 8000)

### Google Cloud Run
```bash
gcloud run deploy guardian-ai \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

### Azure Container Instances
```bash
az container create \
  --resource-group guardian-ai-rg \
  --name guardian-ai-engine \
  --image guardian-ai-engine:latest \
  --dns-name-label guardian-ai \
  --ports 8000
```

## Performance Tuning

### Workers Configuration
```bash
# Calculate workers: (2 x CPU cores) + 1
uvicorn main:app --workers 4 --host 0.0.0.0 --port 8000
```

### Gunicorn + Uvicorn
```bash
pip install gunicorn
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

## Monitoring

### Health Check
```bash
curl http://localhost:8000/health
```

### Prometheus Metrics (Optional)
Add to requirements.txt:
```
prometheus-fastapi-instrumentator==6.1.0
```

## Security Hardening

### 1. Environment Variables
```bash
export GUARDIAN_AI_SECRET_KEY="your-secret-key"
export GUARDIAN_AI_ALLOWED_ORIGINS="https://yourdomain.com"
```

### 2. HTTPS Only
Update CORS in main.py:
```python
allow_origins=["https://yourdomain.com"]
```

### 3. Rate Limiting
Already configured at 100 req/min per IP

### 4. Firewall
```bash
sudo ufw allow 8000/tcp
sudo ufw enable
```

## Backup & Recovery

### Backup Models
```bash
tar -czf models-backup-$(date +%Y%m%d).tar.gz models/
```

### Restore Models
```bash
tar -xzf models-backup-20260301.tar.gz
```

## Troubleshooting

### Port Already in Use
```bash
# Find process
lsof -i :8000
# Kill process
kill -9 <PID>
```

### Models Not Loading
```bash
# Retrain models
cd guardian_ai_engine
python training/train_login_model.py
python training/train_url_model.py
python training/train_sms_model.py
```

### Memory Issues
```bash
# Reduce workers
uvicorn main:app --workers 2 --host 0.0.0.0 --port 8000
```

## Integration with Next.js Frontend

### Environment Variable (.env.local)
```bash
NEXT_PUBLIC_AI_ENGINE_URL=http://localhost:8000
```

### API Client Example
```typescript
// lib/aiEngine.ts
const AI_ENGINE_URL = process.env.NEXT_PUBLIC_AI_ENGINE_URL;

export async function detectLoginThreat(data: LoginData) {
  const response = await fetch(`${AI_ENGINE_URL}/predict/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return response.json();
}
```

## Maintenance

### Update Dependencies
```bash
pip install --upgrade -r requirements.txt
```

### Retrain Models
Schedule monthly retraining with new data:
```bash
0 0 1 * * cd /opt/guardian_ai_engine && python training/train_login_model.py
```

## Support

For issues or questions, check:
- API documentation: http://localhost:8000/docs
- Health status: http://localhost:8000/health
- Logs: Check systemd/docker logs
