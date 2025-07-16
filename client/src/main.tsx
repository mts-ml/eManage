// import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from "react-router-dom"

import App from './App'
import { AuthProvider } from './Context/AuthContext'
import { ClientsProvider } from './Context/ClientsContext'
import { ProductsProvider } from './Context/ProductsContext'

import './index.css'


createRoot(document.getElementById('root')!).render(
  // <StrictMode>
  <AuthProvider>
    <ClientsProvider>
      <ProductsProvider>
        < BrowserRouter >
          <App />
        </BrowserRouter >
      </ProductsProvider>
    </ClientsProvider>
  </AuthProvider >
  // </StrictMode>
)
