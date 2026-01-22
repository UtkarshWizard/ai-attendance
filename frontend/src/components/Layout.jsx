import React from 'react'
import { Outlet } from 'react-router-dom'
import Topbar from './Topbar'
import { motion } from 'framer-motion'

const Layout = () => {
  return (
    <div className="min-h-screen bg-background">
      <Topbar />
      <main className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Outlet />
        </motion.div>
      </main>
    </div>
  )
}

export default Layout
