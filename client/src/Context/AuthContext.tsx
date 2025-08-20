import { createContext, useEffect, useState } from "react"
import { jwtDecode } from "jwt-decode"

import { axiosInstance } from "../api/axios"
import type { CustomJwtPayload } from "../types/types"
import { logInfo, logError } from "../utils/logger"


interface AuthProviderProps {
    children: React.ReactNode
}

interface AuthData {
    name: string
    email: string
    roles: number[]
    accessToken: string
}

interface ContextData {
    auth: AuthData
    setAuth: React.Dispatch<React.SetStateAction<AuthData>>,
    loading: boolean
}


const emptyAuth: AuthData = {
    name: '',
    email: '',
    roles: [],
    accessToken: ''
}

const defaultValues: ContextData = {
    auth: emptyAuth,
    setAuth: () => { },
    loading: true,
}

const AuthContext = createContext<ContextData>(defaultValues)


export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [auth, setAuth] = useState(emptyAuth)
    const [loading, setLoading] = useState<boolean>(true)


    useEffect(() => {
        let isMounted = true
        //  Isso cria um "interruptor" que pode cancelar operações assíncronas.
        const controller = new AbortController()

        async function verifyAuthentication() {
            try {
                const response = await axiosInstance.get('/refresh',
                    {
                        withCredentials: true,
                        signal: controller.signal // Permite cancelar a requisição se o componente for desmontado.
                    }
                )

                if (isMounted) {
                    const accessToken = response.data.accessToken
                    const decodedToken: CustomJwtPayload = jwtDecode(accessToken)

                    setAuth({
                        name: decodedToken.UserInfo.name,
                        email: decodedToken.UserInfo.email,
                        roles: decodedToken.UserInfo.roles,
                        accessToken
                    })
                }
            } catch (error) {
                if (isMounted) {
                    setAuth(emptyAuth)
                }

                if (error instanceof Error) {
                    if (error.name === 'AbortError') {
                        logInfo('AuthContext', 'Requisição cancelada intencionalmente');
                    } else {
                        logError('AuthContext', error.message);
                    }
                }
            } finally {
                if (isMounted) setLoading(false)
            }
        }
        verifyAuthentication()

        return () => {
            isMounted = false
            controller.abort()
        }
    }, [])

    return (
        <AuthContext.Provider value={{
            auth,
            setAuth,
            loading
        }}
        >
            {children}
        </AuthContext.Provider>
    )
}
export default AuthContext

