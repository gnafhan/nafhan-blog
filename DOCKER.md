# Docker Setup for Blog Platform

This project includes Docker configuration for easy development and deployment.

## Prerequisites

- Docker Desktop or Docker Engine installed
- Docker Compose v2.x

## Quick Start

### Development Mode (with hot-reloading)

```bash
# Start all services in development mode
docker-compose -f docker-compose.dev.yml up --build

# Or run in detached mode
docker-compose -f docker-compose.dev.yml up -d --build
```

Services will be available at:
- Frontend: http://localhost:3001
- Backend API: http://localhost:3000
- MongoDB: localhost:27017

### Production Mode (Local)

```bash
# Copy and configure environment variables
cp .env.docker .env

# Edit .env with your production values
# Then start all services
docker-compose up --build -d
```

### Production Mode with Traefik (Recommended)

For production deployment with SSL and reverse proxy using Traefik:

```bash
# 1. Copy and configure environment variables
cp .env.docker .env

# 2. Edit .env with your production values
nano .env
```

Required environment variables for Traefik:
```env
# Domain Configuration
DOMAIN=nafhan.com
FRONTEND_SUBDOMAIN=blog
BACKEND_SUBDOMAIN=be-blog

# Traefik Network (must match your Traefik setup)
TRAEFIK_NETWORK=traefik_network

# Security - CHANGE THESE!
MONGO_ROOT_PASSWORD=your-secure-password
JWT_SECRET=your-super-secret-jwt-key-change-in-production
```

```bash
# 3. Ensure Traefik network exists
docker network create traefik_network || true

# 4. Start all services
docker-compose -f docker-compose.prod.yml up --build -d
```

Services will be available at:
- Frontend: https://blog.nafhan.com (or your configured subdomain)
- Backend API: https://be-blog.nafhan.com (or your configured subdomain)

## Services

| Service  | Port | Description |
|----------|------|-------------|
| frontend | 3001 | Next.js frontend application |
| backend  | 3000 | NestJS REST API |
| mongodb  | 27017 | MongoDB database |

## Environment Variables

### Root `.env` file (for docker-compose)

```env
# MongoDB
MONGO_ROOT_USERNAME=admin
MONGO_ROOT_PASSWORD=password123

# Backend
NODE_ENV=production
JWT_SECRET=your-super-secret-jwt-key

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:3000
```

## Common Commands

```bash
# View logs
docker-compose logs -f

# View logs for specific service
docker-compose logs -f backend

# Stop all services
docker-compose down

# Stop and remove volumes (clears database)
docker-compose down -v

# Rebuild specific service
docker-compose up --build backend

# Access MongoDB shell
docker exec -it blog-mongodb mongosh -u admin -p password123

# Access backend container shell
docker exec -it blog-backend sh
```

## Development Tips

### Hot Reloading

In development mode (`docker-compose.dev.yml`):
- Backend: Changes to `backend/src/` are automatically detected
- Frontend: Changes to `frontend/app/`, `frontend/components/`, etc. trigger hot reload

### Database Persistence

- Development: Data stored in `mongodb_dev_data` volume
- Production: Data stored in `mongodb_data` volume

To reset the database:
```bash
docker-compose down -v
docker-compose up --build
```

### Running Tests

```bash
# Run backend tests inside container
docker exec -it blog-backend-dev npm test

# Run property-based tests
docker exec -it blog-backend-dev npx jest --config ./test/jest-properties.json
```

## Troubleshooting

### MongoDB Connection Issues

If the backend can't connect to MongoDB:
1. Ensure MongoDB is healthy: `docker-compose ps`
2. Check MongoDB logs: `docker-compose logs mongodb`
3. Verify the connection string in environment variables

### Port Conflicts

If ports are already in use, modify the port mappings in `docker-compose.yml`:
```yaml
ports:
  - "3002:3000"  # Change external port
```

### Build Failures

Clear Docker cache and rebuild:
```bash
docker-compose down
docker system prune -f
docker-compose up --build
```
