import { useContext } from "react"
import { useNavigate } from "react-router-dom"

import AuthContext from "../Context/AuthContext"
import { axiosInstance } from "../api/axios"
import { logError } from "../utils/logger"


export const LogoutButton: React.FC = () => {
    const { auth, setAuth } = useContext(AuthContext)
    const navigate = useNavigate()

    async function handleLogout() {
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
            className="bg-green-700 hover:bg-green-600 px-3 sm:px-4 py-1.5 sm:py-2 rounded-md text-white transition cursor-pointer text-sm sm:text-base"
        >
            Sair
        </button>
    )
}
