import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App.jsx'
import { LanguageProvider } from './context/LanguageContext.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { GoogleOAuthProvider } from '@react-oauth/google'
import './index.css'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <LanguageProvider>
        <HashRouter>
          <AuthProvider>
            <App />
          </AuthProvider>
        </HashRouter>
      </LanguageProvider>
    </GoogleOAuthProvider>
  </React.StrictMode>
)