# unwhelm Installation Guide

## Setup Instructions

### 1. Prerequisites

Make sure you have the following installed:

- Node.js 20 or later
- PostgreSQL database (local or cloud)
- npm or yarn package manager

### 2. Environment Configuration

1. Copy the `.env` file and update the database connection:

   ```bash
   DATABASE_URL="postgresql://username:password@localhost:5432/unwhelm?schema=public"
   NEXTAUTH_SECRET="your-secure-random-string-here"
   NEXTAUTH_URL="http://localhost:3000"
   ```

2. **For local PostgreSQL setup:**
   - Install PostgreSQL locally
   - Create a database named `unwhelm`
   - Update the `DATABASE_URL` with your credentials
   - For testing, there's a docker compose file: `docker compose up db`

3. **For cloud PostgreSQL:**
   - Use services like Neon, Supabase, or Railway
   - Get the connection string and update `DATABASE_URL`

### 3. Installation and Database Setup

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Generate Prisma client:**

   ```bash
   npm run db:generate
   ```

3. **Push the database schema:**

   ```bash
   npm run db:push
   ```

4. **Seed the database with sample data:**
   ```bash
   npm run db:seed
   ```

### 4. Development

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Demo Account

The application comes with a pre-seeded demo account for immediate testing:

- **Email**: `demo@unwhelm.app`
- **Password**: `password123`

This account includes sample contexts and tasks that demonstrate all features including different task types, habit tracking, and context health visualization.

## Troubleshooting

### Database Connection Issues

- Verify your `DATABASE_URL` is correct
- Ensure your PostgreSQL server is running
- Check firewall settings for cloud databases

### Authentication Issues

- Verify `NEXTAUTH_SECRET` is set
- Check `NEXTAUTH_URL` matches your domain
- Clear browser cookies if needed

### Build Issues

- Run `npm run db:generate` after schema changes
- Ensure all environment variables are set
- Check TypeScript errors with `npm run lint`

## Support

For questions or issues:

1. Check the documentation in `/docs/`
2. Check the console for error messages
3. Verify database connectivity and seeding
4. Post an issue!
