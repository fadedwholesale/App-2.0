# Supabase Database Setup Guide

## 🔗 Database Connection

**Connection String:**
```
postgresql://postgres.hdqbnhtimuynuypwouwf:[YOUR-PASSWORD]@aws-1-us-east-2.pooler.supabase.com:5432/postgres
```

**Connection Details:**
- **Host:** `aws-1-us-east-2.pooler.supabase.com`
- **Port:** `5432`
- **Database:** `postgres`
- **Username:** `postgres.hdqbnhtimuynuypwouwf`
- **Password:** `[YOUR-PASSWORD]` (replace with your actual password)

## 🛠️ Setup Instructions

### 1. Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `supabase-schema.sql`
4. Click **Run** to execute the schema

### 2. Using Database Management Tools

#### Option A: pgAdmin
1. Open pgAdmin
2. Create a new server connection
3. Use the connection details above
4. Connect and run the SQL schema

#### Option B: DBeaver
1. Open DBeaver
2. Create a new PostgreSQL connection
3. Use the connection details above
4. Connect and run the SQL schema

#### Option C: Command Line (psql)
```bash
# Install PostgreSQL client if not already installed
# macOS: brew install postgresql
# Ubuntu: sudo apt-get install postgresql-client

# Connect to database
psql "postgresql://postgres.hdqbnhtimuynuypwouwf:[YOUR-PASSWORD]@aws-1-us-east-2.pooler.supabase.com:5432/postgres"

# Run the schema file
\i supabase-schema.sql
```

### 3. Using Node.js Script

Create a setup script to initialize the database:

```javascript
// setup-database.js
const { Client } = require('pg');
const fs = require('fs');

const connectionString = 'postgresql://postgres.hdqbnhtimuynuypwouwf:[YOUR-PASSWORD]@aws-1-us-east-2.pooler.supabase.com:5432/postgres';

async function setupDatabase() {
  const client = new Client({ connectionString });
  
  try {
    await client.connect();
    console.log('Connected to Supabase database');
    
    // Read and execute the schema file
    const schema = fs.readFileSync('supabase-schema.sql', 'utf8');
    await client.query(schema);
    
    console.log('Database schema created successfully!');
  } catch (error) {
    console.error('Error setting up database:', error);
  } finally {
    await client.end();
  }
}

setupDatabase();
```

Run with:
```bash
npm install pg
node setup-database.js
```

## 📊 Database Schema Overview

### Tables Created:

1. **users** - Customer accounts and profiles
2. **products** - Cannabis products catalog
3. **drivers** - Driver accounts and status
4. **orders** - Order management and tracking

### Features Included:

- **Row Level Security (RLS)** - Fine-grained access control
- **Real-time Subscriptions** - Live updates across apps
- **Automatic Timestamps** - Created/updated timestamps
- **Foreign Key Relationships** - Proper data integrity
- **Indexes** - Performance optimization
- **Sample Data** - 10 cannabis products for testing

## 🔐 Security Configuration

### Row Level Security Policies:

- **Users**: Can only access their own data
- **Products**: Public read access, admin-only write
- **Drivers**: Can access their own data, admin can manage all
- **Orders**: Users see their orders, drivers see assigned orders, admin sees all

### Authentication:

- Uses Supabase Auth with JWT tokens
- Automatic user creation on signup
- Role-based access control

## 🔄 Real-time Features

### Enabled Tables:
- `users` - User profile updates
- `products` - Product catalog changes
- `drivers` - Driver status updates
- `orders` - Order status changes

### Subscription Channels:
- User-specific order updates
- Driver order assignments
- Admin dashboard updates
- Product catalog changes

## 🧪 Testing the Setup

### 1. Verify Tables Exist
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE';
```

### 2. Check Sample Data
```sql
SELECT * FROM products LIMIT 5;
```

### 3. Test RLS Policies
```sql
-- This should only show your own data
SELECT * FROM users;
```

### 4. Verify Real-time
```sql
-- Enable real-time for testing
ALTER PUBLICATION supabase_realtime ADD TABLE users, products, drivers, orders;
```

## 🚀 Environment Variables

Add these to your app's environment:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://hdqbnhtimuynuypwouwf.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhkcWJuaHRpbXV5bnV5cHdvdXdmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzOTExMTIsImV4cCI6MjA3MDk2NzExMn0.JU4TzFtiUmVDAJ0QNu7lcu5RcXEJw6jhNUB86L1YTSQ

# Database Connection (for admin tools only)
DATABASE_URL=postgresql://postgres.hdqbnhtimuynuypwouwf:[YOUR-PASSWORD]@aws-1-us-east-2.pooler.supabase.com:5432/postgres
```

## 🔧 Troubleshooting

### Common Issues:

1. **Connection Refused**
   - Check if the password is correct
   - Verify the connection string format
   - Ensure your IP is allowed in Supabase

2. **Permission Denied**
   - Check RLS policies
   - Verify user authentication
   - Ensure proper role assignments

3. **Real-time Not Working**
   - Enable real-time in Supabase dashboard
   - Check subscription filters
   - Verify channel names

### Support:

- **Supabase Docs:** https://supabase.com/docs
- **PostgreSQL Docs:** https://www.postgresql.org/docs/
- **Community:** https://github.com/supabase/supabase/discussions

## 📈 Monitoring

### Supabase Dashboard:
- **Database** - View tables, run queries, monitor performance
- **Authentication** - User management and auth logs
- **Logs** - API request logs and errors
- **Storage** - File storage (if needed)

### Key Metrics:
- **Active Users** - Authentication logs
- **Order Volume** - Orders table analytics
- **Driver Activity** - Driver status tracking
- **Product Performance** - Product sales analytics

## 🎯 Next Steps

1. **Set up the database** using one of the methods above
2. **Configure authentication** in Supabase dashboard
3. **Test real-time subscriptions** in each app
4. **Deploy to production** with proper environment variables
5. **Monitor performance** through Supabase dashboard

Your database is now ready to power the Faded Skies cannabis delivery platform! 🚀
