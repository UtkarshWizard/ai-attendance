# Quick Start Guide - Neon DB Setup

## 🚀 Fastest Way to Get Started (No PostgreSQL Installation!)

### Step 1: Create Neon DB Account (2 minutes)

1. Go to [https://neon.tech](https://neon.tech)
2. Click "Sign Up" (free, no credit card)
3. Create a new project (name it `ai_attendance`)

### Step 2: Get Connection String (1 minute)

1. In Neon dashboard, click on your project
2. Click "Connection Details" 
3. Copy the connection string (looks like):
   ```
   postgresql://user:pass@ep-xxx-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```

### Step 3: Setup Backend (3 minutes)

```bash
cd backend

# Install dependencies
npm install

# Create .env file
cat > .env << EOF
DATABASE_URL=your-neon-connection-string-here
JWT_SECRET=your-random-secret-key-here
JWT_EXPIRES_IN=7d
PORT=3000
AI_SERVICE_URL=http://localhost:8000
EOF

# Setup database tables
npm run setup-db
```

**Replace `your-neon-connection-string-here` with your actual Neon connection string!**

### Step 4: Setup AI Service (5 minutes)

```bash
cd ../ai-service

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies (downloads ML models, takes a few minutes)
pip install -r requirements.txt

# Start service
python main.py
```

### Step 5: Setup Frontend (2 minutes)

```bash
cd ../frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

### Step 6: Test It! 🎉

1. Open http://localhost:5173
2. Click "Register" to create an account
3. Login and start using the system!

## ✅ That's It!

You now have:
- ✅ Cloud database (Neon DB) - no local PostgreSQL needed
- ✅ AI service running on port 8000
- ✅ Backend API running on port 3000  
- ✅ Frontend running on port 5173

## 🐛 Troubleshooting

**Backend can't connect to database?**
- Check your `DATABASE_URL` in `backend/.env`
- Make sure it includes `?sslmode=require` at the end
- Verify the connection string in Neon dashboard

**Database setup script fails?**
- Make sure `DATABASE_URL` is set correctly
- Check Neon dashboard to verify database is accessible
- Try running `npm run setup-db` again

**Need help?**
- See [NEON_SETUP.md](./NEON_SETUP.md) for detailed Neon instructions
- See [SETUP.md](./SETUP.md) for full setup guide

