# DataKit Docker Container

Run DataKit as a lightweight Docker container with nginx serving your React app.

## 🚀 Quick Start

```bash
# Pull and run from Docker Hub (when published)
docker run -p 8080:80 datakit/app

# Or build locally
./build-docker.sh
docker run -p 8080:80 datakit/app:latest
```

**Access DataKit**: http://localhost:8080

## 📦 Building the Image

### Prerequisites
- Docker installed
- React app built in `dist/` folder

### Build Steps

```bash
# 1. Build your React app first
npm run build

# 2. Build Docker image
./build-docker.sh

# Or manually:
docker build -t datakit/app .
```

## 🐙 Using Docker Compose

```bash
# Start container
docker-compose up

# Start in background
docker-compose up -d

# Stop container
docker-compose down
```

## ⚙️ Configuration

### Port Mapping
```bash
# Default port 8080
docker run -p 8080:80 datakit/app

# Custom port 3000
docker run -p 3000:80 datakit/app

# Multiple instances
docker run -p 8081:80 datakit/app
docker run -p 8082:80 datakit/app
```

### Environment Variables
```bash
# Quiet nginx logs
docker run -e NGINX_ENTRYPOINT_QUIET_LOGS=1 -p 8080:80 datakit/app
```

### Volume Mounting (Advanced)
```bash
# Mount custom nginx config
docker run -v $(pwd)/custom-nginx.conf:/etc/nginx/conf.d/default.conf -p 8080:80 datakit/app

# Mount custom static files
docker run -v $(pwd)/custom-dist:/usr/share/nginx/html -p 8080:80 datakit/app
```

## 🏗️ Image Details

### Base Image
- **nginx:alpine** - Lightweight Alpine Linux with nginx
- **Size**: ~20MB (compressed)
- **Security**: Non-root user, minimal attack surface

### Features
- ✅ **Client-side routing** support (React Router)
- ✅ **Gzip compression** for faster loading
- ✅ **Security headers** (XSS protection, CSRF protection)
- ✅ **Static asset caching** (1 year for JS/CSS/images)
- ✅ **Health check** endpoint at `/health`
- ✅ **Non-root user** for security

### File Structure in Container
```
/usr/share/nginx/html/          # Your React app
├── index.html
├── assets/
│   ├── index.js
│   ├── index.css
│   └── ...
└── ...

/etc/nginx/conf.d/default.conf  # nginx configuration
```

## 🔧 Customization

### Custom nginx Configuration

Create `custom-nginx.conf`:
```nginx
server {
    listen 80;
    root /usr/share/nginx/html;
    
    # Your custom configuration
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

Mount it:
```bash
docker run -v $(pwd)/custom-nginx.conf:/etc/nginx/conf.d/default.conf -p 8080:80 datakit/app
```

### Custom Build Args

```dockerfile
# Custom Dockerfile
FROM nginx:alpine
ARG VERSION=0.1.0
LABEL version=$VERSION
# ... rest of build
```

Build with args:
```bash
docker build --build-arg VERSION=0.2.0 -t datakit/app:0.2.0 .
```

## 🚀 Deployment

### Production Deployment

```bash
# Build for production
docker build -t datakit/app:production .

# Run with resource limits
docker run -d \
  --name datakit-prod \
  --memory="128m" \
  --cpus="0.5" \
  --restart=unless-stopped \
  -p 80:80 \
  datakit/app:production
```

### Docker Swarm

```yaml
# docker-stack.yml
version: '3.8'
services:
  datakit:
    image: datakit/app:latest
    ports:
      - "80:80"
    deploy:
      replicas: 3
      resources:
        limits:
          memory: 128M
          cpus: '0.5'
```

Deploy:
```bash
docker stack deploy -c docker-stack.yml datakit
```

### Kubernetes

```yaml
# k8s-deployment.yml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: datakit
spec:
  replicas: 3
  selector:
    matchLabels:
      app: datakit
  template:
    metadata:
      labels:
        app: datakit
    spec:
      containers:
      - name: datakit
        image: datakit/app:latest
        ports:
        - containerPort: 80
        resources:
          requests:
            memory: "64Mi"
            cpu: "100m"
          limits:
            memory: "128Mi"
            cpu: "500m"
---
apiVersion: v1
kind: Service
metadata:
  name: datakit-service
spec:
  selector:
    app: datakit
  ports:
  - port: 80
    targetPort: 80
  type: LoadBalancer
```

## 🔍 Debugging

### Check Container Logs
```bash
docker logs datakit-app

# Follow logs
docker logs -f datakit-app
```

### Access Container Shell
```bash
docker exec -it datakit-app sh
```

### Check nginx Status
```bash
# Health check
curl http://localhost:8080/health

# Check if files are served
curl -I http://localhost:8080/
```

### Common Issues

**Problem**: Container starts but app doesn't load
```bash
# Check if files exist in container
docker exec datakit-app ls -la /usr/share/nginx/html/

# Check nginx config
docker exec datakit-app cat /etc/nginx/conf.d/default.conf
```

**Problem**: Build fails
```bash
# Ensure dist/ folder exists and has content
ls -la dist/

# Check Dockerfile syntax
docker build --no-cache -t datakit/app .
```

## 📊 Monitoring

### Health Check
The container includes a health check at `/health`:
```bash
curl http://localhost:8080/health
# Response: healthy
```

### Metrics
```bash
# Container stats
docker stats datakit-app

# Resource usage
docker exec datakit-app top
```

## 🔒 Security

### Security Features
- **Non-root user**: nginx runs as user `nginx`
- **Security headers**: XSS, CSRF, and content-type protection
- **Minimal image**: Alpine Linux base (smaller attack surface)
- **No unnecessary packages**: Only nginx and essential files

### Security Best Practices
```bash
# Run with read-only filesystem
docker run --read-only -p 8080:80 datakit/app

# Drop capabilities
docker run --cap-drop=ALL -p 8080:80 datakit/app

# Use secrets for sensitive data
docker run --secret my-secret -p 8080:80 datakit/app
```

## 📝 Publishing to Docker Hub

```bash
# Tag for Docker Hub
docker tag datakit/app:latest yourusername/datakit:latest

# Push to Docker Hub
docker push yourusername/datakit:latest

# Create multi-arch build
docker buildx build --platform linux/amd64,linux/arm64 -t yourusername/datakit:latest --push .
```