import React from 'react'
import { Outlet } from 'react-router-dom'
import Topbar from './Topbar'
import { motion, AnimatePresence } from 'framer-motion'

const Layout = () => {
  return (
    <div className="min-h-screen bg-background relative overflow-x-hidden">
      {/* Dynamic Background Vignette */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(34,197,94,0.05),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.02] mix-blend-overlay"></div>
      </div>

      <Topbar />
      
      <main className="relative z-10 pt-28 pb-8 px-4 md:px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            <Outlet />
          </motion.div>
        </div>
      </main>

      {/* Decorative Blur Blobs */}
      <div className="fixed top-1/4 -left-20 w-80 h-80 bg-primary/5 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="fixed bottom-1/4 -right-20 w-80 h-80 bg-primary/5 rounded-full blur-[100px] pointer-events-none"></div>
    </div>
  )
}

export default Layout
