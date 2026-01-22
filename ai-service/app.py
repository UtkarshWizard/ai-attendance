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
from ultralytics import YOLO
from insightface.app import FaceAnalysis
import cv2
from PIL import Image
import io
import os

app = FastAPI(title="AI Attendance Service", version="1.0.0")

# ---------------- YOLOv8 Face Detector ----------------
yolo_face = YOLO(
    os.path.join(os.path.dirname(__file__), "yolov9t-face-lindevs.pt")
)  # lightweight & fast

arcface_app = FaceAnalysis(
    name="buffalo_l",          # stable, bundled model
    providers=["CPUExecutionProvider"]
)
arcface_app.prepare(ctx_id=0, det_size=(640, 640))


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
SIMILARITY_THRESHOLD = 0.60  # Lowered threshold for better selfie-to-group matching
MIN_FACE_SIZE = 20  # Minimum face size in pixels to consider


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


# def extract_embedding(image: np.ndarray) -> np.ndarray:
#     """
#     Extract face embedding using ArcFace model via DeepFace
    
#     Args:
#         image: numpy array representing the image
        
#     Returns:
#         numpy array of face embedding (512 dimensions for ArcFace)
#     """
#     try:
#         # Validate image
#         if image is None or image.size == 0:
#             raise ValueError("Image is empty or invalid")
        
#         # DeepFace uses ArcFace by default when model_name is not specified
#         # We explicitly use ArcFace for better accuracy
#         embedding = DeepFace.represent(
#             img_path=image,
#             model_name='ArcFace',
#             enforce_detection=False,
#             detector_backend='retinaface',
#             align=True
#         )
        
#         # DeepFace returns a list of dictionaries, get the first face
#         if isinstance(embedding, list) and len(embedding) > 0:
#             embedding_vector = np.array(embedding[0]['embedding'])
#         elif isinstance(embedding, dict) and 'embedding' in embedding:
#             embedding_vector = np.array(embedding['embedding'])
#         else:
#             raise ValueError("Unexpected embedding format from DeepFace")
            
#         return embedding_vector
#     except ValueError:
#         raise
#     except Exception as e:
#         error_msg = str(e)
#         # Provide more helpful error messages
#         if "Face could not be detected" in error_msg or "enforce_detection" in error_msg:
#             raise ValueError("No face detected in image. Please ensure the image contains a clear, front-facing face.")
#         raise ValueError(f"Face embedding extraction failed: {error_msg}")


# def detect_faces(image: np.ndarray) -> List[dict]:
#     """
#     Detect faces using Retinaface via DeepFace
#     """

#     try:
#         detections = DeepFace.extract_faces(
#             img_path=image,
#             detector_backend='retinaface',
#             enforce_detection=False,
#             align=True,
#         )

#         detected_faces = []

#         for det in detections:
#             face = det["face"]
#             region = det["facial_area"]

#             h, w, _ = face.shape

#             if h < MIN_FACE_SIZE or w < MIN_FACE_SIZE:
#                 continue

#             detected_faces.append({
#                 "bbox": [
#                     int(region["x"]),
#                     int(region["y"]),
#                     int(region["w"]),
#                     int(region["h"])
#                 ],
#                 "region": face
#             })

#         return detected_faces

#     except Exception as e:
#         raise HTTPException(
#             status_code=400,
#             detail=f"RetinaFace detection failed: {str(e)}"
#         )

def detect_faces_yolo(image: np.ndarray) -> List[dict]:
    """
    Detect faces using YOLOv8-face
    Returns list of {bbox, region}
    """
    results = yolo_face(image, conf=0.3, iou=0.5)[0]

    faces = []

    for box in results.boxes:
        x1, y1, x2, y2 = map(int, box.xyxy[0])

        w, h = x2 - x1, y2 - y1
        if w < MIN_FACE_SIZE or h < MIN_FACE_SIZE:
            continue

        face_crop = image[y1:y2, x1:x2]

        faces.append({
            "bbox": [x1, y1, w, h],
            "region": face_crop
        })

    return faces


def calculate_iou(bbox1: List[int], bbox2: List[int]) -> float:
    """
    Calculate Intersection over Union (IoU) between two bounding boxes
    bbox format: [x, y, width, height]
    """
    x1_1, y1_1, w1, h1 = bbox1
    x1_2, y1_2, w2, h2 = bbox2
    x2_1, y2_1 = x1_1 + w1, y1_1 + h1
    x2_2, y2_2 = x1_2 + w2, y1_2 + h2
    
    # Calculate intersection
    x1_i = max(x1_1, x1_2)
    y1_i = max(y1_1, y1_2)
    x2_i = min(x2_1, x2_2)
    y2_i = min(y2_1, y2_2)
    
    if x2_i <= x1_i or y2_i <= y1_i:
        return 0.0
    
    intersection = (x2_i - x1_i) * (y2_i - y1_i)
    area1 = w1 * h1
    area2 = w2 * h2
    union = area1 + area2 - intersection
    
    if union == 0:
        return 0.0
    
    return intersection / union


