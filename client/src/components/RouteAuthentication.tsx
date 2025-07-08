import { useContext } from "react"
import { Navigate, Outlet, useLocation } from "react-router-dom"

import AuthContext from "../Context/AuthContext.js"


export const RouteAuthentication = () => {
    const { auth } = useContext(AuthContext)
    const location = useLocation()


    return (
        auth?.accessToken ?
            <Outlet />
            :
            <Navigate to='/unauthorized' state={{ from: location }} replace />
    )
}
