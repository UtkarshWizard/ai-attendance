/**
 * Attendance routes
 */
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const Attendance = require('../models/Attendance');
const FaceEmbedding = require('../models/FaceEmbedding');
const Student = require('../models/Student');
const AIService = require('../services/aiService');
const multer = require('multer');

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB limit

/**
 * Mark attendance from group photo
 * POST /api/attendance/mark
 */
router.post('/mark', authenticate, upload.single('photo'), async (req, res) => {
  try {
    const { class_id, date } = req.body;

    if (!class_id || !date) {
      return res.status(400).json({ error: 'Class ID and date are required' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Group photo is required' });
    }

    // Get all students in the class with their embeddings
    const students = await Student.findByClass(class_id);
    const storedEmbeddings = [];

    for (const student of students) {
      const embedding = await FaceEmbedding.findByStudentId(student.id);
      if (embedding) {
        storedEmbeddings.push({
          student_id: student.id,
          embedding: embedding.embedding
        });
      }
    }

    if (storedEmbeddings.length === 0) {
      return res.status(400).json({ error: 'No face embeddings found for students in this class' });
    }

    // Validate AI service URL
    if (!process.env.AI_SERVICE_URL) {
      console.error('AI_SERVICE_URL not configured');
      return res.status(500).json({ error: 'AI service not configured' });
    }

    // Extract face embeddings from group photo using AI service
    let faceData;
    try {
      faceData = await AIService.extractFaceEmbeddings(req.file.buffer);
    } catch (error) {
      console.error('Error extracting face embeddings:', error);
      return res.status(500).json({ 
        error: `Failed to extract face embeddings: ${error.message}` 
      });
    }

    if (!faceData || faceData.total_faces === 0) {
      return res.status(400).json({ error: 'No faces detected in the photo' });
    }

    // Match faces with stored embeddings
    let matchResult;
    try {
      matchResult = await AIService.matchFaces(
        storedEmbeddings,
        faceData.faces
      );
    } catch (error) {
      console.error('Error matching faces:', error);
      return res.status(500).json({ 
        error: `Failed to match faces: ${error.message}` 
      });
    }

    // Save attendance records
    const attendanceDate = new Date(date).toISOString().split('T')[0];
    const attendanceRecords = [];
    const matchedStudentIds = new Set();

    // Mark present for matched students
    for (const face of matchResult.recognized_faces) {
      if (face.student_id && face.confidence > 0) {
        matchedStudentIds.add(face.student_id);
        const record = await Attendance.create({
          student_id: face.student_id,
          date: attendanceDate,
          status: 'present',
          confidence_score: face.confidence,
          image_url: null // In production, upload to cloud storage and store URL
        });
        attendanceRecords.push(record);
      }
    }

    // Mark absent for unmatched students
    for (const student of students) {
      if (!matchedStudentIds.has(student.id.toString())) {
        const record = await Attendance.create({
          student_id: student.id,
          date: attendanceDate,
          status: 'absent',
          confidence_score: 0,
          image_url: null
        });
        attendanceRecords.push(record);
      }
    }

    res.json({
      message: 'Attendance marked successfully',
      summary: {
        total_students: students.length,
        present: matchedStudentIds.size,
        absent: students.length - matchedStudentIds.size,
        faces_detected: matchResult.total_faces_detected,
        faces_matched: matchResult.matched_faces
      },
      attendance: attendanceRecords
    });
  } catch (error) {
    console.error('Attendance marking error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

/**
 * Get attendance for a class on a specific date
 * GET /api/attendance/class/:class_id/date/:date
 */
router.get('/class/:class_id/date/:date', authenticate, async (req, res) => {
  try {
    const { class_id, date } = req.params;
    const attendance = await Attendance.findByClassAndDate(class_id, date);
    res.json({ attendance });
  } catch (error) {
    console.error('Error fetching attendance:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Get attendance statistics for a class
 * GET /api/attendance/stats/:class_id
 */
router.get('/stats/:class_id', authenticate, async (req, res) => {
  try {
    const { class_id } = req.params;
    const { start_date, end_date } = req.query;

    if (!start_date || !end_date) {
      return res.status(400).json({ error: 'Start date and end date are required' });
    }

    const stats = await Attendance.getStats(class_id, start_date, end_date);
    res.json({ stats });
  } catch (error) {
    console.error('Error fetching attendance stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Manual attendance override
 * PUT /api/attendance/override
 */
router.put('/override', authenticate, async (req, res) => {
  try {
    const { student_id, date, status } = req.body;

    if (!student_id || !date || !status) {
      return res.status(400).json({ error: 'Student ID, date, and status are required' });
    }

    if (!['present', 'absent'].includes(status)) {
      return res.status(400).json({ error: 'Status must be "present" or "absent"' });
    }

    const attendanceDate = new Date(date).toISOString().split('T')[0];
    const record = await Attendance.create({
      student_id,
      date: attendanceDate,
      status,
      confidence_score: 1.0, // Manual override has full confidence
      image_url: null
    });

    res.json({
      message: 'Attendance updated successfully',
      attendance: record
    });
  } catch (error) {
    console.error('Attendance override error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

