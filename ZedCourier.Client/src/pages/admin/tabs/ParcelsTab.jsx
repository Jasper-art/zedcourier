import { useEffect, useState } from 'react'
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Chip, CircularProgress, TextField,
  MenuItem, Button, Drawer, Divider, IconButton, Alert,
  Select, FormControl, InputLabel, Stack
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import FileDownloadIcon from '@mui/icons-material/FileDownload'
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf'
import CloseIcon from '@mui/icons-material/Close'
import EditIcon from '@mui/icons-material/Edit'
import LocalShippingIcon from '@mui/icons-material/LocalShipping'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import PersonIcon from '@mui/icons-material/Person'
import KeyIcon from '@mui/icons-material/Key'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import WhatsAppIcon from '@mui/icons-material/WhatsApp'

const token = () => localStorage.getItem('token')

const STATUS_COLOR = {
  Recorded: 'default', InTransit: 'warning',
  Arrived: 'info', Collected: 'success'
}

const STATUSES = ['All', 'Recorded', 'InTransit', 'Arrived', 'Collected']

export default function ParcelsTab() {
  const [parcels,      setParcels]      = useState([])
  const [loading,      setLoading]      = useState(true)
  const [search,       setSearch]       = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [dateFilter,   setDateFilter]   = useState('')
  const [selected,     setSelected]     = useState(null)
  const [drawerOpen,   setDrawerOpen]   = useState(false)
  const [updating,     setUpdating]     = useState(false)
  const [newStatus,    setNewStatus]    = useState('')
  const [updateMsg,    setUpdateMsg]    = useState('')
  const [revealedPin,  setRevealedPin]  = useState('')
  const [regenerating, setRegenerating] = useState(false)
  const [regenError,   setRegenError]   = useState('')

  const load = () => {
    setLoading(true)
    fetch('${import.meta.env.VITE_API_URL}/api/v1/parcel', {
      headers: { Authorization: `Bearer ${token()}` }
    })
      .then(r => r.json())
      .then(setParcels)
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const filtered = parcels.filter(p => {
    const matchSearch = !search ||
      p.waybillNumber?.toLowerCase().includes(search.toLowerCase()) ||
      p.senderPhone?.includes(search) ||
      p.senderName?.toLowerCase().includes(search.toLowerCase()) ||
      p.receiverName?.toLowerCase().includes(search.toLowerCase()) ||
      p.receiverPhone?.includes(search) ||
      p.deliveryLandmark?.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'All' || p.status === statusFilter
    const matchDate   = !dateFilter || new Date(p.createdAt).toLocaleDateString('en-CA') === dateFilter
    return matchSearch && matchStatus && matchDate
  })

  const openDrawer = p => {
    setSelected(p)
    setNewStatus(p.status)
    setUpdateMsg('')
    setRevealedPin('')
    setRegenError('')
    setDrawerOpen(true)
  }

  const handleStatusUpdate = async () => {
    if (!selected || newStatus === selected.status) return
    setUpdating(true)
    setUpdateMsg('')
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/parcel/${selected.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ newStatus, notes: `Status updated to ${newStatus} by Admin.` })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setUpdateMsg('Status updated successfully.')
      load()
      setSelected(prev => ({ ...prev, status: newStatus }))
    } catch (err) {
      setUpdateMsg(err.message)
    } finally {
      setUpdating(false)
    }
  }

  const handleRegeneratePin = async () => {
    if (!selected) return
    setRegenerating(true)
    setRegenError('')
    setRevealedPin('')
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/parcel/${selected.id}/regenerate-pin`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token()}` }
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to regenerate PIN')
      setRevealedPin(data.pin)
    } catch (err) {
      setRegenError(err.message)
    } finally {
      setRegenerating(false)
    }
  }

  const exportCSV = () => {
    const headers = ['Waybill', 'Sender Name', 'Sender Phone', 'Sender Email', 'Receiver Name', 'Receiver Phone', 'Receiver Email', 'Landmark', 'Weight(kg)', 'Cost(ZMW)', 'Status', 'Created']
    const rows = filtered.map(p => [
      p.waybillNumber,
      p.senderName, p.senderPhone, p.senderEmail,
      p.receiverName, p.receiverPhone, p.receiverEmail,
      p.deliveryLandmark, p.weightKg, p.cost, p.status,
      new Date(p.createdAt).toLocaleDateString()
    ])
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url
    a.download = `ZedCourier_Parcels_${new Date().toLocaleDateString('en-CA')}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const exportPDF = () => {
    const rows = filtered.map(p =>
      `<tr>
        <td>${p.waybillNumber}</td>
        <td>${p.senderName || '—'}<br/><span style="color:#888">${p.senderPhone}</span></td>
        <td>${p.receiverName || '—'}<br/><span style="color:#888">${p.receiverPhone}</span></td>
        <td>${p.deliveryLandmark}</td>
        <td>${p.weightKg} kg</td>
        <td>K ${p.cost}</td>
        <td>${p.status}</td>
        <td>${new Date(p.createdAt).toLocaleDateString()}</td>
      </tr>`
    ).join('')

    const html = `
      <html><head><title>ZedCourier Parcels Report</title>
      <style>
        body { font-family: Arial, sans-serif; font-size: 12px; padding: 20px; }
        h2 { color: #1565c0; }
        p { color: #666; margin: 0 0 16px; }
        table { width: 100%; border-collapse: collapse; }
        th { background: #1565c0; color: #fff; padding: 8px; text-align: left; font-size: 11px; }
        td { padding: 7px 8px; border-bottom: 1px solid #eee; font-size: 11px; vertical-align: top; }
        tr:nth-child(even) td { background: #f5f9ff; }
      </style></head>
      <body>
        <h2>ZedCourier Pro — Parcels Report</h2>
        <p>Generated: ${new Date().toLocaleString()} · Total: ${filtered.length} parcels</p>
        <table>
          <thead><tr>
            <th>Waybill</th><th>Sender</th><th>Receiver</th><th>Landmark</th>
            <th>Weight</th><th>Cost</th><th>Status</th><th>Created</th>
          </tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </body></html>`

    const win = window.open('', '_blank')
    win.document.write(html)
    win.document.close()
    win.print()
  }

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
      <CircularProgress sx={{ color: '#4fc3f7' }} />
    </Box>
  )

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ color: '#f0f4ff', fontWeight: 700 }}>Parcels</Typography>
          <Typography variant="body2" sx={{ color: '#506680' }}>
            {filtered.length} of {parcels.length} parcels
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" size="small" startIcon={<FileDownloadIcon />} onClick={exportCSV}
            sx={{ borderColor: '#1a2f4a', color: '#4fc3f7', '&:hover': { borderColor: '#4fc3f7' } }}>
            CSV
          </Button>
          <Button variant="outlined" size="small" startIcon={<PictureAsPdfIcon />} onClick={exportPDF}
            sx={{ borderColor: '#1a2f4a', color: '#ce93d8', '&:hover': { borderColor: '#ce93d8' } }}>
            PDF
          </Button>
        </Stack>
      </Box>

      {/* Filters */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <TextField
          size="small" placeholder="Search waybill, name, phone, landmark..."
          value={search} onChange={e => setSearch(e.target.value)}
          InputProps={{ startAdornment: <SearchIcon sx={{ color: '#506680', mr: 1, fontSize: 18 }} /> }}
          sx={{ flex: 1, minWidth: 220 }}
        />
        <TextField select size="small" label="Status"
          value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          sx={{ minWidth: 140 }}>
          {STATUSES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
        </TextField>
        <TextField size="small" type="date" label="Date"
          value={dateFilter} onChange={e => setDateFilter(e.target.value)}
          InputLabelProps={{ shrink: true }} sx={{ minWidth: 160 }} />
        {(search || statusFilter !== 'All' || dateFilter) && (
          <Button size="small"
            onClick={() => { setSearch(''); setStatusFilter('All'); setDateFilter('') }}
            sx={{ color: '#506680' }}>
            Clear
          </Button>
        )}
      </Box>

      {/* Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              {['Waybill', 'Sender', 'Receiver', 'Landmark', 'Weight', 'Cost', 'Status', 'Created', ''].map(h => (
                <TableCell key={h}>{h}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} sx={{ textAlign: 'center', color: '#506680', py: 6 }}>
                  No parcels match your filters.
                </TableCell>
              </TableRow>
            ) : filtered.map(p => (
              <TableRow key={p.id} onClick={() => openDrawer(p)}
                sx={{ cursor: 'pointer', '&:hover': { backgroundColor: '#4fc3f708' } }}>
                <TableCell sx={{ color: '#4fc3f7', fontWeight: 700 }}>{p.waybillNumber}</TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#f0f4ff' }}>{p.senderName || '—'}</Typography>
                  <Typography variant="caption" sx={{ color: '#506680' }}>{p.senderPhone}</Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#f0f4ff' }}>{p.receiverName || '—'}</Typography>
                  <Typography variant="caption" sx={{ color: '#506680' }}>{p.receiverPhone}</Typography>
                </TableCell>
                <TableCell sx={{ maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#90a4c1' }}>
                  {p.deliveryLandmark}
                </TableCell>
                <TableCell>{p.weightKg} kg</TableCell>
                <TableCell sx={{ color: '#4caf50', fontWeight: 600 }}>K {p.cost}</TableCell>
                <TableCell>
                  <Chip label={p.status} color={STATUS_COLOR[p.status] ?? 'default'} size="small" />
                </TableCell>
                <TableCell sx={{ fontSize: 12 }}>{new Date(p.createdAt).toLocaleDateString()}</TableCell>
                <TableCell>
                  <IconButton size="small" sx={{ color: '#506680' }}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Detail Drawer */}
      <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)}
        PaperProps={{ sx: { width: 400, backgroundColor: '#080f1e', borderLeft: '1px solid #1a2f4a', p: 3 } }}>
        {selected && (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Box>
                <Typography variant="h6" sx={{ color: '#4fc3f7', fontWeight: 800, letterSpacing: 1 }}>
                  {selected.waybillNumber}
                </Typography>
                <Chip label={selected.status} color={STATUS_COLOR[selected.status] ?? 'default'} size="small" sx={{ mt: 0.5 }} />
              </Box>
              <IconButton onClick={() => setDrawerOpen(false)} sx={{ color: '#506680' }}>
                <CloseIcon />
              </IconButton>
            </Box>

            <Divider sx={{ mb: 2 }} />

            {/* Sender */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
              <PersonIcon sx={{ color: '#4fc3f7', fontSize: 16 }} />
              <Typography variant="subtitle2" sx={{ color: '#4fc3f7' }}>Sender</Typography>
            </Box>
            {[
              { label: 'Name',  value: selected.senderName  || '—' },
              { label: 'Phone', value: selected.senderPhone || '—' },
              { label: 'Email', value: selected.senderEmail || '—' },
            ].map(row => (
              <Box key={row.label} sx={{ display: 'flex', justifyContent: 'space-between', py: 1, borderBottom: '1px solid #0f1e33' }}>
                <Typography variant="body2" sx={{ color: '#506680' }}>{row.label}</Typography>
                <Typography variant="body2" sx={{ color: '#f0f4ff', fontWeight: 600 }}>{row.value}</Typography>
              </Box>
            ))}

            <Divider sx={{ my: 2 }} />

            {/* Receiver */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
              <PersonIcon sx={{ color: '#4caf50', fontSize: 16 }} />
              <Typography variant="subtitle2" sx={{ color: '#4caf50' }}>Receiver</Typography>
            </Box>
            {[
              { label: 'Name',  value: selected.receiverName  || '—' },
              { label: 'Phone', value: selected.receiverPhone || '—' },
              { label: 'Email', value: selected.receiverEmail || '—' },
            ].map(row => (
              <Box key={row.label} sx={{ display: 'flex', justifyContent: 'space-between', py: 1, borderBottom: '1px solid #0f1e33' }}>
                <Typography variant="body2" sx={{ color: '#506680' }}>{row.label}</Typography>
                <Typography variant="body2" sx={{ color: '#f0f4ff', fontWeight: 600 }}>{row.value}</Typography>
              </Box>
            ))}

            <Divider sx={{ my: 2 }} />

            {/* Parcel */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
              <LocalShippingIcon sx={{ color: '#ffb74d', fontSize: 16 }} />
              <Typography variant="subtitle2" sx={{ color: '#ffb74d' }}>Parcel</Typography>
            </Box>
            {[
              { label: 'Weight',  value: `${selected.weightKg} kg` },
              { label: 'Cost',    value: `K ${selected.cost}`, color: '#4caf50' },
              { label: 'Created', value: new Date(selected.createdAt).toLocaleString() },
            ].map(row => (
              <Box key={row.label} sx={{ display: 'flex', justifyContent: 'space-between', py: 1, borderBottom: '1px solid #0f1e33' }}>
                <Typography variant="body2" sx={{ color: '#506680' }}>{row.label}</Typography>
                <Typography variant="body2" sx={{ color: row.color ?? '#f0f4ff', fontWeight: 600 }}>{row.value}</Typography>
              </Box>
            ))}

            {/* Landmark */}
            <Box sx={{ backgroundColor: '#0a1628', borderRadius: 2, p: 2, mt: 2, mb: 3, display: 'flex', gap: 1 }}>
              <LocationOnIcon sx={{ color: '#4fc3f7', fontSize: 18, mt: 0.2 }} />
              <Box>
                <Typography variant="caption" sx={{ color: '#506680' }}>COLLECT AT</Typography>
                <Typography sx={{ color: '#4fc3f7', fontWeight: 700, fontSize: 14 }}>
                  {selected.deliveryLandmark}
                </Typography>
              </Box>
            </Box>

            <Divider sx={{ mb: 2 }} />

            {/* PIN Section */}
            <Typography variant="subtitle2" sx={{ color: '#90a4c1', mb: 1.5 }}>Collection PIN</Typography>
            {regenError && <Alert severity="error" sx={{ mb: 2, borderRadius: 2, fontSize: 12 }}>{regenError}</Alert>}

            {revealedPin ? (
              <Box sx={{ backgroundColor: '#0a1628', border: '1px solid #4fc3f740', borderRadius: 2, p: 2, mb: 2, textAlign: 'center' }}>
                <Typography variant="caption" sx={{ color: '#506680' }}>NEW PIN</Typography>
                <Typography sx={{ color: '#4fc3f7', fontWeight: 800, fontSize: 40, fontFamily: 'monospace', letterSpacing: 8, my: 0.5 }}>
                  {revealedPin}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', mt: 1 }}>
                  <Button size="small" variant="outlined" startIcon={<ContentCopyIcon />}
                    onClick={() => navigator.clipboard.writeText(revealedPin)}
                    sx={{ borderColor: '#1a2f4a', color: '#4fc3f7', fontSize: 11 }}>
                    Copy
                  </Button>
                  {selected?.receiverPhone && (
                    <Button size="small" variant="contained" startIcon={<WhatsAppIcon />}
                      onClick={() => {
                        const msg = encodeURIComponent(`Hello ${selected.receiverName || 'Customer'},\n\nYour parcel ${selected.waybillNumber} delivery PIN: *${revealedPin}*\n\nCollect at: ${selected.deliveryLandmark}`)
                        window.open(`https://wa.me/${selected.receiverPhone.replace(/\D/g, '')}?text=${msg}`, '_blank')
                      }}
                      sx={{ backgroundColor: '#25d366', color: '#fff', fontSize: 11, '&:hover': { backgroundColor: '#1ebe5d' } }}>
                      WhatsApp
                    </Button>
                  )}
                </Box>
              </Box>
            ) : (
              <Alert severity="info" sx={{ mb: 2, fontSize: 12 }}>
                PINs are hashed. Generate a new one if receiver needs it.
              </Alert>
            )}

            <Button fullWidth variant="outlined" startIcon={<KeyIcon />}
              onClick={handleRegeneratePin}
              disabled={regenerating || selected?.status === 'Collected'}
              sx={{ mb: 3, borderColor: '#1a2f4a', color: '#ce93d8', '&:hover': { borderColor: '#ce93d8' } }}>
              {regenerating ? <CircularProgress size={18} color="inherit" /> : 'Generate New PIN'}
            </Button>

            <Divider sx={{ mb: 2 }} />

            {/* Status Update */}
            <Typography variant="subtitle2" sx={{ color: '#90a4c1', mb: 1.5 }}>Update Status</Typography>
            {updateMsg && (
              <Alert severity={updateMsg.includes('success') ? 'success' : 'error'} sx={{ mb: 2, borderRadius: 2 }}>
                {updateMsg}
              </Alert>
            )}
            <FormControl fullWidth size="small" sx={{ mb: 2 }}>
              <InputLabel>New Status</InputLabel>
              <Select value={newStatus} label="New Status" onChange={e => setNewStatus(e.target.value)}>
                {['Recorded', 'InTransit', 'Arrived', 'Collected'].map(s => (
                  <MenuItem key={s} value={s}>{s}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button fullWidth variant="contained" color="primary"
              onClick={handleStatusUpdate} disabled={updating || newStatus === selected.status}
              sx={{ py: 1.3 }}>
              {updating ? <CircularProgress size={20} color="inherit" /> : 'Update Status'}
            </Button>
          </Box>
        )}
      </Drawer>
    </Box>
  )
}