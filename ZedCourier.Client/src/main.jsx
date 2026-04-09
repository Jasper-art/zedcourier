import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material'
import App from './App.jsx'

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#4fc3f7',
      light: '#8bf6ff',
      dark: '#0093c4',
      contrastText: '#000'
    },
    secondary: {
      main: '#90caf9',
      light: '#c3fdff',
      dark: '#5d99c6',
      contrastText: '#000'
    },
    background: {
      default: '#070d1a',
      paper: '#0d1b2e'
    },
    text: {
      primary: '#f0f4ff',
      secondary: '#90a4c1'
    },
    divider: '#1a2f4a',
    success: { main: '#4caf50' },
    warning: { main: '#ffb74d' },
    error:   { main: '#ef5350' },
    info:    { main: '#4fc3f7' },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", sans-serif',
    h4: { fontWeight: 700, letterSpacing: '-0.5px' },
    h5: { fontWeight: 700, letterSpacing: '-0.3px' },
    h6: { fontWeight: 600 },
    subtitle1: { fontWeight: 600 },
    body2: { color: '#90a4c1' },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: '#0d1b2e',
          border: '1px solid #1a2f4a',
          borderRadius: 16,
        }
      }
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#080f1e',
          borderRight: '1px solid #1a2f4a',
        }
      }
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          textTransform: 'none',
          fontWeight: 600,
          fontSize: 14,
        },
        containedPrimary: {
          background: 'linear-gradient(135deg, #4fc3f7, #1976d2)',
          color: '#fff',
          '&:hover': {
            background: 'linear-gradient(135deg, #81d4fa, #1565c0)',
          }
        }
      }
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 10,
            backgroundColor: '#0a1628',
            '& fieldset': { borderColor: '#1a2f4a' },
            '&:hover fieldset': { borderColor: '#4fc3f7' },
            '&.Mui-focused fieldset': { borderColor: '#4fc3f7' },
          },
          '& .MuiInputLabel-root.Mui-focused': { color: '#4fc3f7' },
        }
      }
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-root': {
            backgroundColor: '#0a1628',
            color: '#4fc3f7',
            fontWeight: 700,
            fontSize: 13,
            letterSpacing: '0.5px',
            textTransform: 'uppercase',
            borderBottom: '1px solid #1a2f4a',
          }
        }
      }
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:hover': { backgroundColor: '#4fc3f710' }
        }
      }
    },
    MuiTableCell: {
      styleOverrides: {
        root: { borderBottom: '1px solid #0f1e33' }
      }
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 8, fontWeight: 600, fontSize: 12 }
      }
    },
    MuiDivider: {
      styleOverrides: {
        root: { borderColor: '#1a2f4a' }
      }
    },
    MuiListItemButton: {
      styleOverrides: {
        root: { borderRadius: 10 }
      }
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: '#0d1b2e',
        }
      }
    }
  }
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <App />
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>
)