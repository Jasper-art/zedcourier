import { useEffect, useState } from 'react'
import {
  Card, CardContent, Typography, Box, CircularProgress,
  Alert, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Paper, Chip, LinearProgress, Divider
} from '@mui/material'
import LocalShippingIcon from '@mui/icons-material/LocalShipping'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import AttachMoneyIcon from '@mui/icons-material/AttachMoney'
import TodayIcon from '@mui/icons-material/Today'
import PendingIcon from '@mui/icons-material/Pending'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis,
  Tooltip, CartesianGrid, PieChart, Pie, Cell, Legend
} from 'recharts'

const token = () => localStorage.getItem('token')
const user  = () => JSON.parse(localStorage.getItem('user') || '{}')

const STATUS_COLOR = {
  Recorded: 'default', InTransit: 'warning',
  Arrived: 'info', Collected: 'success'
}

const KpiCard = ({ label, value, icon, color, sub }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="body2" sx={{ color: '#506680', mb: 0.5 }}>{label}</Typography>
          <Typography variant="h4" sx={{ color: '#f0f4ff', fontWeight: 700 }}>{value}</Typography>
          {sub && <Typography variant="caption" sx={{ color: '#506680' }}>{sub}</Typography>}
        </Box>
        <Box sx={{ backgroundColor: `${color}20`, p: 1.5, borderRadius: 2 }}>{icon}</Box>
      </Box>
    </CardContent>
  </Card>
)

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <Box sx={{ backgroundColor: '#0d1b2e', border: '1px solid #1a2f4a', borderRadius: 2, p: 1.5 }}>
        <Typography variant="caption" sx={{ color: '#506680' }}>{label}</Typography>
        <Typography variant="body2" sx={{ color: '#4caf50', fontWeight: 700 }}>
          K {payload[0].value?.toFixed(2)}
        </Typography>
      </Box>
    )
  }
  return null
}

const DonutTooltip = ({ active, payload }) => {
  if (active && payload?.length) {
    return (
      <Box sx={{ backgroundColor: '#0d1b2e', border: '1px solid #1a2f4a', borderRadius: 2, p: 1.5 }}>
        <Typography variant="body2" sx={{ color: '#f0f4ff', fontWeight: 700 }}>
          {payload[0].name}: {payload[0].value}
        </Typography>
      </Box>
    )
  }
  return null
}

function LiveClock() {
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const hour = time.getHours()
  const shift = hour >= 6 && hour < 14 ? '🌅 Morning Shift'
              : hour >= 14 && hour < 22 ? '🌇 Afternoon Shift'
              : '🌙 Night Shift'

  return (
    <Box sx={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      mb: 3, px: 2.5, py: 1.5, backgroundColor: '#0d1b2e',
      borderRadius: 2, border: '1px solid #1a2f4a'
    }}>
      <Box>
        <Typography variant="body2" sx={{ color: '#506680' }}>
          👤 <strong style={{ color: '#f0f4ff' }}>{user().fullName}</strong> · {user().role}
        </Typography>
        <Typography variant="caption" sx={{ color: '#506680' }}>{shift}</Typography>
      </Box>
      <Box sx={{ textAlign: 'right' }}>
        <Typography variant="h6" sx={{ color: '#4fc3f7', fontWeight: 700, fontFamily: 'monospace' }}>
          {time.toLocaleTimeString()}
        </Typography>
        <Typography variant="caption" sx={{ color: '#506680' }}>
          {time.toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </Typography>
      </Box>
    </Box>
  )
}

