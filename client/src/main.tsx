// import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from "react-router-dom"

import App from './App'
import { AuthProvider } from './Context/AuthContext'
import { ClientsProvider } from './Context/ClientContext'
import { ProductsProvider } from './Context/ProductsContext'
import { SaleProvider } from './Context/SaleContext'

import './index.css'
import { SupplierProvider } from './Context/SupplierContext'


createRoot(document.getElementById('root')!).render(
  // <StrictMode>
  < BrowserRouter >
    <AuthProvider>
      <ClientsProvider>
        <SupplierProvider>
          <ProductsProvider>
            <SaleProvider>
              <App />
            </SaleProvider>
          </ProductsProvider>
        </SupplierProvider>
      </ClientsProvider>
    </AuthProvider >
  </BrowserRouter >
  // </StrictMode>
)
