/**
 * Face Embedding model and database operations
 */
const pool = require('../config/database');

/**
 * Safely parse embedding - handles both JSONB (already parsed) and JSON string
 * PostgreSQL JSONB is automatically parsed by pg library, but sometimes it returns as string
 */
function parseEmbedding(embedding) {
  // Handle null/undefined
  if (embedding === null || embedding === undefined) {
    return null;
  }
  
  // If already an array (most common case with pg library and JSONB)
  if (Array.isArray(embedding)) {
    return embedding;
  }
  
  // If already an object (shouldn't happen for embeddings, but handle it)
  if (typeof embedding === 'object' && embedding !== null && !Array.isArray(embedding)) {
    return embedding;
  }
  
  // If it's a string, we need to parse it
  if (typeof embedding === 'string') {
    // Trim whitespace
    const trimmed = embedding.trim();
    
    // Check if it's a valid JSON string (starts with [ or {)
    if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
      try {
        return JSON.parse(trimmed);
      } catch (error) {
        // If parsing fails, try to extract just the JSON portion
        // Find where the JSON ends (might have extra characters)
        let jsonEnd = trimmed.length;
        
        // For arrays, find the matching closing bracket
        if (trimmed.startsWith('[')) {
          let depth = 0;
          let inString = false;
          let escapeNext = false;
          
          for (let i = 0; i < trimmed.length; i++) {
            const char = trimmed[i];
            
            if (escapeNext) {
              escapeNext = false;
              continue;
            }
            
            if (char === '\\') {
              escapeNext = true;
              continue;
            }
            
            if (char === '"' && !escapeNext) {
              inString = !inString;
              continue;
            }
            
            if (!inString) {
              if (char === '[') depth++;
              if (char === ']') {
                depth--;
                if (depth === 0) {
                  jsonEnd = i + 1;
                  break;
                }
              }
            }
          }
        }
        
        // Try parsing just the JSON portion
        const jsonPortion = trimmed.substring(0, jsonEnd);
        try {
          return JSON.parse(jsonPortion);
        } catch (e) {
          console.error('Failed to parse embedding JSON:', e.message);
          console.error('Input (first 100 chars):', trimmed.substring(0, 100));
          throw new Error(`Invalid embedding JSON: ${e.message}`);
        }
      }
    }
    
    // Doesn't look like JSON
    throw new Error(`Embedding is a string but doesn't start with [ or {: ${trimmed.substring(0, 50)}`);
  }
  
  // Unexpected type
  console.warn('Unexpected embedding type:', typeof embedding);
  return embedding;
}

class FaceEmbedding {
  /**
   * Store face embedding for a student
   */
  static async create(student_id, embedding) {
    const query = `
      INSERT INTO face_embeddings (student_id, embedding)
      VALUES ($1, $2::jsonb)
      RETURNING *
    `;
    // Ensure embedding is properly stringified for JSONB
    const embeddingJson = typeof embedding === 'string' ? embedding : JSON.stringify(embedding);
    const values = [student_id, embeddingJson];
    const result = await pool.query(query, values);
    
    // Parse the returned embedding if needed
    if (result.rows[0]) {
      result.rows[0].embedding = parseEmbedding(result.rows[0].embedding);
    }
    
    return result.rows[0];
  }

  /**
   * Get embedding for a student
   */
  static async findByStudentId(student_id) {
    const query = 'SELECT * FROM face_embeddings WHERE student_id = $1 ORDER BY created_at DESC LIMIT 1';
    const result = await pool.query(query, [student_id]);
    
    if (result.rows[0] && result.rows[0].embedding !== null) {
      try {
        result.rows[0].embedding = parseEmbedding(result.rows[0].embedding);
      } catch (error) {
        console.error(`Error parsing embedding for student ${student_id}:`, error.message);
        const rawEmbedding = result.rows[0].embedding;
        console.error('Raw embedding type:', typeof rawEmbedding);
        if (typeof rawEmbedding === 'string') {
          console.error('Raw embedding length:', rawEmbedding.length);
          console.error('Raw embedding (first 100 chars):', rawEmbedding.substring(0, 100));
        }
        // Return null embedding rather than crashing - this will cause the student to be skipped
        result.rows[0].embedding = null;
      }
    }
    return result.rows[0];
  }

  /**
   * Get all embeddings for a class
   */
  static async findByClass(class_id) {
    const query = `
      SELECT fe.*, s.name, s.roll_number
      FROM face_embeddings fe
      JOIN students s ON fe.student_id = s.id
      WHERE s.class_id = $1
      ORDER BY fe.created_at DESC
    `;
    const result = await pool.query(query, [class_id]);
    
    // Parse JSON embeddings
    return result.rows.map(row => ({
      ...row,
      embedding: parseEmbedding(row.embedding)
    }));
  }

  /**
   * Update embedding for a student
   */
  static async update(student_id, embedding) {
    const query = `
      UPDATE face_embeddings
      SET embedding = $1::jsonb, created_at = NOW()
      WHERE student_id = $2
      RETURNING *
    `;
    const embeddingJson = typeof embedding === 'string' ? embedding : JSON.stringify(embedding);
    const values = [embeddingJson, student_id];
    const result = await pool.query(query, values);
    if (result.rows[0]) {
      result.rows[0].embedding = parseEmbedding(result.rows[0].embedding);
    }
    return result.rows[0];
  }

  /**
   * Delete embedding for a student
   */
  static async delete(student_id) {
    const query = 'DELETE FROM face_embeddings WHERE student_id = $1 RETURNING *';
    const result = await pool.query(query, [student_id]);
    return result.rows[0];
  }
}

module.exports = FaceEmbedding;

