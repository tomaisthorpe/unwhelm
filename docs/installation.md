# unwhelm Installation Guide

## Self-hosting

### With Docker (easiest)

1. **Download docker-compose.yml**

```bash
   wget https://raw.githubusercontent.com/tomaisthorpe/unwhelm/main/docker-compose.yml
```

Or clone the whole repo if you want to browse the code:

```bash
   git clone https://github.com/tomaisthorpe/unwhelm.git
   cd unwhelm
```

2. **Configure docker-compose.yml**

   Update these environment variables:

```yaml
   # Generate a secure secret
   NEXTAUTH_SECRET=your-secret-key-here  # Generate with: openssl rand -base64 32

   # Set your domain (change in production)
   NEXTAUTH_URL=http://localhost:3000

   # Create your admin account
   ADMIN_EMAIL=admin@example.com
   ADMIN_PASSWORD=changeme
   ADMIN_NAME=Admin User
```

3. **Start everything**

```bash
   docker compose up
```

That's it. Open http://localhost:3000 and log in with your admin credentials.

The database will be automatically migrated and your admin user created on first startup.

**Optional: Add demo data**

To add sample tasks and contexts for testing:

```bash
docker compose exec -e ENABLE_DEMO_USER=true app npm run db:seed
```

This creates a demo account (demo@unwhelm.app / password123) with example data.

### Without Docker

If you prefer running Node directly:

1. **Install dependencies**

```bash
   npm install
```

2. **Set up PostgreSQL**

   Run locally with Docker:

```bash
   docker compose up db -d
```

Or use a cloud provider (Neon, Supabase, Railway)

3. **Configure environment**

   Copy `.env.example` to `.env`:

```bash
   DATABASE_URL="postgresql://unwhelm:password@localhost:5432/unwhelm"
   NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
   NEXTAUTH_URL="http://localhost:3000"
```

4. **Initialize database**

```bash
   npm run db:generate
   npm run db:push
```

5. **Create admin user**

   Set environment variables and run the script:

```bash
   ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD=changeme ADMIN_NAME="Admin User" node prisma/create-admin.js
```

6. **Start the app**

```bash
   npm run dev
```

**Optional: Add demo data**

```bash
ENABLE_DEMO_USER=true npm run db:seed
```

This creates a demo account (demo@unwhelm.app / password123) with sample contexts and tasks.

### Production deployment

**With Docker:**

- Change `NEXTAUTH_URL` to your domain
- Generate a strong `NEXTAUTH_SECRET`: `openssl rand -base64 32`
- Set a secure `ADMIN_PASSWORD`
- Use a managed PostgreSQL instance (recommended) or the included db service
- Set up a reverse proxy (nginx, Caddy) for HTTPS

**Without Docker (Vercel, Railway, etc):**

- Set all environment variables in your platform
- Connect your PostgreSQL database
- Add `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME` to create your first user
- The admin user will be created automatically on first deployment
- Deploy normally

### Troubleshooting

**Can't connect to database?**

- Docker: Make sure both services are running: `docker compose ps`
- Check your `DATABASE_URL` format
- Cloud databases: verify firewall/IP allowlists

**Authentication errors?**

- Generate a new secret: `openssl rand -base64 32`
- Make sure `NEXTAUTH_URL` matches your actual URL

**Admin user not created?**

- Check container logs: `docker compose logs app`
- Verify `ADMIN_EMAIL` and `ADMIN_PASSWORD` are set
- Try running create-admin script manually: `docker compose exec app node prisma/create-admin.js`

**Port already in use?**

- Change ports in docker-compose.yml or stop conflicting services

**Need help?** [Open an issue](https://github.com/tomaisthorpe/unwhelm/issues)
