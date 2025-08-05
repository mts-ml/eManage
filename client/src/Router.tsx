import { createBrowserRouter } from "react-router-dom"

import { Layout } from "./pages/Layout"
import { Login } from "./pages/Login"
import { Register } from "./pages/Register"
import { Home } from "./pages/Home"
import { Unauthorized } from "./pages/Unauthorized"
import { AuthProvider } from "./Context/AuthContext"
import { ClientsProvider } from "./Context/ClientContext"
import { ProductsProvider } from "./Context/ProductsContext"
import { SaleProvider } from "./Context/SaleContext"
import { SupplierProvider } from "./Context/SupplierContext"
import { ExpensesProvider } from "./Context/ExpensesContext"
import ErrorPage from "./pages/ErrorPage"
import { RouteAuthentication } from "./components/RouteAuthentication"
import { ROLES_LIST } from "./config/roles_list"


// // Exemplo de loader (você pode criar loaders para cada rota)
// export async function mainLoader() {
//     // fetch dados iniciais, se necessário
//     return null
// }

function withProviders(children: React.ReactNode) {
   return (
      <AuthProvider>
         <ClientsProvider>
            <SupplierProvider>
               <ProductsProvider>
                  <SaleProvider>
                     <ExpensesProvider>
                        {children}
                     </ExpensesProvider>
                  </SaleProvider>
               </ProductsProvider>
            </SupplierProvider>
         </ClientsProvider>
      </AuthProvider>
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
               { path: "main", element: <Home />, // loader: mainLoader, // loader opcional
               },
               { path: "unauthorized", element: <Unauthorized /> }
            ]
         },
         { path: "*", element: <ErrorPage /> }
      ]
   }
])
