import { Route, Routes } from "react-router"

import ErrorPage from "./pages/ErrorPage"
import { Layout } from "./pages/Layout"
import { Login } from "./pages/Login"
import { Register } from "./pages/Register"
import { MainPageLayout } from "./pages/MainPageLayout"


function App() {
  return (
    <Routes>
      <Route element={<Layout />} errorElement={<ErrorPage />}>
        <Route index element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="main" element={<MainPageLayout />} />

        <Route path="*" element={<ErrorPage />} />
      </Route>
    </Routes>
  )
}

export default App
