import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { AppProvider } from './context/AppContext.jsx'
import './index.css'

// Aplicar tema ANTES de que React renderice para evitar flash
;(function() {
  const COLORS = {
    default:'#0a0a0f', red:'#0f0a0a', pink:'#0f0a0d', blue:'#090b14', cyan:'#080f12',
    light:'#f0f2f5', 'light-red':'#fdf2f2', 'light-pink':'#fdf2f8', 'light-blue':'#f0f4ff', 'light-cyan':'#f0faff'
  }
  const saved   = localStorage.getItem('gymtrack_theme') || 'default'
  const isLight = saved.startsWith('light')
  document.body.classList.remove('theme-red','theme-pink','theme-blue','theme-cyan','theme-light','theme-light-red','theme-light-pink','theme-light-blue','theme-light-cyan')
  if (saved !== 'default') document.body.classList.add(`theme-${saved}`)
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute('content', isLight ? '#ffffff' : '#000000')
  const statusBar = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]')
  if (statusBar) statusBar.setAttribute('content', isLight ? 'default' : 'black-translucent')
})()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppProvider>
      <App />
    </AppProvider>
  </React.StrictMode>
)
