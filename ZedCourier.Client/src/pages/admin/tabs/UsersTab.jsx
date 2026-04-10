import { useEffect, useState } from 'react'
import {
  Box, Typography, Avatar, Chip, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper,
  IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, Alert, CircularProgress, Tooltip
} from '@mui/material'
import BlockIcon from '@mui/icons-material/Block'
import LockResetIcon from '@mui/icons-material/LockReset'
import WhatsAppIcon from '@mui/icons-material/WhatsApp'
import PersonAddIcon from '@mui/icons-material/PersonAdd'
import { useNavigate } from 'react-router-dom'

const token = () => localStorage.getItem('token')

const ROLE_COLOR = {
  Admin:  { bg: '#ef535020', color: '#ef5350' },
  Clerk:  { bg: '#4fc3f720', color: '#4fc3f7' },
  Driver: { bg: '#ffb74d20', color: '#ffb74d' },
}

const avatarColor = role => ROLE_COLOR[role]?.color ?? '#90a4c1'

function generatePassword() {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#!'
  return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

export default function UsersTab() {
  const navigate = useNavigate()
  const [users, setUsers] = useState([])
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [resetDialog, setResetDialog] = useState(null)
  const [newPassword, setNewPassword] = useState('')
  const [resetting, setResetting] = useState(false)
  const [resetMsg, setResetMsg] = useState('')

  const loadUsers = () => {
    setLoadingUsers(true)
    fetch('https://zedcourier-1.onrender.com/api/v1/auth/users', {
      headers: { Authorization: `Bearer ${token()}` }
    }).then(r => r.json()).then(setUsers).catch(() => setUsers([])).finally(() => setLoadingUsers(false))
  }

  useEffect(() => {
    loadUsers()
  }, [])

  const handleDeactivate = async id => {
    if (!confirm('Deactivate this user?')) return
    await fetch(`https://zedcourier-1.onrender.com/api/v1/auth/${id}/deactivate`, {
      method: 'PUT', headers: { Authorization: `Bearer ${token()}` }
    })
    loadUsers()
  }

  const handleResetPassword = async () => {
    if (!newPassword) return
    setResetting(true)
    setResetMsg('')
    try {
      const res = await fetch(`https://zedcourier-1.onrender.com/api/v1/auth/${resetDialog.id}/reset-password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ newPassword })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setResetMsg('Password reset successfully.')
      setNewPassword('')
      setTimeout(() => setResetDialog(null), 1500)
    } catch (err) {
      setResetMsg(err.message)
    } finally {
      setResetting(false)
    }
  }

  const openWhatsApp = creds => {
    const msg = encodeURIComponent(
      `Hello ${creds.name},\n\nYour ZedCourier Pro login credentials:\n\nEmail: ${creds.email}\nPassword: ${creds.password}\n\nPlease change your password after first login.\n\n— ZedCourier Admin`
    )
    const number = creds.whatsapp.replace(/\D/g, '')
    window.open(`https://wa.me/${number}?text=${msg}`, '_blank')
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ color: '#f0f4ff', fontWeight: 700 }}>
          Users ({users.length})
        </Typography>
        <Button variant="contained" color="primary"
          startIcon={<PersonAddIcon />}
          onClick={() => navigate('/admin/create-user')}
          sx={{ px: 3, py: 1.2 }}>
          Create User
        </Button>
      </Box>

      {/* Users Table */}
      {loadingUsers ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress sx={{ color: '#4fc3f7' }} />
        </Box>
      ) : users.length === 0 ? (
        <Typography sx={{ color: '#90a4c1', textAlign: 'center', py: 4 }}>
          No users found
        </Typography>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                {['User', 'Email', 'WhatsApp', 'Role', 'Branch', 'DOB', 'Status', 'Actions'].map(h => (
                  <TableCell key={h}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map(u => (
                <TableRow key={u.id} sx={{ '&:hover': { backgroundColor: '#4fc3f708' } }}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Avatar sx={{ width: 34, height: 34, backgroundColor: avatarColor(u.role) + '30', color: avatarColor(u.role), fontSize: 14, fontWeight: 700 }}>
                        {u.fullName?.[0]?.toUpperCase()}
                      </Avatar>
                      <Typography variant="body2" sx={{ color: '#f0f4ff', fontWeight: 600 }}>
                        {u.fullName}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ color: '#90a4c1', fontSize: 13 }}>{u.email}</TableCell>
                  <TableCell sx={{ color: '#90a4c1', fontSize: 13 }}>{u.whatsAppNumber || '—'}</TableCell>
                  <TableCell>
                    <Chip label={u.role} size="small" sx={{
                      backgroundColor: ROLE_COLOR[u.role]?.bg ?? '#1a2f4a',
                      color: ROLE_COLOR[u.role]?.color ?? '#90a4c1',
                      fontWeight: 700, fontSize: 11
                    }} />
                  </TableCell>
                  <TableCell sx={{ color: '#90a4c1', fontSize: 13 }}>{u.branchName || '—'}</TableCell>
                  <TableCell sx={{ color: '#90a4c1', fontSize: 13 }}>
                    {u.dateOfBirth ? new Date(u.dateOfBirth).toLocaleDateString() : '—'}
                  </TableCell>
                  <TableCell>
                    <Chip label={u.isActive ? 'Active' : 'Inactive'} size="small"
                      color={u.isActive ? 'success' : 'default'} />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <Tooltip title="Reset Password">
                        <IconButton size="small" sx={{ color: '#4fc3f7' }}
                          onClick={() => { setResetDialog(u); setResetMsg(''); setNewPassword('') }}>
                          <LockResetIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      {u.isActive && (
                        <Tooltip title="Deactivate">
                          <IconButton size="small" sx={{ color: '#ef5350' }}
                            onClick={() => handleDeactivate(u.id)}>
                            <BlockIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      {u.whatsAppNumber && (
                        <Tooltip title="Send on WhatsApp">
                          <IconButton size="small" sx={{ color: '#25d366' }}
                            onClick={() => openWhatsApp({ name: u.fullName, email: u.email, password: '(use reset to set)', whatsapp: u.whatsAppNumber })}>
                            <WhatsAppIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Reset Password Dialog */}
      <Dialog open={!!resetDialog} onClose={() => setResetDialog(null)} maxWidth="xs" fullWidth
        PaperProps={{ sx: { backgroundColor: '#0d1b2e', border: '1px solid #1a2f4a' } }}>
        <DialogTitle sx={{ color: '#f0f4ff', borderBottom: '1px solid #1a2f4a' }}>
          Reset Password — {resetDialog?.fullName}
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {resetMsg && (
            <Alert severity={resetMsg.includes('success') ? 'success' : 'error'} sx={{ mb: 2 }}>
              {resetMsg}
            </Alert>
          )}
          <TextField fullWidth label="New Password" type="text"
            value={newPassword} onChange={e => setNewPassword(e.target.value)}
            sx={{ mt: 1 }} />
          <Button size="small" onClick={() => setNewPassword(generatePassword())}
            sx={{ mt: 1, color: '#4fc3f7' }}>
            Generate
          </Button>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid #1a2f4a' }}>
          <Button onClick={() => setResetDialog(null)} sx={{ color: '#506680' }}>Cancel</Button>
          <Button variant="contained" color="primary" onClick={handleResetPassword} disabled={resetting}>
            {resetting ? <CircularProgress size={20} color="inherit" /> : 'Reset'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}