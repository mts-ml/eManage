import { useContext } from "react"
import { Navigate, Outlet, useLocation } from "react-router-dom"

import AuthContext from "../Context/AuthContext.js"
import { CircleLoader } from "react-spinners"


type RouteAuthenticationProps = {
    allowedRoles: number[]
}


export const RouteAuthentication: React.FC<RouteAuthenticationProps> = ({ allowedRoles }) => {
    const { auth, loading} = useContext(AuthContext)
    const location = useLocation()


    if (loading) return <CircleLoader />

    return (
        auth.roles.some(role => allowedRoles.includes(role)) ?
            <Outlet />
            :
            auth.accessToken ?
            <Navigate to='/unauthorized' state={{ from: location }} replace />
            :
            <Navigate to='/' state={{ from: location }} replace />
    )
}
