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

2. **Update secrets in docker-compose.yml**

```yaml
   NEXTAUTH_SECRET=your-secret-key-here  # Generate with: openssl rand -base64 32
   NEXTAUTH_URL=http://localhost:3000     # Change to your domain in production
```

3. **Start everything**

```bash
   docker compose up
```

That's it. Open http://localhost:3000

To seed demo data:

```bash
docker compose exec app npm run db:seed
```

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
   npm run db:seed  # optional: adds demo account
```

5. **Start the app**

```bash
   npm run dev
```

### Demo Account

The application comes with a pre-seeded demo account for immediate testing:

- **Email**: `demo@unwhelm.app`
- **Password**: `password123`

This account includes sample contexts and tasks that demonstrate all features including different task types, habit tracking, and context health visualization.

### Production deployment

**With Docker:**

- Change `NEXTAUTH_URL` to your domain
- Generate a strong `NEXTAUTH_SECRET`
- Use a managed PostgreSQL instance (recommended) or the included db service
- Set up a reverse proxy (nginx, Caddy) for HTTPS

**Without Docker (Vercel, Railway, etc):**

- Set environment variables in your platform
- Connect your PostgreSQL database
- Deploy normally

### Troubleshooting

**Can't connect to database?**

- Docker: Make sure both services are running: `docker compose ps`
- Check your `DATABASE_URL` format
- Cloud databases: verify firewall/IP allowlists

**Authentication errors?**

- Generate a new secret: `openssl rand -base64 32`
- Make sure `NEXTAUTH_URL` matches your actual URL

**Port already in use?**

- Change ports in docker-compose.yml or stop conflicting services

**Need help?** [Open an issue](https://github.com/tomaisthorpe/unwhelm/issues)
