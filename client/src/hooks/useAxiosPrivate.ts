import { useContext, useEffect } from "react"
import { AxiosError, type AxiosResponse } from "axios"

import { useRefreshToken } from "./useRefreshToken"
import AuthContext from "../Context/AuthContext"
import { axiosPrivate } from "../api/axios"
import { logError, logInfo } from '../utils/logger';
import { useNavigate } from "react-router-dom"

// Variáveis globais para controlar race conditions
let isRefreshing = false
let failedQueue: Array<{
    resolve: (value: string) => void
    reject: (error: AxiosError) => void
}> = []

const processQueue = (error: AxiosError | null, token: string | null = null) => {
    failedQueue.forEach(({ resolve, reject }) => {
        if (error) {
            reject(error)
        } else {
            resolve(token!)
        }
    })
    
    failedQueue = []
}

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
            (error: AxiosError) => Promise.reject(error)
        )

        // Interceptor de response → após receber resposta
        const responseIntercept = axiosPrivate.interceptors.response.use(
            (response: AxiosResponse) => response,
            async (error: AxiosError) => {
                const previousRequest = error?.config

                if (error.response?.status === 401 && previousRequest) {
                    // Se já está fazendo refresh, adiciona à fila
                    if (isRefreshing) {
                        return new Promise<string>((resolve, reject) => {
                            failedQueue.push({ resolve, reject })
                        }).then(token => {
                            previousRequest.headers!['Authorization'] = `Bearer ${token}`
                            return axiosPrivate(previousRequest)
                        }).catch(err => {
                            return Promise.reject(err)
                        })
                    }

                    logInfo("Axios Interceptor", "Token expired, attempting refresh...")
                    isRefreshing = true

                    try {
                        const newToken = await refresh()
                        logInfo("Axios Interceptor", "Token refreshed successfully")
                        
                        // Processa todas as requisições na fila
                        processQueue(null, newToken)
                        
                        // Atualiza o token no header da requisição atual
                        previousRequest.headers!['Authorization'] = `Bearer ${newToken}`
                        
                        return axiosPrivate(previousRequest)
                    } catch (refreshError) {
                        logError("Axios Interceptor", "Refresh failed, redirecting to login")
                        
                        // Rejeita todas as requisições na fila
                        processQueue(refreshError as AxiosError, null)
                        
                        setAuth({
                            name: "",
                            email: "",
                            roles: [],
                            accessToken: ""
                        })
                        
                        navigate('/')
                        
                        return Promise.reject(refreshError)
                    } finally {
                        isRefreshing = false
                    }
                }
                
                return Promise.reject(error)
            }
        )

        return () => {
            axiosPrivate.interceptors.request.eject(requestIntercept)
            axiosPrivate.interceptors.response.eject(responseIntercept)
        }
    }, [auth, refresh])

    return axiosPrivate
}
