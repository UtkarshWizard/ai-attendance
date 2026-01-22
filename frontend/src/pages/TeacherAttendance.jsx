import React, { useState } from 'react'
import axios from 'axios'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Button } from '../components/ui/button'
import { Camera, Upload, CheckCircle2, Users, UserCheck, UserX, Eye, AlertCircle, Scan, Sparkles, Hash, Calendar } from 'lucide-react'

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
      setError('Missing intel. Need class, date, and a photo.')
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
        timeout: 180000 
      })

      setResult(response.data)
    } catch (err) {
      let errorMessage = 'AI Processing glitch. Try again.'
      if (err.response?.data?.error) errorMessage = err.response.data.error
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-20">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-6"
      >
        <div className="space-y-2">
          <h1 className="text-5xl font-black tracking-tighter gradient-text">
            Mark Session<span className="text-foreground/20">.</span>
          </h1>
          <p className="text-muted-foreground font-medium max-w-md">
            Upload a classroom photo. Our neural network will identify students instantly.
          </p>
        </div>

        <div className="flex gap-4">
          <div className="glass px-6 py-4 rounded-[2rem] border-white/5 flex items-center gap-4">
            <div className={`h-3 w-3 rounded-full ${loading ? 'bg-amber-500 animate-pulse' : 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]'}`}></div>
            <div>
              <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Core Status</p>
              <p className="text-sm font-bold">{loading ? 'Processing...' : 'Ready to Scan'}</p>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Input Panel */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-5 space-y-6"
        >
          <Card className="glass-card border-none">
            <CardContent className="p-8">
              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="class_id" className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Class ID</Label>
                    <div className="relative group">
                      <Hash className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <Input
                        id="class_id"
                        type="number"
                        value={classId}
                        onChange={(e) => setClassId(e.target.value)}
                        placeholder="101"
                        className="pl-11 h-14 rounded-2xl border-white/5 bg-white/5 focus:bg-white/10 transition-all text-base"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="date" className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Session Date</Label>
                    <div className="relative group">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <Input
                        id="date"
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="pl-11 h-14 rounded-2xl border-white/5 bg-white/5 focus:bg-white/10 transition-all text-base [color-scheme:dark]"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Group Evidence</Label>
                  <div className="relative">
                    <input
                      id="photo"
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="hidden"
                    />
                    <label
                      htmlFor="photo"
                      className={`flex flex-col items-center justify-center w-full min-h-[240px] rounded-[2.5rem] border-2 border-dashed transition-all cursor-pointer group relative overflow-hidden ${
                        preview ? 'border-primary/50 bg-primary/5' : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.05]'
                      }`}
                    >
                      {preview ? (
                        <div className="relative w-full h-full">
                          <img src={preview} alt="Upload preview" className="w-full h-full object-cover max-h-[300px]" />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <p className="text-white font-bold bg-primary px-4 py-2 rounded-xl">Change Photo</p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center p-6 text-center">
                          <div className="p-4 rounded-3xl bg-primary/10 mb-4 group-hover:rotate-12 transition-transform">
                            <Camera className="w-8 h-8 text-primary" />
                          </div>
                          <p className="text-sm font-bold">Standard Group Photo</p>
                          <p className="text-xs text-muted-foreground mt-2 max-w-[200px]">Ensure all faces are visible.</p>
                        </div>
                      )}
                    </label>
                  </div>
                </div>

                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-destructive/10 border border-destructive/20 text-destructive p-4 rounded-2xl flex items-center gap-3 text-sm font-bold"
                    >
                      <AlertCircle className="h-5 w-5 shrink-0" />
                      {error}
                    </motion.div>
                  )}
                </AnimatePresence>

                <Button
                  onClick={handleSubmit}
                  disabled={loading || !photo}
                  className="w-full h-16 rounded-[1.5rem] text-lg font-black shadow-2xl shadow-primary/30 transition-all active:scale-95 group"
                >
                  {loading ? (
                    <div className="flex items-center gap-3">
                      <div className="h-6 w-6 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span className="animate-pulse">Analyzing Faces...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <Sparkles className="h-6 w-6 group-hover:scale-125 transition-transform" />
                      <span>Mark Attendance</span>
                    </div>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>

        {/* Results Panel */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-7 space-y-6"
        >
          <AnimatePresence mode="wait">
            {result ? (
              <motion.div
                key="result"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="space-y-6"
              >
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: 'Present', value: result.summary.present, icon: UserCheck, color: 'text-green-500', bg: 'bg-green-500/10' },
                    { label: 'Absent', value: result.summary.absent, icon: UserX, color: 'text-red-500', bg: 'bg-red-500/10' },
                    { label: 'Total', value: result.summary.total_students, icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                    { label: 'Detected', value: result.summary.faces_detected, icon: Eye, color: 'text-purple-500', bg: 'bg-purple-500/10' },
                  ].map((item, i) => (
                    <motion.div
                      key={item.label}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="glass-card p-5 rounded-[2rem] border-none text-center space-y-2"
                    >
                      <div className={`mx-auto w-10 h-10 rounded-xl ${item.bg} flex items-center justify-center`}>
                        <item.icon className={`h-5 w-5 ${item.color}`} />
                      </div>
                      <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{item.label}</p>
                      <p className="text-2xl font-black">{item.value}</p>
                    </motion.div>
                  ))}
                </div>

                <div className="glass-card rounded-[2.5rem] p-8 border-none flex items-center justify-between bg-primary/10">
                  <div className="space-y-1">
                    <h3 className="font-black text-xl gradient-text">Sync Complete!</h3>
                  </div>
                  <div className="h-14 w-14 rounded-full bg-primary/20 flex items-center justify-center">
                    <CheckCircle2 className="h-8 w-8 text-primary" />
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-full min-h-[400px] glass rounded-[3rem] border-dashed border-white/10 flex flex-col items-center justify-center p-12 text-center"
              >
                <div className="p-8 rounded-[3rem] bg-white/[0.02] mb-6 relative">
                  <Scan className="h-16 w-16 text-white/5" />
                  <motion.div 
                    animate={{ top: ['0%', '100%', '0%'] }}
                    transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                    className="absolute left-0 right-0 h-0.5 bg-primary/20 blur-sm"
                  />
                </div>
                <h3 className="text-2xl font-black tracking-tight">Match Pending</h3>
                <p className="text-muted-foreground max-w-xs mx-auto mt-2 font-medium">Results will manifest here.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  )
}

export default TeacherAttendance
