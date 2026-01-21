# Backend API - AI Attendance System

Express.js backend with PostgreSQL database.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set up PostgreSQL database:
```bash
# Create database
createdb ai_attendance

# Run schema
psql ai_attendance < database/schema.sql
```

3. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your database credentials
```

4. Start the server:
```bash
npm start
# Or for development with auto-reload:
npm run dev
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login and get JWT token

### Students
- `POST /api/students/register` - Register student with face photos (multipart/form-data)
- `GET /api/students/class/:class_id` - Get all students in a class
- `GET /api/students/:id` - Get student by ID
- `PUT /api/students/:id` - Update student
- `DELETE /api/students/:id` - Delete student

### Attendance
- `POST /api/attendance/mark` - Mark attendance from group photo (multipart/form-data)
- `GET /api/attendance/class/:class_id/date/:date` - Get attendance for a class on a date
- `GET /api/attendance/stats/:class_id` - Get attendance statistics
- `PUT /api/attendance/override` - Manually override attendance

## Database Schema

- `users` - Authentication
- `students` - Student information
- `face_embeddings` - Stored face embeddings
- `attendance` - Attendance records

