# Setting Up with Neon DB (Cloud PostgreSQL)

Neon DB is a serverless PostgreSQL service that's perfect for development - no local installation needed!

## Step 1: Create Neon DB Account

1. Go to [https://neon.tech](https://neon.tech)
2. Sign up for a free account (no credit card required)
3. Create a new project

## Step 2: Get Connection String

1. In your Neon dashboard, click on your project
2. Go to "Connection Details" or "Connection String"
3. Copy the connection string (it looks like):
   ```
   postgresql://username:password@ep-xxx-xxx.us-east-2.aws.neon.tech/dbname?sslmode=require
   ```

## Step 3: Run Database Schema

You have two options:

### Option A: Using Neon SQL Editor (Easiest)

1. In Neon dashboard, go to "SQL Editor"
2. Copy the contents of `backend/database/schema.sql`
3. Paste and run it in the SQL Editor
4. Done! ✅

### Option B: Using psql (if you install PostgreSQL client)

```bash
# Install PostgreSQL client only (much lighter than full PostgreSQL)
# On Ubuntu/Debian:
sudo apt-get update
sudo apt-get install postgresql-client

# On macOS:
brew install libpq
brew link --force libpq

# Then run schema:
psql "YOUR_NEON_CONNECTION_STRING" < backend/database/schema.sql
```

### Option C: Using Node.js Script (No psql needed!)

I'll create a script that runs the schema using Node.js:

```bash
cd backend
node scripts/setup-db.js
```

## Step 4: Configure Backend

Create `backend/.env` file:

```env
# Use Neon DB connection string
DATABASE_URL=postgresql://username:password@ep-xxx-xxx.us-east-2.aws.neon.tech/dbname?sslmode=require

# Or use individual parameters (if Neon provides them separately)
# DB_HOST=ep-xxx-xxx.us-east-2.aws.neon.tech
# DB_PORT=5432
# DB_NAME=neondb
# DB_USER=username
# DB_PASSWORD=password

# Other settings
PORT=3000
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=7d
AI_SERVICE_URL=http://localhost:8000
```

## Step 5: Test Connection

```bash
cd backend
npm install
npm start
```

You should see: `✅ Connected to PostgreSQL database`

## Benefits of Neon DB

- ✅ No local PostgreSQL installation needed
- ✅ Free tier available
- ✅ Automatic backups
- ✅ Accessible from anywhere
- ✅ Easy to share with team
- ✅ Serverless (scales automatically)

## Troubleshooting

### Connection Issues
- Make sure your connection string includes `?sslmode=require`
- Check that your IP is allowed (Neon allows all by default)
- Verify the connection string is correct

### Schema Issues
- Use the SQL Editor in Neon dashboard (easiest)
- Or use the Node.js script I'll create below

## Alternative: Install PostgreSQL Locally

If you prefer local PostgreSQL:

### Ubuntu/Debian:
```bash
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo -u postgres createdb ai_attendance
sudo -u postgres psql ai_attendance < backend/database/schema.sql
```

### macOS:
```bash
brew install postgresql@14
brew services start postgresql@14
createdb ai_attendance
psql ai_attendance < backend/database/schema.sql
```

### Windows:
Download from [postgresql.org](https://www.postgresql.org/download/windows/)

