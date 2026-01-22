import React, { useState } from 'react'
import axios from 'axios'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Button } from '../components/ui/button'
import { UserPlus, Upload, X, CheckCircle2, AlertCircle } from 'lucide-react'

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
    // Revoke object URLs to prevent memory leaks
    URL.revokeObjectURL(previews[index])
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
      previews.forEach(url => URL.revokeObjectURL(url))
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
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent mb-2">
          Student Registration
        </h1>
        <p className="text-muted-foreground">
          Register a new student by uploading 3-5 clear face photos
        </p>
      </div>

      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            Register New Student
          </CardTitle>
          <CardDescription>
            Make sure faces are clearly visible and well-lit in all photos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Student Name</Label>
                <Input
                  type="text"
                  id="name"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter student name"
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="roll_number">Roll Number</Label>
                <Input
                  type="text"
                  id="roll_number"
                  name="roll_number"
                  required
                  value={formData.roll_number}
                  onChange={handleInputChange}
                  placeholder="Enter roll number"
                  className="h-11"
                />
              </div>

              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="class_id">Class ID</Label>
                <Input
                  type="number"
                  id="class_id"
                  name="class_id"
                  required
                  value={formData.class_id}
                  onChange={handleInputChange}
                  placeholder="Enter class ID"
                  className="h-11"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="photo-input" className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Face Photos (3-5 photos required)
              </Label>
              <Input
                id="photo-input"
                type="file"
                accept="image/*"
                multiple
                onChange={handlePhotoChange}
                className="h-11 cursor-pointer"
              />
              <p className="text-sm text-muted-foreground">
                Selected: {photos.length} photos
              </p>
            </div>

            <AnimatePresence>
              {previews.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="grid grid-cols-2 md:grid-cols-3 gap-4"
                >
                  {previews.map((preview, index) => (
                    <motion.div
                      key={index}
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="relative group"
                    >
                      <div className="aspect-square rounded-lg border-2 border-border overflow-hidden bg-muted">
                        <img
                          src={preview}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removePhoto(index)}
                        className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full w-8 h-8 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                      >
                        <X className="h-4 w-4" />
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
                  className={`flex items-center gap-2 p-4 rounded-md ${
                    message.type === 'success'
                      ? 'bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400'
                      : 'bg-destructive/10 border border-destructive/20 text-destructive'
                  }`}
                >
                  {message.type === 'success' ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    <AlertCircle className="h-5 w-5" />
                  )}
                  <span className="text-sm font-medium">{message.text}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <Button
              type="submit"
              disabled={loading || photos.length < 3}
              className="w-full h-11 text-base font-semibold"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  Registering...
                </span>
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Register Student
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default StudentRegistration
