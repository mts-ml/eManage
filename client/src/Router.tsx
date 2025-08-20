import { createBrowserRouter } from "react-router-dom"

import { Layout } from "./pages/Layout"
import { Login } from "./pages/Login"
import { Register } from "./pages/Register"
import { Home } from "./pages/Home"
import { Unauthorized } from "./pages/Unauthorized"
import ErrorPage from "./pages/ErrorPage"
import { RouteAuthentication } from "./components/RouteAuthentication"
import { ROLES_LIST } from "./config/roles_list"
import { AuthProvider } from "./Context/AuthContext"

function withAuthProvider(children: React.ReactNode) {
   return (
      <AuthProvider>
         {children}
      </AuthProvider>
   )
}

export const router = createBrowserRouter([
   {
      element: withAuthProvider(<Layout />),
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
