import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import Login from './pages/Login'
import StudentRegistration from './pages/StudentRegistration'
import TeacherAttendance from './pages/TeacherAttendance'
import AttendanceDashboard from './pages/AttendanceDashboard'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'

const AppRoutes = () => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background gap-6">
        <div className="relative">
          <div className="h-16 w-16 border-4 border-primary/10 border-t-primary rounded-full animate-spin"></div>
          <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full animate-pulse"></div>
        </div>
        <div className="flex flex-col items-center gap-1">
          <span className="text-xl font-black tracking-tighter gradient-text">ABSENCE.AI</span>
          <span className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em]">Synchronizing</span>
        </div>
      </div>
    )
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={user ? <Navigate to="/dashboard" replace /> : <Login />}
      />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="register" element={<StudentRegistration />} />
        <Route path="attendance" element={<TeacherAttendance />} />
        <Route path="dashboard" element={<AttendanceDashboard />} />
      </Route>
      <Route path="*" element={<Navigate to={user ? "/dashboard" : "/login"} replace />} />
    </Routes>
  )
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <AppRoutes />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
