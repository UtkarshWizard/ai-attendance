/**
 * Attendance model and database operations
 */
const pool = require('../config/database');

class Attendance {
  /**
   * Mark attendance for a student
   */
  static async create(attendanceData) {
    const { student_id, date, status, confidence_score, image_url } = attendanceData;
    
    // Check if attendance already exists for this student on this date
    const existing = await this.findByStudentAndDate(student_id, date);
    if (existing) {
      // Update existing attendance
      return await this.update(existing.id, { status, confidence_score, image_url });
    }
    
    const query = `
      INSERT INTO attendance (student_id, date, status, confidence_score, image_url)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const values = [student_id, date, status, confidence_score, image_url];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Get attendance by student and date
   */
  static async findByStudentAndDate(student_id, date) {
    const query = 'SELECT * FROM attendance WHERE student_id = $1 AND date = $2';
    const result = await pool.query(query, [student_id, date]);
    return result.rows[0];
  }

  /**
   * Get attendance for a class on a specific date
   */
  static async findByClassAndDate(class_id, date) {
    const query = `
      SELECT a.*, s.name, s.roll_number
      FROM attendance a
      JOIN students s ON a.student_id = s.id
      WHERE s.class_id = $1 AND a.date = $2
      ORDER BY s.roll_number
    `;
    const result = await pool.query(query, [class_id, date]);
    return result.rows;
  }

  /**
   * Update attendance
   */
  static async update(id, attendanceData) {
    const { status, confidence_score, image_url } = attendanceData;
    const query = `
      UPDATE attendance
      SET status = $1, confidence_score = $2, image_url = $3
      WHERE id = $4
      RETURNING *
    `;
    const values = [status, confidence_score, image_url, id];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Get attendance statistics for a class
   */
  static async getStats(class_id, start_date, end_date) {
    const query = `
      SELECT 
        s.id,
        s.name,
        s.roll_number,
        COUNT(a.id) as total_days,
        COUNT(CASE WHEN a.status = 'present' THEN 1 END) as present_days,
        COUNT(CASE WHEN a.status = 'absent' THEN 1 END) as absent_days
      FROM students s
      LEFT JOIN attendance a ON s.id = a.student_id 
        AND a.date BETWEEN $2 AND $3
      WHERE s.class_id = $1
      GROUP BY s.id, s.name, s.roll_number
      ORDER BY s.roll_number
    `;
    const result = await pool.query(query, [class_id, start_date, end_date]);
    return result.rows;
  }
}

module.exports = Attendance;

