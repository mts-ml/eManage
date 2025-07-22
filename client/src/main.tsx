// import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from "react-router-dom"

import App from './App'
import { AuthProvider } from './Context/AuthContext'
import { ClientsProvider } from './Context/ClientsContext'
import { ProductsProvider } from './Context/ProductsContext'
import { SaleProvider } from './Context/SaleContext'

import './index.css'


createRoot(document.getElementById('root')!).render(
  // <StrictMode>
  < BrowserRouter >
    <AuthProvider>
      <ClientsProvider>
        <ProductsProvider>
          <SaleProvider>
            <App />
          </SaleProvider>
        </ProductsProvider>
      </ClientsProvider>
    </AuthProvider >
  </BrowserRouter >
  // </StrictMode>
)
