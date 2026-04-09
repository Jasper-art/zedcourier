import { useEffect, useState } from 'react'
import { Box, Typography, Card, CardContent, Grid, Chip, CircularProgress, Button, Dialog, TextField, Alert } from '@mui/material'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import AddIcon from '@mui/icons-material/Add'
import PersonIcon from '@mui/icons-material/Person'
import PhoneIcon from '@mui/icons-material/Phone'
import LocalShippingIcon from '@mui/icons-material/LocalShipping'
import AttachMoneyIcon from '@mui/icons-material/AttachMoney'

const token = () => localStorage.getItem('token')

export default function BranchesTab() {
  const [branches, setBranches] = useState([])
  const [loading, setLoading] = useState(true)
  const [openModal, setOpenModal] = useState(false)
  const [formData, setFormData] = useState({ name: '', town: '', province: '', managerName: '', managerPhone: '', staffCount: '' })
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchBranches()
  }, [])

  const fetchBranches = () => {
    fetch('http://localhost:5076/api/v1/branch', {
      headers: { Authorization: `Bearer ${token()}` }
    })
      .then(r => r.json())
      .then(setBranches)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }

  const handleAddBranch = async () => {
    if (!formData.name || !formData.town || !formData.province) {
      setError('Fill all required fields')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('http://localhost:5076/api/v1/branch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token()}`
        },
        body: JSON.stringify(formData)
      })

      if (!res.ok) throw new Error('Failed to create branch')
      
      setOpenModal(false)
      setFormData({ name: '', town: '', province: '', managerName: '', managerPhone: '', staffCount: '' })
      setError(null)
      fetchBranches()
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress sx={{ color: '#e53935' }} /></Box>

  const totalParcels = branches.reduce((sum, b) => sum + (b.parcels || 0), 0)
  const totalRevenue = branches.reduce((sum, b) => sum + (b.revenue || 0), 0)

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ color: '#fff', fontWeight: 700 }}>Branches</Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          onClick={() => setOpenModal(true)}
          sx={{ backgroundColor: '#e53935', '&:hover': { backgroundColor: '#c62828' } }}
        >
          Add Branch
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ backgroundColor: '#1a1a1a', border: '1px solid #222' }}>
            <CardContent>
              <Typography sx={{ color: '#999', fontSize: 12, mb: 1 }}>Total Branches</Typography>
              <Typography variant="h5" sx={{ color: '#fff', fontWeight: 700 }}>{branches.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ backgroundColor: '#1a1a1a', border: '1px solid #222' }}>
            <CardContent>
              <Typography sx={{ color: '#999', fontSize: 12, mb: 1 }}>Total Parcels</Typography>
              <Typography variant="h5" sx={{ color: '#4fc3f7', fontWeight: 700 }}>{totalParcels}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ backgroundColor: '#1a1a1a', border: '1px solid #222' }}>
            <CardContent>
              <Typography sx={{ color: '#999', fontSize: 12, mb: 1 }}>Total Revenue</Typography>
              <Typography variant="h5" sx={{ color: '#4caf50', fontWeight: 700 }}>K {totalRevenue.toFixed(2)}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ backgroundColor: '#1a1a1a', border: '1px solid #222' }}>
            <CardContent>
              <Typography sx={{ color: '#999', fontSize: 12, mb: 1 }}>Avg per Branch</Typography>
              <Typography variant="h5" sx={{ color: '#ffb74d', fontWeight: 700 }}>K {branches.length ? (totalRevenue / branches.length).toFixed(2) : '0'}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Branch Cards */}
      <Grid container spacing={2}>
        {branches.map(b => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={b.id}>
            <Card sx={{ backgroundColor: '#1a1a1a', border: '1px solid #222', height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LocationOnIcon sx={{ color: '#e53935', fontSize: 20 }} />
                    <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>{b.name}</Typography>
                  </Box>
                  <Chip label="Active" color="success" size="small" />
                </Box>

                <Typography sx={{ color: '#888', fontSize: 12, mb: 2 }}>{b.town}, {b.province}</Typography>

                {/* Manager Info */}
                {b.managerName && (
                  <Box sx={{ mb: 1.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                      <PersonIcon sx={{ fontSize: 16, color: '#4fc3f7' }} />
                      <Typography sx={{ color: '#aaa', fontSize: 12 }}>{b.managerName}</Typography>
                    </Box>
                    {b.managerPhone && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <PhoneIcon sx={{ fontSize: 16, color: '#4caf50' }} />
                        <Typography sx={{ color: '#aaa', fontSize: 12 }}>{b.managerPhone}</Typography>
                      </Box>
                    )}
                  </Box>
                )}

                {/* Stats */}
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 1, mt: 2, pt: 1.5, borderTop: '1px solid #222' }}>
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.3 }}>
                      <LocalShippingIcon sx={{ fontSize: 14, color: '#4fc3f7' }} />
                      <Typography sx={{ color: '#999', fontSize: 10 }}>Parcels</Typography>
                    </Box>
                    <Typography sx={{ color: '#fff', fontWeight: 600, fontSize: 13 }}>{b.parcels || 0}</Typography>
                  </Box>
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.3 }}>
                      <AttachMoneyIcon sx={{ fontSize: 14, color: '#4caf50' }} />
                      <Typography sx={{ color: '#999', fontSize: 10 }}>Revenue</Typography>
                    </Box>
                    <Typography sx={{ color: '#4caf50', fontWeight: 600, fontSize: 13 }}>K {(b.revenue || 0).toFixed(2)}</Typography>
                  </Box>
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.3 }}>
                      <PersonIcon sx={{ fontSize: 14, color: '#ffb74d' }} />
                      <Typography sx={{ color: '#999', fontSize: 10 }}>Staff</Typography>
                    </Box>
                    <Typography sx={{ color: '#ffb74d', fontWeight: 600, fontSize: 13 }}>{b.staffCount || 0}</Typography>
                  </Box>
                </Box>

                {/* Revenue Contribution % */}
                {totalRevenue > 0 && (
                  <Box sx={{ mt: 1.5, pt: 1.5, borderTop: '1px solid #222' }}>
                    <Typography sx={{ color: '#999', fontSize: 11, mb: 0.5 }}>Revenue Contribution</Typography>
                    <Typography sx={{ color: '#4caf50', fontWeight: 700, fontSize: 14 }}>
                      {((b.revenue / totalRevenue) * 100).toFixed(1)}% of Total
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Add Branch Modal */}
      <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="sm" fullWidth>
        <Box sx={{ backgroundColor: '#1a1a1a', p: 3 }}>
          <Typography variant="h6" sx={{ color: '#fff', fontWeight: 700, mb: 2 }}>Add New Branch</Typography>
          
          <TextField
            fullWidth
            label="Branch Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            sx={{ mb: 2, '& .MuiOutlinedInput-root': { color: '#fff' }, '& .MuiOutlinedInput-notchedOutline': { borderColor: '#333' } }}
          />
          
          <TextField
            fullWidth
            label="Town"
            value={formData.town}
            onChange={(e) => setFormData({ ...formData, town: e.target.value })}
            sx={{ mb: 2, '& .MuiOutlinedInput-root': { color: '#fff' }, '& .MuiOutlinedInput-notchedOutline': { borderColor: '#333' } }}
          />
          
          <TextField
            fullWidth
            label="Province"
            value={formData.province}
            onChange={(e) => setFormData({ ...formData, province: e.target.value })}
            sx={{ mb: 2, '& .MuiOutlinedInput-root': { color: '#fff' }, '& .MuiOutlinedInput-notchedOutline': { borderColor: '#333' } }}
          />
          
          <TextField
            fullWidth
            label="Manager Name (Optional)"
            value={formData.managerName}
            onChange={(e) => setFormData({ ...formData, managerName: e.target.value })}
            sx={{ mb: 2, '& .MuiOutlinedInput-root': { color: '#fff' }, '& .MuiOutlinedInput-notchedOutline': { borderColor: '#333' } }}
          />
          
          <TextField
            fullWidth
            label="Manager Phone (Optional)"
            value={formData.managerPhone}
            onChange={(e) => setFormData({ ...formData, managerPhone: e.target.value })}
            sx={{ mb: 2, '& .MuiOutlinedInput-root': { color: '#fff' }, '& .MuiOutlinedInput-notchedOutline': { borderColor: '#333' } }}
          />

          <TextField
            fullWidth
            label="Staff Count (Optional)"
            type="number"
            value={formData.staffCount}
            onChange={(e) => setFormData({ ...formData, staffCount: e.target.value })}
            sx={{ mb: 2, '& .MuiOutlinedInput-root': { color: '#fff' }, '& .MuiOutlinedInput-notchedOutline': { borderColor: '#333' } }}
          />

          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button 
              fullWidth 
              variant="contained" 
              onClick={handleAddBranch}
              disabled={submitting}
              sx={{ backgroundColor: '#e53935', '&:hover': { backgroundColor: '#c62828' } }}
            >
              {submitting ? 'Adding...' : 'Add Branch'}
            </Button>
            <Button 
              fullWidth 
              variant="outlined" 
              onClick={() => setOpenModal(false)}
              sx={{ borderColor: '#333', color: '#fff', '&:hover': { borderColor: '#555', backgroundColor: '#222' } }}
            >
              Cancel
            </Button>
          </Box>
        </Box>
      </Dialog>
    </Box>
  )
}