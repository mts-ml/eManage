import { useContext } from "react"

import AuthContext from "../Context/AuthContext"
import { axiosInstance } from "../api/axios"


export const useRefreshToken = () => {
    const { setAuth } = useContext(AuthContext)

    async function refresh() {
        const response = await axiosInstance.get('/refresh', { withCredentials: true })

        setAuth(prev => ({
            ...prev, accessToken: response.data.accessToken
        }))
        return response.data.accessToken
    }

    return refresh
}
