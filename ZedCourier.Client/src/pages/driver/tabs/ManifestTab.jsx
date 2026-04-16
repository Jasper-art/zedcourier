import { useEffect, useState } from 'react'
import {
  Box, Typography, Card, CardContent, Chip,
  CircularProgress, Divider, Alert, TextField, MenuItem, Button, Badge,
  Dialog, DialogTitle, DialogContent, DialogActions, TextareaAutosize
} from '@mui/material'
import LocalShippingIcon from '@mui/icons-material/LocalShipping'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import SearchIcon from '@mui/icons-material/Search'
import RouteIcon from '@mui/icons-material/Route'
import NavigateNextIcon from '@mui/icons-material/NavigateNext'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat'
import InfoIcon from '@mui/icons-material/Info'

const token = () => localStorage.getItem('token')

const STATUS_COLOR = {
  load: 'warning',
  unload: 'success'
}

export default function ManifestTab() {
  const [scannedParcels, setScannedParcels] = useState([])
  const [filteredParcels, setFilteredParcels] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('waybill')

  // Dialog state
  const [openDialog, setOpenDialog] = useState(false)
  const [selectedParcel, setSelectedParcel] = useState(null)
  const [notes, setNotes] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [actionSuccess, setActionSuccess] = useState('')
  const [actionError, setActionError] = useState('')

  const user = JSON.parse(localStorage.getItem('user') || '{}')

  // Load scanned parcels from Scanner tab history
  useEffect(() => {
    loadScannedParcels()
    // Refresh every 2 seconds to sync with Scanner tab
    const interval = setInterval(loadScannedParcels, 2000)
    return () => clearInterval(interval)
  }, [])

  const loadScannedParcels = () => {
    try {
      const scanHistory = JSON.parse(localStorage.getItem('scanHistory') || '[]')
      setScannedParcels(scanHistory)
      setLoading(false)
    } catch (err) {
      console.error('Failed to load scanned parcels:', err)
      setLoading(false)
    }
  }

  // Filter and sort parcels
  useEffect(() => {
    let filtered = [...scannedParcels]

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      filtered = filtered.filter(p =>
        p.waybill?.toLowerCase().includes(q) ||
        p.senderName?.toLowerCase().includes(q) ||
        p.receiverName?.toLowerCase().includes(q) ||
        p.deliveryLandmark?.toLowerCase().includes(q)
      )
    }

    // Sorting
    if (sortBy === 'action') {
      const actionOrder = { load: 0, unload: 1 }
      filtered.sort((a, b) => actionOrder[a.action] - actionOrder[b.action])
    } else if (sortBy === 'landmark') {
      filtered.sort((a, b) => (a.deliveryLandmark || '').localeCompare(b.deliveryLandmark || ''))
    } else {
      filtered.sort((a, b) => (a.waybill || '').localeCompare(b.waybill || ''))
    }

    setFilteredParcels(filtered)
  }, [scannedParcels, searchQuery, sortBy])

  // Handle button actions
  const handleActionClick = (parcel) => {
    setSelectedParcel(parcel)
    setNotes('')
    setActionError('')
    setActionSuccess('')
    setOpenDialog(true)
  }

  // Execute action
  const handleConfirmAction = async () => {
    if (!selectedParcel) return

    setActionLoading(true)
    setActionError('')
    setActionSuccess('')

    try {
      // Update the parcel status in backend
      const statusMap = {
        load: 'InTransit',
        unload: 'Arrived'
      }

      const notesText = selectedParcel.action === 'load'
        ? `Loaded ${selectedParcel.waybill} onto vehicle at ${user.branchName || 'branch'}. ${notes ? `Notes: ${notes}` : ''}`
        : `Offloaded ${selectedParcel.waybill} at ${selectedParcel.deliveryLandmark}. ${notes ? `Notes: ${notes}` : ''}`

      // You'll need the parcelId - fetch it first
const trackData = await api.getTracking(selectedParcel.waybill)
      await api.apiPut(`parcel/${trackData.parcelId}/status`, {
        newStatus: statusMap[selectedParcel.action],
        notes: notesText
      })

      setActionSuccess(`✓ ${selectedParcel.waybill} ${selectedParcel.action === 'load' ? 'loaded' : 'offloaded'} successfully`)

      // Remove from manifest after confirming action
      setTimeout(() => {
        const updated = scannedParcels.filter(p => p.waybill !== selectedParcel.waybill)
        setScannedParcels(updated)
        setOpenDialog(false)
      }, 1500)
    } catch (err) {
      setActionError(err.message)
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
      <CircularProgress sx={{ color: '#4fc3f7' }} />
    </Box>
  )

  const loadCount = filteredParcels.filter(p => p.action === 'load').length
  const unloadCount = filteredParcels.filter(p => p.action === 'unload').length

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ color: '#f0f4ff', fontWeight: 700, mb: 1 }}>
          📦 My Scanned Parcels
        </Typography>
        <Typography variant="body2" sx={{ color: '#506680' }}>
          {filteredParcels.length} parcels scanned today • {loadCount} ready to load • {unloadCount} ready to offload
        </Typography>
      </Box>

      {/* Info Alert */}
      <Alert severity="info" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1, borderRadius: 2 }}>
        <InfoIcon sx={{ fontSize: 18 }} />
        Only parcels you've scanned in the <strong>Scanner tab</strong> appear here. This prevents loading wrong parcels.
      </Alert>

      {/* Status Summary */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <Card sx={{ flex: 1, minWidth: 120, backgroundColor: '#0a1628', border: '1px solid #1a2f4a' }}>
          <CardContent sx={{ p: 1.5 }}>
            <Typography variant="caption" sx={{ color: '#506680' }}>Ready to Load</Typography>
            <Typography sx={{ color: '#4fc3f7', fontWeight: 700, fontSize: 18 }}>{loadCount}</Typography>
          </CardContent>
        </Card>
        <Card sx={{ flex: 1, minWidth: 120, backgroundColor: '#0a1628', border: '1px solid #1a2f4a' }}>
          <CardContent sx={{ p: 1.5 }}>
            <Typography variant="caption" sx={{ color: '#506680' }}>Ready to Offload</Typography>
            <Typography sx={{ color: '#4caf50', fontWeight: 700, fontSize: 18 }}>{unloadCount}</Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Filters & Search */}
      <Card sx={{ mb: 3, backgroundColor: '#0a1628', border: '1px solid #1a2f4a' }}>
        <CardContent sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <TextField
              placeholder="Search waybill, sender, receiver, branch..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              InputProps={{ startAdornment: <SearchIcon sx={{ mr: 1, color: '#506680' }} /> }}
              size="small"
              sx={{ flex: 1, minWidth: 250, '& .MuiOutlinedInput-root': { color: '#fff', backgroundColor: '#000' }, '& .MuiOutlinedInput-notchedOutline': { borderColor: '#1a2f4a' } }}
            />

            <TextField
              select label="Sort By" value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              size="small" sx={{ minWidth: 130, '& .MuiOutlinedInput-root': { color: '#fff' }, '& .MuiOutlinedInput-notchedOutline': { borderColor: '#1a2f4a' } }}
            >
              <MenuItem value="waybill">Waybill</MenuItem>
              <MenuItem value="action">Action (Load/Unload)</MenuItem>
              <MenuItem value="landmark">Destination</MenuItem>
            </TextField>

            <Button
              variant="outlined"
              onClick={() => { setSearchQuery(''); setSortBy('waybill') }}
              sx={{ borderColor: '#1a2f4a', color: '#4fc3f7' }}
            >
              Reset
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Parcels List */}
      {filteredParcels.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <LocalShippingIcon sx={{ fontSize: 48, color: '#1a2f4a', mb: 1 }} />
            <Typography sx={{ color: '#506680' }}>
              No scanned parcels yet. <br /> <br />
              <strong>👉 Go to Scanner tab and scan parcels to see them here.</strong>
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Box>
          {filteredParcels.map((p, idx) => (
            <Card
              key={idx}
              sx={{
                mb: 2,
                backgroundColor: p.action === 'load' ? '#4fc3f720' : '#4caf5020',
                border: p.action === 'load' ? '1px solid #4fc3f7' : '1px solid #4caf50',
                transition: 'all 0.3s',
                '&:hover': { backgroundColor: p.action === 'load' ? '#4fc3f730' : '#4caf5030', borderColor: '#fff' }
              }}
            >
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Badge badgeContent={idx + 1} color="primary">
                      <Typography sx={{ color: '#4fc3f7', fontWeight: 800, fontSize: 16, letterSpacing: 1 }}>
                        {p.waybill}
                      </Typography>
                    </Badge>
                  </Box>
                  <Chip 
                    label={p.action === 'load' ? 'LOAD' : 'OFFLOAD'} 
                    color={p.action === 'load' ? 'primary' : 'success'}
                    size="small"
                    sx={{ fontWeight: 700 }}
                  />
                </Box>

                <Divider sx={{ mb: 1.5 }} />

                {/* Workflow visualization */}
                <Box sx={{ 
                  backgroundColor: '#0a1628', 
                  borderRadius: 2, 
                  p: 2, 
                  mb: 1.5,
                  border: '1px solid #1a2f4a'
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    {/* From */}
                    <Box sx={{ textAlign: 'center', flex: 1 }}>
                      <Typography variant="caption" sx={{ color: '#506680', fontWeight: 700 }}>FROM</Typography>
                      <Typography sx={{ color: '#f0f4ff', fontSize: 12, fontWeight: 600 }}>
                        {p.senderName || 'N/A'}
                      </Typography>
                    </Box>

                    {/* Arrow */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                      <TrendingFlatIcon sx={{ color: '#4fc3f7', fontSize: 20 }} />
                      <Typography variant="caption" sx={{ color: '#506680', fontSize: 10, fontWeight: 700 }}>
                        {p.action === 'load' ? 'LOAD' : 'OFFLOAD'}
                      </Typography>
                    </Box>

                    {/* To */}
                    <Box sx={{ textAlign: 'center', flex: 1 }}>
                      <Typography variant="caption" sx={{ color: '#506680', fontWeight: 700 }}>TO</Typography>
                      <Typography sx={{ color: '#f0f4ff', fontSize: 12, fontWeight: 600 }}>
                        {p.deliveryLandmark || 'N/A'}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#4fc3f7', fontSize: 11 }}>
                        For: {p.receiverName || 'N/A'}
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                {/* Details Grid */}
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 1.5 }}>
                  <Box>
                    <Typography variant="caption" sx={{ color: '#506680' }}>COST</Typography>
                    <Typography sx={{ color: '#4caf50', fontSize: 13, fontWeight: 600 }}>
                      K {p.cost || '0'}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: '#506680' }}>SCANNED AT</Typography>
                    <Typography sx={{ color: '#f0f4ff', fontSize: 13 }}>
                      {p.timestamp || 'N/A'}
                    </Typography>
                  </Box>
                </Box>

                {/* Action Button */}
                <Button
                  fullWidth variant="contained"
                  endIcon={<NavigateNextIcon />}
                  onClick={() => handleActionClick(p)}
                  sx={{
                    backgroundColor: p.action === 'load' ? '#4fc3f7' : '#4caf50',
                    color: '#070d1a',
                    fontWeight: 600,
                    fontSize: 12,
                    '&:hover': { 
                      backgroundColor: p.action === 'load' ? '#81d4fa' : '#81c784'
                    }
                  }}
                >
                  {p.action === 'load' ? 'Confirm Load' : 'Confirm Offload'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      {/* Route Optimization Info */}
      {filteredParcels.length > 0 && (
        <Card sx={{ mt: 3, backgroundColor: '#0d2a4a', border: '1px solid #4fc3f7' }}>
          <CardContent sx={{ p: 2, display: 'flex', gap: 1, alignItems: 'center' }}>
            <RouteIcon sx={{ color: '#4fc3f7', fontSize: 20 }} />
            <Typography sx={{ color: '#4fc3f7', fontSize: 13, fontWeight: 600 }}>
              💡 Tip: Sort by Destination to optimize your delivery route
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* Action Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ backgroundColor: '#0d1b2e', color: '#f0f4ff', fontWeight: 700 }}>
          Confirm {selectedParcel?.action === 'load' ? 'Load' : 'Offload'} - {selectedParcel?.waybill}
        </DialogTitle>
        <DialogContent sx={{ backgroundColor: '#070d1a', pt: 3 }}>
          {actionSuccess && (
            <Alert severity="success" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <CheckCircleIcon /> {actionSuccess}
            </Alert>
          )}
          {actionError && (
            <Alert severity="error" sx={{ mb: 2 }}>{actionError}</Alert>
          )}

          {selectedParcel && (
            <Box sx={{ mb: 2 }}>
              <Box sx={{ backgroundColor: '#0a1628', p: 2, borderRadius: 2, mb: 2, border: '1px solid #1a2f4a' }}>
                {selectedParcel.action === 'load' && (
                  <>
                    <Typography variant="body2" sx={{ color: '#90a4c1', mb: 1 }}>
                      <strong>📍 Pickup from:</strong> {selectedParcel.senderName}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#90a4c1', mb: 1 }}>
                      <strong>🚚 Load onto:</strong> Your vehicle
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#90a4c1', mb: 1 }}>
                      <strong>🏢 Final destination:</strong> {selectedParcel.deliveryLandmark}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#90a4c1' }}>
                      <strong>👤 For client:</strong> {selectedParcel.receiverName}
                    </Typography>
                  </>
                )}

                {selectedParcel.action === 'unload' && (
                  <>
                    <Typography variant="body2" sx={{ color: '#90a4c1', mb: 1 }}>
                      <strong>🏢 Offload at:</strong> {selectedParcel.deliveryLandmark}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#90a4c1', mb: 1 }}>
                      <strong>👤 For client:</strong> {selectedParcel.receiverName}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#4caf50', fontWeight: 600 }}>
                      <strong>💵 Cost:</strong> K {selectedParcel.cost}
                    </Typography>
                  </>
                )}
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ color: '#90a4c1', mb: 1 }}>Additional Notes (Optional):</Typography>
                <TextareaAutosize
                  minRows={3}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Add any notes about this parcel..."
                  style={{
                    width: '100%',
                    padding: 10,
                    borderRadius: 8,
                    border: '1px solid #1a2f4a',
                    backgroundColor: '#0a1628',
                    color: '#f0f4ff',
                    fontFamily: 'inherit'
                  }}
                />
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ backgroundColor: '#0d1b2e', p: 2 }}>
          <Button onClick={() => setOpenDialog(false)} sx={{ color: '#506680' }} disabled={actionLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirmAction}
            variant="contained"
            color="primary"
            disabled={actionLoading}
            sx={{ backgroundColor: '#4fc3f7', color: '#070d1a', fontWeight: 600 }}
          >
            {actionLoading ? <CircularProgress size={20} /> : 'Confirm'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}