import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Login from './pages/Login'
import StudentRegistration from './pages/StudentRegistration'
import TeacherAttendance from './pages/TeacherAttendance'
import AttendanceDashboard from './pages/AttendanceDashboard'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/register" replace />} />
            <Route path="register" element={<StudentRegistration />} />
            <Route path="attendance" element={<TeacherAttendance />} />
            <Route path="dashboard" element={<AttendanceDashboard />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App

