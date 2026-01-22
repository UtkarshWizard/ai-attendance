import React, { useState } from 'react'
import axios from 'axios'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Button } from '../components/ui/button'
import { UserPlus, Upload, X, CheckCircle2, AlertCircle, Fingerprint, IdCard, GraduationCap } from 'lucide-react'

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
        text: 'GenZ Tip: We need 3-5 photos for perfection 📸'
      })
      return
    }

    setPhotos(files)
    
    const newPreviews = files.map((file) => URL.createObjectURL(file))
    setPreviews(newPreviews)
    setMessage({ type: '', text: '' })
  }

  const removePhoto = (index) => {
    const newPhotos = photos.filter((_, i) => index !== i)
    const newPreviews = previews.filter((_, i) => index !== i)
    URL.revokeObjectURL(previews[index])
    setPhotos(newPhotos)
    setPreviews(newPreviews)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (photos.length < 3 || photos.length > 5) {
      setMessage({
        type: 'error',
        text: 'Please upload 3-5 high-quality face photos'
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

      await axios.post('/api/students/register', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      setMessage({
        type: 'success',
        text: 'Student enrolled successfully! '
      })

      setFormData({ name: '', roll_number: '', class_id: '' })
      setPhotos([])
      previews.forEach(url => URL.revokeObjectURL(url))
      setPreviews([])
      document.getElementById('photo-input').value = ''
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.error || 'Enrollment failed. Try again.'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-20">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-3"
      >
        <h1 className="text-5xl font-black tracking-tighter gradient-text">
          Enroll Student<span className="text-foreground/20">.</span>
        </h1>
        <p className="text-muted-foreground font-medium max-w-lg mx-auto">
          Add new students to the database.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-3 space-y-6"
        >
          <Card className="glass-card border-none">
            <CardContent className="p-8">
              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Student Full Name</Label>
                    <div className="relative group">
                      <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="e.g. Alex Rivers"
                        className="pl-12 h-14 rounded-2xl border-white/5 bg-white/5 focus:bg-white/10 transition-all text-base"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="roll_number" className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Roll Number</Label>
                      <div className="relative group">
                        <IdCard className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <Input
                          id="roll_number"
                          name="roll_number"
                          value={formData.roll_number}
                          onChange={handleInputChange}
                          placeholder="CS-2024-001"
                          className="pl-12 h-14 rounded-2xl border-white/5 bg-white/5 focus:bg-white/10 transition-all text-base"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="class_id" className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Class ID</Label>
                      <div className="relative group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 flex items-center justify-center font-black text-muted-foreground group-focus-within:text-primary transition-colors">#</div>
                        <Input
                          id="class_id"
                          name="class_id"
                          type="number"
                          value={formData.class_id}
                          onChange={handleInputChange}
                          placeholder="101"
                          className="pl-12 h-14 rounded-2xl border-white/5 bg-white/5 focus:bg-white/10 transition-all text-base"
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1 flex items-center justify-between">
                    Face Biometrics
                    <span className="text-[10px] text-primary bg-primary/10 px-2 py-0.5 rounded-full">3-5 Photos</span>
                  </Label>
                  
                  <div className="relative">
                    <input
                      id="photo-input"
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handlePhotoChange}
                      className="hidden"
                    />
                    <label
                      htmlFor="photo-input"
                      className="flex flex-col items-center justify-center w-full h-40 rounded-[2rem] border-2 border-dashed border-white/10 bg-white/[0.02] hover:bg-white/[0.05] hover:border-primary/50 transition-all cursor-pointer group"
                    >
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <div className="p-3 rounded-2xl bg-primary/10 mb-3 group-hover:scale-110 transition-transform">
                          <Upload className="w-6 h-6 text-primary" />
                        </div>
                        <p className="text-sm font-bold tracking-tight">Drop photos or click to upload</p>
                        <p className="text-xs text-muted-foreground mt-1">High-quality selfies work best</p>
                      </div>
                    </label>
                  </div>
                </div>

                <AnimatePresence>
                  {message.text && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0 }}
                      className={`flex items-center gap-3 p-4 rounded-2xl ${
                        message.type === 'success'
                          ? 'bg-green-500/10 border border-green-500/20 text-green-500'
                          : 'bg-destructive/10 border border-destructive/20 text-destructive'
                      }`}
                    >
                      {message.type === 'success' ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
                      <span className="text-sm font-bold">{message.text}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                <Button
                  type="submit"
                  disabled={loading || photos.length < 3}
                  className="w-full h-14 rounded-2xl text-lg font-bold shadow-xl shadow-primary/20 transition-all duration-300 group"
                >
                  {loading ? (
                    <div className="flex items-center gap-3">
                      <div className="h-5 w-5 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Enrolling...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <UserPlus className="h-5 w-5 group-hover:rotate-12 transition-transform" />
                      <span>Start Enrollment</span>
                    </div>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-2 space-y-6"
        >
          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Photo Preview</h3>
            <div className="grid grid-cols-2 gap-4">
              <AnimatePresence mode="popLayout">
                {previews.map((preview, index) => (
                  <motion.div
                    key={preview}
                    layout
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    className="relative group aspect-[3/4] rounded-3xl overflow-hidden border-2 border-white/5"
                  >
                    <img
                      src={preview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removePhoto(index)}
                      className="absolute top-3 right-3 p-2 bg-destructive/80 backdrop-blur-md text-white rounded-xl opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive"
                    >
                      <X className="h-4 w-4" />
                    </button>
                    <div className="absolute bottom-0 inset-x-0 h-12 bg-gradient-to-t from-black/60 to-transparent"></div>
                  </motion.div>
                ))}
                {Array.from({ length: Math.max(0, 4 - previews.length) }).map((_, i) => (
                  <div key={`empty-${i}`} className="aspect-[3/4] rounded-3xl bg-white/[0.02] border-2 border-dashed border-white/5 flex items-center justify-center">
                    <Upload className="h-6 w-6 text-white/5" />
                  </div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          <div className="glass-card rounded-[2rem] p-6 border-none bg-primary/5">
            <h4 className="font-bold flex items-center gap-2 mb-2 text-primary">
              <CheckCircle2 className="h-4 w-4" />
              Guidelines
            </h4>
            <ul className="text-xs text-muted-foreground space-y-2 font-medium">
              <li className="flex gap-2"><span>•</span> Use different angles and expressions</li>
              <li className="flex gap-2"><span>•</span> Avoid glasses or masks for best results</li>
              <li className="flex gap-2"><span>•</span> Background should be neutral and plain</li>
              <li className="flex gap-2"><span>•</span> Lighting must be consistent on the face</li>
            </ul>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default StudentRegistration
