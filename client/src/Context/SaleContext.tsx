import { createContext, useContext, useEffect, useState } from "react"

import type { SaleResponse } from "../types/types"
import { useAxiosPrivate } from "../hooks/useAxiosPrivate"
import { logError } from "../utils/logger"
import AuthContext from "./AuthContext"


interface SaleProviderProps {
    children: React.ReactNode
}

interface SaleData {
    lastSale: SaleResponse["sale"] | null
    setLastSale: React.Dispatch<React.SetStateAction<SaleResponse["sale"] | null>>
}


const SaleContext = createContext<SaleData>({} as SaleData)


export const SaleProvider: React.FC<SaleProviderProps> = ({ children }) => {
    const [lastSale, setLastSale] = useState<SaleResponse["sale"] | null>(null)
    const axiosPrivate = useAxiosPrivate()
    const { auth } = useContext(AuthContext)

    useEffect(() => {
        if (!auth.accessToken) return

        async function getLastSale() {
            try {
                const response = await axiosPrivate.get('/sales/last')

                setLastSale(response.status === 204 ? null : response.data.sale)
            } catch (error) {
                logError("Sales", error)
                return
            }
        }

        getLastSale()
    }, [auth.accessToken])


    return (
        <SaleContext.Provider value={{
            lastSale,
            setLastSale
        }}>
            {children}
        </SaleContext.Provider>
    )
}

export default SaleContext
