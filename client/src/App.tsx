import { Route, Routes } from "react-router-dom"

import ErrorPage from "./pages/ErrorPage"
import { Layout } from "./pages/Layout"
import { Login } from "./pages/Login"
import { Register } from "./pages/Register"
import { MainPageLayout } from "./pages/MainPageLayout"
import { RouteAuthentication } from "./components/RouteAuthentication"
import { Unauthorized } from "./pages/Unauthorized"


function App() {
  return (
    <Routes>
      <Route element={<Layout />} errorElement={<ErrorPage />}>
        <Route index element={<Login />} />
        <Route path="register" element={<Register />} />

        <Route element={<RouteAuthentication />}>
          <Route path="main" element={<MainPageLayout />} />
        </Route>

        <Route path='unauthorized' element={<Unauthorized />} />
        <Route path="*" element={<ErrorPage />} />
      </Route>
    </Routes>
  )
}

export default App
