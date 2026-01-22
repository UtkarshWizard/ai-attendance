# AI-Based Classroom Attendance System

A production-ready web application that automatically marks attendance by analyzing classroom group photographs using face recognition.

## 🏗️ System Architecture

The system consists of three main components:

1. **AI Service** (Python + FastAPI) - Face detection, embedding extraction, and matching
2. **Backend** (Node.js + Express) - API server with authentication and database
3. **Frontend** (React) - User interface for registration, attendance, and dashboard

## 🧠 Core Technology

- **Face Recognition**: Uses DeepFace with ArcFace model for face embeddings
- **Face Detection**: OpenCV for detecting multiple faces in group photos
- **Matching**: Cosine similarity for comparing face embeddings
- **Database**: PostgreSQL for storing student data, embeddings, and attendance

## 📋 Prerequisites

- Python 3.8+
- Node.js 16+
- PostgreSQL 12+
- npm or yarn

##  Setup Instructions

### 1. Database Setup

```bash
# Create PostgreSQL database
createdb ai_attendance

# Run schema
psql ai_attendance < backend/database/schema.sql
```

### 2. AI Service Setup

```bash
cd ai-service

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment (optional)
cp .env.example .env
# Edit .env if needed

# Start the service
python main.py
# Or: uvicorn main:app --reload --port 8000
```

The AI service will run on `http://localhost:8000`

### 3. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your database credentials and AI service URL

# Start the server
npm start
# Or for development: npm run dev
```

The backend will run on `http://localhost:3000`

### 4. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will run on `http://localhost:5173`

## 📁 Project Structure

```
ai_attendance/
├── ai-service/          # Python FastAPI service
│   ├── main.py          # Main application
│   ├── requirements.txt  # Python dependencies
│   └── README.md
├── backend/              # Node.js Express server
│   ├── config/          # Database configuration
│   ├── models/          # Database models
│   ├── routes/          # API routes
│   ├── services/        # AI service client
│   ├── middleware/      # Auth middleware
│   ├── database/        # SQL schema
│   ├── server.js        # Main server file
│   └── package.json
└── frontend/            # React application
    ├── src/
    │   ├── pages/       # Page components
    │   ├── components/  # Reusable components
    │   ├── context/     # React context
    │   └── App.jsx
    └── package.json
```

## 🔐 Authentication

The system uses JWT (JSON Web Tokens) for authentication:

1. Register a new user at `/login` (click "Register")
2. Login with your credentials
3. JWT token is stored in localStorage and sent with each request

## 📝 Usage

### Student Registration

1. Navigate to "Student Registration" page
2. Enter student details (name, roll number, class ID)
3. Upload 3-5 clear face photos
4. Click "Register Student"

The system will:
- Extract face embeddings from each photo
- Average the embeddings
- Store the final embedding in the database

### Mark Attendance

1. Navigate to "Mark Attendance" page
2. Select class ID and date
3. Upload a group photo of the classroom
4. Click "Mark Attendance"

The system will:
- Detect all faces in the photo
- Extract embeddings for each face
- Match with stored student embeddings
- Mark students as present if similarity > 0.70
- Mark unmatched students as absent

### View Dashboard

1. Navigate to "Dashboard" page
2. Enter class ID and date
3. View attendance list with present/absent status

## 🧬 Face Recognition Logic

### Registration Flow
1. Student uploads 3-5 face photos
2. Extract embedding from each photo using ArcFace
3. Average all embeddings to get a single representative vector
4. Store the averaged embedding in the database

### Attendance Flow
1. Teacher uploads classroom group photo
2. Detect all faces in the image
3. Extract embedding for each detected face
4. Compare each face embedding with all stored student embeddings
5. Calculate cosine similarity for each comparison
6. Match face to student if similarity > threshold (0.70)
7. One face matches one student only (prevents duplicates)
8. Mark matched students as present, others as absent

### Matching Rules
- **Cosine Similarity**: Used for comparing embeddings (range: 0 to 1)
- **Threshold**: 0.70 minimum similarity for a match
- **One-to-One**: Each face matches only one student
- **No Duplicates**: Each student can only be matched once per photo
- **Minimum Face Size**: Faces smaller than 50px are ignored

## 🗄️ Database Schema

### Students
- `id` - Primary key
- `name` - Student name
- `roll_number` - Unique roll number per class
- `class_id` - Class identifier
- `created_at` - Registration timestamp

### FaceEmbeddings
- `id` - Primary key
- `student_id` - Foreign key to students
- `embedding` - JSONB array of float values (face embedding vector)
- `created_at` - Creation timestamp

### Attendance
- `id` - Primary key
- `student_id` - Foreign key to students
- `date` - Attendance date
- `status` - 'present' or 'absent'
- `confidence_score` - Similarity score (0.0 to 1.0)
- `image_url` - Optional URL to attendance photo
- `created_at` - Record timestamp

### Users
- `id` - Primary key
- `email` - Unique email
- `password` - Hashed password
- `name` - User name
- `role` - 'teacher' or 'admin'

## 🔧 Configuration

### AI Service
- `SIMILARITY_THRESHOLD` - Minimum similarity for face match (default: 0.70)
- `MIN_FACE_SIZE` - Minimum face size in pixels (default: 50)
- `PORT` - Service port (default: 8000)

### Backend
- `PORT` - Server port (default: 3000)
- `JWT_SECRET` - Secret key for JWT tokens
- `JWT_EXPIRES_IN` - Token expiration (default: 7d)
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` - Database credentials
- `AI_SERVICE_URL` - AI service URL (default: http://localhost:8000)

## 🧪 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login and get JWT token

### Students
- `POST /api/students/register` - Register student with face photos
- `GET /api/students/class/:class_id` - Get all students in a class
- `GET /api/students/:id` - Get student by ID
- `PUT /api/students/:id` - Update student
- `DELETE /api/students/:id` - Delete student

### Attendance
- `POST /api/attendance/mark` - Mark attendance from group photo
- `GET /api/attendance/class/:class_id/date/:date` - Get attendance for a class
- `GET /api/attendance/stats/:class_id` - Get attendance statistics
- `PUT /api/attendance/override` - Manually override attendance

### AI Service
- `POST /register-face` - Register face from multiple images
- `POST /extract-face-embeddings` - Extract embeddings from group photo
- `POST /match-faces` - Match face embeddings with stored embeddings
- `GET /health` - Health check

## 🛡️ Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Protected API routes
- One attendance per student per day
- Manual override option for corrections

## 📝 Notes

- **Image Storage**: Raw images are not stored permanently (only embeddings)
- **Face Quality**: Better quality photos = better recognition accuracy
- **Lighting**: Ensure good lighting in photos for best results
- **Face Size**: Faces should be clearly visible and not too small
- **Group Photos**: Works best with clear, front-facing faces

## 🐛 Troubleshooting

### AI Service Issues
- Ensure DeepFace models are downloaded (first run will download automatically)
- Check that OpenCV is properly installed
- Verify Python version is 3.8+

### Backend Issues
- Verify PostgreSQL is running and accessible
- Check database credentials in `.env`
- Ensure AI service is running and accessible

### Frontend Issues
- Clear browser cache if authentication issues occur
- Check browser console for errors
- Verify backend and AI service are running

## 📄 License

This project is provided as-is for educational and development purposes.

## 🤝 Contributing

This is a production-ready template. Feel free to extend and customize as needed.

