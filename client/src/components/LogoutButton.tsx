import { useContext } from "react"
import { useNavigate } from "react-router-dom"

import AuthContext from "../Context/AuthContext"
import { axiosInstance } from "../api/axios"


export const LogoutButton: React.FC = () => {
    const { setAuth } = useContext(AuthContext)
    const navigate = useNavigate()

    async function handleLogout() {
        try {
            await axiosInstance.get('/logout',
                { withCredentials: true }
            )
            setAuth({
                name: "",
                email: "",
                roles: [],
                accessToken: ""
            })

            navigate('/')
        } catch (error) {
            console.log(error)
        } finally {
            setAuth({ name: "", email: "", roles: [], accessToken: "" })
            navigate('/')
        }
    }


    return (
        <button
            type="button"
            onClick={handleLogout}
            className="bg-green-700 hover:bg-green-600 px-4 py-2 rounded-md text-white transition cursor-pointer"
        >
            Sair
        </button>
    )
}
