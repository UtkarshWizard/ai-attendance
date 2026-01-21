/**
 * Database setup script
 * Runs the schema.sql file to create all tables
 * Works with both local PostgreSQL and Neon DB
 */
const fs = require('fs');
const path = require('path');
const pool = require('../config/database');

async function setupDatabase() {
  try {
    console.log('📊 Setting up database schema...');
    
    // Read schema file
    const schemaPath = path.join(__dirname, '../database/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Remove comments and split by semicolons
    const statements = schema
      .split(';')
      .map(s => {
        // Remove single-line comments
        return s.split('\n')
          .map(line => {
            const commentIndex = line.indexOf('--');
            return commentIndex >= 0 ? line.substring(0, commentIndex) : line;
          })
          .join('\n')
          .trim();
      })
      .filter(s => s.length > 0 && !s.match(/^\s*$/));
    
    // Execute each statement
    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await pool.query(statement + ';');
          const firstLine = statement.split('\n')[0].trim();
          console.log('✅ Executed:', firstLine.substring(0, 60));
        } catch (error) {
          // Ignore "already exists" errors
          if (error.message.includes('already exists') || error.message.includes('duplicate')) {
            const firstLine = statement.split('\n')[0].trim();
            console.log('⏭️  Skipped (already exists):', firstLine.substring(0, 60));
          } else {
            console.error('❌ Error:', error.message);
            const firstLine = statement.split('\n')[0].trim();
            console.error('Statement:', firstLine.substring(0, 100));
          }
        }
      }
    }
    
    console.log('\n✅ Database schema setup complete!');
    console.log('\n📋 Created tables:');
    console.log('   - users');
    console.log('   - students');
    console.log('   - face_embeddings');
    console.log('   - attendance');
    
    // Verify tables exist
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    console.log('\n📊 Tables in database:');
    tables.rows.forEach(row => {
      console.log(`   ✓ ${row.table_name}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  }
}

setupDatabase();

