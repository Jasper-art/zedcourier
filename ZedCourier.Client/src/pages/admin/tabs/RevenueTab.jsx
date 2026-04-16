import { useEffect, useState } from 'react'
import { Box, Typography, Card, CardContent, CircularProgress, Grid, Chip } from '@mui/material'
import TrendingUpIcon  from '@mui/icons-material/TrendingUp'
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import { api } from '../../../api'

const KpiCard = ({ label, value, sub, icon, color }) => (
  <Card sx={{ backgroundColor: '#1a1a1a', border: '1px solid #222', height: '100%' }}>
    <CardContent>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography sx={{ color: '#999', fontSize: 12, mb: 1 }}>{label}</Typography>
          <Typography variant="h5" sx={{ color: '#fff', fontWeight: 700 }}>{value}</Typography>
          {sub && <Typography sx={{ color: '#666', fontSize: 11, mt: 0.5 }}>{sub}</Typography>}
        </Box>
        <Box sx={{ color, fontSize: 24 }}>{icon}</Box>
      </Box>
    </CardContent>
  </Card>
)

export default function RevenueTab({ finance = {} }) {
  const { daily = [], byBranch = [], loading = false } = finance

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
      <CircularProgress sx={{ color: '#e53935' }} />
    </Box>
  )

  // Calculations — fix: spread to avoid mutating state
  const totalRevenue = byBranch.reduce((sum, b) => sum + (b.revenue || 0), 0)
  const avgDaily     = daily.length ? (daily.reduce((sum, d) => sum + (d.revenue || 0), 0) / daily.length).toFixed(2) : 0
  const topBranch    = byBranch.length ? [...byBranch].sort((a, b) => b.revenue - a.revenue)[0] : null
  const growth       = daily.length > 10
    ? (((daily[daily.length - 1].revenue - daily[0].revenue) / (daily[0].revenue || 1)) * 100).toFixed(1)
    : 0

  const chartData = daily.map(d => ({
    date:    new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    revenue: d.revenue
  }))

  return (
    <Box>
      <Typography variant="h5" sx={{ color: '#fff', fontWeight: 700, mb: 3 }}>Revenue Dashboard</Typography>

      {/* KPIs */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <KpiCard label="Total Revenue" value={`K ${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`} icon="💰" color="#4caf50" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <KpiCard label="Avg Daily" value={`K ${avgDaily}`} icon="📊" color="#4fc3f7" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <KpiCard
            label="Growth" value={`${growth}%`} sub="vs first day"
            icon={<TrendingUpIcon />} color={growth > 0 ? '#4caf50' : '#e53935'}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          {topBranch && (
            <KpiCard
              label="Top Branch" value={topBranch.branchName}
              sub={`K ${topBranch.revenue?.toFixed(2)}`}
              icon={<EmojiEventsIcon />} color="#ffb74d"
            />
          )}
        </Grid>
      </Grid>

      {/* Chart */}
      {chartData.length > 0 && (
        <Card sx={{ backgroundColor: '#1a1a1a', border: '1px solid #222', mb: 3 }}>
          <CardContent>
            <Typography variant="subtitle1" sx={{ color: '#fff', fontWeight: 600, mb: 2 }}>Revenue Trend</Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="date" tick={{ fill: '#999', fontSize: 12 }} />
                <YAxis tick={{ fill: '#999', fontSize: 12 }} tickFormatter={v => `K${v}`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #222' }}
                  formatter={v => [`K ${v}`, 'Revenue']}
                />
                <Line type="monotone" dataKey="revenue" stroke="#4fc3f7"
                  strokeWidth={2} dot={{ fill: '#4fc3f7', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* By Branch & Daily */}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ backgroundColor: '#1a1a1a', border: '1px solid #222' }}>
            <CardContent>
              <Typography variant="subtitle1" sx={{ color: '#fff', fontWeight: 600, mb: 2 }}>By Branch</Typography>
              {byBranch.length === 0
                ? <Typography sx={{ color: '#666' }}>No branch data yet.</Typography>
                : byBranch.map((b, i) => (
                  <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, pb: 1.5, borderBottom: '1px solid #222' }}>
                    <Box>
                      <Typography sx={{ color: '#fff', fontSize: 14, fontWeight: 500 }}>{b.branchName}</Typography>
                      <Typography sx={{ color: '#666', fontSize: 12 }}>{b.parcels} parcels</Typography>
                    </Box>
                    <Chip label={`K ${b.revenue?.toFixed(2)}`} sx={{ backgroundColor: '#4caf5020', color: '#4caf50', fontWeight: 700 }} />
                  </Box>
                ))
              }
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ backgroundColor: '#1a1a1a', border: '1px solid #222' }}>
            <CardContent>
              <Typography variant="subtitle1" sx={{ color: '#fff', fontWeight: 600, mb: 2 }}>Last 30 Days</Typography>
              <Box sx={{ maxHeight: 350, overflowY: 'auto' }}>
                {daily.length === 0
                  ? <Typography sx={{ color: '#666' }}>No data yet.</Typography>
                  : daily.map((d, i) => (
                    <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5, pb: 1.5, borderBottom: '1px solid #222' }}>
                      <Typography sx={{ color: '#999', fontSize: 13 }}>{new Date(d.date).toLocaleDateString()}</Typography>
                      <Typography sx={{ color: '#4caf50', fontWeight: 600, fontSize: 13 }}>K {d.revenue?.toFixed(2)}</Typography>
                    </Box>
                  ))
                }
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}