import { useState, useEffect } from 'react'
import {
  Box, Typography, Card, CardContent, TextField,
  Button, Alert, CircularProgress, Divider, ToggleButton, ToggleButtonGroup,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions, Paper, IconButton, Tabs, Tab
} from '@mui/material'
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner'
import FileUploadIcon from '@mui/icons-material/FileUpload'
import StorefrontIcon from '@mui/icons-material/Storefront'
import HistoryIcon from '@mui/icons-material/History'
import PrintIcon from '@mui/icons-material/Print'
import ClearIcon from '@mui/icons-material/Clear'
import RefreshIcon from '@mui/icons-material/Refresh'

const token = () => localStorage.getItem('token')

export default function ScannerTab() {
  const [waybill,        setWaybill]        = useState('')
  const [action,         setAction]         = useState('load')
  const [loading,        setLoading]        = useState(false)
  const [success,        setSuccess]        = useState('')
  const [error,          setError]          = useState('')
  const [tab,            setTab]            = useState(0)
  const [scanHistory,    setScanHistory]    = useState([])
  const [offlineScans,   setOfflineScans]   = useState([])
  const [isOnline,       setIsOnline]       = useState(navigator.onLine)
  const [showDetails,    setShowDetails]    = useState(false)
  const [selectedParcel, setSelectedParcel] = useState(null)
  const [batchWaybills,  setBatchWaybills]  = useState('')
  const [batchResults,   setBatchResults]   = useState([])
  const [batchLoading,   setBatchLoading]   = useState(false)
  const [stats,          setStats]          = useState({ loaded: 0, dropped: 0, failed: 0, total: 0 })

  const STATUS_MAP = { load: 'InTransit', drop: 'Arrived' }
  const NOTE_MAP   = {
    load: 'Scanned and loaded onto vehicle by driver.',
    drop: 'Dropped at destination branch by driver. Awaiting receiver collection.'
  }

  useEffect(() => {
    const saved        = JSON.parse(localStorage.getItem('scanHistory')  || '[]')
    const savedOffline = JSON.parse(localStorage.getItem('offlineScans') || '[]')
    setScanHistory(saved)
    setOfflineScans(savedOffline)
    updateStats(saved)
  }, [])

  useEffect(() => {
    const on  = () => setIsOnline(true)
    const off = () => setIsOnline(false)
    window.addEventListener('online',  on)
    window.addEventListener('offline', off)
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off) }
  }, [])

  useEffect(() => {
    if (isOnline && offlineScans.length > 0) syncOfflineScans()
  }, [isOnline])

  const updateStats = history => {
    setStats({
      loaded:  history.filter(s => s.action === 'load' && !s.error).length,
      dropped: history.filter(s => s.action === 'drop' && !s.error).length,
      failed:  history.filter(s => s.error).length,
      total:   history.length
    })
  }

