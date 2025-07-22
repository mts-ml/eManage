import { createContext, useState } from "react"

interface SaleProviderProps {
    children: React.ReactNode
}

interface SaleData {
    saleNumber: number
    incrementSaleNumber: () => void
}


const SaleContext = createContext<SaleData | undefined>(undefined)


export const SaleProvider: React.FC<SaleProviderProps> = ({ children }) => {
    const [saleNumber, setSaleNumber] = useState<number>(1)

    function incrementSaleNumber(): void {
        setSaleNumber(prev => prev + 1)
    }

    return (
        <SaleContext.Provider value={{
            saleNumber,
            incrementSaleNumber,
        }}>
            {children}
        </SaleContext.Provider>
    )
}
