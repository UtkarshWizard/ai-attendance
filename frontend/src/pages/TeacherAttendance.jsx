import React, { useState } from 'react'
import axios from 'axios'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Button } from '../components/ui/button'
import { Camera, Upload, CheckCircle2, Users, UserCheck, UserX, Eye, AlertCircle } from 'lucide-react'

const TeacherAttendance = () => {
  const [classId, setClassId] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [photo, setPhoto] = useState(null)
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  const handlePhotoChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setPhoto(file)
      setPreview(URL.createObjectURL(file))
      setResult(null)
      setError('')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!classId || !date || !photo) {
      setError('Please fill all fields and upload a photo')
      return
    }

    setLoading(true)
    setError('')
    setResult(null)

    try {
      const formData = new FormData()
      formData.append('class_id', classId)
      formData.append('date', date)
      formData.append('photo', photo)

      const response = await axios.post('/api/attendance/mark', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        timeout: 180000 // 3 minutes timeout
      })

      setResult(response.data)
    } catch (err) {
      console.error('Attendance marking error:', err)
      let errorMessage = 'Failed to mark attendance'
      
      if (err.response?.data?.error) {
        errorMessage = err.response.data.error
      } else if (err.message) {
        errorMessage = err.message
      } else if (err.code === 'ECONNABORTED') {
        errorMessage = 'Request timed out. The image may be too large or the AI service is taking too long.'
      } else if (err.code === 'ERR_NETWORK') {
        errorMessage = 'Network error. Please check if the backend server is running.'
      }
      
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent mb-2">
          Mark Attendance
        </h1>
        <p className="text-muted-foreground">
          Upload a group photo of the classroom to automatically mark attendance using AI
        </p>
      </div>

      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-primary" />
            Upload Group Photo
          </CardTitle>
          <CardDescription>
            Select a class, date, and upload a photo with all students visible
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="class_id">Class ID</Label>
                <Input
                  type="number"
                  id="class_id"
                  required
                  value={classId}
                  onChange={(e) => setClassId(e.target.value)}
                  placeholder="Enter class ID"
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  type="date"
                  id="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="h-11"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="photo" className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Group Photo
              </Label>
              <Input
                id="photo"
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="h-11 cursor-pointer"
              />
            </div>

            {preview && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-lg border-2 border-border overflow-hidden bg-muted"
              >
                <img
                  src={preview}
                  alt="Preview"
                  className="w-full h-auto max-h-96 object-contain"
                />
              </motion.div>
            )}

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md text-sm flex items-center gap-2"
              >
                <AlertCircle className="h-4 w-4" />
                {error}
              </motion.div>
            )}

            <Button
              type="submit"
              disabled={loading || !photo}
              className="w-full h-11 text-base font-semibold"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  Processing...
                </span>
              ) : (
                <>
                  <Camera className="mr-2 h-4 w-4" />
                  Mark Attendance
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <Card className="border-2 border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                  Attendance Marked Successfully!
                </CardTitle>
                <CardDescription>
                  AI has processed the image and marked attendance for all detected students
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="bg-background rounded-lg p-4 border border-border"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="h-4 w-4 text-blue-500" />
                      <p className="text-sm font-medium text-muted-foreground">Total Students</p>
                    </div>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {result.summary.total_students}
                    </p>
                  </motion.div>

                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="bg-background rounded-lg p-4 border border-border"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <UserCheck className="h-4 w-4 text-green-500" />
                      <p className="text-sm font-medium text-muted-foreground">Present</p>
                    </div>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {result.summary.present}
                    </p>
                  </motion.div>

                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="bg-background rounded-lg p-4 border border-border"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <UserX className="h-4 w-4 text-red-500" />
                      <p className="text-sm font-medium text-muted-foreground">Absent</p>
                    </div>
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                      {result.summary.absent}
                    </p>
                  </motion.div>

                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="bg-background rounded-lg p-4 border border-border"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Eye className="h-4 w-4 text-purple-500" />
                      <p className="text-sm font-medium text-muted-foreground">Faces Detected</p>
                    </div>
                    <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {result.summary.faces_detected}
                    </p>
                  </motion.div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default TeacherAttendance
