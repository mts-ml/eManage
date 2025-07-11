import { JwtPayload } from "jsonwebtoken"


export interface RegisterProps {
    name: string
    email: string
    password: string
}

export interface UserProps {
    name: String
    email: string
    password: string
    refreshToken?: string
    roles: Roles
}

interface Roles {
    User: number
    Editor?: number
    Admin?: number
}

export interface CustomJwtPayload extends JwtPayload {
    UserInfo: {
        name: string
        email: string
        roles: number[]
    }
}

export interface ClientProps {
    name: string
    email: string
    phone: string
    cpfCnpj: string
    address: string
    district: string
    city: string
    notes?: string
}

export type Errors = Partial<Record<keyof ClientProps, string[]>>