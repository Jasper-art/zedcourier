import { useState } from 'react'
import {
  Box, Card, CardContent, TextField, Button,
  Typography, Alert, CircularProgress, Divider
} from '@mui/material'
import LocalShippingIcon from '@mui/icons-material/LocalShipping'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('http://localhost:5076/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Login failed')

      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))

      const role = data.user.role
      window.location.href =
        role === 'Admin'  ? '/dashboard' :
        role === 'Driver' ? '/driver'    : '/clerk'
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box sx={{
      minHeight: '100vh',
      backgroundColor: '#070d1a',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundImage: 'radial-gradient(ellipse at 60% 20%, #0d2a4a 0%, transparent 60%)',
    }}>
      <Box sx={{ width: 420 }}>

        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Box sx={{
            display: 'inline-flex', p: 2, borderRadius: '50%',
            backgroundColor: '#0d1b2e', border: '1px solid #1a2f4a', mb: 2
          }}>
            <LocalShippingIcon sx={{ fontSize: 40, color: '#4fc3f7' }} />
          </Box>
          <Typography variant="h5" sx={{ color: '#f0f4ff', fontWeight: 700 }}>
            ZedCourier Pro
          </Typography>
          <Typography variant="body2" sx={{ color: '#506680', mt: 0.5 }}>
            Staff Portal — Sign in to continue
          </Typography>
        </Box>

        <Card sx={{ p: 1 }}>
          <CardContent sx={{ p: 3 }}>
            {error && (
              <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                {error}
              </Alert>
            )}

            <TextField
              fullWidth label="Email Address" type="email"
              value={email} onChange={e => setEmail(e.target.value)}
              sx={{ mb: 2 }} variant="outlined"
            />
            <TextField
              fullWidth label="Password" type="password"
              value={password} onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              sx={{ mb: 3 }} variant="outlined"
            />

            <Button
              fullWidth variant="contained" color="primary"
              onClick={handleLogin} disabled={loading}
              sx={{ py: 1.5 }}
            >
              {loading ? <CircularProgress size={22} color="inherit" /> : 'Sign In'}
            </Button>

            <Divider sx={{ my: 3 }} />

            <Typography variant="caption" sx={{ color: '#506680', display: 'block', textAlign: 'center' }}>
              ZedCourier Pro · Eastern Province Logistics Platform
            </Typography>
          </CardContent>
        </Card>
      </Box>
    </Box>
  )
}