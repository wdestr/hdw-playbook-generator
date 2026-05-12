import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Register PWA service worker (prompt mode — never force-reloads the page)
import { registerSW } from 'virtual:pwa-register'
registerSW({ immediate: false })

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
