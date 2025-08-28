#!/usr/bin/env node

import { Client } from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database connection configuration using environment variable
const dbPassword = process.env.SUPABASE_DB_PASSWORD;
if (!dbPassword) {
  console.error('❌ SUPABASE_DB_PASSWORD environment variable is not set');
  console.log('\n💡 To set it, run:');
  console.log('export SUPABASE_DB_PASSWORD="your-actual-password"');
  console.log('\nOr create a .env file with:');
  console.log('SUPABASE_DB_PASSWORD=your-actual-password');
  process.exit(1);
}

const connectionString = `postgresql://postgres.hdqbnhtimuynuypwouwf:${dbPassword}@aws-1-us-east-2.pooler.supabase.com:5432/postgres`;

async function setupDatabase() {
  const client = new Client({ connectionString });
  
  try {
    console.log('🔌 Connecting to Supabase database...');
    await client.connect();
    console.log('✅ Connected to Supabase database');
    
    // Read the schema file
    const schemaPath = path.join(__dirname, 'supabase-schema.sql');
    if (!fs.existsSync(schemaPath)) {
      throw new Error('Schema file not found. Please ensure supabase-schema.sql exists in the current directory.');
    }
    
    const schema = fs.readFileSync(schemaPath, 'utf8');
    console.log('📄 Schema file loaded');
    
    // Execute the schema
    console.log('🚀 Creating database schema...');
    await client.query(schema);
    
    console.log('✅ Database schema created successfully!');
    
    // Verify the setup
    console.log('🔍 Verifying setup...');
    
    // Check if tables were created
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);
    
    console.log('📊 Tables created:');
    tablesResult.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });
    
    // Check sample data
    const productsResult = await client.query('SELECT COUNT(*) as count FROM products;');
    console.log(`🌿 Sample products loaded: ${productsResult.rows[0].count}`);
    
    // Check RLS policies
    const policiesResult = await client.query(`
      SELECT schemaname, tablename, policyname 
      FROM pg_policies 
      WHERE schemaname = 'public'
      ORDER BY tablename, policyname;
    `);
    
    console.log('🔐 Row Level Security policies:');
    policiesResult.rows.forEach(row => {
      console.log(`  - ${row.tablename}.${row.policyname}`);
    });
    
    console.log('\n🎉 Database setup completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Update your environment variables with the Supabase credentials');
    console.log('2. Test the connection from your apps');
    console.log('3. Enable real-time subscriptions in Supabase dashboard');
    console.log('4. Start your development servers');
    
  } catch (error) {
    console.error('❌ Error setting up database:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Troubleshooting tips:');
      console.log('- Check if the password in the connection string is correct');
      console.log('- Verify your IP is allowed in Supabase dashboard');
      console.log('- Ensure the connection string format is correct');
    } else if (error.code === '28P01') {
      console.log('\n💡 Authentication failed. Please check:');
      console.log('- Database password is correct');
      console.log('- Username is correct');
      console.log('- Database name is correct');
    }
    
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Check if pg module is installed
try {
  await import('pg');
} catch (error) {
  console.error('❌ PostgreSQL client not found. Please install it first:');
  console.log('npm install pg');
  process.exit(1);
}

// Run the setup
setupDatabase();
