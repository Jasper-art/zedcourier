import { useState, useEffect } from 'react'
import {
  Box, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText,
  Typography, Avatar, Divider, Card, CardContent, IconButton,
  BottomNavigation, BottomNavigationAction, Paper
} from '@mui/material'
import ListAltIcon from '@mui/icons-material/ListAlt'
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner'
import LocalShippingIcon from '@mui/icons-material/LocalShipping'
import LogoutIcon from '@mui/icons-material/Logout'
import DashboardIcon from '@mui/icons-material/Dashboard'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import TaskAltIcon from '@mui/icons-material/TaskAlt'
import TimerIcon from '@mui/icons-material/Timer'
import MenuIcon from '@mui/icons-material/Menu'
import CloseIcon from '@mui/icons-material/Close'
import ManifestTab from './tabs/ManifestTab'
import ScannerTab from './tabs/ScannerTab'

const DRAWER_WIDTH = 240
const token = () => localStorage.getItem('token')

const NAV = [
  { label: 'Dashboard',   icon: <DashboardIcon />,       tab: 'dashboard' },
  { label: 'My Manifest', icon: <ListAltIcon />,         tab: 'manifest' },
  { label: 'Scan Parcel', icon: <QrCodeScannerIcon />,   tab: 'scanner'  },
]

