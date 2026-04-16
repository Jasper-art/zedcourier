import { useState, useRef, useEffect } from 'react'
import {
  Box, Typography, Card, CardContent, TextField, Button, Alert,
  CircularProgress, Divider, Dialog, DialogTitle, DialogContent,
  DialogActions, FormControlLabel, Checkbox, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, Chip, Avatar, LinearProgress,
  Stepper, Step, StepLabel, Grid
} from '@mui/material'
import VerifiedIcon from '@mui/icons-material/Verified'
import SendIcon from '@mui/icons-material/Send'
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner'
import CameraAltIcon from '@mui/icons-material/CameraAlt'
import DrawIcon from '@mui/icons-material/Draw'
import DeleteIcon from '@mui/icons-material/Delete'
import CloudOffIcon from '@mui/icons-material/CloudOff'
import CloudDoneIcon from '@mui/icons-material/CloudDone'
import BadgeIcon from '@mui/icons-material/Badge'
import DownloadIcon from '@mui/icons-material/Download'
import TimelineIcon from '@mui/icons-material/Timeline'
import NotificationsIcon from '@mui/icons-material/Notifications'
import { api } from '../../../api'

export default function CollectionTab() {
  // Core states
  const [waybill, setWaybill] = useState('')
  const [pin, setPin] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [parcelDetails, setParcelDetails] = useState(null)
  const [deliveryNotes, setDeliveryNotes] = useState('')
  const [signatureData, setSignatureData] = useState(null)
  
  // Multi-angle photos
  const [photos, setPhotos] = useState({ front: null, back: null, side: null })
  const [photoPreview, setPhotoPreview] = useState({ front: null, back: null, side: null })
  const [currentPhotoAngle, setCurrentPhotoAngle] = useState('front')
  
  // NRC verification
  const [nrcPhotoFile, setNrcPhotoFile] = useState(null)
  const [nrcPhotoPreview, setNrcPhotoPreview] = useState(null)
  const [nrcNumber, setNrcNumber] = useState('')
  const [nrcCaptured, setNrcCaptured] = useState(false)
  const [receiverIdVerified, setReceiverIdVerified] = useState(false)
  
  // Offline & sync
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [queuedCollections, setQueuedCollections] = useState([])
  const [showQueue, setShowQueue] = useState(false)
  
  // Real-time tracking
  const [trackingLogs, setTrackingLogs] = useState([])
  const [showTracking, setShowTracking] = useState(false)
  
  // Notifications
  const [sendEmail, setSendEmail] = useState(true)
  const [sendSms, setSendSms] = useState(false)
  const [sendWhatsapp, setSendWhatsapp] = useState(false)
  const [notificationStatus, setNotificationStatus] = useState(null)
  
  // UI
  const [showSignature, setShowSignature] = useState(false)
  const [showNrcDialog, setShowNrcDialog] = useState(false)
  const [showNotificationSettings, setShowNotificationSettings] = useState(false)
  const [activeStep, setActiveStep] = useState(0)
  const [batchMode, setBatchMode] = useState(false)
  const [batchWaybills, setBatchWaybills] = useState([])
  const [batchParcels, setBatchParcels] = useState([])
  
  const signatureCanvasRef = useRef(null)
  const fileInputRef = useRef(null)
  const nrcInputRef = useRef(null)
  const cameraInputRef = useRef(null)

  // Monitor online status
  useEffect(() => {
    window.addEventListener('online', () => setIsOnline(true))
    window.addEventListener('offline', () => setIsOnline(false))
    loadQueuedCollections()
    return () => {
      window.removeEventListener('online', () => setIsOnline(true))
      window.removeEventListener('offline', () => setIsOnline(false))
    }
  }, [])

  // Load queued collections from localStorage
  const loadQueuedCollections = () => {
    const queued = JSON.parse(localStorage.getItem('collectionQueue') || '[]')
    setQueuedCollections(queued)
  }

  // Save collection to queue
  const saveToQueue = (collection) => {
    const queued = JSON.parse(localStorage.getItem('collectionQueue') || '[]')
    queued.push({ ...collection, timestamp: new Date().toISOString() })
    localStorage.setItem('collectionQueue', JSON.stringify(queued))
    setQueuedCollections(queued)
  }

  // Sync queued collections
  const syncQueuedCollections = async () => {
    if (!isOnline || queuedCollections.length === 0) return
    setLoading(true)
    try {
      for (const collection of queuedCollections) {
        await submitCollection(collection, true)
      }
      localStorage.setItem('collectionQueue', '[]')
      setQueuedCollections([])
      setResult(`✓ ${queuedCollections.length} queued collections synced successfully`)
    } catch (err) {
      setError(`Sync failed: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleWaybillChange = async (value) => {
    setWaybill(value)
    if (value.length >= 8) {
      await fetchParcelDetails(value)
    }
  }

const fetchParcelDetails = async (waybillNumber) => {
    try {
      const parcels = await api.getParcels()
      const parcel = parcels.find(p => p.waybillNumber === waybillNumber)
      if (parcel) {
        setParcelDetails(parcel)
        setActiveStep(1)
        await fetchTrackingLogs(parcel.id)
      }
    } catch (err) {
      console.error('Error fetching parcel:', err)
    }
  }

const fetchTrackingLogs = async (parcelId) => {
    try {
      const data = await api.apiGet(`parcel/${parcelId}`)
      setTrackingLogs(data.logs || [])
    } catch (err) {
      console.error('Error fetching tracking:', err)
    }
  }

  // Photo capture for multi-angle
  const handlePhotoUpload = (e, angle = 'front') => {
    const file = e.target.files?.[0]
    if (file) {
      setPhotos(prev => ({ ...prev, [angle]: file }))
      const reader = new FileReader()
      reader.onload = (event) => {
        setPhotoPreview(prev => ({ ...prev, [angle]: event.target?.result }))
      }
      reader.readAsDataURL(file)
    }
  }

  // NRC photo capture - extracts NRC number from photo (mock OCR)
  const handleNrcPhotoUpload = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      setNrcPhotoFile(file)
      const reader = new FileReader()
      reader.onload = (event) => {
        setNrcPhotoPreview(event.target?.result)
        // TODO: Integrate OCR to extract NRC number from photo
        // For now, we'll just capture the photo and user can verify
        setNrcCaptured(true)
      }
      reader.readAsDataURL(file)
    }
  }

  const verifyWithNrcPhoto = () => {
    if (!nrcPhotoFile) {
      setError('Please capture NRC photo')
      return
    }

    // In production, OCR would extract NRC from photo automatically
    // For now, show success if photo is captured
    setReceiverIdVerified(true)
    setShowNrcDialog(false)
    setActiveStep(2)
    setError('')
  }

  const verifyWithNrcNumber = () => {
    if (!nrcNumber.trim()) {
      setError('Please enter NRC number')
      return
    }

    // NRC number format validation (basic)
    const nrcRegex = /^\d{6}\/\d{2}\/\d{1}$/
    if (!nrcRegex.test(nrcNumber.trim())) {
      setError('Invalid NRC format. Use: 123456/78/1')
      return
    }

    setReceiverIdVerified(true)
    setActiveStep(2)
    setError('')
  }

  // Signature capture
  const startSignature = () => {
    setShowSignature(true)
    setTimeout(() => {
      const canvas = signatureCanvasRef.current
      if (canvas) {
        const ctx = canvas.getContext('2d')
        ctx.fillStyle = '#000'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
      }
    }, 100)
  }

  const drawSignature = (e) => {
    const canvas = signatureCanvasRef.current
    if (!canvas || !showSignature) return
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#4fc3f7'
    ctx.beginPath()
    ctx.arc(x, y, 2, 0, Math.PI * 2)
    ctx.fill()
  }

  const saveSignature = () => {
    const canvas = signatureCanvasRef.current
    if (canvas) {
      setSignatureData(canvas.toDataURL())
      setShowSignature(false)
      setActiveStep(3)
    }
  }

  // Generate PDF receipt
  const generateReceipt = (collection) => {
    const html = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
            .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #4fc3f7; pb: 10px; }
            .logo { font-size: 24px; color: #4fc3f7; font-weight: bold; }
            .section { margin: 15px 0; }
            .label { font-weight: bold; color: #666; font-size: 12px; }
            .value { font-size: 14px; color: #000; margin-top: 3px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th { background: #4fc3f7; color: white; padding: 8px; text-align: left; }
            td { padding: 8px; border-bottom: 1px solid #eee; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #999; }
            .success { color: #4caf50; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">ZedCourier Pro</div>
            <div>Collection Receipt</div>
          </div>
          
          <div class="section">
            <div class="label">WAYBILL NUMBER</div>
            <div class="value">${collection.waybill}</div>
          </div>
          
          <div class="section">
            <div class="label">COLLECTION DATE & TIME</div>
            <div class="value">${new Date().toLocaleString()}</div>
          </div>

          ${collection.nrcNumber ? `
            <div class="section">
              <div class="label">NRC NUMBER</div>
              <div class="value">${collection.nrcNumber}</div>
            </div>
          ` : ''}
          
          <table>
            <tr>
              <th>SENDER</th>
              <th>RECEIVER</th>
            </tr>
            <tr>
              <td>${collection.senderName}</td>
              <td>${collection.receiverName}</td>
            </tr>
            <tr>
              <th>ORIGIN</th>
              <th>DESTINATION</th>
            </tr>
            <tr>
              <td>${collection.originBranch}</td>
              <td>${collection.destinationBranch}</td>
            </tr>
          </table>
          
          <div class="section">
            <div class="label">PARCEL DETAILS</div>
            <div class="value">Weight: ${collection.weight} kg | Cost: K ${collection.cost}</div>
          </div>
          
          <div class="section">
            <div class="label">DELIVERY LANDMARK</div>
            <div class="value">${collection.landmark}</div>
          </div>
          
          <div class="section">
            <div class="label">DELIVERY NOTES</div>
            <div class="value">${collection.notes || 'N/A'}</div>
          </div>
          
          <div class="section">
            <div class="label">STATUS</div>
            <div class="value success">✓ COLLECTED</div>
          </div>
          
          <div class="footer">
            <p>This is an automated receipt. Please retain for your records.</p>
            <p>ZedCourier Pro © 2026</p>
          </div>
        </body>
      </html>
    `
    return html
  }

  const downloadReceipt = (collection) => {
    const html = generateReceipt(collection)
    const win = window.open('', '_blank')
    win.document.write(html)
    win.document.close()
    win.print()
  }

const sendReceiptEmail = async (collection) => {
    try {
      const data = await api.apiPost('notification/send-receipt', {
        recipientEmail: collection.receiverEmail,
        recipientName: collection.receiverName,
        recipientPhone: collection.receiverPhone,
        waybill: collection.waybill,
        collectDate: new Date().toLocaleString(),
        sendSms: sendSms,
        sendWhatsapp: sendWhatsapp
      })
      
      setNotificationStatus({
        type: 'success',
        message: 'Receipt sent via ' + [sendEmail && 'Email', sendSms && 'SMS', sendWhatsapp && 'WhatsApp'].filter(Boolean).join(', ')
      })
      return true
    } catch (err) {
      console.error('Error sending receipt:', err)
      setNotificationStatus({ type: 'error', message: 'Failed to send receipt' })
      return false
    }
  }

const notifySender = async (collection) => {
    try {
      await api.apiPost('notification/notify-sender', {
        senderPhone: collection.senderPhone,
        senderEmail: collection.senderEmail,
        waybill: collection.waybill,
        receiverName: collection.receiverName,
        collectDate: new Date().toLocaleString(),
        sendSms: sendSms,
        sendWhatsapp: sendWhatsapp
      })
      return true
    } catch (err) {
      console.error('Error notifying sender:', err)
      return false
    }
  }

  const submitCollection = async (collection, isFromQueue = false) => {
    try {
      const parcels = await api.getParcels()
      const parcel = parcels.find(p => p.waybillNumber === collection.waybill)

      if (!parcel) throw new Error('Parcel not found')
      if (parcel.deliveryPin !== collection.pin) throw new Error('Invalid PIN')

      // Submit collection
      await api.apiPut(`parcel/${parcel.id}/status`, {
        newStatus: 'Collected',
        notes: collection.notes,
        deliveryPin: collection.pin,
        notifySender: true
      })
      // Send notifications
      if (sendEmail || sendSms || sendWhatsapp) {
        await notifySender(collection)
        await sendReceiptEmail(collection)
      }

      return true
    } catch (err) {
      throw err
    }
  }

  const handleVerify = async () => {
    if (!waybill || !pin) {
      setError('Please enter waybill and PIN')
      return
    }

    if (!receiverIdVerified) {
      setError('Please verify receiver NRC')
      return
    }

    if (!signatureData) {
      setError('Please capture signature')
      return
    }

    setLoading(true)
    setResult(null)
    setError('')
    setNotificationStatus(null)

    const collection = {
      waybill,
      pin,
      nrcNumber: nrcNumber || 'Captured from photo',
      senderName: parcelDetails.senderName,
      senderPhone: parcelDetails.senderPhone,
      senderEmail: parcelDetails.senderEmail,
      receiverName: parcelDetails.receiverName,
      receiverEmail: parcelDetails.receiverEmail,
      originBranch: parcelDetails.originBranchId,
      destinationBranch: parcelDetails.destinationBranchId,
      weight: parcelDetails.weightKg,
      cost: parcelDetails.cost,
      landmark: parcelDetails.deliveryLandmark,
      notes: deliveryNotes,
      photos,
      nrcPhoto: nrcPhotoFile,
      signature: signatureData,
      collectionTime: new Date().toISOString()
    }

    try {
      if (isOnline) {
        await submitCollection(collection)
        setResult(`✓ Parcel ${waybill} successfully collected`)
        downloadReceipt(collection)
      } else {
        saveToQueue(collection)
        setResult(`✓ Collection queued (offline). Will sync when online.`)
      }
      setActiveStep(4)
      setTimeout(() => resetForm(), 2000)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setWaybill('')
    setPin('')
    setParcelDetails(null)
    setDeliveryNotes('')
    setPhotos({ front: null, back: null, side: null })
    setPhotoPreview({ front: null, back: null, side: null })
    setNrcNumber('')
    setNrcPhotoFile(null)
    setNrcPhotoPreview(null)
    setNrcCaptured(false)
    setReceiverIdVerified(false)
    setSignatureData(null)
    setActiveStep(0)
    setTrackingLogs([])
    setNotificationStatus(null)
    setBatchWaybills([])
    setBatchParcels([])
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ color: '#f0f4ff', fontWeight: 700 }}>
          📦 Parcel Collection
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Chip
            icon={isOnline ? <CloudDoneIcon /> : <CloudOffIcon />}
            label={isOnline ? 'Online' : 'Offline'}
            color={isOnline ? 'success' : 'error'}
          />
          <Button
            size="small"
            variant="outlined"
            startIcon={<NotificationsIcon />}
            onClick={() => setShowNotificationSettings(true)}
            sx={{ color: '#4fc3f7', borderColor: '#1a2f4a' }}
          >
            Notifications
          </Button>
          {queuedCollections.length > 0 && (
            <Button
              size="small"
              variant="outlined"
              onClick={() => setShowQueue(true)}
            >
              Queued: {queuedCollections.length}
            </Button>
          )}
          {!isOnline && queuedCollections.length > 0 && (
            <Button
              size="small"
              variant="contained"
              onClick={syncQueuedCollections}
              disabled={!isOnline}
            >
              Sync Now
            </Button>
          )}
        </Box>
      </Box>

      {result && <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>{result}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}
      {notificationStatus && (
        <Alert severity={notificationStatus.type} sx={{ mb: 3, borderRadius: 2 }}>
          {notificationStatus.message}
        </Alert>
      )}

      {/* Stepper */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stepper activeStep={activeStep}>
            <Step>
              <StepLabel>Scan Waybill</StepLabel>
            </Step>
            <Step>
              <StepLabel>Verify NRC</StepLabel>
            </Step>
            <Step>
              <StepLabel>Capture Photos</StepLabel>
            </Step>
            <Step>
              <StepLabel>Signature</StepLabel>
            </Step>
            <Step>
              <StepLabel>Submit</StepLabel>
            </Step>
          </Stepper>
        </CardContent>
      </Card>

      {/* Waybill & Tracking */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle1" sx={{ color: '#4fc3f7', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <VerifiedIcon fontSize="small" /> Step 1: Scan or Enter Waybill
          </Typography>

          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <TextField
              fullWidth
              label="Waybill Number"
              value={waybill}
              onChange={e => handleWaybillChange(e.target.value)}
              placeholder="e.g. ZP-2026-4821"
            />
            <Button
              variant="outlined"
              startIcon={<QrCodeScannerIcon />}
              sx={{ borderColor: '#1a2f4a', color: '#4fc3f7' }}
            >
              Scan
            </Button>
          </Box>

          {parcelDetails && (
            <>
              <Card sx={{ backgroundColor: '#0a1628', border: '1px solid #1a2f4a', mb: 2 }}>
                <CardContent>
                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2 }}>
                    <Box>
                      <Typography variant="caption" sx={{ color: '#506680' }}>FROM</Typography>
                      <Typography sx={{ color: '#f0f4ff', fontWeight: 600 }}>{parcelDetails.senderName}</Typography>
                      <Typography variant="caption" sx={{ color: '#506680' }}>{parcelDetails.senderPhone}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" sx={{ color: '#506680' }}>TO</Typography>
                      <Typography sx={{ color: '#f0f4ff', fontWeight: 600 }}>{parcelDetails.receiverName}</Typography>
                      <Typography variant="caption" sx={{ color: '#506680' }}>{parcelDetails.receiverPhone}</Typography>
                    </Box>
                  </Box>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="caption" sx={{ color: '#506680' }}>LANDMARK</Typography>
                  <Typography sx={{ color: '#4fc3f7', fontWeight: 600 }}>{parcelDetails.deliveryLandmark}</Typography>
                  <Typography variant="caption" sx={{ color: '#506680', display: 'block', mt: 1 }}>STATUS</Typography>
                  <Chip label={parcelDetails.status} size="small" />
                </CardContent>
              </Card>

              <Button
                fullWidth
                variant="text"
                startIcon={<TimelineIcon />}
                onClick={() => setShowTracking(!showTracking)}
                sx={{ color: '#4fc3f7', mb: 1 }}
              >
                {showTracking ? 'Hide Tracking' : 'Show Real-time Tracking'}
              </Button>

              {showTracking && trackingLogs.length > 0 && (
                <Card sx={{ backgroundColor: '#0a1628', border: '1px solid #1a2f4a', mb: 2 }}>
                  <CardContent>
                    <Typography variant="caption" sx={{ color: '#506680' }}>DELIVERY TIMELINE</Typography>
                    {trackingLogs.map((log, idx) => (
                      <Box key={idx} sx={{ py: 1, borderLeft: '2px solid #4fc3f7', pl: 2 }}>
                        <Typography variant="caption" sx={{ color: '#4fc3f7', fontWeight: 600 }}>
                          {log.newStatus}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#506680', display: 'block' }}>
                          {new Date(log.timestamp).toLocaleString()}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#90a4c1' }}>
                          {log.notes}
                        </Typography>
                      </Box>
                    ))}
                  </CardContent>
                </Card>
              )}

              <TextField
                fullWidth
                label="4-Digit PIN"
                value={pin}
                onChange={e => setPin(e.target.value)}
                inputProps={{ maxLength: 4 }}
                placeholder="Ask receiver for PIN"
                type="password"
                sx={{ mb: 2 }}
              />
            </>
          )}
        </CardContent>
      </Card>

      {/* NRC Verification */}
      {parcelDetails && activeStep >= 1 && (
        <Card sx={{ mb: 3, border: receiverIdVerified ? '2px solid #4caf50' : '1px solid #1a2f4a' }}>
          <CardContent>
            <Typography variant="subtitle1" sx={{ color: receiverIdVerified ? '#4caf50' : '#ffb74d', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <BadgeIcon fontSize="small" /> Step 2: Verify Receiver NRC
            </Typography>

            {receiverIdVerified ? (
              <Box>
                {nrcCaptured ? (
                  <Chip label="✓ NRC Captured from Photo" color="success" sx={{ mb: 2 }} />
                ) : (
                  <Chip label={`✓ NRC: ${nrcNumber}`} color="success" sx={{ mb: 2 }} />
                )}
                {nrcPhotoPreview && (
                  <Box sx={{ mb: 2, borderRadius: 2, overflow: 'hidden', border: '1px solid #4caf50' }}>
                    <Typography variant="caption" sx={{ color: '#506680', display: 'block', mb: 1 }}>NRC Photo</Typography>
                    <img src={nrcPhotoPreview} alt="NRC" style={{ width: '100%', maxHeight: 200, objectFit: 'cover' }} />
                  </Box>
                )}
              </Box>
            ) : (
              <>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<CameraAltIcon />}
                  onClick={() => setShowNrcDialog(true)}
                  sx={{ mb: 2, borderColor: '#4fc3f7', color: '#4fc3f7', py: 1.5 }}
                >
                  📸 Capture NRC Photo
                </Button>

                {nrcPhotoPreview && (
                  <Box sx={{ mb: 2, borderRadius: 2, overflow: 'hidden', border: '1px solid #4fc3f7' }}>
                    <img src={nrcPhotoPreview} alt="NRC" style={{ width: '100%', maxHeight: 200, objectFit: 'cover' }} />
                  </Box>
                )}

                {nrcPhotoPreview && (
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={verifyWithNrcPhoto}
                    sx={{ mb: 2 }}
                  >
                    Verify with NRC Photo
                  </Button>
                )}

                <Divider sx={{ my: 2 }}>OR</Divider>

                <Typography variant="body2" sx={{ color: '#506680', mb: 2 }}>
                  If NRC not available, enter number manually
                </Typography>

                <TextField
                  fullWidth
                  label="NRC Number (Manual Entry)"
                  value={nrcNumber}
                  onChange={e => setNrcNumber(e.target.value)}
                  placeholder="e.g. 123456/78/1"
                  helperText="Format: XXXXXX/XX/X"
                  sx={{ mb: 2 }}
                />

                <Button
                  fullWidth
                  variant="contained"
                  onClick={verifyWithNrcNumber}
                  disabled={!nrcNumber.trim()}
                >
                  Verify with NRC Number
                </Button>

                <Dialog open={showNrcDialog} onClose={() => setShowNrcDialog(false)} maxWidth="sm" fullWidth>
                  <DialogTitle>Capture NRC Photo</DialogTitle>
                  <DialogContent sx={{ p: 2 }}>
                    <Typography variant="body2" sx={{ color: '#666', mb: 2 }}>
                      Take a clear photo of the receiver's National Registration Card (NRC)
                    </Typography>
                    <input
                      ref={nrcInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleNrcPhotoUpload}
                      style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }}
                    />
                  </DialogContent>
                  <DialogActions>
                    <Button onClick={() => setShowNrcDialog(false)}>Cancel</Button>
                    <Button variant="contained" onClick={() => setShowNrcDialog(false)}>Done</Button>
                  </DialogActions>
                </Dialog>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Multi-Angle Photos */}
      {parcelDetails && activeStep >= 2 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="subtitle1" sx={{ color: '#4fc3f7', mb: 1 }}>
              Step 3: Capture Parcel Photos (Optional)
            </Typography>
            <Typography variant="caption" sx={{ color: '#506680', mb: 2, display: 'block' }}>
              📸 Front, Back & Side photos - recommended but optional
            </Typography>

            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              {['front', 'back', 'side'].map(angle => (
                <Button
                  key={angle}
                  variant={currentPhotoAngle === angle ? 'contained' : 'outlined'}
                  onClick={() => setCurrentPhotoAngle(angle)}
                  sx={{
                    flex: 1,
                    backgroundColor: currentPhotoAngle === angle ? '#4fc3f7' : 'transparent',
                    color: currentPhotoAngle === angle ? '#000' : '#4fc3f7',
                    borderColor: '#1a2f4a'
                  }}
                >
                  {angle.toUpperCase()} {photos[angle] && '✓'}
                </Button>
              ))}
            </Box>

            {['front', 'back', 'side'].map(angle => (
              <Box key={angle} sx={{ mb: 2, display: currentPhotoAngle === angle ? 'block' : 'none' }}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<CameraAltIcon />}
                  onClick={() => fileInputRef.current?.click()}
                  sx={{ mb: 2, borderColor: '#1a2f4a', color: '#4fc3f7' }}
                >
                  Capture {angle.toUpperCase()} Photo
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  style={{ display: 'none' }}
                  onChange={(e) => handlePhotoUpload(e, angle)}
                />
                {photoPreview[angle] && (
                  <Box sx={{ borderRadius: 2, overflow: 'hidden', border: '1px solid #1a2f4a' }}>
                    <img src={photoPreview[angle]} alt={angle} style={{ width: '100%', maxHeight: 250, objectFit: 'cover' }} />
                  </Box>
                )}
              </Box>
            ))}

            <Button
              fullWidth
              variant="text"
              onClick={() => setActiveStep(3)}
              sx={{ color: '#506680', mt: 1 }}
            >
              Skip Photos & Continue
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Signature */}
      {parcelDetails && activeStep >= 3 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="subtitle1" sx={{ color: '#4fc3f7', mb: 2 }}>
              Step 4: Capture Signature
            </Typography>

            <Button
              fullWidth
              variant="outlined"
              startIcon={<DrawIcon />}
              onClick={startSignature}
              sx={{ mb: 2, borderColor: '#1a2f4a', color: '#4fc3f7' }}
            >
              {signatureData ? '✓ Signature Captured' : 'Capture Signature'}
            </Button>

            {signatureData && (
              <Box sx={{ mb: 2, borderRadius: 2, overflow: 'hidden', border: '1px solid #1a2f4a', backgroundColor: '#000' }}>
                <img src={signatureData} alt="Signature" style={{ width: '100%', maxHeight: 100 }} />
              </Box>
            )}

            <Dialog open={showSignature} onClose={() => setShowSignature(false)} maxWidth="sm" fullWidth>
              <DialogTitle>Capture Signature</DialogTitle>
              <DialogContent sx={{ p: 2 }}>
                <canvas
                  ref={signatureCanvasRef}
                  width={400}
                  height={200}
                  onMouseMove={drawSignature}
                  style={{ border: '1px solid #ccc', backgroundColor: '#000', cursor: 'crosshair', width: '100%' }}
                />
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setShowSignature(false)}>Cancel</Button>
                <Button variant="contained" onClick={saveSignature}>Save Signature</Button>
              </DialogActions>
            </Dialog>
          </CardContent>
        </Card>
      )}

      {/* Delivery Notes */}
      {parcelDetails && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="subtitle1" sx={{ color: '#4fc3f7', mb: 2 }}>
              Delivery Notes (Optional)
            </Typography>
            <TextField
              fullWidth
              label="Notes"
              value={deliveryNotes}
              onChange={e => setDeliveryNotes(e.target.value)}
              multiline
              rows={3}
              placeholder="Add any delivery notes..."
            />
          </CardContent>
        </Card>
      )}

      {/* Submit */}
      {parcelDetails && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Button
              fullWidth
              variant="contained"
              color="primary"
              onClick={handleVerify}
              disabled={loading}
              sx={{ py: 1.5, mb: 1 }}
            >
              {loading ? <CircularProgress size={22} color="inherit" /> : '✓ Complete Collection & Generate Receipt'}
            </Button>
            <Button
              fullWidth
              variant="outlined"
              onClick={resetForm}
              sx={{ borderColor: '#1a2f4a', color: '#506680' }}
            >
              Clear All
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Notification Settings Dialog */}
      <Dialog open={showNotificationSettings} onClose={() => setShowNotificationSettings(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Notification Settings</DialogTitle>
        <DialogContent sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <FormControlLabel
              control={<Checkbox checked={sendEmail} onChange={e => setSendEmail(e.target.checked)} />}
              label="📧 Email Receipt"
            />
            <FormControlLabel
              control={<Checkbox checked={sendSms} onChange={e => setSendSms(e.target.checked)} />}
              label="💬 SMS Notification"
            />
            <FormControlLabel
              control={<Checkbox checked={sendWhatsapp} onChange={e => setSendWhatsapp(e.target.checked)} />}
              label="📱 WhatsApp Message"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowNotificationSettings(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Queued Collections Dialog */}
      <Dialog open={showQueue} onClose={() => setShowQueue(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Queued Collections ({queuedCollections.length})</DialogTitle>
        <DialogContent>
          {queuedCollections.length === 0 ? (
            <Typography>No queued collections</Typography>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Waybill</TableCell>
                    <TableCell>Receiver</TableCell>
                    <TableCell>Time</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {queuedCollections.map((col, i) => (
                    <TableRow key={i}>
                      <TableCell sx={{ color: '#4fc3f7', fontWeight: 700 }}>{col.waybill}</TableCell>
                      <TableCell>{col.receiverName}</TableCell>
                      <TableCell sx={{ fontSize: 12 }}>{new Date(col.timestamp).toLocaleTimeString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowQueue(false)}>Close</Button>
          {isOnline && queuedCollections.length > 0 && (
            <Button variant="contained" onClick={syncQueuedCollections}>Sync All</Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  )
}