# Environment Variables Setup

## Problem Fixed

Hardcoded Resend API key was exposed in application.yml. Now using environment variables instead.

## Current State

- ✅ application.yml uses `${RESEND_API_KEY:}` placeholder
- ✅ .env and .env.* files are in .gitignore
- ✅ .env.example documents required variables

## Setup Instructions

### For Local Development

1. **Copy template to .env**
   ```bash
   cp Backend/.env.example Backend/.env
   ```

2. **Edit .env with your values**
   ```bash
   RESEND_API_KEY=re_your_actual_key_here
   RESEND_FROM=vendor@projectbuild.me
   ```

3. **Load .env before running Spring Boot**

   **Option A: Maven (recommended for IDE)**
   ```bash
   cd Backend
   ./mvnw spring-boot:run
   ```
   Spring Boot automatically reads environment variables.

   **Option B: Shell (terminal)**
   ```bash
   cd Backend
   source .env
   ./mvnw spring-boot:run
   ```

   **Option C: IDE (IntelliJ/VS Code)**
   - Edit run configuration → Environment variables
   - Paste contents of .env
   - Run

### For Docker / Production

Set environment variables before container starts:
```bash
docker run -e RESEND_API_KEY=re_xxx -e RESEND_FROM=... myapp:latest
```

Or via docker-compose:
```yaml
services:
  backend:
    environment:
      RESEND_API_KEY: ${RESEND_API_KEY}
      RESEND_FROM: ${RESEND_FROM}
```

## application.yml Configuration

Currently using Spring placeholder syntax:
```yaml
resend:
  api-key: ${RESEND_API_KEY:}        # reads RESEND_API_KEY env var (empty default)
  from: ${RESEND_FROM:vendor@...}    # reads RESEND_FROM env var (has default)
```

## Optional: Use Spring Profiles + application-{profile}.yml

For more control, can use Spring profiles:

**application-dev.yml** (local development)
```yaml
resend:
  api-key: ${RESEND_API_KEY:}
  from: vendor@projectbuild.me
```

**application-prod.yml** (production)
```yaml
resend:
  api-key: ${RESEND_API_KEY}  # REQUIRED in prod
  from: ${RESEND_FROM}
```

Run with:
```bash
./mvnw spring-boot:run -Dspring-boot.run.arguments="--spring.profiles.active=dev"
```

## Configuration Checklist

- [x] application.yml uses env variable placeholders
- [x] .env in .gitignore (never commits secrets)
- [x] .env.example provides template
- [ ] Document in team wiki / README
- [ ] CI/CD pipeline has RESEND_API_KEY secret configured
- [ ] All developers have .env file locally

## Next: CI/CD Integration

GitHub Actions / GitLab CI should:
1. **NOT** use .env files (use GitHub Secrets instead)
2. Set env vars in workflow:
   ```yaml
   env:
     RESEND_API_KEY: ${{ secrets.RESEND_API_KEY }}
     RESEND_FROM: ${{ secrets.RESEND_FROM }}
   ```
3. Pass to build command or Docker build

## Security Best Practices

- ✅ Never commit .env to git
- ✅ Share .env.example (template only, no secrets)
- ✅ Use GitHub Secrets / CI platform for production keys
- ✅ Rotate Resend API key immediately (old one was exposed)
- ✅ Use different keys for dev/staging/prod

## Rotating Resend API Key

Since the key was exposed on GitHub:
1. Go to https://resend.com/api-keys
2. Delete any exposed keys (check audit log)
3. Create new key
4. Update .env locally
5. Update GitHub Secrets if using CI/CD
