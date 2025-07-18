import { createContext, useState } from "react"

import type { SalePayload } from "../types/types"
import { useAxiosPrivate } from "../hooks/useAxiosPrivate"


interface SaleProviderProps {
    children: React.ReactNode
}

interface SaleData {
    saleNumber: number
    incrementSaleNumber: () => void
    submitSale: (sale: SalePayload) => Promise<void>
}


const SaleContext = createContext<SaleData | undefined>(undefined)


export const SalesProvider: React.FC<SaleProviderProps> = ({ children }) => {
    const [saleNumber, setSaleNumber] = useState<number>(1)
    const axiosPrivate = useAxiosPrivate()

    function incrementSaleNumber(): void {
        setSaleNumber(prev => prev + 1)
    }

    async function submitSale(sale: SalePayload) {
        try {
            await axiosPrivate.post('/sales', sale)
        } catch (error) {
            console.error(error)
            throw error
        }
    }


    return (
        <SaleContext.Provider value={{
            saleNumber,
            incrementSaleNumber,
            submitSale
        }}>
            {children}
        </SaleContext.Provider>
    )
}
