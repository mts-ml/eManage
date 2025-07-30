import React, { createContext, useContext, useEffect, useState } from "react"

import type { Supplier, SupplierFromBackend } from "../types/types"
import AuthContext from "./AuthContext"
import { useAxiosPrivate } from "../hooks/useAxiosPrivate"


interface SupplierProviderProps {
    children: React.ReactNode
}

interface SupplierData {
    suppliers: Supplier[]
    setSuppliers: React.Dispatch<React.SetStateAction<Supplier[]>>
}

const defaultValues: SupplierData = {
    suppliers: [],
    setSuppliers: () => { }
}

const SupplierContext = createContext(defaultValues)

export const SupplierProvider: React.FC<SupplierProviderProps> = ({ children }) => {
    const [suppliers, setSuppliers] = useState<Supplier[]>([])
    const axiosPrivate = useAxiosPrivate()
    const { auth } = useContext(AuthContext)

    useEffect(() => {
        if (!auth.accessToken) return

        async function getSuppliers() {
            try {
                const response = await axiosPrivate.get<SupplierFromBackend[]>('/suppliers')
                if (response.status === 204) {
                    setSuppliers([])
                    return
                }

                const normalizeSupplier = response.data.map(supplier => ({
                    ...supplier,
                    id: supplier._id
                }))
                setSuppliers(normalizeSupplier)
            } catch (error) {
                console.error("Erro ao carregar fornecedores", error)
            }
        }
        getSuppliers()
    }, [auth.accessToken])

    return (
        <SupplierContext.Provider value={{
            suppliers,
            setSuppliers
        }}>
            {children}
        </SupplierContext.Provider >
    )
}

export default SupplierContext
