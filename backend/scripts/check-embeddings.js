/**
 * Script to check embedding data in database
 */
require('dotenv').config();
const pool = require('../config/database');

async function checkEmbeddings() {
  try {
    console.log('Checking embeddings in database...\n');
    
    // Get all embeddings with their raw data
    const query = `
      SELECT 
        id,
        student_id,
        pg_typeof(embedding) as embedding_type,
        embedding::text as embedding_text,
        length(embedding::text) as embedding_length,
        created_at
      FROM face_embeddings
      ORDER BY created_at DESC
      LIMIT 5
    `;
    
    const result = await pool.query(query);
    
    console.log(`Found ${result.rows.length} embeddings:\n`);
    
    result.rows.forEach((row, index) => {
      console.log(`--- Embedding ${index + 1} ---`);
      console.log(`ID: ${row.id}`);
      console.log(`Student ID: ${row.student_id}`);
      console.log(`Type: ${row.embedding_type}`);
      console.log(`Length: ${row.embedding_length} characters`);
      console.log(`First 100 chars: ${row.embedding_text.substring(0, 100)}`);
      console.log(`Last 50 chars: ${row.embedding_text.substring(Math.max(0, row.embedding_length - 50))}`);
      
      // Try to parse it
      try {
        const parsed = JSON.parse(row.embedding_text);
        console.log(`✓ Parses successfully as ${Array.isArray(parsed) ? 'array' : 'object'}, length: ${parsed.length || 'N/A'}`);
      } catch (error) {
        console.log(`✗ Parse error: ${error.message}`);
        console.log(`  Error at position: ${error.message.match(/position (\d+)/)?.[1] || 'unknown'}`);
      }
      console.log('');
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkEmbeddings();

