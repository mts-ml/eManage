import { createContext, useContext, useEffect, useState } from "react"

import type { Receivable } from "../types/types"
import AuthContext from "./AuthContext"
import { useAxiosPrivate } from "../hooks/useAxiosPrivate"
import { logError } from "../utils/logger"


interface ReceivablesProviderProps {
   children: React.ReactNode
}

interface ReceivablesData {
   receivables: Receivable[],
   setReceivables: React.Dispatch<React.SetStateAction<Receivable[]>>
}

const defaultValues: ReceivablesData = {
   receivables: [],
   setReceivables: () => { }
}


const ReceivablesContext = createContext(defaultValues)

export const ReceivablesProvider: React.FC<ReceivablesProviderProps> = ({ children }) => {
   const [receivables, setReceivables] = useState<Receivable[]>([])
   const { auth } = useContext(AuthContext)
   const axiosPrivate = useAxiosPrivate()

   useEffect(() => {
      async function getReceivables() {
         if (!auth.accessToken) return

         try {
            const response = await axiosPrivate.get<Receivable[]>("/sales")

            const data = Array.isArray(response.data) ? response.data : []

            if (response.status === 204 || data.length === 0) {
               setReceivables([])
               return
            }

            const salesWithReceivablesInfo: Receivable[] = data.map((sale: Receivable) => ({
               ...sale,
               status: sale.status || "Pendente",
               totalPaid: sale.totalPaid || 0,
               remainingAmount: sale.remainingAmount || sale.total,
               firstPaymentDate: sale.firstPaymentDate || null,
               finalPaymentDate: sale.finalPaymentDate || null,
               bank: sale.bank || "",
               observations: sale.observations || ""
            }))

            setReceivables(salesWithReceivablesInfo)
         } catch (error) {
            logError("Receivables", error)
         }
      }

      getReceivables()

   }, [auth.accessToken])




   return (
      <ReceivablesContext.Provider value={{ receivables, setReceivables }}>
         {children}
      </ReceivablesContext.Provider>
   )
}

export default ReceivablesContext
