import { useState } from 'react'
import {
  Box, Card, CardContent, TextField, Button, Typography,
  Alert, CircularProgress, Stepper, Step, StepLabel, Divider, Chip
} from '@mui/material'
import LocalShippingIcon from '@mui/icons-material/LocalShipping'
import SearchIcon from '@mui/icons-material/Search'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'
import AccessTimeIcon from '@mui/icons-material/AccessTime'

const STEP_LABELS = ['Recorded', 'In Transit', 'Arrived', 'Collected']

const STEP_INDEX = {
  Recorded: 0, InTransit: 1, Arrived: 2, Collected: 3
}

function getEstimatedDelivery(createdAt, status) {
  if (status === 'Collected') return null
  const created = new Date(createdAt)
  const est = new Date(created)
  est.setDate(est.getDate() + (status === 'Arrived' ? 1 : status === 'InTransit' ? 2 : 3))
  return est
}

function getStatusMessage(status) {
  switch (status) {
    case 'Recorded':  return 'Your parcel has been registered and is awaiting pickup.'
    case 'InTransit': return 'Your parcel is on the road and heading to the destination.'
    case 'Arrived':   return 'Your parcel has arrived! Visit the branch with your PIN to collect.'
    case 'Collected': return 'Parcel successfully collected. Thank you for using ZedCourier!'
    default: return ''
  }
}

