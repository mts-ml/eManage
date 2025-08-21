import { createContext, useContext, useEffect, useState } from "react"

import type { Payable } from "../types/types"
import AuthContext from "./AuthContext"
import { logError } from "../utils/logger"
import { useAxiosPrivate } from "../hooks/useAxiosPrivate"


interface PayablesProviderProps {
   children: React.ReactNode
}

interface PayablesData {
   payables: Payable[]
   setPayables: React.Dispatch<React.SetStateAction<Payable[]>>
}

const defaultPayables: PayablesData = {
   payables: [],
   setPayables: () => { },
}


const PayablesContext = createContext(defaultPayables)

export const PayablesProvider: React.FC<PayablesProviderProps> = ({ children }) => {
   const [payables, setPayables] = useState<Payable[]>([])
   const { auth } = useContext(AuthContext)
   const axiosPrivate = useAxiosPrivate()

   useEffect(() => {
      if (!auth.accessToken) return

      async function getPayables() {
         try {
            const response = await axiosPrivate.get<Payable[]>("/purchases")

            const data = Array.isArray(response.data) ? response.data : []

            if (response.status === 204 || data.length === 0) {
               setPayables([])
               return
            }

            const purchasesWithPayableInfo: Payable[] = data.map((purchase: Payable) => ({
               ...purchase,
               status: purchase.status || "Pendente",
               totalPaid: purchase.totalPaid || 0,
               remainingAmount: purchase.remainingAmount || purchase.total,
               firstPaymentDate: purchase.firstPaymentDate || null,
               finalPaymentDate: purchase.finalPaymentDate || null,
               bank: purchase.bank || "",
               observations: purchase.observations || ""
            }))

            setPayables(purchasesWithPayableInfo)
         } catch (error) {
            logError("Payables", error)
         }
      }

      getPayables()
   }, [auth.accessToken])


   return (
      <PayablesContext.Provider value={{ payables, setPayables }}>
         {children}
      </PayablesContext.Provider>
   )
}

export default PayablesContext
