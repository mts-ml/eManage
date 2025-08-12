import { createBrowserRouter } from "react-router-dom"
import { Suspense, lazy } from 'react'

import { Layout } from "./pages/Layout"
import { Login } from "./pages/Login"
import { Register } from "./pages/Register"
import { Home } from "./pages/Home"
import { Unauthorized } from "./pages/Unauthorized"
import { Loading } from "./components/ReactLoader"
import ErrorPage from "./pages/ErrorPage"
import { RouteAuthentication } from "./components/RouteAuthentication"
import { ROLES_LIST } from "./config/roles_list"

// Lazy load dos contexts pesados
const AuthProvider = lazy(() => import('./Context/AuthContext').then((module) => ({ default: module.AuthProvider })))
const ClientsProvider = lazy(() => import('./Context/ClientContext').then(module => ({ default: module.ClientsProvider })))
const SupplierProvider = lazy(() => import('./Context/SupplierContext').then(module => ({ default: module.SupplierProvider })))
const ProductsProvider = lazy(() => import('./Context/ProductsContext').then(module => ({ default: module.ProductsProvider })))
const SaleProvider = lazy(() => import('./Context/SaleContext').then(module => ({ default: module.SaleProvider })))
const ExpensesProvider = lazy(() => import('./Context/ExpensesContext').then(module => ({ default: module.ExpensesProvider })))


function withProviders(children: React.ReactNode) {
   return (
      <Suspense fallback={<Loading />}>
         <AuthProvider>
            <Suspense fallback={<Loading />}>
               <ClientsProvider>
                  <Suspense fallback={<Loading />}>
                     <SupplierProvider>
                        <Suspense fallback={<Loading />}>
                           <ProductsProvider>
                              <Suspense fallback={<Loading />}>
                                 <SaleProvider>
                                    <Suspense fallback={<Loading />}>
                                       <ExpensesProvider>
                                          {children}
                                       </ExpensesProvider>
                                    </Suspense>
                                 </SaleProvider>
                              </Suspense>
                           </ProductsProvider>
                        </Suspense>
                     </SupplierProvider>
                  </Suspense>
               </ClientsProvider>
            </Suspense>
         </AuthProvider>
      </Suspense>
   )
}

export const router = createBrowserRouter([
   {
      element: withProviders(<Layout />),
      errorElement: <ErrorPage />,
      children: [
         { index: true, element: <Login /> },
         { path: "register", element: <Register /> },
         {
            element: <RouteAuthentication allowedRoles={[ROLES_LIST.Admin, ROLES_LIST.Editor, ROLES_LIST.User]} />,
            children: [
               { path: "home", element: <Home /> },
               { path: "unauthorized", element: <Unauthorized /> }
            ]
         },
         { path: "*", element: <ErrorPage /> }
      ]
   }
])
