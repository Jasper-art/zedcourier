import { useEffect, useState } from 'react'
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip, CircularProgress, TextField, FormControl, InputLabel, Select, MenuItem, Button, Grid, Card, CardContent, Pagination } from '@mui/material'
import FileDownloadIcon from '@mui/icons-material/FileDownload'
import SearchIcon from '@mui/icons-material/Search'

const token = () => localStorage.getItem('token')

export default function AuditTab() {
  const [logs, setLogs] = useState([])
  const [filteredLogs, setFilteredLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [branches, setBranches] = useState([])
  const [search, setSearch] = useState('')
  const [selectedBranch, setSelectedBranch] = useState('')
  const [actionType, setActionType] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [page, setPage] = useState(1)
  const itemsPerPage = 10

  useEffect(() => {
    Promise.all([
      fetch('${import.meta.env.VITE_API_URL}/api/v1/finance/audit', {
        headers: { Authorization: `Bearer ${token()}` }
      }).then(r => r.json()),
      fetch('${import.meta.env.VITE_API_URL}/api/v1/branch', {
        headers: { Authorization: `Bearer ${token()}` }
      }).then(r => r.json())
    ])
      .then(([logsData, branchesData]) => {
        setLogs(logsData)
        setBranches(branchesData)
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    filterLogs()
    setPage(1)
  }, [logs, search, selectedBranch, actionType, dateFrom, dateTo])

  const filterLogs = () => {
    let filtered = logs.filter(l => {
      const matchesSearch = l.notes?.toLowerCase().includes(search.toLowerCase()) ||
                           l.user?.toLowerCase().includes(search.toLowerCase()) ||
                           l.newStatus?.toLowerCase().includes(search.toLowerCase())
      const matchesBranch = !selectedBranch || l.branchName === selectedBranch
      const matchesAction = !actionType || l.actionType === actionType
      
      const logDate = new Date(l.timestamp)
      const fromDate = dateFrom ? new Date(dateFrom) : null
      const toDate = dateTo ? new Date(dateTo) : null
      const matchesDate = (!fromDate || logDate >= fromDate) && (!toDate || logDate <= toDate)

      return matchesSearch && matchesBranch && matchesAction && matchesDate
    })

    setFilteredLogs(filtered)
  }

  const exportToCSV = () => {
    const headers = ['Branch', 'User', 'From', 'To', 'Action', 'Notes', 'Time']
    const rows = filteredLogs.map(l => [
      l.branchName || 'N/A',
      l.user || 'System',
      l.previousStatus || '—',
      l.newStatus,
      l.actionType || 'Unknown',
      l.notes,
      new Date(l.timestamp).toLocaleString()
    ])

    const csv = [headers, ...rows].map(r => r.map(cell => `"${cell}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
  }

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress sx={{ color: '#e53935' }} /></Box>

  // Stats
  const totalLogs = logs.length
  const todayLogs = logs.filter(l => new Date(l.timestamp).toDateString() === new Date().toDateString()).length
  const branchLogs = selectedBranch ? logs.filter(l => l.branchName === selectedBranch).length : logs.length
  const actionTypes = [...new Set(logs.map(l => l.actionType).filter(Boolean))]

  // Pagination
  const paginatedLogs = filteredLogs.slice((page - 1) * itemsPerPage, page * itemsPerPage)
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage)

  const getActionColor = (action) => {
    switch(action) {
      case 'Create': return 'success'
      case 'Update': return 'info'
      case 'Delete': return 'error'
      case 'Status Change': return 'warning'
      default: return 'default'
    }
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ color: '#fff', fontWeight: 700 }}>Audit Log</Typography>
        <Button 
          variant="contained" 
          startIcon={<FileDownloadIcon />}
          onClick={exportToCSV}
          disabled={filteredLogs.length === 0}
          sx={{ backgroundColor: '#4caf50', '&:hover': { backgroundColor: '#388e3c' } }}
        >
          Export CSV
        </Button>
      </Box>

      {/* Stats */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ backgroundColor: '#1a1a1a', border: '1px solid #222' }}>
            <CardContent>
              <Typography sx={{ color: '#999', fontSize: 12, mb: 1 }}>Total Logs</Typography>
              <Typography variant="h5" sx={{ color: '#fff', fontWeight: 700 }}>{totalLogs}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ backgroundColor: '#1a1a1a', border: '1px solid #222' }}>
            <CardContent>
              <Typography sx={{ color: '#999', fontSize: 12, mb: 1 }}>Today's Changes</Typography>
              <Typography variant="h5" sx={{ color: '#4fc3f7', fontWeight: 700 }}>{todayLogs}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ backgroundColor: '#1a1a1a', border: '1px solid #222' }}>
            <CardContent>
              <Typography sx={{ color: '#999', fontSize: 12, mb: 1 }}>Filtered Results</Typography>
              <Typography variant="h5" sx={{ color: '#ffb74d', fontWeight: 700 }}>{filteredLogs.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ backgroundColor: '#1a1a1a', border: '1px solid #222' }}>
            <CardContent>
              <Typography sx={{ color: '#999', fontSize: 12, mb: 1 }}>Branch Logs</Typography>
              <Typography variant="h5" sx={{ color: '#ce93d8', fontWeight: 700 }}>{branchLogs}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <TextField
          placeholder="Search by notes, user, status..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{ startAdornment: <SearchIcon sx={{ mr: 1, color: '#666' }} /> }}
          sx={{ flex: 1, minWidth: 250, '& .MuiOutlinedInput-root': { color: '#fff', backgroundColor: '#1a1a1a' }, '& .MuiOutlinedInput-notchedOutline': { borderColor: '#333' } }}
        />
        
        <FormControl sx={{ minWidth: 180, '& .MuiOutlinedInput-root': { color: '#fff', backgroundColor: '#1a1a1a' } }}>
          <InputLabel sx={{ color: '#999' }}>Branch</InputLabel>
          <Select value={selectedBranch} onChange={(e) => setSelectedBranch(e.target.value)} label="Branch">
            <MenuItem value="">All Branches</MenuItem>
            {branches.map(b => (
              <MenuItem key={b.id} value={b.name}>{b.name}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl sx={{ minWidth: 160, '& .MuiOutlinedInput-root': { color: '#fff', backgroundColor: '#1a1a1a' } }}>
          <InputLabel sx={{ color: '#999' }}>Action Type</InputLabel>
          <Select value={actionType} onChange={(e) => setActionType(e.target.value)} label="Action Type">
            <MenuItem value="">All Actions</MenuItem>
            {actionTypes.map(at => (
              <MenuItem key={at} value={at}>{at}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          type="date"
          label="From"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          InputLabelProps={{ shrink: true }}
          sx={{ '& .MuiOutlinedInput-root': { color: '#fff', backgroundColor: '#1a1a1a' }, '& .MuiOutlinedInput-notchedOutline': { borderColor: '#333' } }}
        />

        <TextField
          type="date"
          label="To"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          InputLabelProps={{ shrink: true }}
          sx={{ '& .MuiOutlinedInput-root': { color: '#fff', backgroundColor: '#1a1a1a' }, '& .MuiOutlinedInput-notchedOutline': { borderColor: '#333' } }}
        />
      </Box>

      {/* Audit Table */}
      <TableContainer component={Paper} sx={{ backgroundColor: '#1a1a1a', border: '1px solid #222', mb: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              {['Branch', 'User', 'From', 'To', 'Action', 'Notes', 'Time'].map(h => (
                <TableCell key={h} sx={{ color: '#666', borderBottom: '1px solid #333', fontWeight: 600, fontSize: 12 }}>{h}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedLogs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} sx={{ textAlign: 'center', color: '#666', py: 3 }}>No logs found</TableCell>
              </TableRow>
            ) : (
              paginatedLogs.map((l, i) => (
                <TableRow key={i} sx={{ '&:hover': { backgroundColor: '#ffffff08' } }}>
                  <TableCell sx={{ borderBottom: '1px solid #1e1e1e', fontSize: 12 }}>
                    <Chip label={l.branchName || 'System'} size="small" sx={{ backgroundColor: '#333', color: '#aaa' }} />
                  </TableCell>
                  <TableCell sx={{ color: '#aaa', fontSize: 12, borderBottom: '1px solid #1e1e1e' }}>{l.user || 'System'}</TableCell>
                  <TableCell sx={{ borderBottom: '1px solid #1e1e1e' }}>
                    <Chip label={l.previousStatus || '—'} size="small" sx={{ backgroundColor: '#333', color: '#aaa' }} />
                  </TableCell>
                  <TableCell sx={{ borderBottom: '1px solid #1e1e1e' }}>
                    <Chip label={l.newStatus} size="small" color="success" />
                  </TableCell>
                  <TableCell sx={{ borderBottom: '1px solid #1e1e1e' }}>
                    <Chip label={l.actionType || 'Unknown'} size="small" color={getActionColor(l.actionType)} />
                  </TableCell>
                  <TableCell sx={{ color: '#aaa', fontSize: 11, borderBottom: '1px solid #1e1e1e', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {l.notes}
                  </TableCell>
                  <TableCell sx={{ color: '#666', fontSize: 10, borderBottom: '1px solid #1e1e1e', whiteSpace: 'nowrap' }}>
                    {new Date(l.timestamp).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <Pagination 
            count={totalPages} 
            page={page} 
            onChange={(e, p) => setPage(p)}
            sx={{ '& .MuiPaginationItem-root': { color: '#fff', borderColor: '#333' } }}
          />
        </Box>
      )}
    </Box>
  )
}