/**
 * Service to communicate with AI Service (FastAPI)
 */
const axios = require('axios');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

class AIService {
  /**
   * Register face by sending images to AI service
   */
  static async registerFace(student_id, images) {
    try {
      const response = await axios.post(
        `${AI_SERVICE_URL}/register-face`,
        {
          student_id,
          images
        },
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 60000 // 60 seconds timeout for face processing
        }
      );
      return response.data;
    } catch (error) {
      const errorDetail = error.response?.data?.detail || error.response?.data?.message || error.message;
      const errorData = error.response?.data;
      console.error('AI Service registerFace error:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        detail: errorDetail,
        data: errorData
      });
      throw new Error(`AI Service error: ${errorDetail}`);
    }
  }

  /**
   * Extract face embeddings from group photo
   */
  static async extractFaceEmbeddings(imageBuffer) {
    try {
      const FormData = require('form-data');
      const form = new FormData();
      form.append('file', Buffer.from(imageBuffer), {
        filename: 'group-photo.jpg',
        contentType: 'image/jpeg'
      });

      const response = await axios.post(
        `${AI_SERVICE_URL}/extract-face-embeddings`,
        form,
        {
          headers: {
            ...form.getHeaders(),
            'Content-Length' : form.getLengthSync()
          },
          timeout: 120000, // 2 minutes timeout for face extraction
          validateStatus: function (status) {
            return status < 500; // Don't throw for 4xx errors, let us handle them
          }
        }
      );
      
      // Check if response is valid JSON
      if (response.headers['content-type'] && !response.headers['content-type'].includes('application/json')) {
        throw new Error(`Unexpected response type: ${response.headers['content-type']}. AI service may be returning HTML error page.`);
      }
      
      if (response.status >= 400) {
        const errorMsg = response.data?.detail || response.data?.message || `HTTP ${response.status}`;
        throw new Error(errorMsg);
      }
      
      return response.data;
    } catch (error) {
      // Handle JSON parsing errors
      if (error.message && error.message.includes('Unexpected token') || error.message.includes('JSON')) {
        console.error('JSON parsing error - AI service may be down or returning HTML:', {
          url: `${AI_SERVICE_URL}/extract-face-embeddings`,
          message: error.message
        });
        throw new Error('AI service returned invalid response. Please check if the AI service is running on port 8000.');
      }
      
      const errorDetail = error.response?.data?.detail || error.response?.data?.message || error.message;
      const errorData = error.response?.data;
      console.error('AI Service extractFaceEmbeddings error:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        detail: errorDetail,
        data: errorData,
        responseType: error.response?.headers?.['content-type'],
        code: error.code
      });
      
      // Handle connection errors
      if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
        throw new Error(`Cannot connect to AI service at ${AI_SERVICE_URL}. Please ensure the AI service is running.`);
      }
      
      throw new Error(`AI Service error: ${errorDetail}`);
    }
  }

  /**
   * Match face embeddings with stored embeddings
   */
  static async matchFaces(storedEmbeddings, faceEmbeddings) {
    try {
      const response = await axios.post(
        `${AI_SERVICE_URL}/match-faces`,
        {
          stored_embeddings: storedEmbeddings.map(emb => ({
            student_id: emb.student_id.toString(),
            embedding: emb.embedding
          })),
          face_embeddings: faceEmbeddings
        },
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 60000 // 60 seconds timeout
        }
      );
      return response.data;
    } catch (error) {
      const errorDetail = error.response?.data?.detail || error.response?.data?.message || error.message;
      const errorData = error.response?.data;
      console.error('AI Service matchFaces error:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        detail: errorDetail,
        data: errorData,
        responseType: error.response?.headers?.['content-type']
      });
      throw new Error(`AI Service error: ${errorDetail}`);
    }
  }
}

module.exports = AIService;

