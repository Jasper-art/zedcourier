import { useState, useEffect } from 'react'
import {
  Box, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText,
  Typography, Avatar, Divider, Card, CardContent, Button, TextField, Chip,
  Badge, IconButton, Dialog, Alert, BottomNavigation, BottomNavigationAction, Paper
} from '@mui/material'
import AddBoxIcon from '@mui/icons-material/AddBox'
import LocalShippingIcon from '@mui/icons-material/LocalShipping'
import QrCodeIcon from '@mui/icons-material/QrCode'
import VerifiedIcon from '@mui/icons-material/Verified'
import SendIcon from '@mui/icons-material/Send'
import LogoutIcon from '@mui/icons-material/Logout'
import SearchIcon from '@mui/icons-material/Search'
import NotificationsIcon from '@mui/icons-material/Notifications'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import TaskAltIcon from '@mui/icons-material/TaskAlt'
import HourglassTopIcon from '@mui/icons-material/HourglassTop'
import MenuIcon from '@mui/icons-material/Menu'
import CloseIcon from '@mui/icons-material/Close'
import BookingTab from './tabs/BookingTab'
import CollectionTab from './tabs/CollectionTab'
import LabelTab from './tabs/LabelTab'
import MyParcelsTab from './tabs/MyParcelsTab'

const DRAWER_WIDTH = 240
import { api, getUser } from '../../api'

const NAV = [
  { label: 'Dashboard',         icon: <TrendingUpIcon />,    tab: 'dashboard'  },
  { label: 'New Booking',       icon: <AddBoxIcon />,        tab: 'booking'    },
  { label: 'My Parcels',        icon: <LocalShippingIcon />, tab: 'myparcels'  },
  { label: 'Send PIN',          icon: <SendIcon />,          tab: 'sendpin'    },
  { label: 'Collection',        icon: <VerifiedIcon />,      tab: 'collection' },
  { label: 'Print Label',       icon: <QrCodeIcon />,        tab: 'label'      },
]

const BOTTOM_NAV = ['dashboard', 'booking', 'myparcels', 'collection', 'label']

