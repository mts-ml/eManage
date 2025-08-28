import { useContext } from "react"
import { Navigate, Outlet, useLocation } from "react-router-dom"

import AuthContext from "../Context/AuthContext.js"
import { Loading } from "./ReactLoader.js"


type RouteAuthenticationProps = {
    allowedRoles: number[]
}


export const RouteAuthentication: React.FC<RouteAuthenticationProps> = ({ allowedRoles }) => {
    const { auth, loading} = useContext(AuthContext)
    const location = useLocation()


    if (loading) return <Loading />

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
