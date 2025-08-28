import axios from "axios"

import { logWarning } from "../utils/logger"


export const axiosInstance = axios.create({
    baseURL: import.meta.env.VITE_API_URL
})

export const axiosPrivate = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    withCredentials: true
})

export const warmupServer = async (): Promise<void> => {
    try {
        await axiosInstance.get("/healthz", { timeout: 5000 })
    } catch (error) {
        logWarning("Warmup", "Falha ao acordar o servidor", error)
    }
}
