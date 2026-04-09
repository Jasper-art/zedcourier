import { useState } from 'react'
import {
  Box, Typography, Card, CardContent, TextField,
  Button, Alert, CircularProgress, Divider
} from '@mui/material'
import { QRCodeSVG } from 'qrcode.react' // High-quality SVG QR generator

const token = () => localStorage.getItem('token')

export default function LabelTab() {
  const [waybill, setWaybill] = useState('')
  const [parcel, setParcel] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSearch = async () => {
    if (!waybill.trim()) return
    setLoading(true)
    setError('')
    setParcel(null)
    
    try {
      const res = await fetch(`http://localhost:5076/api/v1/parcel`, {
          headers: { Authorization: `Bearer ${token()}` }
      })
      
      if (!res.ok) throw new Error('Unauthorized or Server Error')
      
      const allParcels = await res.json()
      const found = allParcels.find(p => 
        p.waybillNumber.toLowerCase() === waybill.toLowerCase().trim()
      )

      if (!found) throw new Error('Parcel not found.')
      setParcel(found)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handlePrint = () => window.print()

  return (
    <Box sx={{ p: 1 }}>
      {/* Optimized Print CSS */}
      <style>
        {`
          @media print {
            body * { visibility: hidden; }
            #print-area, #print-area * { visibility: visible; }
            #print-area { 
              position: absolute; 
              left: 0; 
              top: 0; 
              width: 100%; 
              max-width: 400px;
              background: white !important;
              color: black !important;
              border: 1px solid #000 !important;
            }
            .no-print { display: none !important; }
            .qr-container svg { width: 120px !important; height: 120px !important; }
          }
        `}
      </style>

      <Typography variant="h5" sx={{ color: '#f0f4ff', fontWeight: 700, mb: 3 }}>
        Print Parcel Label
      </Typography>

      {/* Search Input */}
      <Card sx={{ maxWidth: 500, mb: 4, backgroundColor: '#111', border: '1px solid #222' }} className="no-print">
        <CardContent>
          <TextField
            fullWidth label="Waybill Number" value={waybill}
            onChange={e => setWaybill(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            sx={{ mb: 2, input: { color: 'white' } }} 
            InputLabelProps={{ style: { color: '#666' } }}
          />
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Button
            fullWidth variant="contained" onClick={handleSearch} disabled={loading}
            sx={{ py: 1.5, fontWeight: 700, backgroundColor: '#4fc3f7' }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Find Parcel'}
          </Button>
        </CardContent>
      </Card>

      {/* The Scannable Label */}
      {parcel && (
        <Card 
          id="print-area"
          sx={{ 
            maxWidth: 420, 
            backgroundColor: '#fff', 
            color: '#000', 
            borderRadius: 0, 
            border: '2px solid #000'
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6" sx={{ fontWeight: 900, color: '#000' }}>
                    ZEDCOURIER PRO
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 800 }}>
                    EXPRESS DELIVERY
                </Typography>
            </Box>
            
            <Divider sx={{ my: 2, borderColor: '#000', borderBottomWidth: 2 }} />

            {/* QR CODE SECTION - Built for Scanners */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Box className="qr-container">
                <QRCodeSVG 
                  value={parcel.waybillNumber} 
                  size={100} 
                  level="H" // High Error Correction (makes it scannable even if torn/dirty)
                  includeMargin={true}
                />
              </Box>
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="caption" sx={{ color: '#666', fontWeight: 800 }}>WAYBILL NO.</Typography>
                <Typography variant="h4" sx={{ fontWeight: 900, letterSpacing: 1 }}>
                    {parcel.waybillNumber}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#444' }}>
                    {new Date(parcel.createdAt).toLocaleDateString()}
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 3, border: '1px solid #ddd', p: 1.5 }}>
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 800, color: '#888' }}>SENDER</Typography>
                <Typography sx={{ fontWeight: 700, fontSize: 14 }}>{parcel.senderName}</Typography>
                <Typography sx={{ fontSize: 12 }}>{parcel.senderPhone}</Typography>
              </Box>
              <Box sx={{ borderLeft: '1px solid #ddd', pl: 2 }}>
                <Typography variant="caption" sx={{ fontWeight: 800, color: '#888' }}>RECEIVER</Typography>
                <Typography sx={{ fontWeight: 700, fontSize: 14 }}>{parcel.receiverName}</Typography>
                <Typography sx={{ fontSize: 12 }}>{parcel.receiverPhone}</Typography>
              </Box>
            </Box>

            {/* HIGH-CONTRAST DESTINATION BOX */}
            <Box sx={{ backgroundColor: '#000', color: '#fff', p: 2, mb: 3, textAlign: 'center' }}>
              <Typography variant="caption" sx={{ color: '#aaa', fontWeight: 800 }}>DESTINATION LANDMARK</Typography>
              <Typography sx={{ fontWeight: 900, fontSize: 24, letterSpacing: 2 }}>
                {parcel.deliveryLandmark?.toUpperCase() || 'CHIPATA MAIN'}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed #ccc', pt: 2 }}>
                <Box>
                    <Typography variant="caption" sx={{ color: '#888' }}>WEIGHT</Typography>
                    <Typography sx={{ fontWeight: 700 }}>{parcel.weightKg} KG</Typography>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="caption" sx={{ color: '#888' }}>SERVICE FEE</Typography>
                    <Typography sx={{ fontWeight: 700 }}>K {parcel.cost?.toFixed(2)}</Typography>
                </Box>
            </Box>

            <Button
              fullWidth variant="contained" className="no-print"
              onClick={handlePrint}
              sx={{ mt: 3, backgroundColor: '#000', color: '#fff', fontWeight: 700 }}
            >
              Print Shipping Label
            </Button>
          </CardContent>
        </Card>
      )}
    </Box>
  )
}