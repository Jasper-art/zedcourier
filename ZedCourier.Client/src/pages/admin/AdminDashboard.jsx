import { useState } from 'react'
import {
  Box, Drawer, List, ListItem, ListItemButton, ListItemIcon,
  ListItemText, Typography, Avatar, Divider, BottomNavigation,
  BottomNavigationAction, Paper, IconButton, Tooltip
} from '@mui/material'
import DashboardIcon from '@mui/icons-material/Dashboard'
import LocalShippingIcon from '@mui/icons-material/LocalShipping'
import BarChartIcon from '@mui/icons-material/BarChart'
import PeopleIcon from '@mui/icons-material/People'
import PersonAddIcon from '@mui/icons-material/PersonAdd'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import HistoryIcon from '@mui/icons-material/History'
import LogoutIcon from '@mui/icons-material/Logout'
import MenuIcon from '@mui/icons-material/Menu'
import CloseIcon from '@mui/icons-material/Close'
import OverviewTab from './tabs/OverviewTab'
import ParcelsTab from './tabs/ParcelsTab'
import RevenueTab from './tabs/RevenueTab'
import AuditTab from './tabs/AuditTab'
import BranchesTab from './tabs/BranchesTab'
import UsersTab from './tabs/UsersTab'
import CreateUserTab from './tabs/CreateUserTab'

const DRAWER_WIDTH = 240

const NAV = [
  { label: 'Overview',    icon: <DashboardIcon />,     tab: 'overview' },
  { label: 'Parcels',     icon: <LocalShippingIcon />,  tab: 'parcels'  },
  { label: 'Revenue',     icon: <BarChartIcon />,       tab: 'revenue'  },
  { label: 'Branches',    icon: <LocationOnIcon />,     tab: 'branches' },
  { label: 'Users',       icon: <PeopleIcon />,         tab: 'users'    },
  { label: 'Create User', icon: <PersonAddIcon />,      tab: 'create'   },
  { label: 'Audit Log',   icon: <HistoryIcon />,        tab: 'audit'    },
]

// Bottom nav shows only top 5 most used tabs on mobile
const BOTTOM_NAV = ['overview', 'parcels', 'revenue', 'users', 'create']

export default function AdminDashboard() {
  const [active,      setActive]      = useState('overview')
  const [mobileOpen,  setMobileOpen]  = useState(false)
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  const handleLogout = () => {
    localStorage.clear()
    window.location.href = '/login'
  }

  const renderTab = () => {
    switch (active) {
      case 'overview':  return <OverviewTab />
      case 'parcels':   return <ParcelsTab />
      case 'revenue':   return <RevenueTab />
      case 'branches':  return <BranchesTab />
      case 'users':     return <UsersTab />
      case 'create':    return <CreateUserTab />
      case 'audit':     return <AuditTab />
      default:          return <OverviewTab />
    }
  }

  const SidebarContent = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Logo */}
      <Box sx={{ p: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <LocalShippingIcon sx={{ color: '#4fc3f7', fontSize: 28 }} />
          <Box>
            <Typography variant="subtitle1" sx={{ color: '#f0f4ff', fontWeight: 700, lineHeight: 1 }}>
              ZedCourier
            </Typography>
            <Typography variant="caption" sx={{ color: '#4fc3f7' }}>Admin Portal</Typography>
          </Box>
        </Box>
        {/* Close button — mobile only */}
        <Box sx={{ display: { xs: 'flex', md: 'none' } }}>
          <IconButton onClick={() => setMobileOpen(false)} sx={{ color: '#506680' }}>
            <CloseIcon />
          </IconButton>
        </Box>
      </Box>

      <Divider />

      {/* Nav */}
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
                primaryTypographyProps={{
                  fontSize: 14,
                  color: active === item.tab ? '#f0f4ff' : '#90a4c1'
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      <Divider />

      {/* User + Logout */}
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
          <Avatar sx={{ width: 32, height: 32, backgroundColor: '#1565c0', fontSize: 14 }}>
            {user.fullName?.[0] ?? 'A'}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body2" sx={{ color: '#f0f4ff', fontWeight: 600, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user.fullName}
            </Typography>
            <Typography variant="caption" sx={{ color: '#506680' }}>{user.role}</Typography>
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

      {/* DESKTOP sidebar — permanent */}
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

      {/* MOBILE sidebar — temporary drawer */}
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

      {/* Main area */}
      <Box sx={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,
        backgroundColor: '#070d1a',
      }}>

        {/* MOBILE top bar */}
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
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="caption" sx={{ color: '#4fc3f7' }}>
              {NAV.find(n => n.tab === active)?.label}
            </Typography>
            <Avatar sx={{ width: 28, height: 28, backgroundColor: '#1565c0', fontSize: 12 }}>
              {user.fullName?.[0] ?? 'A'}
            </Avatar>
          </Box>
        </Box>

        {/* Content */}
        <Box sx={{
          flex: 1,
          p: { xs: 2, md: 3 },
          overflow: 'auto',
          pb: { xs: 10, md: 3 } // padding for bottom nav on mobile
        }}>
          {renderTab()}
        </Box>
      </Box>

      {/* MOBILE bottom navigation */}
      <Paper sx={{
        display: { xs: 'block', md: 'none' },
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
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