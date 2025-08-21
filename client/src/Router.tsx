import { createBrowserRouter } from "react-router-dom"
import { Suspense, lazy } from 'react'

import { Layout } from "./pages/Layout"
import { Login } from "./pages/Login"
import { Register } from "./pages/Register"
import { Unauthorized } from "./pages/Unauthorized"
import { Loading } from "./components/ReactLoader"
import { RouteAuthentication } from "./components/RouteAuthentication"
import { ROLES_LIST } from "./config/roles_list"
import { PayablesProvider } from "./Context/PayablesContext"
import { ReceivablesProvider } from "./Context/ReceivablesContext"
import { PurchaseProvider } from "./Context/PurchaseContext"
import { AuthProvider } from "./Context/AuthContext"
import { ClientsProvider } from "./Context/ClientContext"
import { SupplierProvider } from "./Context/SupplierContext"
import { ProductsProvider } from "./Context/ProductsContext"
import { SaleProvider } from "./Context/SaleContext"
import { ExpensesProvider } from "./Context/ExpensesContext"
import ErrorPage from "./pages/ErrorPage"

const Home = lazy(() => import('./pages/Home').then(module => ({ default: module.Home })))


function withProviders(children: React.ReactNode) {
   return (
      <Suspense fallback={<Loading />}>
         <AuthProvider>
            <ClientsProvider>
               <SupplierProvider>
                  <ProductsProvider>
                     <SaleProvider>
                        <ExpensesProvider>
                           <PayablesProvider>
                              <ReceivablesProvider>
                                 <PurchaseProvider>
                                    {children}
                                 </PurchaseProvider>
                              </ReceivablesProvider>
                           </PayablesProvider>
                        </ExpensesProvider>
                     </SaleProvider>
                  </ProductsProvider>
               </SupplierProvider>
            </ClientsProvider>
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