export default function TrackingPortal() {
  const [waybill, setWaybill] = useState('')
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  const handleTrack = async () => {
    if (!waybill.trim()) return
    setLoading(true)
    setError('')
    setData(null)
    try {
      const res  = await fetch(`https://zedcourier-1.onrender.com/api/v1/tracking/${waybill.trim()}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Waybill not found')
      setData(json)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const activeStep = data ? (STEP_INDEX[data.status] ?? 0) : 0
  const estDelivery = data ? getEstimatedDelivery(data.createdAt, data.status) : null

  return (
    <Box sx={{
      minHeight: '100vh',
      backgroundColor: '#070d1a',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
    }}>

      {/* ── Animated Hero Banner ── */}
      <Box sx={{
        width: '100%',
        background: 'linear-gradient(135deg, #0a1628 0%, #0d2a4a 40%, #082040 70%, #070d1a 100%)',
        borderBottom: '1px solid #1a2f4a',
        position: 'relative',
        overflow: 'hidden',
        py: { xs: 5, md: 7 },
        px: 2,
        textAlign: 'center',
        mb: 4,
      }}>
        {/* Animated orbs */}
        <Box sx={{
          position: 'absolute', top: '-60px', left: '10%',
          width: 300, height: 300, borderRadius: '50%',
          background: 'radial-gradient(circle, #4fc3f730 0%, transparent 70%)',
          animation: 'pulse 4s ease-in-out infinite',
          '@keyframes pulse': {
            '0%, 100%': { transform: 'scale(1)', opacity: 0.6 },
            '50%': { transform: 'scale(1.2)', opacity: 1 }
          }
        }} />
        <Box sx={{
          position: 'absolute', bottom: '-40px', right: '15%',
          width: 200, height: 200, borderRadius: '50%',
          background: 'radial-gradient(circle, #1565c030 0%, transparent 70%)',
          animation: 'pulse 6s ease-in-out infinite',
        }} />

        {/* Moving truck animation */}
        <Box sx={{
          display: 'inline-flex', p: { xs: 2, md: 2.5 }, borderRadius: '50%',
          backgroundColor: '#0d1b2e', border: '2px solid #1a2f4a',
          mb: 2.5, position: 'relative', zIndex: 1,
          animation: 'float 3s ease-in-out infinite',
          '@keyframes float': {
            '0%, 100%': { transform: 'translateY(0px)' },
            '50%': { transform: 'translateY(-8px)' }
          }
        }}>
          <LocalShippingIcon sx={{ fontSize: { xs: 36, md: 48 }, color: '#4fc3f7' }} />
        </Box>

        <Typography variant="h4" sx={{
          color: '#f0f4ff', fontWeight: 800,
          fontSize: { xs: '1.6rem', md: '2.2rem' },
          position: 'relative', zIndex: 1,
          letterSpacing: '-0.5px'
        }}>
          Track Your Parcel
        </Typography>
        <Typography variant="body2" sx={{
          color: '#506680', mt: 1, mb: 3,
          position: 'relative', zIndex: 1,
          fontSize: { xs: 13, md: 15 }
        }}>
          Real-time delivery tracking across Eastern Province
        </Typography>

        {/* Search bar inside hero */}
        <Box sx={{
          display: 'flex', gap: 1.5, maxWidth: 520,
          mx: 'auto', position: 'relative', zIndex: 1
        }}>
          <TextField
            fullWidth label="Enter Waybill Number"
            value={waybill} onChange={e => setWaybill(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleTrack()}
            placeholder="e.g. ZP-2026-4821"
            sx={{
              '& .MuiOutlinedInput-root': { backgroundColor: '#0a1628' }
            }}
          />
          <Button
            variant="contained" color="primary"
            onClick={handleTrack} disabled={loading}
            sx={{ px: { xs: 2, md: 3 }, minWidth: 56, fontWeight: 700 }}
          >
            {loading
              ? <CircularProgress size={20} color="inherit" />
              : <SearchIcon />
            }
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mt: 2, maxWidth: 520, mx: 'auto', borderRadius: 2 }}>
            {error}
          </Alert>
        )}
      </Box>

      {/* ── Results ── */}
      {data && (
        <Box sx={{ width: '100%', maxWidth: 580, px: 2, pb: 6 }}>

          {/* Status message banner */}
          <Box sx={{
            backgroundColor: data.status === 'Collected' ? '#4caf5015' :
                             data.status === 'Arrived'   ? '#4fc3f715' :
                             data.status === 'InTransit' ? '#ffb74d15' : '#90a4c115',
            border: `1px solid ${
              data.status === 'Collected' ? '#4caf5040' :
              data.status === 'Arrived'   ? '#4fc3f740' :
              data.status === 'InTransit' ? '#ffb74d40' : '#90a4c140'
            }`,
            borderRadius: 2, p: 2, mb: 3,
            display: 'flex', alignItems: 'center', gap: 1.5
          }}>
            <Box sx={{
              width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
              backgroundColor:
                data.status === 'Collected' ? '#4caf50' :
                data.status === 'Arrived'   ? '#4fc3f7' :
                data.status === 'InTransit' ? '#ffb74d' : '#90a4c1',
              animation: data.status !== 'Collected'
                ? 'blink 1.5s ease-in-out infinite' : 'none',
              '@keyframes blink': {
                '0%, 100%': { opacity: 1 },
                '50%': { opacity: 0.2 }
              }
            }} />
            <Typography variant="body2" sx={{ color: '#f0f4ff', fontSize: 13 }}>
              {getStatusMessage(data.status)}
            </Typography>
          </Box>

          <Card sx={{ mb: 2 }}>
            <CardContent sx={{ p: { xs: 2, md: 3 } }}>

              {/* Waybill + Status */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box>
                  <Typography variant="caption" sx={{ color: '#506680' }}>WAYBILL</Typography>
                  <Typography sx={{ color: '#4fc3f7', fontWeight: 800, letterSpacing: 1, fontSize: { xs: 18, md: 22 } }}>
                    {data.waybill}
                  </Typography>
                </Box>
                <Chip
                  label={data.status}
                  color={
                    data.status === 'Collected' ? 'success' :
                    data.status === 'Arrived'   ? 'info' :
                    data.status === 'InTransit' ? 'warning' : 'default'
                  }
                  sx={{ fontWeight: 700, fontSize: 12 }}
                />
              </Box>

              {/* Stepper */}
              <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 3 }}>
                {STEP_LABELS.map(label => (
                  <Step key={label}>
                    <StepLabel sx={{
                      '& .MuiStepLabel-label': { color: '#506680', fontSize: 11 },
                      '& .MuiStepLabel-label.Mui-active': { color: '#4fc3f7' },
                      '& .MuiStepLabel-label.Mui-completed': { color: '#4caf50' },
                      '& .MuiStepIcon-root.Mui-active': { color: '#4fc3f7' },
                      '& .MuiStepIcon-root.Mui-completed': { color: '#4caf50' },
                    }}>
                      {label}
                    </StepLabel>
                  </Step>
                ))}
              </Stepper>

              <Divider sx={{ mb: 3 }} />

              {/* Estimated Delivery */}
              {estDelivery && (
                <Box sx={{
                  display: 'flex', gap: 2, mb: 3,
                  p: 2, backgroundColor: '#0a1628',
                  borderRadius: 2, border: '1px solid #1a2f4a',
                  flexWrap: 'wrap'
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
                    <CalendarTodayIcon sx={{ color: '#ce93d8', fontSize: 18 }} />
                    <Box>
                      <Typography variant="caption" sx={{ color: '#506680' }}>EST. DELIVERY</Typography>
                      <Typography sx={{ color: '#ce93d8', fontWeight: 700, fontSize: 14 }}>
                        {estDelivery.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
                    <AccessTimeIcon sx={{ color: '#4fc3f7', fontSize: 18 }} />
                    <Box>
                      <Typography variant="caption" sx={{ color: '#506680' }}>BOOKED ON</Typography>
                      <Typography sx={{ color: '#f0f4ff', fontWeight: 600, fontSize: 14 }}>
                        {new Date(data.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              )}

              {/* Route */}
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 3 }}>
                <Box>
                  <Typography variant="caption" sx={{ color: '#506680' }}>FROM</Typography>
                  <Typography sx={{ color: '#f0f4ff', fontWeight: 600, fontSize: 14 }}>{data.origin}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: '#506680' }}>TO</Typography>
                  <Typography sx={{ color: '#f0f4ff', fontWeight: 600, fontSize: 14 }}>{data.destination}</Typography>
                </Box>
              </Box>

              {/* Landmark */}
              <Box sx={{
                backgroundColor: '#0a1628', borderRadius: 2, p: 2, mb: 3,
                border: '1px solid #1a2f4a', display: 'flex', gap: 1.5, alignItems: 'flex-start'
              }}>
                <LocationOnIcon sx={{ color: '#4fc3f7', mt: 0.2 }} />
                <Box>
                  <Typography variant="caption" sx={{ color: '#506680' }}>COLLECT AT</Typography>
                  <Typography sx={{ color: '#4fc3f7', fontWeight: 700, fontSize: 15 }}>
                    {data.deliveryLandmark}
                  </Typography>
                </Box>
              </Box>

              {/* Timeline */}
              {data.timeline?.length > 0 && (
                <>
                  <Typography variant="subtitle2" sx={{ color: '#90a4c1', mb: 1.5 }}>
                    Movement History
                  </Typography>
                  {data.timeline.map((t, i) => (
                    <Box key={i} sx={{
                      display: 'flex', gap: 2, mb: 1.5,
                      pb: 1.5, borderBottom: i < data.timeline.length - 1 ? '1px solid #0f1e33' : 'none'
                    }}>
                      <Box sx={{
                        width: 8, height: 8, borderRadius: '50%',
                        backgroundColor: '#4fc3f7', mt: 0.8, flexShrink: 0
                      }} />
                      <Box sx={{ flex: 1 }}>
                        <Typography sx={{ color: '#f0f4ff', fontSize: 13, fontWeight: 600 }}>
                          {t.newStatus}
                        </Typography>
                        <Typography sx={{ color: '#506680', fontSize: 12 }}>{t.notes}</Typography>
                      </Box>
                      <Typography sx={{ color: '#506680', fontSize: 11, whiteSpace: 'nowrap' }}>
                        {new Date(t.timestamp).toLocaleString()}
                      </Typography>
                    </Box>
                  ))}
                </>
              )}
            </CardContent>
          </Card>
        </Box>
      )}

      {/* Footer */}
      <Typography variant="caption" sx={{ color: '#1a2f4a', mb: 4, mt: data ? 0 : 4 }}>
        ZedCourier Pro · Eastern Province Logistics Platform
      </Typography>
    </Box>
  )
}