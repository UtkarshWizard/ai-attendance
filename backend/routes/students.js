/**
 * Student routes
 */
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const Student = require('../models/Student');
const FaceEmbedding = require('../models/FaceEmbedding');
const AIService = require('../services/aiService');
const multer = require('multer');

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB limit

/**
 * Register a new student with face photos
 * POST /api/students/register
 */
router.post('/register', authenticate, upload.array('photos', 5), async (req, res) => {
  try {
    const { name, roll_number, class_id } = req.body;

    if (!name || !roll_number || !class_id) {
      return res.status(400).json({ error: 'Name, roll number, and class ID are required' });
    }

    if (!req.files || req.files.length < 3 || req.files.length > 5) {
      return res.status(400).json({ error: 'Please provide 3-5 face photos' });
    }

    // Check if student already exists
    const existing = await Student.findByRollNumber(roll_number, class_id);
    if (existing) {
      return res.status(400).json({ error: 'Student with this roll number already exists in this class' });
    }

    // Create student
    const student = await Student.create({ name, roll_number, class_id });

    // Convert images to base64
    const images = req.files.map(file => {
      const base64 = file.buffer.toString('base64');
      return `data:${file.mimetype};base64,${base64}`;
    });

    // Register face with AI service
    const faceData = await AIService.registerFace(student.id.toString(), images);

    // Store embedding in database
    await FaceEmbedding.create(student.id, faceData.embedding);

    res.status(201).json({
      message: 'Student registered successfully',
      student: {
        id: student.id,
        name: student.name,
        roll_number: student.roll_number,
        class_id: student.class_id
      }
    });
  } catch (error) {
    console.error('Student registration error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

/**
 * Get all students in a class
 * GET /api/students/class/:class_id
 */
router.get('/class/:class_id', authenticate, async (req, res) => {
  try {
    const { class_id } = req.params;
    const students = await Student.findByClass(class_id);
    res.json({ students });
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Get student by ID
 * GET /api/students/:id
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    res.json({ student });
  } catch (error) {
    console.error('Error fetching student:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Update student
 * PUT /api/students/:id
 */
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { name, roll_number } = req.body;
    const student = await Student.update(req.params.id, { name, roll_number });
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    res.json({ message: 'Student updated successfully', student });
  } catch (error) {
    console.error('Error updating student:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Delete student
 * DELETE /api/students/:id
 */
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const student = await Student.delete(req.params.id);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    res.json({ message: 'Student deleted successfully' });
  } catch (error) {
    console.error('Error deleting student:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

