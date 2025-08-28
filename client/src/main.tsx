// import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from "react-router-dom"

import { router } from './Router.tsx'
import { warmupServer } from "./api/axios.ts"


void warmupServer()

createRoot(document.getElementById('root')!).render(
  // <StrictMode>
  <RouterProvider router={router} />
  // </StrictMode>
)
