# Quick Setup Guide

## Prerequisites Check

```bash
# Check Python version (need 3.8+)
python3 --version

# Check Node.js version (need 16+)
node --version

# Check PostgreSQL
psql --version
```

## Step-by-Step Setup

### 1. Database Setup (5 minutes)

**Option A: Use Neon DB (Recommended - No local PostgreSQL needed!)**

See [NEON_SETUP.md](./NEON_SETUP.md) for detailed instructions.

Quick steps:
1. Sign up at [neon.tech](https://neon.tech)
2. Create a project and copy the connection string
3. Add to `backend/.env`: `DATABASE_URL=your-neon-connection-string`
4. Run: `cd backend && npm run setup-db`

**Option B: Local PostgreSQL**

```bash
# Create database
createdb ai_attendance

# Run schema
psql ai_attendance < backend/database/schema.sql

# Verify tables created
psql ai_attendance -c "\dt"
```

**Option C: Use Node.js script (works with both Neon and local)**

```bash
cd backend
npm install
# Set DATABASE_URL in .env (for Neon) or DB_* variables (for local)
npm run setup-db
```

### 2. AI Service Setup (10 minutes)

```bash
cd ai-service

# Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies (this may take a while, downloads ML models)
pip install -r requirements.txt

# Test the service
python main.py
# Should see: "Application startup complete" and running on port 8000
```

**Note**: First run will download DeepFace models (~500MB), be patient.

### 3. Backend Setup (5 minutes)

```bash
cd ../backend

# Install dependencies
npm install

# Create .env file
touch .env

# Edit .env with your database credentials:

# For Neon DB (recommended):
# DATABASE_URL=postgresql://username:password@ep-xxx-xxx.us-east-2.aws.neon.tech/dbname?sslmode=require

# OR for local PostgreSQL:
# DB_HOST=localhost
# DB_PORT=5432
# DB_NAME=ai_attendance
# DB_USER=your_postgres_user
# DB_PASSWORD=your_postgres_password

# Other required settings:
# JWT_SECRET=your-secret-key-here
# AI_SERVICE_URL=http://localhost:8000
# PORT=3000
# JWT_EXPIRES_IN=7d

# Setup database schema (if not done already)
npm run setup-db

# Start server
npm start
# Should see: " Backend server running on port 3000"
```

### 4. Frontend Setup (3 minutes)

```bash
cd ../frontend

# Install dependencies
npm install

# Start development server
npm run dev
# Should open at http://localhost:5173
```

## Testing the System

1. **Register a User**:
   - Go to http://localhost:5173/login
   - Click "Register"
   - Enter email, password, and name
   - You'll be automatically logged in

2. **Register a Student**:
   - Go to "Student Registration"
   - Enter student details
   - Upload 3-5 clear face photos
   - Click "Register Student"

3. **Mark Attendance**:
   - Go to "Mark Attendance"
   - Enter class ID and date
   - Upload a group photo with the registered student
   - Click "Mark Attendance"
   - View results

4. **View Dashboard**:
   - Go to "Dashboard"
   - Enter class ID and date
   - View attendance list

## Common Issues

### AI Service won't start
- Check Python version: `python3 --version` (need 3.8+)
- Ensure virtual environment is activated
- Try: `pip install --upgrade pip` then reinstall requirements

### Backend connection errors
- Verify PostgreSQL is running: `pg_isready`
- Check database credentials in `.env`
- Ensure database exists: `psql -l | grep ai_attendance`

### Frontend can't connect to backend
- Check backend is running on port 3000
- Check browser console for CORS errors
- Verify proxy settings in `vite.config.js`

### Face recognition not working
- Ensure photos are clear and well-lit
- Faces should be front-facing
- Minimum 3 photos required for registration
- Check AI service logs for errors

## Production Deployment Notes

1. **Environment Variables**: Never commit `.env` files
2. **JWT Secret**: Use a strong, random secret in production
3. **Database**: Use connection pooling and proper backups
4. **AI Service**: Consider GPU acceleration for faster processing
5. **Image Storage**: Implement cloud storage (S3, etc.) for production
6. **HTTPS**: Always use HTTPS in production
7. **CORS**: Restrict CORS origins to your frontend domain

## Next Steps

- Add more classes and students
- Test with different lighting conditions
- Adjust similarity threshold if needed (in AI service)
- Add manual attendance override for edge cases
- Implement attendance reports and analytics

