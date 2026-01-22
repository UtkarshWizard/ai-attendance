import React from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { Avatar, AvatarFallback } from './ui/avatar'
import { Button } from './ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'
import { 
  LogOut, 
  Moon, 
  Sun, 
  Sparkles,
  UserPlus,
  Camera,
  LayoutDashboard,
  Menu
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const Topbar = () => {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const location = useLocation()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const getInitials = (name) => {
    if (!name) return 'U'
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/attendance', label: 'Attendance', icon: Camera },
    { path: '/register', label: 'Register', icon: UserPlus },
  ]

  return (
    <motion.nav 
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed top-0 left-0 right-0 z-50 w-full px-4 py-4 pointer-events-none"
    >
      <div className="max-w-6xl mx-auto flex items-center justify-between pointer-events-auto glass rounded-2xl px-6 py-3 shadow-xl border-white/5">
        <div className="flex items-center gap-10">
          <Link to="/dashboard" className="flex items-center gap-2 group relative">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full group-hover:bg-primary/40 transition-all duration-500"></div>
              <Sparkles className="h-6 w-6 text-primary relative z-10 group-hover:rotate-12 transition-transform duration-500" />
            </div>
            <span className="text-xl font-black tracking-tighter gradient-text">
              ABSENCE<span className="text-foreground/50">.</span>AI
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-2">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`relative px-4 py-2 rounded-xl text-sm font-bold tracking-tight transition-all duration-300 ${
                    isActive
                      ? 'text-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <span className="relative z-10 flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </span>
                  {isActive && (
                    <motion.div
                      layoutId="nav-active"
                      className="absolute inset-0 bg-primary/10 rounded-xl"
                      transition={{ type: 'spring', bounce: 0.25, duration: 0.5 }}
                    />
                  )}
                </Link>
              )
            })}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="rounded-xl hover:bg-primary/10 transition-colors"
          >
            <AnimatePresence mode="wait">
              {theme === 'dark' ? (
                <motion.div
                  key="moon"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Moon className="h-5 w-5 text-primary" />
                </motion.div>
              ) : (
                <motion.div
                  key="sun"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Sun className="h-5 w-5 text-primary" />
                </motion.div>
              )}
            </AnimatePresence>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-11 w-11 rounded-xl p-0 hover:bg-transparent group">
                <Avatar className="h-10 w-10 border-2 border-primary/20 group-hover:border-primary/50 transition-all duration-300">
                  <AvatarFallback className="bg-primary/10 text-primary font-bold">
                    {getInitials(user?.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-1 -right-1 h-3 w-3 bg-primary rounded-full border-2 border-background"></div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 glass border-white/10 rounded-2xl p-2 mt-2">
              <div className="flex items-center gap-3 p-3">
                <Avatar className="h-10 w-10 border-2 border-primary/20">
                  <AvatarFallback className="bg-primary/10 text-primary font-bold">
                    {getInitials(user?.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="text-sm font-bold leading-none">{user?.name}</span>
                  <span className="text-xs text-muted-foreground mt-1 truncate max-w-[140px]">{user?.email}</span>
                </div>
              </div>
              <DropdownMenuSeparator className="bg-white/5" />
              <div className="p-1">
                <DropdownMenuItem asChild className="rounded-xl focus:bg-primary/10 transition-all duration-200 cursor-pointer py-2.5">
                  <Link to="/dashboard" className="flex items-center w-full">
                    <LayoutDashboard className="mr-3 h-4 w-4" />
                    <span className="font-medium">Dashboard</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout} className="rounded-xl focus:bg-destructive/10 text-destructive transition-all duration-200 cursor-pointer py-2.5">
                  <LogOut className="mr-3 h-4 w-4" />
                  <span className="font-medium">Sign Out</span>
                </DropdownMenuItem>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="ghost" size="icon" className="md:hidden rounded-xl">
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </motion.nav>
  )
}

export default Topbar