def extract_arcface_embedding(face_img: np.ndarray, is_full_image: bool = False) -> np.ndarray:
    """
    Extract ArcFace embedding using InsightFace FaceAnalysis
    Handles both full selfie images and cropped faces from group photos
    
    Args:
        face_img: Input image (RGB format)
        is_full_image: True if this is a full selfie/portrait, False if already cropped
    
    Returns:
        512-dimensional embedding vector
    """
    # Ensure face image is valid
    if face_img is None or face_img.size == 0:
        raise ValueError("Face image is empty or invalid")
    
    # Get dimensions
    h, w = face_img.shape[:2]
    
    # Convert to BGR for InsightFace
    if len(face_img.shape) == 3 and face_img.shape[2] == 3:
        face_img_bgr = cv2.cvtColor(face_img, cv2.COLOR_RGB2BGR)
    elif len(face_img.shape) == 2:
        face_img_bgr = cv2.cvtColor(face_img, cv2.COLOR_GRAY2BGR)
    else:
        face_img_bgr = face_img
    
    # For full images (selfies), run InsightFace directly
    if is_full_image:
        faces = arcface_app.get(face_img_bgr)
        if not faces or len(faces) == 0:
            raise ValueError("No face detected in the selfie image")
        # Return the largest face (most prominent)
        largest_face = max(faces, key=lambda f: (f.bbox[2] - f.bbox[0]) * (f.bbox[3] - f.bbox[1]))
        return largest_face.embedding
    
    # For cropped faces from group photos, we need more sophisticated handling
    # Strategy: Create a properly sized canvas with the face centered
    
    # Ensure minimum size with quality upscaling
    min_size = 112  # InsightFace works best with faces >= 112x112
    if h < min_size or w < min_size:
        scale = max(min_size / h, min_size / w) * 1.2
        new_h, new_w = int(h * scale), int(w * scale)
        face_img_bgr = cv2.resize(face_img_bgr, (new_w, new_h), interpolation=cv2.INTER_CUBIC)
        h, w = new_h, new_w
    
    # Apply histogram equalization for better feature extraction
    # Convert to LAB color space for better lighting normalization
    lab = cv2.cvtColor(face_img_bgr, cv2.COLOR_BGR2LAB)
    l, a, b = cv2.split(lab)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    l = clahe.apply(l)
    enhanced_bgr = cv2.cvtColor(cv2.merge([l, a, b]), cv2.COLOR_LAB2BGR)
    
    # Create a larger canvas with generous padding
    # This helps InsightFace's detector work better on cropped faces
    canvas_size = max(h, w) * 3  # 3x the face size
    canvas = np.zeros((canvas_size, canvas_size, 3), dtype=np.uint8)
    
    # Fill with average color to reduce edge artifacts
    avg_color = enhanced_bgr.mean(axis=(0, 1)).astype(np.uint8)
    canvas[:] = avg_color
    
    # Center the face on the canvas
    y_offset = (canvas_size - h) // 2
    x_offset = (canvas_size - w) // 2
    canvas[y_offset:y_offset+h, x_offset:x_offset+w] = enhanced_bgr
    
    # Apply slight Gaussian blur to edges for smoother transition
    mask = np.zeros((canvas_size, canvas_size), dtype=np.uint8)
    mask[y_offset:y_offset+h, x_offset:x_offset+w] = 255
    mask = cv2.GaussianBlur(mask, (21, 21), 11)
    mask = mask[:, :, np.newaxis] / 255.0
    
    # Try to extract embedding from the canvas
    faces = arcface_app.get(canvas)
    
    if faces and len(faces) > 0:
        # Return the most centered face
        center_x, center_y = canvas_size // 2, canvas_size // 2
        best_face = min(faces, key=lambda f: 
            abs((f.bbox[0] + f.bbox[2]) / 2 - center_x) + 
            abs((f.bbox[1] + f.bbox[3]) / 2 - center_y)
        )
        return best_face.embedding
    
    # Fallback: Try with different padding strategies
    for pad_ratio in [0.8, 1.0, 1.5]:
        pad_h = int(h * pad_ratio)
        pad_w = int(w * pad_ratio)
        
        padded = cv2.copyMakeBorder(
            enhanced_bgr,
            pad_h, pad_h, pad_w, pad_w,
            cv2.BORDER_REPLICATE
        )
        
        faces = arcface_app.get(padded)
        if faces and len(faces) > 0:
            return faces[0].embedding
    
    # Last resort: Return error with diagnostic info
    raise ValueError(
        f"Could not extract embedding from cropped face. "
        f"Face size: {h}x{w}. Try using higher quality images."
    )




