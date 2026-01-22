import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Calendar, Users, CheckCircle2, XCircle, TrendingUp, Search, Filter, Hash } from 'lucide-react'

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
    <div className="max-w-6xl mx-auto space-y-10 pb-20">
      {/* Header Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-end justify-between gap-6"
      >
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold tracking-wider uppercase">
            <TrendingUp className="h-3 w-3" />
            Live Insights
          </div>
          <h1 className="text-5xl font-black tracking-tighter gradient-text">
            Analytics<span className="text-foreground/20">.</span>
          </h1>
          <p className="text-muted-foreground font-medium max-w-md">
            Monitor real-time participation and attendance trends across your classes.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="glass px-4 py-2 rounded-2xl flex items-center gap-3 border-white/5 shadow-sm">
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase text-muted-foreground/70 tracking-widest">Class ID</span>
              <div className="flex items-center gap-2">
                <Hash className="h-3.5 w-3.5 text-primary" />
                <input 
                  type="number" 
                  value={classId}
                  onChange={(e) => setClassId(e.target.value)}
                  placeholder="001"
                  className="bg-transparent border-none outline-none w-16 font-bold text-sm focus:ring-0 p-0"
                />
              </div>
            </div>
          </div>

          <div className="glass px-4 py-2 rounded-2xl flex items-center gap-3 border-white/5 shadow-sm">
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase text-muted-foreground/70 tracking-widest">Date</span>
              <div className="flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5 text-primary" />
                <input 
                  type="date" 
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="bg-transparent border-none outline-none font-bold text-sm focus:ring-0 p-0 [color-scheme:dark]"
                />
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Students', value: totalCount, icon: Users, color: 'primary' },
          { label: 'Present Today', value: presentCount, icon: CheckCircle2, color: 'green' },
          { label: 'Absent Today', value: absentCount, icon: XCircle, color: 'red' },
          { label: 'Engagement Rate', value: `${attendanceRate}%`, icon: TrendingUp, color: 'blue' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="glass-card border-none hover:scale-[1.02] transition-all duration-300 group cursor-default">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-black uppercase text-muted-foreground tracking-widest">{stat.label}</p>
                    <p className="text-3xl font-black tracking-tighter">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-2xl bg-${stat.color === 'primary' ? 'primary' : stat.label.toLowerCase().includes('present') ? 'green-500' : stat.label.toLowerCase().includes('absent') ? 'red-500' : 'blue-500'}/10 group-hover:scale-110 transition-transform duration-500`}>
                    <stat.icon className={`h-6 w-6 text-${stat.color === 'primary' ? 'primary' : stat.label.toLowerCase().includes('present') ? 'green-500' : stat.label.toLowerCase().includes('absent') ? 'red-500' : 'blue-500'} transition-colors`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Table Section */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="glass-card rounded-[2.5rem] overflow-hidden border-white/5"
      >
        <div className="p-8 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-1 rounded-full bg-primary shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">Student Directory</h2>
              <p className="text-xs text-muted-foreground font-medium">Real-time status of all enrolled students</p>
            </div>
          </div>
          
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <input 
              type="text" 
              placeholder="Search by name or roll..."
              className="bg-white/5 border border-white/5 rounded-xl pl-10 pr-4 py-2 text-sm outline-none focus:ring-2 ring-primary/20 w-full md:w-64 transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-4">
              <div className="h-10 w-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
              <p className="text-sm font-bold text-muted-foreground animate-pulse">Syncing Database...</p>
            </div>
          ) : attendance.length > 0 ? (
            <table className="w-full text-left">
              <thead>
                <tr className="bg-white/[0.02]">
                  <th className="py-5 px-8 text-xs font-black uppercase text-muted-foreground tracking-widest whitespace-nowrap">ID / Roll</th>
                  <th className="py-5 px-8 text-xs font-black uppercase text-muted-foreground tracking-widest whitespace-nowrap">Student Identity</th>
                  <th className="py-5 px-8 text-xs font-black uppercase text-muted-foreground tracking-widest whitespace-nowrap">Current Status</th>
                  <th className="py-5 px-8 text-xs font-black uppercase text-muted-foreground tracking-widest whitespace-nowrap text-right">Confidence</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {attendance.map((record, index) => (
                  <motion.tr
                    key={record.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + index * 0.03 }}
                    className="hover:bg-white/[0.02] transition-colors group"
                  >
                    <td className="py-5 px-8">
                      <span className="font-mono text-xs font-bold bg-white/5 px-2 py-1 rounded-lg">#{record.roll_number}</span>
                    </td>
                    <td className="py-5 px-8">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center font-bold text-primary group-hover:scale-110 transition-transform">
                          {record.name[0]}
                        </div>
                        <span className="font-bold tracking-tight">{record.name}</span>
                      </div>
                    </td>
                    <td className="py-5 px-8">
                      <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                        record.status === 'present' 
                        ? 'bg-green-500/10 text-green-500' 
                        : 'bg-red-500/10 text-red-500'
                      }`}>
                        <div className={`h-1.5 w-1.5 rounded-full ${record.status === 'present' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                        {record.status}
                      </div>
                    </td>
                    <td className="py-5 px-8 text-right font-mono text-sm font-bold text-muted-foreground">
                      {record.confidence_score ? `${(record.confidence_score * 100).toFixed(0)}%` : '—'}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="py-20 text-center">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-3xl bg-white/5 mb-4 group hover:scale-110 transition-transform cursor-default">
                <Filter className="h-8 w-8 text-muted-foreground/30 group-hover:text-primary transition-colors" />
              </div>
              <h3 className="font-bold text-lg">No Results Found</h3>
              <p className="text-muted-foreground text-sm max-w-xs mx-auto mt-1">Adjust your filters or try a different class ID to see what shows up.</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}

export default AttendanceDashboard
