import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Calendar, Users, CheckCircle2, XCircle, TrendingUp } from 'lucide-react'

const AttendanceDashboard = () => {
  const [classId, setClassId] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [attendance, setAttendance] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const fetchAttendance = async () => {
    if (!classId || !date) {
      setError('Please enter class ID and date')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await axios.get(
        `/api/attendance/class/${classId}/date/${date}`
      )
      setAttendance(response.data.attendance)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch attendance')
      setAttendance([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (classId && date) {
      fetchAttendance()
    }
  }, [classId, date])

  const presentCount = attendance.filter((a) => a.status === 'present').length
  const absentCount = attendance.filter((a) => a.status === 'absent').length
  const totalCount = attendance.length
  const attendanceRate = totalCount > 0 ? ((presentCount / totalCount) * 100).toFixed(1) : 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent mb-2">
          Attendance Dashboard
        </h1>
        <p className="text-muted-foreground">
          View and analyze attendance records for your classes
        </p>
      </div>

      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Filter Attendance
          </CardTitle>
          <CardDescription>
            Select a class and date to view attendance records
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="class_id">Class ID</Label>
              <Input
                type="number"
                id="class_id"
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
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="h-11"
              />
            </div>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md text-sm"
            >
              {error}
            </motion.div>
          )}
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="h-8 w-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
        </div>
      ) : attendance.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="border-2 border-primary/20 bg-primary/5">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">
                        Total Students
                      </p>
                      <p className="text-3xl font-bold text-primary">
                        {totalCount}
                      </p>
                    </div>
                    <Users className="h-8 w-8 text-primary/40" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="border-2 border-green-500/20 bg-green-500/5">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">
                        Present
                      </p>
                      <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                        {presentCount}
                      </p>
                    </div>
                    <CheckCircle2 className="h-8 w-8 text-green-500/40" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="border-2 border-red-500/20 bg-red-500/5">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">
                        Absent
                      </p>
                      <p className="text-3xl font-bold text-red-600 dark:text-red-400">
                        {absentCount}
                      </p>
                    </div>
                    <XCircle className="h-8 w-8 text-red-500/40" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="border-2 border-blue-500/20 bg-blue-500/5">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">
                        Attendance Rate
                      </p>
                      <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                        {attendanceRate}%
                      </p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-blue-500/40" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          <Card className="border-2">
            <CardHeader>
              <CardTitle>Attendance Records</CardTitle>
              <CardDescription>
                Detailed list of all students and their attendance status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-semibold text-sm">Roll Number</th>
                      <th className="text-left py-3 px-4 font-semibold text-sm">Name</th>
                      <th className="text-left py-3 px-4 font-semibold text-sm">Status</th>
                      <th className="text-left py-3 px-4 font-semibold text-sm">Confidence</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendance.map((record, index) => (
                      <motion.tr
                        key={record.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="border-b hover:bg-accent/50 transition-colors"
                      >
                        <td className="py-3 px-4 font-medium">{record.roll_number}</td>
                        <td className="py-3 px-4 text-muted-foreground">{record.name}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                              record.status === 'present'
                                ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                                : 'bg-red-500/10 text-red-600 dark:text-red-400'
                            }`}
                          >
                            {record.status === 'present' ? (
                              <CheckCircle2 className="h-3 w-3" />
                            ) : (
                              <XCircle className="h-3 w-3" />
                            )}
                            {record.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">
                          {record.confidence_score
                            ? `${(record.confidence_score * 100).toFixed(1)}%`
                            : 'N/A'}
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      ) : classId && date ? (
        <Card className="border-2">
          <CardContent className="pt-6 text-center py-12">
            <p className="text-muted-foreground">No attendance records found for this date.</p>
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}

export default AttendanceDashboard
