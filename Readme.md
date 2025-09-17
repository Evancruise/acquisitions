# Dockerized Application with Neon Database

This application is configured to work with Neon Database in both development and production environments using Docker and Docker Compose.

## 🏗️ Architecture Overview

- **Development**: Uses Neon Local proxy for ephemeral database branches
- **Production**: Connects directly to Neon Cloud serverless database
- **Containerization**: Multi-stage Dockerfile with optimized production builds
- **Environment Management**: Separate configuration files for dev and prod

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- [Docker](https://docs.docker.com/get-docker/) (version 20.10+)
- [Docker Compose](https://docs.docker.com/compose/install/) (version 2.0+)
- [Neon Account](https://console.neon.tech) with a project created

## 🚀 Quick Start

### 1. Clone and Setup

```bash
git clone <your-repo-url>
cd <your-project-directory>
```

### 2. Configure Neon Credentials

Get your Neon credentials from the [Neon Console](https://console.neon.tech):

1. Go to your project dashboard
2. Copy your **API Key** from Settings → API Keys
3. Copy your **Project ID** from the connection details
4. Copy your **Branch ID** (usually 'main' for the default branch)

### 3. Development Setup

#### Configure Development Environment

Update `.env.development` with your actual Neon credentials:

```bash
cp .env.development .env.development.local
# Edit .env.development.local with your actual values:
NEON_API_KEY=neon_api_1abc2def3ghi4jkl5mno6pqr
NEON_PROJECT_ID=cool-project-123456
PARENT_BRANCH_ID=br-main-123456
```

#### Start Development Environment

**Option 1: Quick Start Scripts**

**Windows (Batch Script):**
```cmd
# Double-click start-dev.bat or run in Command Prompt:
start-dev.bat
```

**Windows (PowerShell):**
```powershell
# Run in PowerShell (recommended for Windows):
.\start-dev.ps1

# With options:
.\start-dev.ps1 -SkipBrowser -Verbose
```

**Linux/macOS (Bash Script):**
```bash
# Make executable and run:
chmod +x start-dev.sh
./start-dev.sh
```

**Option 2: Manual Docker Compose**

```bash
# Start all services (app + Neon Local + Redis)
docker-compose -f docker-compose.dev.yml --env-file .env.development.local up -d

# View logs
docker-compose -f docker-compose.dev.yml logs -f app

# Stop services
docker-compose -f docker-compose.dev.yml down
```

Your application will be available at: http://localhost:3000

#### Development Features

- **Hot Reloading**: Code changes are automatically reflected
- **Ephemeral Database**: Fresh database branch created on each startup
- **Debug Logging**: Enhanced logging for development
- **Source Code Mounting**: Direct file system mounting for instant updates

### 4. Production Setup

#### Configure Production Environment

Update `.env.production` with your production values:

```bash
cp .env.production .env.production.local
# Edit .env.production.local with your actual values:
DATABASE_URL=postgresql://username:password@ep-example-123456.us-east-1.aws.neon.tech/dbname?sslmode=require
JWT_SECRET=your_secure_jwt_secret
SESSION_SECRET=your_secure_session_secret
```

#### Deploy Production Environment

```bash
# Build and start production services
docker-compose -f docker-compose.prod.yml --env-file .env.production.local up -d

# View production logs
docker-compose -f docker-compose.prod.yml logs -f app

# Stop production services
docker-compose -f docker-compose.prod.yml down
```

## 🔧 Configuration Details

### Environment Variables

| Variable | Development | Production | Description |
|----------|-------------|------------|-------------|
| `DATABASE_URL` | `postgres://user:password@neon-local:5432/dbname` | `postgresql://...neon.tech/...` | Database connection string |
| `NODE_ENV` | `development` | `production` | Application environment |
| `NEON_API_KEY` | Required | Not used | Neon API key for local development |
| `NEON_PROJECT_ID` | Required | Not used | Your Neon project identifier |
| `PARENT_BRANCH_ID` | Required | Not used | Branch to create ephemeral branches from |

### Docker Services

#### Development Services
- **neon-local**: Neon Local proxy for database access
- **app**: Your application with hot reloading
- **redis**: Optional caching layer

#### Production Services
- **app**: Optimized production build
- **nginx**: Optional reverse proxy
- **redis**: Optional production caching

## 📚 Common Commands

### Development Workflow

```bash
# Start development environment
docker-compose -f docker-compose.dev.yml --env-file .env.development.local up -d

# Rebuild application after dependency changes
docker-compose -f docker-compose.dev.yml build app
docker-compose -f docker-compose.dev.yml up -d app

# Access application container
docker-compose -f docker-compose.dev.yml exec app sh

# Access Neon Local database directly
docker-compose -f docker-compose.dev.yml exec neon-local psql -U user -d dbname

# View all logs
docker-compose -f docker-compose.dev.yml logs -f

# Stop and remove everything
docker-compose -f docker-compose.dev.yml down -v
```

### Production Management

```bash
# Deploy production
docker-compose -f docker-compose.prod.yml --env-file .env.production.local up -d

# Scale application (if using Docker Swarm)
docker-compose -f docker-compose.prod.yml up -d --scale app=3

# Update production deployment
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d

# Health check
docker-compose -f docker-compose.prod.yml ps
docker-compose -f docker-compose.prod.yml exec app curl http://localhost:3000/health
```

## 🏥 Health Checks

The application includes built-in health checks:

- **Application**: `GET /health` endpoint
- **Database**: Automatic connection testing
- **Services**: Docker health checks configured

Create a simple health check endpoint in your application:

```javascript path=null start=null
// healthcheck.js or add to your main app
const http = require('http');

const options = {
  host: 'localhost',
  port: process.env.PORT || 3000,
  path: '/health',
  timeout: 2000
};

const request = http.request(options, (res) => {
  if (res.statusCode === 200) {
    process.exit(0);
  } else {
    process.exit(1);
  }
});

request.on('error', () => {
  process.exit(1);
});

request.end();
```

## 🔍 Troubleshooting

### Common Issues

#### Neon Local Connection Issues
```bash
# Check Neon Local logs
docker-compose -f docker-compose.dev.yml logs neon-local

# Verify Neon credentials
echo $NEON_API_KEY
echo $NEON_PROJECT_ID
```

#### Application Won't Start
```bash
# Check application logs
docker-compose -f docker-compose.dev.yml logs app

# Rebuild with no cache
docker-compose -f docker-compose.dev.yml build --no-cache app
```

#### Database Connection Problems
```bash
# Test database connectivity
docker-compose -f docker-compose.dev.yml exec app node -e "
const { Client } = require('pg');
const client = new Client(process.env.DATABASE_URL);
client.connect().then(() => {
  console.log('Database connected successfully');
  client.end();
}).catch(console.error);
"
```

### Performance Optimization

#### Development
- Use `.dockerignore` to exclude unnecessary files
- Mount only necessary directories
- Use multi-stage builds for faster rebuilds

#### Production
- Enable connection pooling
- Configure proper resource limits
- Use health checks for reliability
- Implement proper logging

## 🛡️ Security Considerations

### Development
- Never commit `.env.development.local` to version control
- Use separate Neon API keys for different developers
- Regularly rotate API keys

### Production
- Use secrets management (Docker Secrets, Kubernetes Secrets)
- Enable SSL/TLS for database connections
- Implement proper CORS policies
- Use non-root users in containers
- Regular security updates for base images

## 📖 Additional Resources

- [Neon Documentation](https://neon.com/docs)
- [Neon Local Documentation](https://neon.com/docs/local/neon-local)
- [Docker Best Practices](https://docs.docker.com/develop/best-practices/)
- [Docker Compose Reference](https://docs.docker.com/compose/compose-file/)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Test with both development and production environments
4. Submit a pull request

## 📄 License

[Add your license information here]

---

**Need Help?** Check the [troubleshooting section](#-troubleshooting) or open an issue in the repository.