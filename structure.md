# Turborepo Workspace & Directory Structure

## Project Name: Mangosteen

### Document Version: 1.0.0 (Production-Ready Draft)

### Structure Target: Multi-Package Enterprise Monorepo (Turborepo)

---

## 1. Document Control & Agent Collaboration Log

This project directory structure blueprint was developed and audited under a **Two-Agent Peer Review Workflow**:

| Role               | Agent Persona                                       | Contribution                                                                                                                                |
| :----------------- | :-------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------ |
| **Drafting Agent** | **Agent 1: Lead Enterprise Architect**              | Authored the core monorepo directory layout, structured Next.js frontend, organized NestJS modular layout, and defined package borders.     |
| **Reviewer Agent** | **Agent 2: Principal Systems & Security Architect** | Audited monorepo build configs, verified tsconfig configurations, drafted production Dockerfiles, and configured CI/CD pipeline structures. |

### Peer Review & Hardening Log:

- **Audit Ref #7 (Shared tsconfig and ESLint)**: Hardened workspace config packages to enforce strict TypeScript validation (`strict: true`, `noImplicitAny: true`, and `noUnusedLocals: true`) across apps and packages.
- **Audit Ref #8 (Multi-Stage Docker Optimizations)**: Audited and updated the production Docker Compose setup to leverage Docker multi-stage builds, minimizing final bundle sizes and excluding development dependencies in production.
- **Audit Ref #9 (Securing Environment Variables)**: Implemented a strict `.env.example` validation step within the GitHub Actions workflow, verifying configuration schemas before build triggers.

---

## 2. Complete Enterprise Monorepo Directory Tree

The directory layout below represents the comprehensive architecture of the Mangosteen workspace, facilitating clean vertical slicing of business logic.

```
mangosteen/
├── apps/
│   ├── api/                            # Backend NestJS Core Application
│   │   ├── src/
│   │   │   ├── main.ts                 # NestJS entry point
│   │   │   ├── app.module.ts           # Root module mapping features
│   │   │   ├── common/                 # Global filters, guards, and interceptors
│   │   │   │   ├── decorators/         # @Roles, @CurrentUser definitions
│   │   │   │   ├── filters/            # GlobalExceptionFilter (HTTP/WS)
│   │   │   │   ├── guards/             # JwtAuthGuard, RolesGuard, RateLimitGuard
│   │   │   │   ├── interceptors/       # LoggingInterceptor, TimeoutInterceptor
│   │   │   │   └── middleware/         # LoggerMiddleware, CSRFCheckMiddleware
│   │   │   └── modules/                # Feature Modules (Vertical Domain Slices)
│   │   │       ├── auth/               # Auth (Login, OTP, Session, Admin Auth)
│   │   │       ├── catalog/            # Products, Variants, Categories, Inventory
│   │   │       ├── affiliate/          # Clicks, Referral Commission, Withdrawals
│   │   │       ├── order/              # Shopping Cart, Coupons, Order Processing, Payments
│   │   │       ├── logistics/          # Zones, Delivery Assignments, OTP verification
│   │   │       └── notifications/      # BullMQ workers, SendGrid/Twilio integrations
│   │   ├── test/                       # E2E integrations and security test suites
│   │   ├── Dockerfile                  # Multi-stage backend build profile
│   │   ├── tsconfig.json               # Backend specific TypeScript extends
│   │   └── package.json
│   └── web/                            # Frontend Next.js 15 App Router Client
│       ├── public/                     # Static media files, manifests, icons
│       ├── src/
│       │   ├── app/                    # Next.js App Router (Layouts & Pages)
│       │   │   ├── layout.tsx          # Root Layout (Theme, Context, PWA register)
│       │   │   ├── page.tsx            # Main Hero & Dynamic Campaign Landing Page
│       │   │   ├── products/           # Product Catalog, details and search
│       │   │   ├── cart/               # Checkout basket list
│       │   │   ├── checkout/           # Shipping details, SSLCommerz/Stripe payment
│       │   │   ├── affiliate/          # Affiliate portal & analytics charts
│       │   │   ├── admin/              # Full Admin Control Panel (analytics, logs)
│       │   │   └── delivery/           # Mobile delivery routing interface
│       │   ├── components/             # Reusable UI Atoms and Organisms
│       │   │   ├── ui/                 # shadcn/ui components (buttons, dialogs, cards)
│       │   │   ├── charts/             # Sales & Click velocity charts (Recharts)
│       │   │   └── common/             # Header, Footer, Sidebar, Navigation
│       │   ├── hooks/                  # Custom hooks (useAuth, useCart, useWindowSize)
│       │   ├── store/                  # Client-side state managers (Zustand)
│       │   │   ├── cartStore.ts        # Cart persistence and action definitions
│       │   │   └── authStore.ts        # Short-lived user profile state
│       │   ├── services/               # REST API call functions (TanStack query drivers)
│       │   │   └── api.ts              # Custom Axios client with interceptors
│       │   └── utils/                  # Currency, date formatters, validation schemas
│       ├── next.config.js              # Next.js environment configurations
│       ├── tailwind.config.js          # Design system styling tokens (shadcn/ui)
│       ├── Dockerfile                  # Next.js optimized multi-stage container file
│       └── package.json
├── packages/                           # Shared Packages and Common Configs
│   ├── database/                       # Shared Database & Prisma Engine Package
│   │   ├── prisma/
│   │   │   ├── schema.prisma           # Complete Entity Schema definition
│   │   │   ├── migrations/             # SQL DDL migration files
│   │   │   └── seed.ts                 # Safe database seeding script
│   │   ├── src/
│   │   │   └── index.ts                # Exports PrismaClient and repository interfaces
│   │   └── package.json
│   ├── eslint-config/                  # Shared ESLint configuration profiles
│   ├── typescript-config/              # Shared TSConfig base configurations
│   └── shared-types/                   # Shared TypeScript interfaces & DTO bases
├── docker/                             # Infrastructure Configurations
│   ├── nginx/
│   │   └── nginx.conf                  # Nginx proxy mapping and security headers
│   ├── postgres/
│   │   └── init.sql                    # Initial backup/schema extensions
│   └── docker-compose.yml              # Production/Staging Orchestration configuration
├── .github/
│   └── workflows/
│       └── ci-cd.yml                   # Automated lint, build, test, and release action
├── turbo.json                          # Monorepo build and caching pipelining
├── package.json                        # Root package.json coordinating workspaces
└── pnpm-workspace.yaml                 # Pnpm workspace specifications (if pnpm is used)
```

