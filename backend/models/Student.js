/**
 * Student model and database operations
 */
const pool = require('../config/database');

class Student {
  /**
   * Create a new student
   */
  static async create(studentData) {
    const { name, roll_number, class_id } = studentData;
    const query = `
      INSERT INTO students (name, roll_number, class_id)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    const values = [name, roll_number, class_id];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Get student by ID
   */
  static async findById(id) {
    const query = 'SELECT * FROM students WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  /**
   * Get student by roll number
   */
  static async findByRollNumber(roll_number, class_id) {
    const query = 'SELECT * FROM students WHERE roll_number = $1 AND class_id = $2';
    const result = await pool.query(query, [roll_number, class_id]);
    return result.rows[0];
  }

  /**
   * Get all students in a class
   */
  static async findByClass(class_id) {
    const query = 'SELECT * FROM students WHERE class_id = $1 ORDER BY roll_number';
    const result = await pool.query(query, [class_id]);
    return result.rows;
  }

  /**
   * Update student
   */
  static async update(id, studentData) {
    const { name, roll_number } = studentData;
    const query = `
      UPDATE students
      SET name = $1, roll_number = $2
      WHERE id = $3
      RETURNING *
    `;
    const values = [name, roll_number, id];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Delete student
   */
  static async delete(id) {
    const query = 'DELETE FROM students WHERE id = $1 RETURNING *';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }
}

module.exports = Student;

