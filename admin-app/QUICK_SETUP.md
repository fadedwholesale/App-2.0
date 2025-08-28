# 🚀 Quick Database Setup Guide

## Prerequisites

1. **Replace the password** in the connection string with your actual Supabase database password
2. **Install PostgreSQL client** (if using command line tools)

## Option 1: Automated Setup (Recommended)

```bash
# Install PostgreSQL client
npm install pg

# Run the automated setup script
npm run setup-database
```

## Option 2: Manual Setup via Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy the contents of `supabase-schema.sql`
4. Paste and click **Run**

## Option 3: Command Line Setup

```bash
# Install PostgreSQL client
# macOS: brew install postgresql
# Ubuntu: sudo apt-get install postgresql-client

# Connect and run schema
psql "postgresql://postgres.hdqbnhtimuynuypwouwf:[YOUR-PASSWORD]@aws-1-us-east-2.pooler.supabase.com:5432/postgres" -f supabase-schema.sql
```

## Verify Setup

After setup, you should see:
- ✅ 4 tables created (users, products, drivers, orders)
- ✅ 10 sample products loaded
- ✅ Row Level Security policies configured
- ✅ Real-time subscriptions enabled

## Next Steps

1. **Update environment variables** in your apps
2. **Test the connection** from your apps
3. **Start development servers** with `npm run dev:all`

## Connection Details

- **Host:** `aws-1-us-east-2.pooler.supabase.com`
- **Database:** `postgres`
- **Username:** `postgres.hdqbnhtimuynuypwouwf`
- **Password:** `[YOUR-PASSWORD]` (replace with actual password)

## Troubleshooting

If you encounter issues:
1. Check the password is correct
2. Verify your IP is allowed in Supabase
3. Ensure the connection string format is correct
4. Check Supabase dashboard for any error messages

Your database will be ready to power the Faded Skies platform! 🌿
