import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom' // تم التعديل إلى HashRouter لحل مشاكل 404 على GitHub Pages
import App from './App.jsx'
import { LanguageProvider } from './context/LanguageContext.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { GoogleOAuthProvider } from '@react-oauth/google'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId="907304137172-th8oq2nl5upmnmsqcf2c9u24tu38omoq.apps.googleusercontent.com">
      <LanguageProvider>
        {/* HashRouter لا يحتاج إلى basename وبيحول كل الروابط لتشتغل محلياً داخل الـ Hash بدون 404 */}
        <HashRouter>
          <AuthProvider>
            <App />
          </AuthProvider>
        </HashRouter>
      </LanguageProvider>
    </GoogleOAuthProvider>
  </React.StrictMode>
)