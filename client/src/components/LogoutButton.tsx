import { useContext, useState } from "react"
import { useNavigate } from "react-router-dom"

import AuthContext from "../Context/AuthContext"
import { axiosInstance } from "../api/axios"
import { logError } from "../utils/logger"


export const LogoutButton: React.FC = () => {
    const { auth, setAuth } = useContext(AuthContext)
    const navigate = useNavigate()
    const [isLoggingOut, setIsLoggingOut] = useState(false)

    async function handleLogout() {
        setIsLoggingOut(true)
        try {
            await axiosInstance.get('/logout',
                {
                    withCredentials: true,
                    headers: { "Authorization": `Bearer ${auth.accessToken}` }
                }
            )
            setAuth({
                name: "",
                email: "",
                roles: [],
                accessToken: ""
            })

            navigate('/')
        } catch (error) {
            logError("LogoutButton", error)
        } finally {
            setAuth({ name: "", email: "", roles: [], accessToken: "" })
            navigate('/')
        }
    }


    return (
        <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="bg-emerald-700 hover:bg-emerald-600 disabled:opacity-70 disabled:cursor-not-allowed px-3 sm:px-4 py-1.5 sm:py-2 rounded-md text-white transition cursor-pointer text-sm sm:text-base"
        >
            {isLoggingOut ? "Saindo..." : "Sair"}
        </button>
    )
}
