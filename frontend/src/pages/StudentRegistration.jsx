import React, { useState } from 'react'
import axios from 'axios'
import { motion, AnimatePresence } from 'framer-motion'

const StudentRegistration = () => {
  const [formData, setFormData] = useState({
    name: '',
    roll_number: '',
    class_id: ''
  })
  const [photos, setPhotos] = useState([])
  const [previews, setPreviews] = useState([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handlePhotoChange = (e) => {
    const files = Array.from(e.target.files)
    
    if (files.length < 3 || files.length > 5) {
      setMessage({
        type: 'error',
        text: 'Please select 3-5 photos'
      })
      return
    }

    setPhotos(files)
    
    // Create previews
    const newPreviews = files.map((file) => URL.createObjectURL(file))
    setPreviews(newPreviews)
    setMessage({ type: '', text: '' })
  }

  const removePhoto = (index) => {
    const newPhotos = photos.filter((_, i) => index !== i)
    const newPreviews = previews.filter((_, i) => index !== i)
    setPhotos(newPhotos)
    setPreviews(newPreviews)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (photos.length < 3 || photos.length > 5) {
      setMessage({
        type: 'error',
        text: 'Please upload 3-5 face photos'
      })
      return
    }

    setLoading(true)
    setMessage({ type: '', text: '' })

    try {
      const formDataToSend = new FormData()
      formDataToSend.append('name', formData.name)
      formDataToSend.append('roll_number', formData.roll_number)
      formDataToSend.append('class_id', formData.class_id)
      photos.forEach((photo) => {
        formDataToSend.append('photos', photo)
      })

      const response = await axios.post('/api/students/register', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      setMessage({
        type: 'success',
        text: 'Student registered successfully!'
      })

      // Reset form
      setFormData({ name: '', roll_number: '', class_id: '' })
      setPhotos([])
      setPreviews([])
      document.getElementById('photo-input').value = ''
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.error || 'Registration failed'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl mx-auto bg-white rounded-xl shadow-lg p-8"
      >
        <h2 className="text-3xl font-bold text-gray-900 mb-6">
          Student Face Registration
        </h2>
        <p className="text-gray-600 mb-6">
          Register a student by uploading 3-5 clear face photos. Make sure faces
          are clearly visible and well-lit.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Student Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Enter student name"
              />
            </div>

            <div>
              <label
                htmlFor="roll_number"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Roll Number
              </label>
              <input
                type="text"
                id="roll_number"
                name="roll_number"
                required
                value={formData.roll_number}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Enter roll number"
              />
            </div>

            <div className="md:col-span-2">
              <label
                htmlFor="class_id"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Class ID
              </label>
              <input
                type="number"
                id="class_id"
                name="class_id"
                required
                value={formData.class_id}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Enter class ID"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="photo-input"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Face Photos (3-5 photos required)
            </label>
            <input
              id="photo-input"
              type="file"
              accept="image/*"
              multiple
              onChange={handlePhotoChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <p className="mt-2 text-sm text-gray-500">
              Selected: {photos.length} photos
            </p>
          </div>

          <AnimatePresence>
            {previews.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-2 md:grid-cols-3 gap-4"
              >
                {previews.map((preview, index) => (
                  <motion.div
                    key={index}
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    className="relative group"
                  >
                    <img
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-48 object-cover rounded-lg border-2 border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={() => removePhoto(index)}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ×
                    </button>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {message.text && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={`p-4 rounded-md ${
                  message.type === 'success'
                    ? 'bg-green-50 text-green-800 border border-green-200'
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}
              >
                {message.text}
              </motion.div>
            )}
          </AnimatePresence>

          <button
            type="submit"
            disabled={loading || photos.length < 3}
            className="w-full bg-indigo-600 text-white py-3 px-6 rounded-md font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Registering...' : 'Register Student'}
          </button>
        </form>
      </motion.div>
    </div>
  )
}

export default StudentRegistration

