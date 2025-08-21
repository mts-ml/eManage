import { useContext, useEffect } from "react"

import { useRefreshToken } from "./useRefreshToken"
import AuthContext from "../Context/AuthContext"
import { axiosPrivate } from "../api/axios"
import { logError, logInfo } from '../utils/logger';
import { useNavigate } from "react-router-dom"


export function useAxiosPrivate() {
    const refresh = useRefreshToken()
    const { auth, setAuth } = useContext(AuthContext)
    const navigate = useNavigate()

    useEffect(() => {
        if (!auth?.accessToken) return
        // Interceptor de request → antes de enviar requisição
        const requestIntercept = axiosPrivate.interceptors.request.use(
            config => {
                if (!config.headers['Authorization']) {
                    config.headers['Authorization'] = `Bearer ${auth.accessToken}`
                }
                return config
            },
            error => Promise.reject(error) // Se ocorrer algum erro
        )

        // Interceptor de response → após receber resposta
        const responseIntercept = axiosPrivate.interceptors.response.use(
            response => response, // Se a resposta for sucesso, retorna ela

            // Se der erro, retorna uma callback assíncrona de error handler
            // exemplo, se o token tiver expirado, problema de configuração da requisição
            // que falhou (url, método, headers, body, etc...)
            async (error) => {
                const previousRequest = error?.config

                // Se deu erro 401 (não autorizado) e ainda não tentamos renovar
                if (error.response?.status === 401) {
                    logInfo("Axios Interceptor", "Token expired, attempting refresh...")
                    
                    try {
                        const response = await refresh()
                        const accessToken = response
                        
                        logInfo("Axios Interceptor", "Token refreshed successfully")
                        
                        // Atualiza o token no header
                        previousRequest.headers.Authorization = `Bearer ${accessToken}`
                        
                        return axiosPrivate(previousRequest)
                    } catch (refreshError) {
                        logError("Axios Interceptor", "Refresh failed, redirecting to login")
                        
                        setAuth({
                            name: "",
                            email: "",
                            roles: [],
                            accessToken: ""
                        })
                        
                        navigate('/')
                        
                        return Promise.reject(refreshError)
                    }
                }
                // Se não for erro 403, ou já tentou renovar, retorna erro normalmente
                return Promise.reject(error)
            }
        )

        // Remove os interceptors quando desmontar o componente
        return () => {
            axiosPrivate.interceptors.request.eject(requestIntercept)
            axiosPrivate.interceptors.response.eject(responseIntercept)
        }
    }, [auth, refresh])

    return axiosPrivate
}
