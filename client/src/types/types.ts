import type { JwtPayload } from "jwt-decode"


export interface CustomJwtPayload extends JwtPayload {
    UserInfo: {
        name: string
        email: string
        roles: number[]
    }
}

export interface Client {
    id?: string
    name: string
    email: string
    phone: string
    cpfCnpj: string
    address: string
    district: string
    city: string
    notes?: string
}

export type ClientFromBackend = Client & { _id: string }
