import { createContext, useContext, useEffect, useState } from "react"

import type { Client, ClientFromBackend } from "../types/types"
import { useAxiosPrivate } from "../hooks/useAxiosPrivate"
import AuthContext from "./AuthContext"


interface ClientsProviderProps {
    children: React.ReactNode
}

interface ClientsData {
    clients: Client[]
    setClients: React.Dispatch<React.SetStateAction<Client[]>>
}

const defaultValues: ClientsData = {
    clients: [],
    setClients: () => { }
}

const ClientsContext = createContext(defaultValues)


export const ClientsProvider: React.FC<ClientsProviderProps> = ({ children }) => {
    const { loading } = useContext(AuthContext)
    const [clients, setClients] = useState<Client[]>([])
    const axiosPrivate = useAxiosPrivate()

    useEffect(() => {
        if (loading) return 

        async function getClients() {
            try {
                const response = await axiosPrivate.get<ClientFromBackend[]>('/clients')
                if (response.status === 204) {
                    setClients([])
                    return
                }

                const normalizeClient = response.data.map(client => ({
                    ...client,
                    id: client._id
                }))
                setClients(normalizeClient)
            } catch (error) {
                console.error("Erro ao carregar clientes", error)
            }
        }
        getClients()
    }, [axiosPrivate, loading])


    return (
        <ClientsContext.Provider value={{
            clients,
            setClients
        }}>
            {children}
        </ClientsContext.Provider>
    )
}

export default ClientsContext
