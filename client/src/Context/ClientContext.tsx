import { createContext, useContext, useEffect, useState } from "react"

import type { Client, ClientFromBackend } from "../types/types"
import { useAxiosPrivate } from "../hooks/useAxiosPrivate"
import AuthContext from "./AuthContext"
import { logError } from '../utils/logger';


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

const ClientContext = createContext(defaultValues)


export const ClientsProvider: React.FC<ClientsProviderProps> = ({ children }) => {
    const [clients, setClients] = useState<Client[]>([])
    const axiosPrivate = useAxiosPrivate()
    const { auth } = useContext(AuthContext)

    useEffect(() => {
        if (!auth.accessToken) return

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
                logError("ClientContext", error);
            }
        }
        getClients()
    }, [auth.accessToken])


    return (
        <ClientContext.Provider value={{
            clients,
            setClients
        }}>
            {children}
        </ClientContext.Provider>
    )
}
export default ClientContext
