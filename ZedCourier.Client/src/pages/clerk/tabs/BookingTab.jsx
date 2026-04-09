import { useEffect, useState } from 'react'
import {
  Box, Typography, Card, CardContent, TextField,
  Button, Grid, MenuItem, Alert, CircularProgress, Divider, Chip, Autocomplete, Dialog,
  DialogTitle, DialogContent, DialogActions, FormControlLabel, Checkbox
} from '@mui/material'
import LocalShippingIcon from '@mui/icons-material/LocalShipping'
import RestoreIcon from '@mui/icons-material/Restore'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import NotificationsIcon from '@mui/icons-material/Notifications'

const token = () => localStorage.getItem('token')
const user = () => JSON.parse(localStorage.getItem('user') || '{}')

export default function BookingTab() {
  const [branches, setBranches] = useState([])
  const [recentSenders, setRecentSenders] = useState([])
  const [recentReceivers, setRecentReceivers] = useState([])
  const [parcels, setParcels] = useState([])
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(null)
  const [error, setError] = useState('')
  const [showRecent, setShowRecent] = useState(false)
  const [senderSuggestions, setSenderSuggestions] = useState([])
  const [receiverSuggestions, setReceiverSuggestions] = useState([])
  const [showNotificationDialog, setShowNotificationDialog] = useState(false)
  const [notificationPrefs, setNotificationPrefs] = useState({
    sendReceiverPin: true,
    pinViaEmail: true,
    pinViaSms: false,
    pinViaWhatsapp: false,
    notifySenderOnCreation: false,
    senderNotificationEmail: false,
    senderNotificationSms: false,
    senderNotificationWhatsapp: false
  })

  const [form, setForm] = useState({
    senderName: '',
    senderPhone: '',
    senderEmail: '',
    receiverName: '',
    receiverPhone: '',
    receiverEmail: '',
    originBranchId: '',
    destinationBranchId: '',
    deliveryLandmark: '',
    weightKg: '',
    cost: '',
  })

  const [formErrors, setFormErrors] = useState({})

  useEffect(() => {
    Promise.all([
      fetch('http://localhost:5076/api/v1/branch', {
        headers: { Authorization: `Bearer ${token()}` }
      }).then(r => r.json()),
      fetch('http://localhost:5076/api/v1/parcel', {
        headers: { Authorization: `Bearer ${token()}` }
      }).then(r => r.json())
    ])
      .then(([branchesData, parcelsData]) => {
        setBranches(branchesData)
        setParcels(parcelsData)
        
        // Auto-fill origin branch with user's branch
        const userBranchId = user().branchId
        if (userBranchId) {
          setForm(prev => ({ ...prev, originBranchId: userBranchId }))
        }
        
        // Extract recent senders and receivers
        const senders = [...new Map(parcelsData.map(p => [p.senderPhone, { name: p.senderName, phone: p.senderPhone, email: p.senderEmail }])).values()].slice(0, 5)
        const receivers = [...new Map(parcelsData.map(p => [p.receiverPhone, { name: p.receiverName, phone: p.receiverPhone, email: p.receiverEmail }])).values()].slice(0, 5)
        
        setRecentSenders(senders)
        setRecentReceivers(receivers)
      })
  }, [])

  const validateForm = () => {
    const errors = {}
    if (!form.senderName.trim()) errors.senderName = 'Sender name required'
    if (!form.senderPhone.trim()) errors.senderPhone = 'Sender phone required'
    if (!form.receiverName.trim()) errors.receiverName = 'Receiver name required'
    if (!form.receiverPhone.trim()) errors.receiverPhone = 'Receiver phone required'
    if (!form.originBranchId) errors.originBranchId = 'Origin branch required'
    if (!form.destinationBranchId) errors.destinationBranchId = 'Destination branch required'
    if (form.originBranchId === form.destinationBranchId) errors.destinationBranchId = 'Origin and destination cannot be same'
    if (!form.cost) errors.cost = 'Cost required'
    if (parseFloat(form.cost) <= 0) errors.cost = 'Cost must be greater than 0'
    
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleChange = e => {
    const { name, value } = e.target
    setForm({ ...form, [name]: value })
    if (formErrors[name]) {
      setFormErrors({ ...formErrors, [name]: '' })
    }

    // Auto-suggestions
    if (name === 'senderName' || name === 'senderPhone') {
      const filtered = recentSenders.filter(s => 
        s.name.toLowerCase().includes(value.toLowerCase()) || 
        s.phone.includes(value)
      )
      setSenderSuggestions(filtered)
    }
    if (name === 'receiverName' || name === 'receiverPhone') {
      const filtered = recentReceivers.filter(r => 
        r.name.toLowerCase().includes(value.toLowerCase()) || 
        r.phone.includes(value)
      )
      setReceiverSuggestions(filtered)
    }
  }

  const fillSender = (sender) => {
    setForm({ ...form, senderName: sender.name, senderPhone: sender.phone, senderEmail: sender.email || '' })
    setSenderSuggestions([])
  }

  const fillReceiver = (receiver) => {
    setForm({ ...form, receiverName: receiver.name, receiverPhone: receiver.phone, receiverEmail: receiver.email || '' })
    setReceiverSuggestions([])
  }

  const sendDeliveryPin = async (waybill, parcelData) => {
    try {
      if (!notificationPrefs.sendReceiverPin) return

      const sendEmail = notificationPrefs.pinViaEmail && form.receiverEmail
      const sendSms = notificationPrefs.pinViaSms && form.receiverPhone
      const sendWhatsapp = notificationPrefs.pinViaWhatsapp && form.receiverPhone

      if (!sendEmail && !sendSms && !sendWhatsapp) return

      // First, get the parcel to retrieve the PIN
      const res = await fetch(`http://localhost:5076/api/v1/parcel/${parcelData.id}`, {
        headers: { Authorization: `Bearer ${token()}` }
      })
      const parcelDetails = await res.json()
      const pin = parcelDetails.parcel?.deliveryPin || success?.pinForClient

      await fetch(`http://localhost:5076/api/v1/parcel/${parcelData.id}/send-delivery-pin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify({
          sendEmail: sendEmail,
          sendSms: sendSms,
          sendWhatsapp: sendWhatsapp
        })
      })
    } catch (err) {
      console.error('Error sending delivery PIN:', err)
    }
  }

  const notifySender = async (waybill) => {
    try {
      if (!notificationPrefs.notifySenderOnCreation) return

      const sendEmail = notificationPrefs.senderNotificationEmail && form.senderEmail
      const sendSms = notificationPrefs.senderNotificationSms && form.senderPhone
      const sendWhatsapp = notificationPrefs.senderNotificationWhatsapp && form.senderPhone

      if (!sendEmail && !sendSms && !sendWhatsapp) return

      await fetch('http://localhost:5076/api/v1/notification/notify-sender', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify({
          senderEmail: form.senderEmail,
          senderPhone: form.senderPhone,
          waybill: waybill,
          receiverName: form.receiverName,
          collectDate: new Date().toLocaleString(),
          sendSms: sendSms,
          sendWhatsapp: sendWhatsapp
        })
      })
    } catch (err) {
      console.error('Error notifying sender:', err)
    }
  }

  const handleSubmit = async () => {
    if (!validateForm()) {
      setError('Please fix the errors below')
      return
    }

    setLoading(true)
    setError('')
    setSuccess(null)
    try {
      const res = await fetch('http://localhost:5076/api/v1/parcel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token()}`
        },
        body: JSON.stringify({
          ...form,
          weightKg: parseFloat(form.weightKg) || 0,
          cost: parseFloat(form.cost)
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create parcel')
      
      setSuccess(data)

      // Send notifications if enabled
      const parcelId = data.waybill // Use waybill to identify parcel
      if (notificationPrefs.sendReceiverPin || notificationPrefs.notifySenderOnCreation) {
        // Get created parcel ID for sending pin
        const parcelListRes = await fetch('http://localhost:5076/api/v1/parcel', {
          headers: { Authorization: `Bearer ${token()}` }
        })
        const parcelsList = await parcelListRes.json()
        const createdParcel = parcelsList.find(p => p.waybillNumber === data.waybill)
        
        if (createdParcel) {
          await sendDeliveryPin(data.waybill, createdParcel)
          await notifySender(data.waybill)
        }
      }

      setForm({
        senderName: '', senderPhone: '', senderEmail: '',
        receiverName: '', receiverPhone: '', receiverEmail: '',
        originBranchId: user().branchId || '', destinationBranchId: '',
        deliveryLandmark: '', weightKg: '', cost: ''
      })
      
      // Refresh recent contacts
      setTimeout(() => window.location.reload(), 2000)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    alert('Copied to clipboard!')
  }

  const branchOptions = branches.map(b => ({ id: b.id, name: b.name }))
  const originBranchName = branches.find(b => b.id === form.originBranchId)?.name || ''
  const destBranchName = branches.find(b => b.id === form.destinationBranchId)?.name || ''

  return (
    <Box data-booking-form>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ color: '#f0f4ff', fontWeight: 700 }}>
          New Parcel Booking
        </Typography>
        <Button
          size="small"
          variant="outlined"
          startIcon={<NotificationsIcon />}
          onClick={() => setShowNotificationDialog(true)}
          sx={{ color: '#4fc3f7', borderColor: '#1a2f4a' }}
        >
          Notifications
        </Button>
      </Box>

      {success && (
        <Card sx={{ backgroundColor: '#1b5e20', border: '1px solid #4caf50', mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Box>
                <Typography variant="h6" sx={{ color: '#fff', fontWeight: 700, mb: 1 }}>
                  ✅ Parcel Created Successfully!
                </Typography>
                <Typography sx={{ color: '#c8e6c9', fontSize: 13, mb: 1 }}>
                  Waybill: <strong>{success.waybill}</strong>
                </Typography>
                <Typography sx={{ color: '#c8e6c9', fontSize: 13 }}>
                  PIN for Client: <strong>{success.pinForClient}</strong>
                </Typography>
              </Box>
              <Button 
                size="small" 
                startIcon={<ContentCopyIcon />}
                onClick={() => copyToClipboard(`Waybill: ${success.waybill}\nPIN: ${success.pinForClient}`)}
                sx={{ color: '#4caf50' }}
              >
                Copy
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}
      
      {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}

      <Card>
        <CardContent sx={{ p: 3 }}>
          {/* Quick Actions */}
          {recentSenders.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Button 
                size="small" 
                startIcon={<RestoreIcon />}
                onClick={() => setShowRecent(!showRecent)}
                sx={{ color: '#4fc3f7' }}
              >
                {showRecent ? 'Hide Recent' : 'Show Recent Contacts'}
              </Button>
              {showRecent && (
                <Box sx={{ mt: 2, p: 2, backgroundColor: '#0a1628', borderRadius: 2 }}>
                  <Typography variant="caption" sx={{ color: '#999', display: 'block', mb: 1 }}>Recent Senders:</Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                    {recentSenders.map((s, i) => (
                      <Chip 
                        key={i}
                        label={`${s.name} (${s.phone})`}
                        onClick={() => fillSender(s)}
                        sx={{ cursor: 'pointer', backgroundColor: '#1a2f4a', color: '#4fc3f7' }}
                      />
                    ))}
                  </Box>
                  <Typography variant="caption" sx={{ color: '#999', display: 'block', mb: 1 }}>Recent Receivers:</Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {recentReceivers.map((r, i) => (
                      <Chip 
                        key={i}
                        label={`${r.name} (${r.phone})`}
                        onClick={() => fillReceiver(r)}
                        sx={{ cursor: 'pointer', backgroundColor: '#1a2f4a', color: '#4caf50' }}
                      />
                    ))}
                  </Box>
                </Box>
              )}
            </Box>
          )}

          <Typography variant="subtitle1" sx={{ color: '#4fc3f7', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <LocalShippingIcon fontSize="small" /> Sender Details
          </Typography>

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Autocomplete
                freeSolo
                options={senderSuggestions.map(s => s.name)}
                value={form.senderName}
                onChange={(e, val) => setForm({ ...form, senderName: val || '' })}
                onInputChange={(e, val) => handleChange({ target: { name: 'senderName', value: val } })}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    fullWidth
                    label="Sender Name"
                    error={!!formErrors.senderName}
                    helperText={formErrors.senderName}
                  />
                )}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth label="Sender Phone" name="senderPhone"
                value={form.senderPhone} onChange={handleChange}
                error={!!formErrors.senderPhone}
                helperText={formErrors.senderPhone}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth label="Sender Email (Optional)" name="senderEmail" type="email"
                value={form.senderEmail} onChange={handleChange}
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          <Typography variant="subtitle1" sx={{ color: '#4fc3f7', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <LocalShippingIcon fontSize="small" /> Receiver Details
          </Typography>

          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Autocomplete
                freeSolo
                options={receiverSuggestions.map(r => r.name)}
                value={form.receiverName}
                onChange={(e, val) => setForm({ ...form, receiverName: val || '' })}
                onInputChange={(e, val) => handleChange({ target: { name: 'receiverName', value: val } })}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    fullWidth
                    label="Receiver Name"
                    error={!!formErrors.receiverName}
                    helperText={formErrors.receiverName}
                  />
                )}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth label="Receiver Phone" name="receiverPhone"
                value={form.receiverPhone} onChange={handleChange}
                error={!!formErrors.receiverPhone}
                helperText={formErrors.receiverPhone}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth label="Receiver Email (Optional)" name="receiverEmail" type="email"
                value={form.receiverEmail} onChange={handleChange}
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          <Typography variant="subtitle1" sx={{ color: '#4fc3f7', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <LocalShippingIcon fontSize="small" /> Parcel Details
          </Typography>

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth 
                label="Origin Branch" 
                value={originBranchName}
                disabled
                helperText="Your branch (auto-assigned)"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth select label="Destination Branch" name="destinationBranchId"
                value={form.destinationBranchId} onChange={handleChange}
                error={!!formErrors.destinationBranchId}
                helperText={formErrors.destinationBranchId}
              >
                <MenuItem value="">Select Destination</MenuItem>
                {branches.map(b => (
                  <MenuItem key={b.id} value={b.id}>{b.name}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth label="Delivery Landmark" name="deliveryLandmark"
                value={form.deliveryLandmark} onChange={handleChange}
                placeholder="e.g. Sinda Clinic, near the blue gate"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth label="Weight (kg)" name="weightKg" type="number"
                value={form.weightKg} onChange={handleChange}
                placeholder="Optional"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth label="Cost (ZMW)" name="cost" type="number"
                value={form.cost} onChange={handleChange}
                error={!!formErrors.cost}
                helperText={formErrors.cost}
              />
            </Grid>
          </Grid>

          {/* Summary */}
          {originBranchName && destBranchName && (
            <Box sx={{ mt: 3, p: 2, backgroundColor: '#0a1628', borderRadius: 2, border: '1px solid #1a2f4a' }}>
              <Typography variant="caption" sx={{ color: '#999', display: 'block', mb: 1 }}>ROUTE SUMMARY</Typography>
              <Typography sx={{ color: '#4fc3f7', fontWeight: 600, fontSize: 13 }}>
                {originBranchName} → {destBranchName}
              </Typography>
              <Typography sx={{ color: '#aaa', fontSize: 12, mt: 0.5 }}>
                Cost: <strong sx={{ color: '#4caf50' }}>K {form.cost || '0.00'}</strong>
              </Typography>
            </Box>
          )}

          <Divider sx={{ my: 3 }} />

          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={loading}
              sx={{ px: 4, py: 1.5, backgroundColor: '#4fc3f7', color: '#000', fontWeight: 700 }}
            >
              {loading ? <CircularProgress size={22} color="inherit" /> : '✓ Create Parcel & Generate PIN'}
            </Button>
            <Button
              variant="outlined"
              onClick={() => {
                setForm({
                  senderName: '', senderPhone: '', senderEmail: '',
                  receiverName: '', receiverPhone: '', receiverEmail: '',
                  originBranchId: user().branchId || '', destinationBranchId: '',
                  deliveryLandmark: '', weightKg: '', cost: ''
                })
                setFormErrors({})
                setSuccess(null)
              }}
              sx={{ px: 4, py: 1.5, borderColor: '#1a2f4a', color: '#aaa' }}
            >
              Clear Form
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Notification Settings Dialog */}
      <Dialog open={showNotificationDialog} onClose={() => setShowNotificationDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Notification Settings</DialogTitle>
        <DialogContent sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <Typography variant="subtitle2" sx={{ color: '#333', fontWeight: 600, mb: 1 }}>
              📲 Send PIN to Receiver
            </Typography>
            <FormControlLabel
              control={<Checkbox checked={notificationPrefs.sendReceiverPin} onChange={e => setNotificationPrefs({ ...notificationPrefs, sendReceiverPin: e.target.checked })} />}
              label="Send Delivery PIN"
            />
            {notificationPrefs.sendReceiverPin && (
              <>
                <FormControlLabel
                  control={<Checkbox checked={notificationPrefs.pinViaEmail} onChange={e => setNotificationPrefs({ ...notificationPrefs, pinViaEmail: e.target.checked })} />}
                  label="📧 Via Email"
                />
                <FormControlLabel
                  control={<Checkbox checked={notificationPrefs.pinViaSms} onChange={e => setNotificationPrefs({ ...notificationPrefs, pinViaSms: e.target.checked })} />}
                  label="💬 Via SMS"
                />
                <FormControlLabel
                  control={<Checkbox checked={notificationPrefs.pinViaWhatsapp} onChange={e => setNotificationPrefs({ ...notificationPrefs, pinViaWhatsapp: e.target.checked })} />}
                  label="📱 Via WhatsApp"
                />
              </>
            )}

            <Divider sx={{ my: 2 }} />

            <Typography variant="subtitle2" sx={{ color: '#333', fontWeight: 600, mb: 1 }}>
              👤 Notify Sender
            </Typography>
            <FormControlLabel
              control={<Checkbox checked={notificationPrefs.notifySenderOnCreation} onChange={e => setNotificationPrefs({ ...notificationPrefs, notifySenderOnCreation: e.target.checked })} />}
              label="Notify Sender on Parcel Creation"
            />
            {notificationPrefs.notifySenderOnCreation && (
              <>
                <FormControlLabel
                  control={<Checkbox checked={notificationPrefs.senderNotificationEmail} onChange={e => setNotificationPrefs({ ...notificationPrefs, senderNotificationEmail: e.target.checked })} />}
                  label="📧 Via Email"
                />
                <FormControlLabel
                  control={<Checkbox checked={notificationPrefs.senderNotificationSms} onChange={e => setNotificationPrefs({ ...notificationPrefs, senderNotificationSms: e.target.checked })} />}
                  label="💬 Via SMS"
                />
                <FormControlLabel
                  control={<Checkbox checked={notificationPrefs.senderNotificationWhatsapp} onChange={e => setNotificationPrefs({ ...notificationPrefs, senderNotificationWhatsapp: e.target.checked })} />}
                  label="📱 Via WhatsApp"
                />
              </>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowNotificationDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}