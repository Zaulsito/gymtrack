import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { AppProvider } from './context/AppContext.jsx'
import './index.css'

// Aplicar tema ANTES de que React renderice para evitar flash
;(function() {
  const COLORS = { default:'#c8ff00', red:'#ff2d2d', pink:'#ff85c2', blue:'#4d8eff', cyan:'#00e5ff', light:'#2563eb' }
  const saved  = localStorage.getItem('gymtrack_theme') || 'default'
  document.body.classList.remove('theme-red','theme-pink','theme-blue','theme-cyan','theme-light')
  if (saved !== 'default') document.body.classList.add(`theme-${saved}`)
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute('content', COLORS[saved] || '#c8ff00')
})()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppProvider>
      <App />
    </AppProvider>
  </React.StrictMode>
)