const fetchParcelDetails = async waybillNum => {
    const trackData = await api.getTracking(waybillNum.trim())
    const parcelData = await api.apiGet(`parcel/${trackData.parcelId}`)

    return {
      parcelId:         trackData.parcelId,
      waybill:          trackData.waybill,
      status:           trackData.status,
      origin:           trackData.origin,
      destination:      trackData.destination,
      deliveryLandmark: trackData.deliveryLandmark,
      senderName:       parcelData.parcel?.senderName    || trackData.origin,
      receiverName:     parcelData.parcel?.receiverName  || trackData.destination,
      senderPhone:      parcelData.parcel?.senderPhone   || '—',
      receiverPhone:    parcelData.parcel?.receiverPhone || '—',
      weightKg:         parcelData.parcel?.weightKg      || '—',
      cost:             parcelData.parcel?.cost          || '—',
    }
  }

  const handleScan = async () => {
    if (!waybill.trim()) return
    setLoading(true)
    setSuccess('')
    setError('')
    try {
      const data = await fetchParcelDetails(waybill)
      setSelectedParcel(data)
      setShowDetails(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const confirmScan = async () => {
    if (!selectedParcel) return
    setLoading(true)
    try {
      if (!isOnline) {
        const offlineScan = {
          waybill:   selectedParcel.waybill,
          action,
          status:    STATUS_MAP[action],
          timestamp: new Date().toISOString(),
          parcelId:  selectedParcel.parcelId
        }
        const updated = [...offlineScans, offlineScan]
        setOfflineScans(updated)
        localStorage.setItem('offlineScans', JSON.stringify(updated))
        setSuccess(`${selectedParcel.waybill} saved offline — will sync when online.`)
      } else {
await apiPut(`parcel/${selectedParcel.parcelId}/status`, {
          newStatus: STATUS_MAP[action],
          notes: NOTE_MAP[action]
        })
        setSuccess(`✓ ${selectedParcel.waybill} — ${action === 'load' ? 'Loaded onto truck' : 'Dropped at branch'}`)
      }

      const entry = {
        waybill:          selectedParcel.waybill,
        action,
        status:           STATUS_MAP[action],
        timestamp:        new Date().toLocaleTimeString(),
        senderName:       selectedParcel.senderName,
        receiverName:     selectedParcel.receiverName,
        deliveryLandmark: selectedParcel.deliveryLandmark,
        cost:             selectedParcel.cost
      }
      const updated = [entry, ...scanHistory]
      setScanHistory(updated)
      localStorage.setItem('scanHistory', JSON.stringify(updated))
      updateStats(updated)
      setWaybill('')
      setShowDetails(false)
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

const syncOfflineScans = async () => {
    for (const scan of offlineScans) {
      try {
        await apiPut(`parcel/${scan.parcelId}/status`, {
          newStatus: scan.status,
          notes: NOTE_MAP[scan.action]
        })
      } catch (err) { console.error('Sync failed:', err) }
    }
    setOfflineScans([])
    localStorage.setItem('offlineScans', '[]')
  }

  const handleBatchScan = async () => {
    if (!batchWaybills.trim()) return
    setBatchLoading(true)
    setBatchResults([])
    const waybills = batchWaybills.split('\n').map(w => w.trim()).filter(w => w)
    const results  = []
    for (const wb of waybills) {
      try {
        const data = await fetchParcelDetails(wb)
if (isOnline) {
          await apiPut(`parcel/${data.parcelId}/status`, {
            newStatus: STATUS_MAP[action],
            notes: NOTE_MAP[action]
          })
          results.push({ waybill: wb, success: true, error: '' })
        } else {
          results.push({ waybill: wb, success: true, offline: true })
        }
      } catch (err) {
        results.push({ waybill: wb, success: false, error: err.message })
      }
    }
    setBatchResults(results)
    setBatchLoading(false)
    setSuccess(`Batch: ${results.filter(r => r.success).length}/${results.length} successful`)
  }

  const clearHistory = () => {
    setScanHistory([])
    localStorage.setItem('scanHistory', '[]')
    updateStats([])
  }

  const printLabel = scan => {
    const win = window.open('', '_blank')
    win.document.write(`
      <html><head><title>Waybill</title>
      <style>
        body { font-family: Arial; margin: 20px; }
        .label { border: 2px solid #000; padding: 20px; max-width: 420px; }
        h2 { text-align: center; margin: 0 0 12px; }
        .barcode { text-align: center; font-size: 22px; font-weight: bold; letter-spacing: 3px; margin: 12px 0; }
        .field { margin: 8px 0; font-size: 13px; }
        .footer { margin-top: 20px; text-align: center; font-size: 11px; color: #999; }
      </style></head>
      <body><div class="label">
        <h2>ZedCourier Pro</h2>
        <div class="barcode">${scan.waybill}</div>
        <div class="field"><strong>From:</strong> ${scan.senderName || '—'}</div>
        <div class="field"><strong>Receiver:</strong> ${scan.receiverName || '—'}</div>
        <div class="field"><strong>Collect At Branch:</strong> ${scan.deliveryLandmark || '—'}</div>
        <div class="field"><strong>Cost:</strong> K ${scan.cost || '—'}</div>
        <div class="footer">Printed: ${new Date().toLocaleString()}</div>
      </div></body></html>`)
    win.document.close()
    win.print()
  }

  const ActionToggle = () => (
    <ToggleButtonGroup
      value={action} exclusive
      onChange={(_, val) => val && setAction(val)}
      fullWidth sx={{ mb: 3 }}
    >
      <ToggleButton value="load" sx={{
        fontWeight: 700, gap: 1, py: 1.5,
        '&.Mui-selected': { backgroundColor: '#4fc3f7', color: '#070d1a' }
      }}>
        <FileUploadIcon fontSize="small" /> Load onto Truck
      </ToggleButton>
      <ToggleButton value="drop" sx={{
        fontWeight: 700, gap: 1, py: 1.5,
        '&.Mui-selected': { backgroundColor: '#4caf50', color: '#070d1a' }
      }}>
        <StorefrontIcon fontSize="small" /> Drop at Branch
      </ToggleButton>
    </ToggleButtonGroup>
  )

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ color: '#f0f4ff', fontWeight: 700 }}>
          Parcel Scanner
        </Typography>
        <Box sx={{
          display: 'flex', alignItems: 'center', gap: 1,
          px: 1.5, py: 0.5, borderRadius: 2,
          backgroundColor: isOnline ? '#4caf5015' : '#ff980015',
          border: `1px solid ${isOnline ? '#4caf5040' : '#ff980040'}`
        }}>
          <Box sx={{
            width: 8, height: 8, borderRadius: '50%',
            backgroundColor: isOnline ? '#4caf50' : '#ff9800',
            animation: 'blink 1.5s infinite',
            '@keyframes blink': { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.3 } }
          }} />
          <Typography variant="caption" sx={{ color: isOnline ? '#4caf50' : '#ff9800', fontWeight: 600 }}>
            {isOnline ? 'Online' : `Offline (${offlineScans.length} pending)`}
          </Typography>
        </Box>
      </Box>

      {/* Tabs */}
      <Paper sx={{ mb: 2, backgroundColor: '#0d1b2e', border: '1px solid #1a2f4a' }} elevation={0}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{
          '& .MuiTab-root': { color: '#506680', fontSize: 13 },
          '& .Mui-selected': { color: '#4fc3f7' },
          '& .MuiTabs-indicator': { backgroundColor: '#4fc3f7' }
        }}>
          <Tab label="Scan" />
          <Tab label={`History (${scanHistory.length})`} />
          <Tab label="Batch" />
          <Tab label="Stats" />
        </Tabs>
      </Paper>

      {/* ── Single Scan ── */}
      {tab === 0 && (
        <Card>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="subtitle2" sx={{ color: '#90a4c1', mb: 2 }}>
              What are you doing with this parcel?
            </Typography>

            <ActionToggle />

            {/* Context hint */}
            <Box sx={{
              backgroundColor: action === 'load' ? '#4fc3f710' : '#4caf5010',
              border: `1px solid ${action === 'load' ? '#4fc3f730' : '#4caf5030'}`,
              borderRadius: 2, p: 1.5, mb: 3
            }}>
              <Typography variant="caption" sx={{ color: action === 'load' ? '#4fc3f7' : '#4caf50' }}>
                {action === 'load'
                  ? '🚚 Parcel will be marked In Transit — loaded onto your vehicle.'
                  : '🏢 Parcel will be marked Arrived — receiver must collect at branch with PIN.'
                }
              </Typography>
            </Box>

            {success && <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>{success}</Alert>}
            {error   && <Alert severity="error"   sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

            <Box sx={{
              border: '2px dashed #1a2f4a', borderRadius: 3,
              p: 4, textAlign: 'center', mb: 3, backgroundColor: '#0a1628'
            }}>
              <QrCodeScannerIcon sx={{ fontSize: 52, color: '#4fc3f7', mb: 1 }} />
              <Typography sx={{ color: '#506680', fontSize: 13 }}>Camera scanning — coming soon</Typography>
            </Box>

            <Divider sx={{ mb: 3 }}>
              <Typography variant="caption" sx={{ color: '#506680' }}>or enter manually</Typography>
            </Divider>

            <TextField
              fullWidth label="Waybill Number" value={waybill}
              onChange={e => setWaybill(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleScan()}
              placeholder="e.g. ZP-2026-4821"
              sx={{ mb: 2 }}
            />
            <Button fullWidth variant="contained" color="primary"
              onClick={handleScan} disabled={loading || !waybill.trim()}
              sx={{ py: 1.5 }}>
              {loading
                ? <CircularProgress size={22} color="inherit" />
                : action === 'load' ? 'Scan & Load' : 'Scan & Drop at Branch'
              }
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ── History ── */}
      {tab === 1 && (
        <Box>
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <Button size="small" variant="outlined" startIcon={<RefreshIcon />}
              onClick={() => {
                const h = JSON.parse(localStorage.getItem('scanHistory') || '[]')
                setScanHistory(h); updateStats(h)
              }}
              sx={{ color: '#4fc3f7', borderColor: '#1a2f4a' }}>
              Refresh
            </Button>
            <Button size="small" variant="outlined" startIcon={<ClearIcon />}
              onClick={clearHistory} sx={{ color: '#ef5350', borderColor: '#1a2f4a' }}>
              Clear All
            </Button>
          </Box>
          {scanHistory.length === 0
            ? <Card><CardContent sx={{ textAlign: 'center', py: 6 }}>
                <HistoryIcon sx={{ fontSize: 48, color: '#1a2f4a', mb: 1 }} />
                <Typography sx={{ color: '#506680' }}>No scan history yet.</Typography>
              </CardContent></Card>
            : <TableContainer component={Paper}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      {['Waybill', 'Sender → Receiver', 'Action', 'Time', ''].map(h => (
                        <TableCell key={h} sx={{ fontSize: 11 }}>{h}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {scanHistory.map((s, i) => (
                      <TableRow key={i}>
                        <TableCell sx={{ color: '#4fc3f7', fontWeight: 700, fontSize: 12 }}>{s.waybill}</TableCell>
                        <TableCell sx={{ color: '#90a4c1', fontSize: 11 }}>
                          {(s.senderName || '—').substring(0, 12)} → {(s.receiverName || '—').substring(0, 12)}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={s.action === 'load' ? 'LOADED' : 'DROPPED'}
                            size="small"
                            color={s.action === 'load' ? 'primary' : 'success'}
                          />
                        </TableCell>
                        <TableCell sx={{ color: '#506680', fontSize: 11 }}>{s.timestamp}</TableCell>
                        <TableCell>
                          <IconButton size="small" onClick={() => printLabel(s)} sx={{ color: '#4fc3f7' }}>
                            <PrintIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
          }
        </Box>
      )}

      {/* ── Batch Scan ── */}
      {tab === 2 && (
        <Card>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="subtitle2" sx={{ color: '#90a4c1', mb: 2 }}>
              What are you doing with these parcels?
            </Typography>
            <ActionToggle />

            <TextField fullWidth multiline rows={6}
              label="Waybills — one per line"
              value={batchWaybills} onChange={e => setBatchWaybills(e.target.value)}
              placeholder={'ZP-2026-001\nZP-2026-002\nZP-2026-003'}
              sx={{ mb: 2 }} />

            <Button fullWidth variant="contained" color="primary"
              onClick={handleBatchScan}
              disabled={batchLoading || !batchWaybills.trim()}
              sx={{ py: 1.5, mb: 2 }}>
              {batchLoading
                ? <CircularProgress size={22} color="inherit" />
                : action === 'load' ? 'Load All' : 'Drop All at Branch'
              }
            </Button>

            {batchResults.length > 0 && (
              <TableContainer component={Paper}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      {['Waybill', 'Result', 'Note'].map(h => (
                        <TableCell key={h} sx={{ fontSize: 11 }}>{h}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {batchResults.map((r, i) => (
                      <TableRow key={i}>
                        <TableCell sx={{ color: '#4fc3f7', fontSize: 12 }}>{r.waybill}</TableCell>
                        <TableCell>
                          <Chip label={r.success ? 'OK' : 'Failed'} size="small"
                            color={r.success ? 'success' : 'error'} />
                        </TableCell>
                        <TableCell sx={{ color: '#90a4c1', fontSize: 11 }}>
                          {r.error || (r.offline ? 'Saved offline' : 'Synced')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Stats ── */}
      {tab === 3 && (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 2 }}>
          {[
            { label: 'Total Scans', value: stats.total,   color: '#4fc3f7' },
            { label: 'Loaded',      value: stats.loaded,  color: '#4fc3f7' },
            { label: 'Dropped',     value: stats.dropped, color: '#4caf50' },
            { label: 'Failed',      value: stats.failed,  color: '#ef5350' },
          ].map(s => (
            <Card key={s.label}>
              <CardContent sx={{ p: 2 }}>
                <Typography variant="caption" sx={{ color: '#506680' }}>{s.label}</Typography>
                <Typography sx={{ color: s.color, fontWeight: 700, fontSize: 28 }}>{s.value}</Typography>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      {/* ── Confirm Dialog ── */}
      <Dialog
        open={showDetails}
        onClose={() => { setShowDetails(false); setWaybill('') }}
        maxWidth="sm" fullWidth
        PaperProps={{ sx: { backgroundColor: '#0d1b2e', border: '1px solid #1a2f4a' } }}
      >
        <DialogTitle sx={{ color: '#f0f4ff', fontWeight: 700, borderBottom: '1px solid #1a2f4a' }}>
          {action === 'load' ? '🚚 Load onto Truck' : '🏢 Drop at Branch'} — {selectedParcel?.waybill}
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {selectedParcel && (
            <>
              <Box sx={{ backgroundColor: '#0a1628', p: 2.5, borderRadius: 2, border: '1px solid #1a2f4a', mb: 2 }}>
                {[
                  { label: '📦 Waybill',        value: selectedParcel.waybill },
                  { label: '📍 Origin Branch',   value: selectedParcel.origin },
                  { label: '🏢 Dest. Branch',    value: selectedParcel.destination },
                  { label: '👤 Sender',          value: `${selectedParcel.senderName} (${selectedParcel.senderPhone})` },
                  { label: '👤 Receiver',        value: `${selectedParcel.receiverName} (${selectedParcel.receiverPhone})` },
                  { label: '📍 Collect At',      value: selectedParcel.deliveryLandmark },
                  { label: '⚖️ Weight',          value: `${selectedParcel.weightKg} kg` },
                  { label: '💵 Cost',            value: `K ${selectedParcel.cost}`, color: '#4caf50' },
                  { label: '📊 Current Status',  value: selectedParcel.status },
                ].map(row => (
                  <Box key={row.label} sx={{
                    display: 'flex', justifyContent: 'space-between',
                    py: 0.8, borderBottom: '1px solid #0f1e33'
                  }}>
                    <Typography variant="body2" sx={{ color: '#506680', fontSize: 12 }}>{row.label}</Typography>
                    <Typography variant="body2" sx={{ color: row.color ?? '#f0f4ff', fontWeight: 600, fontSize: 12, textAlign: 'right', maxWidth: '55%' }}>
                      {row.value}
                    </Typography>
                  </Box>
                ))}
              </Box>

              {/* Action result reminder */}
              <Box sx={{
                backgroundColor: action === 'load' ? '#4fc3f710' : '#4caf5010',
                border: `1px solid ${action === 'load' ? '#4fc3f730' : '#4caf5030'}`,
                borderRadius: 2, p: 1.5
              }}>
                <Typography variant="caption" sx={{ color: action === 'load' ? '#4fc3f7' : '#4caf50' }}>
                  {action === 'load'
                    ? '🚚 Confirming will mark this parcel as In Transit.'
                    : '🏢 Confirming will mark this parcel as Arrived at branch. Receiver collects with PIN.'
                  }
                </Typography>
              </Box>
            </>
          )}
          {!isOnline && (
            <Alert severity="warning" sx={{ mt: 2, borderRadius: 2 }}>
              You are offline. Scan will sync automatically when online.
            </Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid #1a2f4a' }}>
          <Button onClick={() => { setShowDetails(false); setWaybill('') }}
            sx={{ color: '#506680' }} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={confirmScan} variant="contained" color="primary"
            disabled={loading} sx={{ px: 3 }}>
            {loading
              ? <CircularProgress size={20} color="inherit" />
              : action === 'load' ? 'Confirm Load' : 'Confirm Drop at Branch'
            }
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}