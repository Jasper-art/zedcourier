import { useEffect, useState } from 'react'
import {
  Box, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, Chip, CircularProgress,
  Button, Dialog, DialogTitle, DialogContent, DialogActions,
  FormControlLabel, Checkbox, Alert, TextField, MenuItem, Card, CardContent,
  IconButton, Tooltip
} from '@mui/material'
import SendIcon from '@mui/icons-material/Send'
import SearchIcon from '@mui/icons-material/Search'
import KeyIcon from '@mui/icons-material/Key'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import WhatsAppIcon from '@mui/icons-material/WhatsApp'
import { api } from '../../../api'

const STATUS_COLOR = {
  Recorded: 'default', InTransit: 'warning',
  Arrived: 'info', Collected: 'success'
}

export default function MyParcelsTab() {
  const [parcels,         setParcels]        = useState([])
  const [allParcels,      setAllParcels]      = useState([])
  const [loading,         setLoading]         = useState(true)
  const [fetchError,      setFetchError]      = useState(null)
  const [showPinModal,    setShowPinModal]    = useState(false)
  const [selectedParcel,  setSelectedParcel]  = useState(null)
  const [sendingPin,      setSendingPin]      = useState(false)
  const [pinError,        setPinError]        = useState('')
  const [pinSuccess,      setPinSuccess]      = useState('')
  const [channels,        setChannels]        = useState({ email: true, sms: false, whatsapp: false })
  const [dateFilter,      setDateFilter]      = useState('all')
  const [statusFilter,    setStatusFilter]    = useState('')
  const [searchQuery,     setSearchQuery]     = useState('')
  const [customDateStart, setCustomDateStart] = useState('')
  const [customDateEnd,   setCustomDateEnd]   = useState('')
  const [showPinDialog,   setShowPinDialog]   = useState(false)
  const [pinParcel,       setPinParcel]       = useState(null)
  const [revealedPin,     setRevealedPin]     = useState('')
  const [regenerating,    setRegenerating]    = useState(false)
  const [regenError,      setRegenError]      = useState('')

  useEffect(() => { fetchParcels() }, [])
  useEffect(() => { applyFilters() }, [allParcels, dateFilter, statusFilter, searchQuery, customDateStart, customDateEnd])

const fetchParcels = async () => {
    setLoading(true)
    setFetchError(null)
    try {
      const parcels = await api.getParcels()
      setAllParcels(parcels)
    } catch (err) {
      setFetchError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const getDateRange = () => {
    const today    = new Date(); today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1)
    if (dateFilter === 'custom' && customDateStart && customDateEnd)
      return { start: new Date(customDateStart), end: new Date(customDateEnd) }
    if (dateFilter === 'today')  return { start: today, end: tomorrow }
    if (dateFilter === 'week')   { const s = new Date(today); s.setDate(s.getDate() - 7);  return { start: s, end: tomorrow } }
    if (dateFilter === 'month')  { const s = new Date(today); s.setDate(s.getDate() - 30); return { start: s, end: tomorrow } }
    return null
  }

  const applyFilters = () => {
    let filtered = [...allParcels]
    const range  = getDateRange()
    if (range) filtered = filtered.filter(p => { const d = new Date(p.createdAt); return d >= range.start && d < range.end })
    if (statusFilter)    filtered = filtered.filter(p => p.status === statusFilter)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      filtered = filtered.filter(p =>
        p.waybillNumber?.toLowerCase().includes(q) ||
        p.senderPhone?.includes(q) ||
        p.senderName?.toLowerCase().includes(q) ||
        p.receiverPhone?.includes(q) ||
        p.receiverName?.toLowerCase().includes(q)
      )
    }
    setParcels(filtered)
  }

  const handleSendPinClick = p => {
    setSelectedParcel(p); setShowPinModal(true); setPinError(''); setPinSuccess('')
  }

const handleSendPin = async () => {
    if (!selectedParcel) return
    setSendingPin(true); setPinError(''); setPinSuccess('')
    try {
      await api.apiPost(`parcel/${selectedParcel.id}/send-delivery-pin`, {
        sendEmail: channels.email,
        sendSms: channels.sms,
        sendWhatsapp: channels.whatsapp
      })
      setPinSuccess('PIN sent successfully!')
      setTimeout(() => { setShowPinModal(false); fetchParcels() }, 2000)
    } catch (err) { setPinError(err.message) }
    finally { setSendingPin(false) }
  }

  const handleShowPin = p => {
    setPinParcel(p); setRevealedPin(''); setRegenError(''); setShowPinDialog(true)
  }

const handleRegeneratePin = async () => {
    if (!pinParcel) return
    setRegenerating(true); setRegenError(''); setRevealedPin('')
    try {
      const data = await api.apiPost(`parcel/${pinParcel.id}/regenerate-pin`, {})
      setRevealedPin(data.pin)
    } catch (err) { setRegenError(err.message) }
    finally { setRegenerating(false) }
  }

  const copyPin = () => navigator.clipboard.writeText(revealedPin)

  const sendPinWhatsApp = () => {
    if (!pinParcel || !revealedPin) return
    const msg    = encodeURIComponent(`Hello ${pinParcel.receiverName || 'Customer'},\n\nYour ZedCourier parcel is ready!\n\nWaybill: ${pinParcel.waybillNumber}\nCollection PIN: *${revealedPin}*\n\nCollect at: ${pinParcel.deliveryLandmark}\n\n— ZedCourier Pro`)
    const number = (pinParcel.receiverPhone || '').replace(/\D/g, '')
    window.open(`https://wa.me/${number}?text=${msg}`, '_blank')
  }

  const exportToCSV = () => {
    const headers = ['Waybill', 'Sender Name', 'Sender Phone', 'Receiver Name', 'Receiver Phone', 'Cost', 'Status', 'PIN Sent', 'Created Date']
    const rows    = parcels.map(p => [p.waybillNumber, p.senderName || '', p.senderPhone, p.receiverName || '', p.receiverPhone, p.cost, p.status, p.pinSent ? 'Yes' : 'No', p.createdAt ? new Date(p.createdAt).toLocaleDateString() : ''])
    const csv     = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n')
    const a       = document.createElement('a')
    a.href        = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    a.download    = `parcels_${new Date().toLocaleDateString('en-CA')}.csv`
    a.click()
  }

  const exportToPDF = () => {
    const html = `<html><head><title>ZedCourier Parcels</title>
      <style>body{font-family:Arial;margin:20px}h1{color:#1565c0}table{width:100%;border-collapse:collapse}th{background:#1565c0;color:#fff;padding:8px;font-size:11px;text-align:left}td{padding:7px 8px;border-bottom:1px solid #eee;font-size:11px}tr:nth-child(even)td{background:#f5f9ff}</style></head>
      <body><h1>ZedCourier Pro — Parcels Report</h1>
      <p>Generated: ${new Date().toLocaleString()} · Total: ${parcels.length}</p>
      <table><thead><tr><th>Waybill</th><th>Sender</th><th>Receiver</th><th>Cost</th><th>Status</th><th>PIN Sent</th><th>Date</th></tr></thead>
      <tbody>${parcels.map(p => `<tr><td><strong>${p.waybillNumber}</strong></td><td>${p.senderName} (${p.senderPhone})</td><td>${p.receiverName} (${p.receiverPhone})</td><td>K ${p.cost}</td><td>${p.status}</td><td>${p.pinSent ? 'Yes' : 'No'}</td><td>${p.createdAt ? new Date(p.createdAt).toLocaleDateString() : ''}</td></tr>`).join('')}
      </tbody></table></body></html>`
    const iframe = document.createElement('iframe')
    iframe.src   = URL.createObjectURL(new Blob([html], { type: 'text/html' }))
    document.body.appendChild(iframe)
    setTimeout(() => { iframe.contentWindow.print(); document.body.removeChild(iframe) }, 500)
  }

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress sx={{ color: '#4fc3f7' }} /></Box>

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ color: '#f0f4ff', fontWeight: 700 }}>My Parcels</Typography>
        <Typography variant="body2" sx={{ color: '#506680' }}>{parcels.length} of {allParcels.length} parcels</Typography>
      </Box>

      {fetchError && <Alert severity="error" sx={{ mb: 3 }}>{fetchError}</Alert>}

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <TextField placeholder="Search waybill, name, phone..." value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)} size="small"
              InputProps={{ startAdornment: <SearchIcon sx={{ mr: 1, color: '#506680' }} /> }}
              sx={{ flex: 1, minWidth: 220 }} />
            <TextField select label="Period" value={dateFilter} onChange={e => setDateFilter(e.target.value)} size="small" sx={{ minWidth: 130 }}>
              <MenuItem value="all">All Time</MenuItem>
              <MenuItem value="today">Today</MenuItem>
              <MenuItem value="week">This Week</MenuItem>
              <MenuItem value="month">This Month</MenuItem>
              <MenuItem value="custom">Custom</MenuItem>
            </TextField>
            {dateFilter === 'custom' && <>
              <TextField type="date" label="From" value={customDateStart} onChange={e => setCustomDateStart(e.target.value)} size="small" InputLabelProps={{ shrink: true }} sx={{ minWidth: 140 }} />
              <TextField type="date" label="To" value={customDateEnd} onChange={e => setCustomDateEnd(e.target.value)} size="small" InputLabelProps={{ shrink: true }} sx={{ minWidth: 140 }} />
            </>}
            <TextField select label="Status" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} size="small" sx={{ minWidth: 130 }}>
              <MenuItem value="">All</MenuItem>
              <MenuItem value="Recorded">Recorded</MenuItem>
              <MenuItem value="InTransit">In Transit</MenuItem>
              <MenuItem value="Arrived">Arrived</MenuItem>
              <MenuItem value="Collected">Collected</MenuItem>
            </TextField>
            <Button size="small" onClick={() => { setDateFilter('all'); setStatusFilter(''); setSearchQuery('') }} sx={{ color: '#506680' }}>Clear</Button>
            <Button size="small" variant="outlined" onClick={exportToCSV} disabled={!parcels.length} sx={{ borderColor: '#1a2f4a', color: '#4caf50' }}>CSV</Button>
            <Button size="small" variant="outlined" onClick={exportToPDF} disabled={!parcels.length} sx={{ borderColor: '#1a2f4a', color: '#ffb74d' }}>PDF</Button>
          </Box>
        </CardContent>
      </Card>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              {['Waybill', 'Sender', 'Receiver', 'Landmark', 'Cost', 'Status', 'PIN', 'Actions', 'Date'].map(h => (
                <TableCell key={h}>{h}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {parcels.length === 0
              ? <TableRow><TableCell colSpan={9} sx={{ textAlign: 'center', py: 6, color: '#506680' }}>No parcels match your filters.</TableCell></TableRow>
              : parcels.map(p => (
              <TableRow key={p.id} sx={{ '&:hover': { backgroundColor: '#4fc3f708' } }}>
                <TableCell sx={{ color: '#4fc3f7', fontWeight: 700 }}>{p.waybillNumber}</TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#f0f4ff' }}>{p.senderName || '—'}</Typography>
                  <Typography variant="caption" sx={{ color: '#506680' }}>{p.senderPhone}</Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#f0f4ff' }}>{p.receiverName || '—'}</Typography>
                  <Typography variant="caption" sx={{ color: '#506680' }}>{p.receiverPhone}</Typography>
                </TableCell>
                <TableCell sx={{ color: '#90a4c1', maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.deliveryLandmark}</TableCell>
                <TableCell sx={{ color: '#4caf50', fontWeight: 600 }}>K {p.cost}</TableCell>
                <TableCell><Chip label={p.status} color={STATUS_COLOR[p.status] ?? 'default'} size="small" /></TableCell>
                <TableCell>
                  <Chip label={p.pinSent ? '✓ Sent' : 'Pending'} size="small"
                    sx={{ backgroundColor: p.pinSent ? '#4caf5020' : '#1a2f4a', color: p.pinSent ? '#4caf50' : '#506680', fontWeight: 600 }} />
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <Tooltip title="Send PIN to receiver">
                      <span>
                        <IconButton size="small" onClick={() => handleSendPinClick(p)}
                          disabled={p.status !== 'Recorded' && p.status !== 'Arrived'}
                          sx={{ color: '#4fc3f7' }}>
                          <SendIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                    <Tooltip title="View / Regenerate PIN">
                      <span>
                        <IconButton size="small" onClick={() => handleShowPin(p)}
                          disabled={p.status === 'Collected'}
                          sx={{ color: '#ce93d8' }}>
                          <KeyIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </Box>
                </TableCell>
                <TableCell sx={{ fontSize: 12, color: '#506680' }}>{p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '—'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Send PIN Modal */}
      <Dialog open={showPinModal} onClose={() => setShowPinModal(false)} maxWidth="xs" fullWidth
        PaperProps={{ sx: { backgroundColor: '#0d1b2e', border: '1px solid #1a2f4a' } }}>
        <DialogTitle sx={{ borderBottom: '1px solid #1a2f4a', color: '#f0f4ff' }}>Send Delivery PIN</DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {pinError   && <Alert severity="error"   sx={{ mb: 2 }}>{pinError}</Alert>}
          {pinSuccess && <Alert severity="success" sx={{ mb: 2 }}>{pinSuccess}</Alert>}
          <Typography sx={{ color: '#4fc3f7', mb: 1, fontWeight: 700 }}>{selectedParcel?.waybillNumber}</Typography>
          <Typography sx={{ color: '#506680', mb: 2, fontSize: 14 }}>Choose how to notify the receiver:</Typography>
          {['email', 'sms', 'whatsapp'].map(ch => (
            <FormControlLabel key={ch}
              control={<Checkbox checked={channels[ch]} onChange={() => setChannels(p => ({ ...p, [ch]: !p[ch] }))}
                sx={{ color: '#4fc3f7', '&.Mui-checked': { color: '#4fc3f7' } }} />}
              label={<Typography sx={{ color: '#90a4c1', fontSize: 14 }}>{ch === 'whatsapp' ? 'WhatsApp' : ch.charAt(0).toUpperCase() + ch.slice(1)}</Typography>}
              sx={{ display: 'block', mb: 0.5 }} />
          ))}
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid #1a2f4a' }}>
          <Button onClick={() => setShowPinModal(false)} sx={{ color: '#506680' }}>Cancel</Button>
          <Button variant="contained" color="primary" onClick={handleSendPin}
            disabled={sendingPin || !Object.values(channels).some(Boolean)}>
            {sendingPin ? <CircularProgress size={20} color="inherit" /> : 'Send Now'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* PIN Reveal Dialog */}
      <Dialog open={showPinDialog} onClose={() => { setShowPinDialog(false); setRevealedPin('') }}
        maxWidth="xs" fullWidth
        PaperProps={{ sx: { backgroundColor: '#0d1b2e', border: '1px solid #1a2f4a' } }}>
        <DialogTitle sx={{ borderBottom: '1px solid #1a2f4a', color: '#f0f4ff' }}>
          Collection PIN — {pinParcel?.waybillNumber}
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Typography sx={{ color: '#506680', fontSize: 13, mb: 2 }}>
            PINs are hashed for security. Generate a new PIN to share with the receiver.
          </Typography>
          {regenError && <Alert severity="error" sx={{ mb: 2 }}>{regenError}</Alert>}

          {revealedPin ? (
            <Box sx={{ backgroundColor: '#0a1628', border: '1px solid #4fc3f740', borderRadius: 2, p: 3, textAlign: 'center', mb: 2 }}>
              <Typography variant="caption" sx={{ color: '#506680' }}>NEW COLLECTION PIN</Typography>
              <Typography sx={{ color: '#4fc3f7', fontWeight: 800, fontSize: 48, fontFamily: 'monospace', letterSpacing: 10, my: 1 }}>
                {revealedPin}
              </Typography>
              <Typography variant="caption" sx={{ color: '#506680' }}>
                Share with {pinParcel?.receiverName || 'receiver'}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', mt: 2 }}>
                <Button size="small" variant="outlined" startIcon={<ContentCopyIcon />} onClick={copyPin}
                  sx={{ borderColor: '#1a2f4a', color: '#4fc3f7', fontSize: 12 }}>
                  Copy
                </Button>
                {pinParcel?.receiverPhone && (
                  <Button size="small" variant="contained" startIcon={<WhatsAppIcon />} onClick={sendPinWhatsApp}
                    sx={{ backgroundColor: '#25d366', color: '#fff', fontSize: 12, '&:hover': { backgroundColor: '#1ebe5d' } }}>
                    WhatsApp
                  </Button>
                )}
              </Box>
            </Box>
          ) : (
            <Box sx={{ backgroundColor: '#0a1628', border: '2px dashed #1a2f4a', borderRadius: 2, p: 3, textAlign: 'center', mb: 2 }}>
              <KeyIcon sx={{ fontSize: 40, color: '#1a2f4a', mb: 1 }} />
              <Typography sx={{ color: '#506680', fontSize: 13 }}>Click below to generate a new PIN</Typography>
            </Box>
          )}

          <Alert severity="warning" sx={{ fontSize: 12 }}>
            Generating a new PIN invalidates the old one.
          </Alert>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid #1a2f4a' }}>
          <Button onClick={() => { setShowPinDialog(false); setRevealedPin('') }} sx={{ color: '#506680' }}>Close</Button>
          <Button variant="contained" color="primary" onClick={handleRegeneratePin}
            disabled={regenerating} startIcon={<KeyIcon />}>
            {regenerating ? <CircularProgress size={20} color="inherit" /> : 'Generate New PIN'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}