import { createContext, useContext, useEffect, useState } from "react"

import type { PurchaseResponse } from "../types/types"
import { logError } from "../utils/logger"
import AuthContext from "./AuthContext"
import { useAxiosPrivate } from "../hooks/useAxiosPrivate"


interface PurchaseProviderProps {
   children: React.ReactNode
}

interface PurchaseData {
   lastPurchase: PurchaseResponse["purchase"] | null
   setLastPurchase: React.Dispatch<React.SetStateAction<PurchaseResponse["purchase"] | null>>
}


const PurchaseContext = createContext<PurchaseData>({} as PurchaseData)

export const PurchaseProvider: React.FC<PurchaseProviderProps> = ({ children }) => {
   const [lastPurchase, setLastPurchase] = useState<PurchaseResponse["purchase"] | null>(null)
   const { auth } = useContext(AuthContext)
   const axiosPrivate = useAxiosPrivate()

   useEffect(() => {
      if (!auth.accessToken) return

      async function getLastPurchase() {
         try {
            const response = await axiosPrivate.get('/purchases/last')
            
            setLastPurchase(response.status === 204 ? null : response.data.purchase)
         } catch (error) {
            logError("Purchases", error)
            return
         }
      }

      getLastPurchase()
   }, [auth.accessToken])


   return (
      <PurchaseContext.Provider value={{ lastPurchase, setLastPurchase }}>
         {children}
      </PurchaseContext.Provider>
   )
}

export default PurchaseContext
