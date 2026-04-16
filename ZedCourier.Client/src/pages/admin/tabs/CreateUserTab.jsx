import { useState, useEffect } from 'react'
import {
  Box, Card, CardContent, TextField, Button, Typography,
  Alert, CircularProgress, Select, MenuItem, FormControl,
  InputLabel, IconButton, InputAdornment
} from '@mui/material'
import PersonAddIcon from '@mui/icons-material/PersonAdd'
import VisibilityIcon from '@mui/icons-material/Visibility'
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff'
import { api } from '../../../api'

function generatePassword() {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#!'
  return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

export default function CreateUserTab() {
  const [formData, setFormData] = useState({
    fullName: '', email: '', password: '',
    role: 'Clerk', branchId: '', dateOfBirth: '', whatsAppNumber: ''
  })
  const [branches,        setBranches]        = useState([])
  const [loading,         setLoading]         = useState(false)
  const [success,         setSuccess]         = useState('')
  const [error,           setError]           = useState('')
  const [loadingBranches, setLoadingBranches] = useState(true)
  const [showPassword,    setShowPassword]    = useState(false)

  useEffect(() => { fetchBranches() }, [])

  const fetchBranches = async () => {
    try {
      const data = await api.getBranches()
      setBranches(Array.isArray(data) ? data : [])
    } catch {
      setError('Failed to load branches')
      setBranches([])
    } finally {
      setLoadingBranches(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (error) setError('')
  }

  const handleGeneratePassword = () => {
    setFormData(prev => ({ ...prev, password: generatePassword() }))
    setShowPassword(true)
  }

  const validateForm = () => {
    if (!formData.fullName.trim())                                            { setError('Full name is required');              return false }
    if (!formData.email.trim())                                               { setError('Email is required');                  return false }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))                  { setError('Invalid email format');               return false }
    if (!formData.password)                                                   { setError('Password is required');               return false }
    if (formData.password.length < 6)                                         { setError('Password must be at least 6 chars');  return false }
    if ((formData.role === 'Clerk' || formData.role === 'Driver') && !formData.branchId) {
      setError('Branch is required for this role')
      return false
    }
    return true
  }

  const handleCreate = async () => {
    if (!validateForm()) return
    setLoading(true)
    setError('')
    setSuccess('')
    try {
      const payload = {
        fullName:       formData.fullName.trim(),
        email:          formData.email.trim().toLowerCase(),
        password:       formData.password,
        role:           formData.role,
        branchId:       formData.branchId || null,
        dateOfBirth:    formData.dateOfBirth || null,
        whatsAppNumber: formData.whatsAppNumber?.trim() || ''
      }
      await api.register(payload)
      setSuccess(`User ${formData.fullName} created successfully!`)
      setFormData({ fullName: '', email: '', password: '', role: 'Clerk', branchId: '', dateOfBirth: '', whatsAppNumber: '' })
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.message || 'An error occurred while creating the user')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box>
      <Typography variant="h5" sx={{ color: '#f0f4ff', fontWeight: 700, mb: 3 }}>
        Create User
      </Typography>

      <Card sx={{ maxWidth: 600 }}>
        <CardContent sx={{ p: 3 }}>
          {error   && <Alert severity="error"   sx={{ mb: 2 }} onClose={() => setError('')}  >{error}  </Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
            <TextField fullWidth label="Full Name"  name="fullName"       value={formData.fullName}       onChange={handleChange} disabled={loading} placeholder="John Doe" />
            <TextField fullWidth label="Email"      name="email" type="email" value={formData.email}      onChange={handleChange} disabled={loading} placeholder="john@example.com" />
            <TextField fullWidth label="WhatsApp"   name="whatsAppNumber" value={formData.whatsAppNumber} onChange={handleChange} disabled={loading} placeholder="+260..." />
            <TextField fullWidth label="DOB" type="date" name="dateOfBirth" value={formData.dateOfBirth}  onChange={handleChange} InputLabelProps={{ shrink: true }} disabled={loading} />

            <TextField
              fullWidth label="Password" name="password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password} onChange={handleChange} disabled={loading}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setShowPassword(p => !p)} edge="end" tabIndex={-1}>
                      {showPassword ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
            <Button variant="outlined" onClick={handleGeneratePassword} disabled={loading} sx={{ height: 56 }}>
              Generate Password
            </Button>

            <FormControl fullWidth disabled={loading}>
              <InputLabel>Role</InputLabel>
              <Select name="role" value={formData.role} onChange={handleChange} label="Role">
                <MenuItem value="Clerk">Clerk</MenuItem>
                <MenuItem value="Driver">Driver</MenuItem>
                <MenuItem value="Admin">Admin</MenuItem>
              </Select>
            </FormControl>

            {(formData.role === 'Clerk' || formData.role === 'Driver') && (
              <FormControl fullWidth disabled={loadingBranches || loading}>
                <InputLabel>Branch</InputLabel>
                <Select name="branchId" value={formData.branchId} onChange={handleChange} label="Branch">
                  <MenuItem value="">Select a branch</MenuItem>
                  {branches.map(b => <MenuItem key={b.id} value={b.id}>{b.name}</MenuItem>)}
                </Select>
              </FormControl>
            )}
          </Box>

          <Button
            fullWidth variant="contained" onClick={handleCreate}
            disabled={loading} startIcon={<PersonAddIcon />}
            sx={{ py: 1.5, mt: 3 }}
          >
            {loading ? <><CircularProgress size={20} sx={{ mr: 1 }} color="inherit" />Creating...</> : 'Create User'}
          </Button>
        </CardContent>
      </Card>
    </Box>
  )
}