export default function DriverDashboard() {
  const [active, setActive] = useState('dashboard')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  useEffect(() => {
    fetchDashboardData()
    const interval = setInterval(fetchDashboardData, 60000)
    return () => clearInterval(interval)
  }, [])

  const fetchDashboardData = async () => {
    try {
      const res = await fetch('${import.meta.env.VITE_API_URL}/api/v1/parcel', {
        headers: { Authorization: `Bearer ${token()}` }
      })
      const parcels = await res.json()

      const today = new Date().toDateString()
      const todayParcels = parcels.filter(p => new Date(p.createdAt).toDateString() === today)
      const completed = parcels.filter(p => p.status === 'Collected')
      const inTransit = parcels.filter(p => p.status === 'InTransit')
      const arrived = parcels.filter(p => p.status === 'Arrived')

      setStats({
        totalAssigned: parcels.length,
        todayPickups: todayParcels.length,
        completed: completed.length,
        inTransit: inTransit.length,
        arrived: arrived.length,
        completionRate: parcels.length ? ((completed.length / parcels.length) * 100).toFixed(1) : 0
      })
    } catch (err) {
      console.error('Dashboard fetch failed:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.clear()
    window.location.href = '/login'
  }

  const renderDashboard = () => (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ color: '#f0f4ff', fontWeight: 700, mb: 0.5 }}>
          Welcome, {user.fullName}
        </Typography>
        <Typography variant="body2" sx={{ color: '#506680', fontSize: { xs: 12, md: 14 } }}>
          {user.branchName} • {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
        </Typography>
      </Box>

      {/* KPI Stats Grid */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 2, mb: 3 }}>
        <Card sx={{ backgroundColor: '#0a1628', border: '1px solid #1a2f4a', cursor: 'pointer', transition: 'all 0.3s', '&:hover': { borderColor: '#4fc3f7', backgroundColor: '#0d1f2d' } }}>
          <CardContent sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Box sx={{ flex: 1 }}>
                <Typography sx={{ color: '#506680', fontSize: { xs: 11, md: 12 }, mb: 0.5, fontWeight: 600 }}>TOTAL ASSIGNED</Typography>
                <Typography variant="h6" sx={{ color: '#4fc3f7', fontWeight: 700, fontSize: { xs: 18, md: 24 } }}>{stats?.totalAssigned || 0}</Typography>
              </Box>
              <LocalShippingIcon sx={{ color: '#4fc3f7', fontSize: { xs: 24, md: 32 }, opacity: 0.7 }} />
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ backgroundColor: '#0a1628', border: '1px solid #1a2f4a', cursor: 'pointer', transition: 'all 0.3s', '&:hover': { borderColor: '#4caf50', backgroundColor: '#0d1f2d' } }}>
          <CardContent sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Box sx={{ flex: 1 }}>
                <Typography sx={{ color: '#506680', fontSize: { xs: 11, md: 12 }, mb: 0.5, fontWeight: 600 }}>COMPLETED</Typography>
                <Typography variant="h6" sx={{ color: '#4caf50', fontWeight: 700, fontSize: { xs: 18, md: 24 } }}>{stats?.completed || 0}</Typography>
              </Box>
              <TaskAltIcon sx={{ color: '#4caf50', fontSize: { xs: 24, md: 32 }, opacity: 0.7 }} />
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ backgroundColor: '#0a1628', border: '1px solid #1a2f4a', cursor: 'pointer', transition: 'all 0.3s', '&:hover': { borderColor: '#ffb74d', backgroundColor: '#0d1f2d' } }}>
          <CardContent sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Box sx={{ flex: 1 }}>
                <Typography sx={{ color: '#506680', fontSize: { xs: 11, md: 12 }, mb: 0.5, fontWeight: 600 }}>IN TRANSIT</Typography>
                <Typography variant="h6" sx={{ color: '#ffb74d', fontWeight: 700, fontSize: { xs: 18, md: 24 } }}>{stats?.inTransit || 0}</Typography>
              </Box>
              <TrendingUpIcon sx={{ color: '#ffb74d', fontSize: { xs: 24, md: 32 }, opacity: 0.7 }} />
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ backgroundColor: '#0a1628', border: '1px solid #1a2f4a', cursor: 'pointer', transition: 'all 0.3s', '&:hover': { borderColor: '#e53935', backgroundColor: '#0d1f2d' } }}>
          <CardContent sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Box sx={{ flex: 1 }}>
                <Typography sx={{ color: '#506680', fontSize: { xs: 11, md: 12 }, mb: 0.5, fontWeight: 600 }}>ARRIVED</Typography>
                <Typography variant="h6" sx={{ color: '#e53935', fontWeight: 700, fontSize: { xs: 18, md: 24 } }}>{stats?.arrived || 0}</Typography>
              </Box>
              <TimerIcon sx={{ color: '#e53935', fontSize: { xs: 24, md: 32 }, opacity: 0.7 }} />
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Performance Metrics */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2, mb: 3 }}>
        <Card sx={{ backgroundColor: '#0a1628', border: '1px solid #1a2f4a' }}>
          <CardContent sx={{ p: { xs: 2, md: 3 } }}>
            <Typography variant="subtitle2" sx={{ color: '#4fc3f7', fontWeight: 700, mb: 2 }}>
              📊 Performance Metrics
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography sx={{ color: '#90a4c1', fontSize: { xs: 13, md: 14 } }}>Completion Rate</Typography>
              <Typography sx={{ color: '#4caf50', fontWeight: 700, fontSize: { xs: 16, md: 18 } }}>{stats?.completionRate || 0}%</Typography>
            </Box>
            <Box sx={{ width: '100%', height: 8, backgroundColor: '#1a2f4a', borderRadius: 4, overflow: 'hidden' }}>
              <Box sx={{ width: `${stats?.completionRate || 0}%`, height: '100%', backgroundColor: '#4caf50', transition: 'all 0.5s' }} />
            </Box>
            <Typography variant="caption" sx={{ color: '#506680', display: 'block', mt: 1, fontSize: { xs: 11, md: 12 } }}>
              {stats?.completed} of {stats?.totalAssigned} parcels delivered
            </Typography>
          </CardContent>
        </Card>

        <Card sx={{ backgroundColor: '#0a1628', border: '1px solid #1a2f4a' }}>
          <CardContent sx={{ p: { xs: 2, md: 3 } }}>
            <Typography variant="subtitle2" sx={{ color: '#4fc3f7', fontWeight: 700, mb: 2 }}>
              🎯 Today's Status
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography sx={{ color: '#90a4c1', fontSize: { xs: 13, md: 14 } }}>Today's Pickups</Typography>
                <Typography sx={{ color: '#4fc3f7', fontWeight: 700, fontSize: { xs: 16, md: 18 } }}>{stats?.todayPickups || 0}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography sx={{ color: '#90a4c1', fontSize: { xs: 13, md: 14 } }}>Last Updated</Typography>
                <Typography sx={{ color: '#506680', fontSize: { xs: 11, md: 12 } }}>Just now</Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Quick Actions */}
      <Box sx={{ mt: { xs: 2, md: 4 } }}>
        <Typography variant="subtitle2" sx={{ color: '#fff', fontWeight: 600, mb: 2, fontSize: { xs: 13, md: 14 } }}>Quick Actions</Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
          <Card
            onClick={() => { setActive('scanner'); setMobileOpen(false) }}
            sx={{ backgroundColor: '#0a1628', border: '1px solid #4fc3f7', cursor: 'pointer', transition: 'all 0.3s', '&:hover': { backgroundColor: '#4fc3f720' } }}>
            <CardContent sx={{ p: 2, textAlign: 'center' }}>
              <QrCodeScannerIcon sx={{ color: '#4fc3f7', fontSize: { xs: 24, md: 28 }, mb: 1 }} />
              <Typography sx={{ color: '#4fc3f7', fontWeight: 600, fontSize: { xs: 12, md: 13 } }}>
                Scan Parcel
              </Typography>
            </CardContent>
          </Card>
          <Card
            onClick={() => { setActive('manifest'); setMobileOpen(false) }}
            sx={{ backgroundColor: '#0a1628', border: '1px solid #4caf50', cursor: 'pointer', transition: 'all 0.3s', '&:hover': { backgroundColor: '#4caf5020' } }}>
            <CardContent sx={{ p: 2, textAlign: 'center' }}>
              <ListAltIcon sx={{ color: '#4caf50', fontSize: { xs: 24, md: 28 }, mb: 1 }} />
              <Typography sx={{ color: '#4caf50', fontWeight: 600, fontSize: { xs: 12, md: 13 } }}>
                View Manifest
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Box>
  )

  const renderTab = () => {
    switch (active) {
      case 'dashboard': return renderDashboard()
      case 'manifest': return <ManifestTab />
      case 'scanner': return <ScannerTab />
      default: return renderDashboard()
    }
  }

  const SidebarContent = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ p: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <LocalShippingIcon sx={{ color: '#4fc3f7', fontSize: 28 }} />
          <Box>
            <Typography variant="subtitle1" sx={{ color: '#f0f4ff', fontWeight: 700, lineHeight: 1 }}>
              ZedCourier
            </Typography>
            <Typography variant="caption" sx={{ color: '#4fc3f7' }}>Driver</Typography>
          </Box>
        </Box>
        <Box sx={{ display: { xs: 'flex', md: 'none' } }}>
          <IconButton onClick={() => setMobileOpen(false)} sx={{ color: '#506680' }}>
            <CloseIcon />
          </IconButton>
        </Box>
      </Box>

      <Divider />

      <List sx={{ flex: 1, pt: 1, overflowY: 'auto' }}>
        {NAV.map(item => (
          <ListItem key={item.tab} disablePadding>
            <ListItemButton
              onClick={() => { setActive(item.tab); setMobileOpen(false) }}
              sx={{
                mx: 1, borderRadius: 2, mb: 0.5,
                backgroundColor: active === item.tab ? '#4fc3f720' : 'transparent',
                borderLeft: active === item.tab ? '3px solid #4fc3f7' : '3px solid transparent',
                '&:hover': { backgroundColor: '#4fc3f710' }
              }}
            >
              <ListItemIcon sx={{ color: active === item.tab ? '#4fc3f7' : '#506680', minWidth: 36 }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{ fontSize: 14, color: active === item.tab ? '#f0f4ff' : '#90a4c1' }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      <Divider />

      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
          <Avatar sx={{ width: 32, height: 32, backgroundColor: '#1565c0', fontSize: 14 }}>
            {user.fullName?.[0] ?? 'D'}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body2" sx={{ color: '#f0f4ff', fontWeight: 600, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user.fullName}
            </Typography>
            <Typography variant="caption" sx={{ color: '#506680' }}>Driver</Typography>
          </Box>
        </Box>
        <ListItemButton onClick={handleLogout} sx={{ borderRadius: 2, '&:hover': { backgroundColor: '#4fc3f715' } }}>
          <ListItemIcon sx={{ color: '#4fc3f7', minWidth: 36 }}>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Logout" primaryTypographyProps={{ fontSize: 13, color: '#4fc3f7' }} />
        </ListItemButton>
      </Box>
    </Box>
  )

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: '#070d1a' }}>
      {/* DESKTOP Sidebar */}
      <Box sx={{ display: { xs: 'none', md: 'block' } }}>
        <Drawer variant="permanent" sx={{
          width: DRAWER_WIDTH,
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            backgroundColor: '#080f1e',
            borderRight: '1px solid #1a2f4a',
          }
        }}>
          <SidebarContent />
        </Drawer>
      </Box>

      {/* MOBILE Sidebar */}
      <Box sx={{ display: { xs: 'block', md: 'none' } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            '& .MuiDrawer-paper': {
              width: DRAWER_WIDTH,
              backgroundColor: '#080f1e',
              borderRight: '1px solid #1a2f4a',
            }
          }}
        >
          <SidebarContent />
        </Drawer>
      </Box>

      {/* Main Content */}
      <Box sx={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,
        backgroundColor: '#070d1a',
      }}>
        {/* MOBILE Top Bar */}
        <Box sx={{
          display: { xs: 'flex', md: 'none' },
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2, py: 1.5,
          backgroundColor: '#080f1e',
          borderBottom: '1px solid #1a2f4a',
          position: 'sticky', top: 0, zIndex: 100
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton onClick={() => setMobileOpen(true)} sx={{ color: '#4fc3f7', p: 0.5 }}>
              <MenuIcon />
            </IconButton>
            <LocalShippingIcon sx={{ color: '#4fc3f7', fontSize: 20 }} />
            <Typography variant="subtitle2" sx={{ color: '#f0f4ff', fontWeight: 700 }}>
              ZedCourier
            </Typography>
          </Box>
          <Avatar sx={{ width: 28, height: 28, backgroundColor: '#1565c0', fontSize: 12 }}>
            {user.fullName?.[0] ?? 'D'}
          </Avatar>
        </Box>

        {/* Content */}
        <Box sx={{
          flex: 1,
          p: { xs: 2, md: 3 },
          overflow: 'auto',
          pb: { xs: 10, md: 3 }
        }}>
          {renderTab()}
        </Box>
      </Box>

      {/* MOBILE Bottom Navigation */}
      <Paper sx={{
        display: { xs: 'block', md: 'none' },
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
        backgroundColor: '#080f1e',
        borderTop: '1px solid #1a2f4a',
      }} elevation={0}>
        <BottomNavigation
          value={active}
          onChange={(_, val) => setActive(val)}
          sx={{ backgroundColor: '#080f1e', height: 64 }}
        >
          {NAV.map(item => (
            <BottomNavigationAction
              key={item.tab}
              value={item.tab}
              label={item.label}
              icon={item.icon}
              sx={{
                color: active === item.tab ? '#4fc3f7' : '#506680',
                minWidth: 0,
                '& .MuiBottomNavigationAction-label': {
                  fontSize: 10,
                  color: active === item.tab ? '#4fc3f7' : '#506680'
                },
                '&.Mui-selected': { color: '#4fc3f7' },
                '& .MuiSvgIcon-root': { fontSize: 22 }
              }}
            />
          ))}
        </BottomNavigation>
      </Paper>
    </Box>
  )
}