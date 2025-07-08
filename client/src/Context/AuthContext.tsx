import { createContext, useState } from "react"


interface AuthProviderProps {
    children: React.ReactNode
}

interface AuthData {
    name: string
    email: string
    roles: number[]
    accessToken: string
}

interface ContextData {
    auth: AuthData
    setAuth: React.Dispatch<React.SetStateAction<AuthData>>,
}


const emptyAuth: AuthData = {
    name: '',
    email: '',
    roles: [],
    accessToken: ''
}

const defaultValues: ContextData = {
    auth: emptyAuth,
    setAuth: () => { },
}

const AuthContext = createContext<ContextData>(defaultValues)


export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [auth, setAuth] = useState(emptyAuth)


    return (
        <AuthContext.Provider value={{
            auth,
            setAuth
        }}
        >
            {children}
        </AuthContext.Provider>
    )
}

export default AuthContext
