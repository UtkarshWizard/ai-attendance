# AI Service - Face Recognition Microservice

FastAPI service for face detection, embedding extraction, and similarity matching.

## Setup

1. Create a virtual environment:
```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Run the service:
```bash
python main.py
# Or with uvicorn:
uvicorn main:app --reload --port 8000
```

## Endpoints

### POST /register-face
Register a student's face by processing 3-5 images.

**Request Body:**
```json
{
  "student_id": "STU001",
  "images": ["base64_image1", "base64_image2", ...]
}
```

**Response:**
```json
{
  "student_id": "STU001",
  "embedding": [0.123, 0.456, ...],
  "message": "Successfully registered 3 face images"
}
```

### POST /recognize-group-photo
Detect and extract embeddings from all faces in a group photo.

**Request:** Multipart form data with image file

**Response:**
```json
{
  "recognized_faces": [...],
  "total_faces_detected": 5,
  "matched_faces": 0
}
```

### POST /extract-face-embeddings
Extract embeddings from all faces in an uploaded image (helper endpoint for backend).

### GET /health
Health check endpoint.

## Configuration

- `SIMILARITY_THRESHOLD`: Minimum cosine similarity for face match (default: 0.70)
- `MIN_FACE_SIZE`: Minimum face size in pixels (default: 50)