export default function ClerkDashboard() {
  const [active, setActive] = useState('dashboard')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [stats, setStats] = useState(null)
  const [recentParcels, setRecentParcels] = useState([])
  const [pendingParcels, setPendingParcels] = useState([])
  const [searchValue, setSearchValue] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [openSearch, setOpenSearch] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [showNotifications, setShowNotifications] = useState(false)
  const user = getUser()

  useEffect(() => {
    fetchDashboardData()
    const interval = setInterval(fetchDashboardData, 30000)
    return () => clearInterval(interval)
  }, [])

const fetchDashboardData = async () => {
    try {
      const parcelsRes = await api.getParcels()

      const today = new Date().toDateString()
      const todayParcels = parcelsRes.filter(p => new Date(p.createdAt).toDateString() === today)
      const recentItems = parcelsRes.slice(0, 5)
      const pending = parcelsRes.filter(p => p.status === 'Arrived' || p.status === 'Recorded').slice(0, 5)
      const collected = parcelsRes.filter(p => p.status === 'Collected')

      setStats({
        todayBookings: todayParcels.length,
        todayRevenue: todayParcels.reduce((sum, p) => sum + (p.cost || 0), 0),
        collectionRate: parcelsRes.length ? ((collected.length / parcelsRes.length) * 100).toFixed(1) : 0,
        totalToday: todayParcels.length
      })

      setRecentParcels(recentItems)
      setPendingParcels(pending)

      const newNotifications = []
      if (pending.length > 0) newNotifications.push({ type: 'warning', msg: `${pending.length} parcels awaiting collection` })
      if (todayParcels.length > 10) newNotifications.push({ type: 'success', msg: `Great! ${todayParcels.length} bookings today` })
      setNotifications(newNotifications)
    } catch (err) {
      console.error('Dashboard fetch failed:', err)
    }
  }

  const handleSearch = async (query) => {
    if (!query.trim()) {
      setSearchResults([])
      return
    }
    try {
   const res = await api.getParcels()
      const q = query.toLowerCase()
      setSearchResults(res.filter(p =>
        p.waybillNumber?.toLowerCase().includes(q) ||
        p.senderPhone?.includes(q) ||
        p.receiverPhone?.includes(q)
      ).slice(0, 5))
    } catch (err) {
      console.error('Search failed:', err)
    }
  }

const handleLogout = async () => {
    try { await api.logout() } catch (_) {}
    localStorage.clear()
    window.location.href = '/login'
  }

  const renderDashboard = () => (
    <>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 2, mb: 3 }}>
        <Card sx={{ backgroundColor: '#0a1628', border: '1px solid #1a2f4a' }}>
          <CardContent sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Box sx={{ flex: 1 }}>
                <Typography sx={{ color: '#506680', fontSize: { xs: 11, md: 12 }, mb: 0.5 }}>Today's Bookings</Typography>
                <Typography variant="h6" sx={{ color: '#4fc3f7', fontWeight: 700, fontSize: { xs: 18, md: 24 } }}>{stats?.todayBookings || 0}</Typography>
              </Box>
              <AddBoxIcon sx={{ color: '#4fc3f7', fontSize: { xs: 24, md: 28 } }} />
            </Box>
          </CardContent>
        </Card>
        <Card sx={{ backgroundColor: '#0a1628', border: '1px solid #1a2f4a' }}>
          <CardContent sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Box sx={{ flex: 1 }}>
                <Typography sx={{ color: '#506680', fontSize: { xs: 11, md: 12 }, mb: 0.5 }}>Today's Revenue</Typography>
                <Typography variant="h6" sx={{ color: '#4caf50', fontWeight: 700, fontSize: { xs: 18, md: 24 } }}>K {(stats?.todayRevenue || 0).toFixed(2)}</Typography>
              </Box>
              <TrendingUpIcon sx={{ color: '#4caf50', fontSize: { xs: 24, md: 28 } }} />
            </Box>
          </CardContent>
        </Card>
        <Card sx={{ backgroundColor: '#0a1628', border: '1px solid #1a2f4a' }}>
          <CardContent sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Box sx={{ flex: 1 }}>
                <Typography sx={{ color: '#506680', fontSize: { xs: 11, md: 12 }, mb: 0.5 }}>Collection Rate</Typography>
                <Typography variant="h6" sx={{ color: '#ffb74d', fontWeight: 700, fontSize: { xs: 18, md: 24 } }}>{stats?.collectionRate || 0}%</Typography>
              </Box>
              <TaskAltIcon sx={{ color: '#ffb74d', fontSize: { xs: 24, md: 28 } }} />
            </Box>
          </CardContent>
        </Card>
        <Card sx={{ backgroundColor: '#0a1628', border: '1px solid #1a2f4a' }}>
          <CardContent sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Box sx={{ flex: 1 }}>
                <Typography sx={{ color: '#506680', fontSize: { xs: 11, md: 12 }, mb: 0.5 }}>Pending Actions</Typography>
                <Typography variant="h6" sx={{ color: '#e53935', fontWeight: 700, fontSize: { xs: 18, md: 24 } }}>{pendingParcels.length}</Typography>
              </Box>
              <HourglassTopIcon sx={{ color: '#e53935', fontSize: { xs: 24, md: 28 } }} />
            </Box>
          </CardContent>
        </Card>
      </Box>

      <Typography variant="subtitle2" sx={{ color: '#fff', fontWeight: 600, mb: 2, fontSize: { xs: 13, md: 14 } }}>Quick Actions</Typography>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 1.5, mb: 3 }}>
        <Button variant="contained" size="small" onClick={() => { setActive('label'); setMobileOpen(false) }} sx={{ backgroundColor: '#4caf50', color: '#000', fontWeight: 600, py: 1 }}>Print Label</Button>
        <Button variant="contained" size="small" onClick={() => { setActive('collection'); setMobileOpen(false) }} sx={{ backgroundColor: '#ffb74d', color: '#000', fontWeight: 600, py: 1 }}>Verify Collection</Button>
        <Button variant="contained" size="small" onClick={() => { setActive('sendpin'); setMobileOpen(false) }} sx={{ backgroundColor: '#ce93d8', color: '#000', fontWeight: 600, py: 1 }}>Send PIN</Button>
      </Box>

      {pendingParcels.length > 0 && (
        <>
          <Typography variant="subtitle2" sx={{ color: '#fff', fontWeight: 600, mb: 2, fontSize: { xs: 13, md: 14 } }}>⚠️ Pending Actions ({pendingParcels.length})</Typography>
          <Box sx={{ mb: 3 }}>
            {pendingParcels.map(p => (
              <Card key={p.id} sx={{ backgroundColor: '#1a2f4a', border: '1px solid #e53935', mb: 1.5 }}>
                <CardContent sx={{ py: 1.5, px: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography sx={{ color: '#4fc3f7', fontWeight: 700, fontSize: { xs: 12, md: 13 } }}>{p.waybillNumber}</Typography>
                      <Typography sx={{ color: '#aaa', fontSize: { xs: 10, md: 11 }, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.senderPhone} → {p.receiverPhone}</Typography>
                    </Box>
                    <Chip label={p.status} color={p.status === 'Arrived' ? 'warning' : 'default'} size="small" />
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        </>
      )}

      <Typography variant="subtitle2" sx={{ color: '#fff', fontWeight: 600, mb: 2, fontSize: { xs: 13, md: 14 } }}>Recent Activity</Typography>
      <Box>
        {recentParcels.map(p => (
          <Card key={p.id} sx={{ backgroundColor: '#0a1628', border: '1px solid #1a2f4a', mb: 1.5 }}>
            <CardContent sx={{ py: 1.5, px: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{ color: '#4fc3f7', fontWeight: 700, fontSize: { xs: 12, md: 13 } }}>{p.waybillNumber}</Typography>
                  <Typography sx={{ color: '#aaa', fontSize: { xs: 10, md: 11 } }}>K {p.cost} · {new Date(p.createdAt).toLocaleString()}</Typography>
                </Box>
                <Chip label={p.status} size="small" />
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>
    </>
  )

  const renderTab = () => {
    switch (active) {
      case 'dashboard':  return renderDashboard()
      case 'booking':    return <BookingTab />
      case 'myparcels':  return <MyParcelsTab />
      case 'sendpin':    return <MyParcelsTab showPinOnly={true} />
      case 'collection': return <CollectionTab />
      case 'label':      return <LabelTab />
      default:           return renderDashboard()
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
            <Typography variant="caption" sx={{ color: '#4fc3f7' }}>Clerk Portal</Typography>
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
            {user.fullName?.[0] ?? 'C'}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body2" sx={{ color: '#f0f4ff', fontWeight: 600, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user.fullName}
            </Typography>
            <Typography variant="caption" sx={{ color: '#506680' }}>{user.branchName}</Typography>
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
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#070d1a', minWidth: 0 }}>
        {/* Top Bar */}
        <Box sx={{
          p: { xs: 1.5, md: 2 },
          borderBottom: '1px solid #1a2f4a',
          backgroundColor: '#080f1e',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: { xs: 1, md: 2 },
          position: 'sticky',
          top: 0,
          zIndex: 50
        }}>
          {/* Mobile Menu Button */}
          <Box sx={{ display: { xs: 'flex', md: 'none' }, alignItems: 'center', gap: 1 }}>
            <IconButton onClick={() => setMobileOpen(true)} sx={{ color: '#4fc3f7', p: 0.5 }}>
              <MenuIcon />
            </IconButton>
            <LocalShippingIcon sx={{ color: '#4fc3f7', fontSize: 20 }} />
          </Box>

          {/* Search */}
          <TextField
            placeholder="Search waybill, phone..."
            value={searchValue}
            onChange={(e) => { setSearchValue(e.target.value); handleSearch(e.target.value) }}
           onFocus={() => setOpenSearch(true)}
            onBlur={() => setTimeout(() => setOpenSearch(false), 200)}
            size="small"
            InputProps={{ startAdornment: <SearchIcon sx={{ mr: 1, color: '#506680', fontSize: 18 }} /> }}
            sx={{
              flex: 1,
              maxWidth: { xs: '100%', md: 400 },
              '& .MuiOutlinedInput-root': { color: '#fff', backgroundColor: '#0a1628', fontSize: { xs: 12, md: 14 } },
              '& .MuiOutlinedInput-notchedOutline': { borderColor: '#1a2f4a' }
            }}
          />

          {/* Notifications */}
          <Badge badgeContent={notifications.length} color="error">
            <IconButton onClick={() => setShowNotifications(!showNotifications)} sx={{ color: '#4fc3f7' }}>
              <NotificationsIcon fontSize="small" />
            </IconButton>
          </Badge>
        </Box>

        {/* Notifications Panel */}
        {showNotifications && notifications.length > 0 && (
          <Box sx={{ p: 2, backgroundColor: '#0a1628', borderBottom: '1px solid #1a2f4a' }}>
            {notifications.map((notif, i) => (
              <Alert key={i} severity={notif.type} sx={{ mb: 1, backgroundColor: '#1a2f4a', fontSize: { xs: 12, md: 14 } }}>
                {notif.msg}
              </Alert>
            ))}
          </Box>
        )}

        {/* Search Results Dialog */}
        {openSearch && searchResults.length > 0 && (
          <Dialog open={openSearch} onClose={() => setOpenSearch(false)} maxWidth="sm" fullWidth
            PaperProps={{ sx: { backgroundColor: '#0d1b2e' } }}>
            <Box sx={{ p: 2 }}>
              <Typography variant="subtitle2" sx={{ color: '#fff', fontWeight: 600, mb: 2 }}>Search Results</Typography>
              {searchResults.map(p => (
                <Box key={p.id} sx={{ p: 1.5, backgroundColor: '#0a1628', borderRadius: 1, mb: 1 }}>
                  <Typography sx={{ color: '#4fc3f7', fontWeight: 600, fontSize: 13 }}>{p.waybillNumber}</Typography>
                  <Typography sx={{ color: '#aaa', fontSize: 11 }}>{p.senderPhone} → {p.receiverPhone}</Typography>
                  <Chip label={p.status} size="small" sx={{ mt: 0.5 }} />
                </Box>
              ))}
            </Box>
          </Dialog>
        )}

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
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        backgroundColor: '#080f1e',
        borderTop: '1px solid #1a2f4a',
      }} elevation={0}>
        <BottomNavigation
          value={BOTTOM_NAV.includes(active) ? active : false}
          onChange={(_, val) => setActive(val)}
          sx={{ backgroundColor: '#080f1e', height: 64 }}
        >
          {NAV.filter(n => BOTTOM_NAV.includes(n.tab)).map(item => (
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