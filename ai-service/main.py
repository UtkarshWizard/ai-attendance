"""
AI Service for Face Recognition
Handles face detection, embedding extraction, and similarity matching
"""
from fastapi import FastAPI, File, UploadFile, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pydantic import BaseModel, ValidationError
from typing import List, Optional
import numpy as np
from deepface import DeepFace
import cv2
from PIL import Image
import io
import os

app = FastAPI(title="AI Attendance Service", version="1.0.0")

# CORS middleware to allow frontend and backend to communicate
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Exception handler for validation errors
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle Pydantic validation errors with better error messages"""
    errors = exc.errors()
    error_details = []
    for error in errors:
        field = " -> ".join(str(loc) for loc in error["loc"])
        error_details.append(f"{field}: {error['msg']}")
    
    return JSONResponse(
        status_code=400,
        content={
            "detail": "Validation error: " + "; ".join(error_details),
            "errors": errors
        }
    )

# Configuration
SIMILARITY_THRESHOLD = 0.70  # Minimum cosine similarity for face match
MIN_FACE_SIZE = 50  # Minimum face size in pixels to consider


class FaceRegistrationRequest(BaseModel):
    """Request model for face registration"""
    student_id: str
    images: List[str]  # Base64 encoded images


class FaceRegistrationResponse(BaseModel):
    """Response model for face registration"""
    student_id: str
    embedding: List[float]
    message: str


class RecognizedFace(BaseModel):
    """Model for a recognized face"""
    student_id: str
    confidence: float
    bbox: List[int]  # [x, y, width, height]


class RecognitionResponse(BaseModel):
    """Response model for group photo recognition"""
    recognized_faces: List[RecognizedFace]
    total_faces_detected: int
    matched_faces: int


class StoredEmbedding(BaseModel):
    """Model for stored student embedding"""
    student_id: str
    embedding: List[float]


class MatchFacesRequest(BaseModel):
    """Request model for matching faces with stored embeddings"""
    stored_embeddings: List[StoredEmbedding]
    face_embeddings: List[dict]  # List of {embedding: [...], bbox: [...]}


def decode_base64_image(image_str: str) -> np.ndarray:
    """Decode base64 image string to numpy array"""
    import base64
    try:
        # Handle data URI format: data:image/jpeg;base64,<data>
        if ',' in image_str:
            # Split on comma and take the part after it
            base64_data = image_str.split(',')[1]
        else:
            # Assume it's already just base64 data
            base64_data = image_str
        
        # Decode base64
        image_data = base64.b64decode(base64_data)
        
        # Open image from bytes
        image = Image.open(io.BytesIO(image_data))
        
        # Convert to RGB if needed (handle RGBA, L, etc.)
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        return np.array(image)
    except base64.binascii.Error as e:
        raise ValueError(f"Invalid base64 encoding: {str(e)}")
    except Exception as e:
        raise ValueError(f"Failed to decode image: {str(e)}")


def extract_embedding(image: np.ndarray) -> np.ndarray:
    """
    Extract face embedding using ArcFace model via DeepFace
    
    Args:
        image: numpy array representing the image
        
    Returns:
        numpy array of face embedding (512 dimensions for ArcFace)
    """
    try:
        # Validate image
        if image is None or image.size == 0:
            raise ValueError("Image is empty or invalid")
        
        # DeepFace uses ArcFace by default when model_name is not specified
        # We explicitly use ArcFace for better accuracy
        embedding = DeepFace.represent(
            img_path=image,
            model_name='ArcFace',
            enforce_detection=True,
            detector_backend='opencv'
        )
        
        # DeepFace returns a list of dictionaries, get the first face
        if isinstance(embedding, list) and len(embedding) > 0:
            embedding_vector = np.array(embedding[0]['embedding'])
        elif isinstance(embedding, dict) and 'embedding' in embedding:
            embedding_vector = np.array(embedding['embedding'])
        else:
            raise ValueError("Unexpected embedding format from DeepFace")
            
        return embedding_vector
    except ValueError:
        raise
    except Exception as e:
        error_msg = str(e)
        # Provide more helpful error messages
        if "Face could not be detected" in error_msg or "enforce_detection" in error_msg:
            raise ValueError("No face detected in image. Please ensure the image contains a clear, front-facing face.")
        raise ValueError(f"Face embedding extraction failed: {error_msg}")


def detect_faces(image: np.ndarray) -> List[dict]:
    """
    Detect all faces in an image and return their bounding boxes
    
    Args:
        image: numpy array representing the image
        
    Returns:
        List of dictionaries with face information (bbox, region)
    """
    try:
        # Use OpenCV's face detector for efficient face detection
        face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
        
        # Convert to grayscale if needed
        if len(image.shape) == 3:
            gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)
        else:
            gray = image
        
        # Detect faces
        bboxes = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=4, minSize=(MIN_FACE_SIZE, MIN_FACE_SIZE))
        
        detected_faces = []
        for (x, y, w, h) in bboxes:
            # Filter out faces that are too small
            if w >= MIN_FACE_SIZE and h >= MIN_FACE_SIZE:
                # Extract face region
                face_region = image[y:y+h, x:x+w]
                detected_faces.append({
                    'bbox': [int(x), int(y), int(w), int(h)],
                    'region': face_region
                })
        
        return detected_faces
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Face detection error: {str(e)}")


def cosine_similarity(embedding1: np.ndarray, embedding2: np.ndarray) -> float:
    """
    Calculate cosine similarity between two embeddings
    
    Args:
        embedding1: first embedding vector
        embedding2: second embedding vector
        
    Returns:
        cosine similarity score (0 to 1)
    """
    # Normalize vectors
    norm1 = np.linalg.norm(embedding1)
    norm2 = np.linalg.norm(embedding2)
    
    if norm1 == 0 or norm2 == 0:
        return 0.0
    
    # Calculate cosine similarity
    similarity = np.dot(embedding1, embedding2) / (norm1 * norm2)
    return float(similarity)


@app.post("/register-face", response_model=FaceRegistrationResponse)
async def register_face(request: FaceRegistrationRequest):
    """
    Register a student's face by processing 3-5 images
    
    Flow:
    1. Decode base64 images
    2. Extract embedding from each image
    3. Average all embeddings
    4. Return final embedding vector
    """
    try:
        # Validate request
        if not request.student_id:
            raise HTTPException(status_code=400, detail="student_id is required")
        
        if not request.images or len(request.images) == 0:
            raise HTTPException(status_code=400, detail="At least one image is required")
        
        if len(request.images) < 3 or len(request.images) > 5:
            raise HTTPException(
                status_code=400,
                detail=f"Please provide 3-5 images for registration. Received {len(request.images)} images."
            )
        
        embeddings = []
        
        for i, image_str in enumerate(request.images):
            try:
                # Validate image string
                if not image_str or not isinstance(image_str, str):
                    raise ValueError(f"Image {i+1} is not a valid string")
                
                # Decode base64 image
                image = decode_base64_image(image_str)
                
                if image is None or image.size == 0:
                    raise ValueError(f"Image {i+1} decoded to empty array")
                
                # Extract embedding from this image
                embedding = extract_embedding(image)
                embeddings.append(embedding)
                
            except HTTPException:
                raise
            except Exception as e:
                error_msg = str(e)
                raise HTTPException(
                    status_code=400,
                    detail=f"Error processing image {i+1}: {error_msg}"
                )
        
        # Average all embeddings to get a single representative embedding
        if len(embeddings) > 0:
            avg_embedding = np.mean(embeddings, axis=0)
            embedding_list = avg_embedding.tolist()
        else:
            raise HTTPException(status_code=400, detail="No valid embeddings extracted")
        
        return FaceRegistrationResponse(
            student_id=request.student_id,
            embedding=embedding_list,
            message=f"Successfully registered {len(embeddings)} face images"
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Unexpected error: {str(e)}"
        )


@app.post("/recognize-group-photo", response_model=RecognitionResponse)
async def recognize_group_photo(file: UploadFile = File(...)):
    """
    Detect and extract embeddings from all faces in a group photo
    This endpoint only extracts embeddings - use /match-faces for actual matching
    """
    # Read uploaded image
    contents = await file.read()
    nparr = np.frombuffer(contents, np.uint8)
    image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    if image is None:
        raise HTTPException(status_code=400, detail="Invalid image file")
    
    # Convert BGR to RGB for DeepFace
    image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    
    # Detect all faces in the image
    detected_faces = detect_faces(image_rgb)
    
    if len(detected_faces) == 0:
        return RecognitionResponse(
            recognized_faces=[],
            total_faces_detected=0,
            matched_faces=0
        )
    
    # Extract embeddings for each detected face
    face_embeddings = []
    for face_info in detected_faces:
        try:
            embedding = extract_embedding(face_info['region'])
            face_embeddings.append({
                'embedding': embedding,
                'bbox': face_info['bbox']
            })
        except Exception as e:
            # Skip faces that fail embedding extraction
            continue
    
    # Return embeddings for backend to match
    recognized_faces = []
    for face_data in face_embeddings:
        recognized_faces.append(RecognizedFace(
            student_id="",  # Will be filled after matching
            confidence=0.0,
            bbox=face_data['bbox']
        ))
    
    return RecognitionResponse(
        recognized_faces=recognized_faces,
        total_faces_detected=len(detected_faces),
        matched_faces=0
    )


@app.post("/match-faces", response_model=RecognitionResponse)
async def match_faces(request: MatchFacesRequest):
    """
    Match detected face embeddings with stored student embeddings
    
    Flow:
    1. For each detected face embedding, find best match in stored embeddings
    2. Use cosine similarity for matching
    3. Only match if similarity > threshold
    4. One face matches one student only (prevent duplicates)
    
    Args:
        request: Contains stored_embeddings and face_embeddings
        
    Returns:
        List of recognized faces with student_id and confidence
    """
    if len(request.stored_embeddings) == 0:
        return RecognitionResponse(
            recognized_faces=[],
            total_faces_detected=len(request.face_embeddings),
            matched_faces=0
        )
    
    # Convert stored embeddings to numpy arrays for efficient computation
    stored_emb_dict = {}
    for stored in request.stored_embeddings:
        stored_emb_dict[stored.student_id] = np.array(stored.embedding)
    
    recognized_faces = []
    matched_student_ids = set()  # Prevent duplicate matches
    
    # Match each detected face with stored embeddings
    for face_data in request.face_embeddings:
        face_embedding = np.array(face_data['embedding'])
        best_match = None
        best_similarity = 0.0
        
        # Find best matching student for this face
        for student_id, stored_embedding in stored_emb_dict.items():
            # Skip if this student is already matched (one face = one student)
            if student_id in matched_student_ids:
                continue
            
            # Calculate cosine similarity
            similarity = cosine_similarity(face_embedding, stored_embedding)
            
            # Update best match if similarity is higher and above threshold
            if similarity > best_similarity and similarity >= SIMILARITY_THRESHOLD:
                best_similarity = similarity
                best_match = student_id
        
        # Add recognized face if match found
        if best_match:
            recognized_faces.append(RecognizedFace(
                student_id=best_match,
                confidence=best_similarity,
                bbox=face_data.get('bbox', [])
            ))
            matched_student_ids.add(best_match)
        else:
            # Unmatched face
            recognized_faces.append(RecognizedFace(
                student_id="",
                confidence=0.0,
                bbox=face_data.get('bbox', [])
            ))
    
    return RecognitionResponse(
        recognized_faces=recognized_faces,
        total_faces_detected=len(request.face_embeddings),
        matched_faces=len(matched_student_ids)
    )


@app.post("/extract-face-embeddings")
async def extract_face_embeddings(file: UploadFile = File(...)):
    """
    Extract embeddings from all faces in a group photo
    This is a helper endpoint for the backend to get embeddings for matching
    """
    try:
        contents = await file.read()
        
        if not contents or len(contents) == 0:
            raise HTTPException(status_code=400, detail="Empty file uploaded")
        
        nparr = np.frombuffer(contents, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if image is None:
            raise HTTPException(status_code=400, detail="Invalid image file. Could not decode image.")
        
        image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        
        # Detect faces
        try:
            detected_faces = detect_faces(image_rgb)
        except Exception as e:
            raise HTTPException(
                status_code=400,
                detail=f"Face detection failed: {str(e)}"
            )
        
        if len(detected_faces) == 0:
            return {
                "faces": [],
                "total_faces": 0
            }
        
        # Extract embeddings for each face
        face_data = []
        for idx, face_info in enumerate(detected_faces):
            try:
                embedding = extract_embedding(face_info['region'])
                face_data.append({
                    'embedding': embedding.tolist(),
                    'bbox': face_info['bbox']
                })
            except ValueError as e:
                # Skip faces that can't be processed (no face detected, etc.)
                continue
            except Exception as e:
                # Log but continue with other faces
                print(f"Warning: Failed to extract embedding for face {idx+1}: {str(e)}")
                continue
        
        return {
            "faces": face_data,
            "total_faces": len(face_data)
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error processing image: {str(e)}"
        )


@app.post("/register-face-debug")
async def register_face_debug(request: dict):
    """Debug endpoint to see what's being received"""
    return {
        "received": {
            "has_student_id": "student_id" in request,
            "has_images": "images" in request,
            "student_id": request.get("student_id"),
            "images_count": len(request.get("images", [])),
            "images_types": [type(img).__name__ for img in request.get("images", [])],
            "first_image_length": len(request.get("images", [""])[0]) if request.get("images") else 0
        }
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "ai-attendance"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