export default function OverviewTab() {
  const [summary,   setSummary]   = useState(null)
  const [parcels,   setParcels]   = useState([])
  const [byBranch,  setByBranch]  = useState([])
  const [daily,     setDaily]     = useState([])
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState(null)

  useEffect(() => {
    Promise.all([
      fetch('${import.meta.env.VITE_API_URL}/api/v1/finance/summary', { headers: { Authorization: `Bearer ${token()}` } }).then(r => r.json()),
      fetch('${import.meta.env.VITE_API_URL}/api/v1/parcel',          { headers: { Authorization: `Bearer ${token()}` } }).then(r => r.json()),
      fetch('${import.meta.env.VITE_API_URL}/api/v1/finance/branch',  { headers: { Authorization: `Bearer ${token()}` } }).then(r => r.json()),
      fetch('${import.meta.env.VITE_API_URL}/api/v1/finance/daily',   { headers: { Authorization: `Bearer ${token()}` } }).then(r => r.json()),
    ])
      .then(([s, p, b, d]) => { setSummary(s); setParcels(p); setByBranch(b); setDaily(d) })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
      <CircularProgress sx={{ color: '#4fc3f7' }} />
    </Box>
  )

  if (error) return <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>

  const today             = new Date().toDateString()
  const todayParcels      = parcels.filter(p => new Date(p.createdAt).toDateString() === today)
  const pendingCollection = parcels.filter(p => p.status === 'Arrived').length
  const avgCost           = parcels.length ? (parcels.reduce((a, p) => a + p.cost, 0) / parcels.length).toFixed(2) : '0.00'
  const recentParcels     = [...parcels].slice(0, 6)
  const total             = summary?.totalParcels || 1
  const maxBranchRevenue  = Math.max(...byBranch.map(b => b.revenue), 1)

  // Donut data
  const donutData = [
    { name: 'Collected', value: summary?.byStatus?.collected ?? 0 },
    { name: 'Arrived',   value: summary?.byStatus?.arrived   ?? 0 },
    { name: 'InTransit', value: summary?.byStatus?.inTransit ?? 0 },
    { name: 'Recorded',  value: summary?.byStatus?.recorded  ?? 0 },
  ]
  const DONUT_COLORS = ['#4caf50', '#4fc3f7', '#ffb74d', '#90a4c1']

  // Top routes
  const routeMap = {}
  parcels.forEach(p => {
    const key = `${p.originBranchId}||${p.destinationBranchId}`
    routeMap[key] = (routeMap[key] || 0) + 1
  })
  const branchMap = {}
  byBranch.forEach(b => { branchMap[b.branchId] = b.branchName })

  const topRoutes = Object.entries(routeMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([key, count]) => {
      const [orig, dest] = key.split('||')
      return {
        origin: branchMap[orig] ?? 'Unknown',
        destination: branchMap[dest] ?? 'Unknown',
        count
      }
    })

  // Revenue chart
  const chartData = daily.map(d => ({
    date: new Date(d.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
    revenue: d.revenue
  }))

  const statusBars = [
    { label: 'Recorded',   value: summary?.byStatus?.recorded  ?? 0, color: '#90a4c1' },
    { label: 'In Transit', value: summary?.byStatus?.inTransit ?? 0, color: '#ffb74d' },
    { label: 'Arrived',    value: summary?.byStatus?.arrived   ?? 0, color: '#4fc3f7' },
    { label: 'Collected',  value: summary?.byStatus?.collected ?? 0, color: '#4caf50' },
  ]

  return (
    <Box>
      <LiveClock />

      {/* KPIs */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 2, mb: 3 }}>
        <KpiCard label="Total Revenue" color="#4caf50"
          value={`K ${summary?.totalRevenue?.toLocaleString(undefined, { minimumFractionDigits: 2 }) ?? '0.00'}`}
          icon={<AttachMoneyIcon sx={{ color: '#4caf50' }} />} sub="All time" />
        <KpiCard label="Total Parcels" color="#4fc3f7"
          value={summary?.totalParcels ?? 0}
          icon={<LocalShippingIcon sx={{ color: '#4fc3f7' }} />} sub={`${todayParcels.length} today`} />
        <KpiCard label="Pending Collection" color="#ffb74d"
          value={pendingCollection}
          icon={<PendingIcon sx={{ color: '#ffb74d' }} />} sub="Arrived, awaiting PIN" />
        <KpiCard label="Today's Bookings" color="#ce93d8"
          value={todayParcels.length}
          icon={<TodayIcon sx={{ color: '#ce93d8' }} />} sub={`Avg K ${avgCost} / parcel`} />
      </Box>

      {/* Revenue Chart + Donut */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '7fr 5fr' }, gap: 2, mb: 3 }}>
        <Card sx={{ height: 300 }}>
          <CardContent sx={{ height: '100%', pb: '16px !important' }}>
            <Typography variant="subtitle1" sx={{ color: '#f0f4ff', fontWeight: 600, mb: 2 }}>
              Revenue — Last 30 Days
            </Typography>
            {chartData.length === 0
              ? <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200 }}>
                  <Typography sx={{ color: '#506680' }}>No revenue data yet.</Typography>
                </Box>
              : <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1a2f4a" />
                    <XAxis dataKey="date" tick={{ fill: '#506680', fontSize: 11 }} tickLine={false} />
                    <YAxis tick={{ fill: '#506680', fontSize: 11 }} tickLine={false} axisLine={false}
                      tickFormatter={v => `K${v}`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line type="monotone" dataKey="revenue" stroke="#4fc3f7"
                      strokeWidth={2.5} dot={{ fill: '#4fc3f7', r: 3 }}
                      activeDot={{ r: 5, fill: '#4fc3f7' }} />
                  </LineChart>
                </ResponsiveContainer>
            }
          </CardContent>
        </Card>

        <Card sx={{ height: 300 }}>
          <CardContent sx={{ height: '100%', pb: '16px !important' }}>
            <Typography variant="subtitle1" sx={{ color: '#f0f4ff', fontWeight: 600, mb: 1 }}>
              Collected vs Pending
            </Typography>
            {summary?.totalParcels === 0
              ? <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 220 }}>
                  <Typography sx={{ color: '#506680' }}>No data yet.</Typography>
                </Box>
              : <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={donutData} cx="50%" cy="45%" innerRadius={55}
                      outerRadius={80} paddingAngle={3} dataKey="value">
                      {donutData.map((_, i) => (
                        <Cell key={i} fill={DONUT_COLORS[i]} />
                      ))}
                    </Pie>
                    <Tooltip content={<DonutTooltip />} />
                    <Legend
                      iconType="circle" iconSize={8}
                      formatter={v => <span style={{ color: '#90a4c1', fontSize: 12 }}>{v}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
            }
          </CardContent>
        </Card>
      </Box>

      {/* Status Breakdown + Top Routes */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '5fr 7fr' }, gap: 2, mb: 3 }}>
        <Card>
          <CardContent>
            <Typography variant="subtitle1" sx={{ color: '#f0f4ff', fontWeight: 600, mb: 2 }}>
              Status Breakdown
            </Typography>
            {statusBars.map(s => (
              <Box key={s.label} sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="body2" sx={{ color: '#90a4c1' }}>{s.label}</Typography>
                  <Typography variant="body2" sx={{ color: '#f0f4ff', fontWeight: 600 }}>
                    {s.value} <span style={{ color: '#506680', fontSize: 11 }}>
                      ({Math.round((s.value / total) * 100)}%)
                    </span>
                  </Typography>
                </Box>
                <LinearProgress variant="determinate" value={(s.value / total) * 100}
                  sx={{ height: 8, borderRadius: 4, backgroundColor: '#0a1628',
                    '& .MuiLinearProgress-bar': { backgroundColor: s.color, borderRadius: 4 } }} />
              </Box>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography variant="subtitle1" sx={{ color: '#f0f4ff', fontWeight: 600, mb: 2 }}>
              Top Routes
            </Typography>
            {topRoutes.length === 0
              ? <Typography sx={{ color: '#506680' }}>No route data yet.</Typography>
              : topRoutes.map((r, i) => (
                <Box key={i} sx={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  p: 1.5, mb: 1.5, backgroundColor: '#0a1628', borderRadius: 2,
                  border: '1px solid #1a2f4a'
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography sx={{ color: '#ce93d8', fontWeight: 700, fontSize: 18 }}>
                      #{i + 1}
                    </Typography>
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <LocationOnIcon sx={{ color: '#4fc3f7', fontSize: 14 }} />
                        <Typography sx={{ color: '#f0f4ff', fontSize: 13, fontWeight: 600 }}>
                          {r.origin}
                        </Typography>
                        <ArrowForwardIcon sx={{ color: '#506680', fontSize: 14 }} />
                        <LocationOnIcon sx={{ color: '#4caf50', fontSize: 14 }} />
                        <Typography sx={{ color: '#f0f4ff', fontSize: 13, fontWeight: 600 }}>
                          {r.destination}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                  <Chip label={`${r.count} parcels`} size="small"
                    sx={{ backgroundColor: '#4fc3f720', color: '#4fc3f7', fontWeight: 700 }} />
                </Box>
              ))
            }

            <Divider sx={{ my: 2 }} />

            <Typography variant="subtitle1" sx={{ color: '#f0f4ff', fontWeight: 600, mb: 1.5 }}>
              Branch Performance
            </Typography>
            {byBranch.map((b, i) => (
              <Box key={i} sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <LocationOnIcon sx={{ color: '#4fc3f7', fontSize: 15 }} />
                    <Typography variant="body2" sx={{ color: '#90a4c1' }}>{b.branchName}</Typography>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="body2" sx={{ color: '#4caf50', fontWeight: 700 }}>
                      K {b.revenue?.toFixed(2)}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#506680' }}>{b.parcels} parcels</Typography>
                  </Box>
                </Box>
                <LinearProgress variant="determinate"
                  value={(b.revenue / maxBranchRevenue) * 100}
                  sx={{ height: 6, borderRadius: 4, backgroundColor: '#0a1628',
                    '& .MuiLinearProgress-bar': { backgroundColor: '#4fc3f7', borderRadius: 4 } }} />
              </Box>
            ))}
          </CardContent>
        </Card>
      </Box>

      {/* Recent Parcels */}
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="subtitle1" sx={{ color: '#f0f4ff', fontWeight: 600 }}>
              Recent Parcels
            </Typography>
            <Typography variant="caption" sx={{ color: '#506680' }}>Last 6</Typography>
          </Box>
          <Divider sx={{ mb: 2 }} />
          <TableContainer component={Paper} sx={{ backgroundColor: 'transparent' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  {['Waybill', 'Sender', 'Receiver', 'Cost', 'Status', 'Date'].map(h => (
                    <TableCell key={h}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {recentParcels.length === 0
                  ? <TableRow>
                      <TableCell colSpan={6} sx={{ textAlign: 'center', color: '#506680', py: 4 }}>
                        No parcels yet.
                      </TableCell>
                    </TableRow>
                  : recentParcels.map(p => (
                    <TableRow key={p.id}>
                      <TableCell sx={{ color: '#4fc3f7', fontWeight: 700 }}>{p.waybillNumber}</TableCell>
                      <TableCell>{p.senderPhone}</TableCell>
                      <TableCell>{p.receiverPhone}</TableCell>
                      <TableCell sx={{ color: '#4caf50' }}>K {p.cost}</TableCell>
                      <TableCell>
                        <Chip label={p.status} color={STATUS_COLOR[p.status] ?? 'default'} size="small" />
                      </TableCell>
                      <TableCell sx={{ fontSize: 12 }}>
                        {new Date(p.createdAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))
                }
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  )
}