---

## 3. Configuration & Tooling Files (Agent 2 Audited)

Here are the key structural configuration blueprints designed to support efficient builds, strict code quality, and safe container deployments.

### 3.1. `turbo.json` (Caching & Build Pipeline)

Configures Turborepo to leverage local and remote build caching, maximizing performance in large-scale deployments:

```json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": [".env"],
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "dist/**"]
    },
    "lint": {
      "dependsOn": ["^lint"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "db:generate": {
      "inputs": ["prisma/schema.prisma"],
      "outputs": []
    }
  }
}
```

### 3.2. `packages/typescript-config/base.json` (Strict TS Setup)

Establishes baseline type safety across the monorepo, preventing logical bugs before execution:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["DOM", "DOM.Iterable", "ES2022"],
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "resolveJsonModule": true,
    "allowJs": true,
    "strict": true,
    "noImplicitAny": true,
    "noImplicitThis": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

### 3.3. `docker/docker-compose.yml` (Production Infrastructure Topology)

Specifies local and staging container systems with automated recovery policies and persistent volume maps:

```yaml
version: "3.8"

services:
  postgres:
    image: postgres:15-alpine
    container_name: mangosteen_postgres
    restart: always
    environment:
      POSTGRES_USER: ${DB_USER:-mangosteen}
      POSTGRES_PASSWORD: ${DB_PASSWORD:-securepassword}
      POSTGRES_DB: ${DB_NAME:-mangosteen_db}
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U mangosteen -d mangosteen_db"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: mangosteen_redis
    restart: always
    command: redis-server --appendonly yes
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  api:
    build:
      context: ..
      dockerfile: apps/api/Dockerfile
    container_name: mangosteen_api
    restart: always
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    environment:
      DATABASE_URL: postgresql://${DB_USER}:${DB_PASSWORD}@postgres:5432/${DB_NAME}?schema=public
      REDIS_HOST: redis
      REDIS_PORT: 6379
      PORT: 4000
    ports:
      - "4000:4000"

  web:
    build:
      context: ..
      dockerfile: apps/web/Dockerfile
    container_name: mangosteen_web
    restart: always
    ports:
      - "3000:3000"
    environment:
      NEXT_PUBLIC_API_URL: http://api:4000/api/v1

  nginx:
    image: nginx:alpine
    container_name: mangosteen_nginx
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
    depends_on:
      - api
      - web

volumes:
  postgres_data:
  redis_data:
```

### 3.4. `docker/nginx/nginx.conf` (Nginx Reverse Proxy Config)

Implements reverse-proxy mapping alongside crucial OWASP security headers:

```nginx
events { worker_connections 1024; }

http {
    include       mime.types;
    default_type  application/octet-stream;
    sendfile        on;
    keepalive_timeout  65;

    # Rate Limiting Zones
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;

    # Security Headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' wss: https:;" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Upstream Clusters
    upstream nextjs_web {
        server web:3000;
    }

    upstream nestjs_api {
        server api:4000;
    }

    server {
        listen 80;
        server_name localhost;

        # Frontend Navigation
        location / {
            proxy_pass http://nextjs_web;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
        }

        # Backend REST & WS Gateway
        location /api/v1 {
            limit_req zone=api_limit burst=20 nodelay;
            proxy_pass http://nestjs_api/api/v1;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        }
    }
}
```