def cosine_similarity(embedding1: np.ndarray, embedding2: np.ndarray) -> float:
    """
    Calculate cosine similarity between two embeddings with L2 normalization
    
    Args:
        embedding1: first embedding vector
        embedding2: second embedding vector
        
    Returns:
        cosine similarity score (0 to 1)
    """
    # L2 normalize embeddings (standard practice for ArcFace)
    embedding1 = embedding1 / (np.linalg.norm(embedding1) + 1e-8)
    embedding2 = embedding2 / (np.linalg.norm(embedding2) + 1e-8)
    
    # Calculate cosine similarity (dot product of normalized vectors)
    similarity = np.dot(embedding1, embedding2)
    
    # Clip to valid range and convert to float
    similarity = np.clip(similarity, -1.0, 1.0)
    
    # Convert from [-1, 1] to [0, 1] range
    return float((similarity + 1.0) / 2.0)


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
                # Mark as full image since these are selfies/portraits during registration
                embedding = extract_arcface_embedding(image, is_full_image=True)
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
    detected_faces = detect_faces_yolo(image_rgb)
    
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
            embedding = extract_arcface_embedding(face_info['region'])
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
    Uses YOLO for detection and InsightFace on full image for embeddings, then matches them
    """
    try:
        contents = await file.read()

        print("Uploaded file size:", len(contents)) 
        
        if not contents or len(contents) == 0:
            raise HTTPException(status_code=400, detail="Empty file uploaded")
        
        nparr = np.frombuffer(contents, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if image is None:
            raise HTTPException(status_code=400, detail="Invalid image file. Could not decode image.")
        
        image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        image_bgr = image  # Keep BGR for InsightFace
        
        # Detect faces with YOLO
        try:
            detected_faces = detect_faces_yolo(image_rgb)
        except Exception as e:
            raise HTTPException(
                status_code=400,
                detail=f"Face detection failed: {str(e)}"
            )
        
        if len(detected_faces) == 0:
            return {
                "faces": [],
                "total_faces": 0,
                "embedded_faces": 0
            }
        
        # Get all face embeddings from InsightFace on the full image
        insightface_faces = arcface_app.get(image_bgr)
        
        # Match YOLO detections with InsightFace detections using IoU
        face_data = []
        matched_insightface_indices = set()
        
        for yolo_face in detected_faces:
            yolo_bbox = yolo_face['bbox']  # [x, y, w, h]
            best_match_idx = None
            best_iou = 0.0
            
            # Find the InsightFace detection that best matches this YOLO detection
            for idx, if_face in enumerate(insightface_faces):
                if idx in matched_insightface_indices:
                    continue
                
                # Convert InsightFace bbox to [x, y, w, h] format
                if_bbox = if_face.bbox  # InsightFace bbox is [x1, y1, x2, y2]
                if_bbox_formatted = [
                    int(if_bbox[0]),
                    int(if_bbox[1]),
                    int(if_bbox[2] - if_bbox[0]),
                    int(if_bbox[3] - if_bbox[1])
                ]
                
                iou = calculate_iou(yolo_bbox, if_bbox_formatted)
                if iou > best_iou and iou > 0.3:  # Minimum IoU threshold
                    best_iou = iou
                    best_match_idx = idx
            
            # If we found a match, use InsightFace embedding
            if best_match_idx is not None:
                matched_insightface_indices.add(best_match_idx)
                embedding = insightface_faces[best_match_idx].embedding
                face_data.append({
                    'embedding': embedding.tolist(),
                    'bbox': yolo_bbox
                })
            else:
                # Fallback: try to extract embedding from cropped face
                try:
                    embedding = extract_arcface_embedding(yolo_face['region'])
                    face_data.append({
                        'embedding': embedding.tolist(),
                        'bbox': yolo_bbox
                    })
                except Exception as e:
                    # Skip this face if embedding extraction fails
                    print(f"Warning: Failed to extract embedding for face at {yolo_bbox}: {str(e)}")
                    continue

        print(
            f"Detected faces: {len(detected_faces)}, "
            f"InsightFace faces: {len(insightface_faces)}, "
            f"Embeddings created: {len(face_data)}"
        )
        
        return {
            "faces": face_data,
            "total_faces": len(detected_faces),   # YOLO detections
            "embedded_faces": len(face_data)       # Successfully embedded faces
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

