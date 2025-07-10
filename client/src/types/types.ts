import type { JwtPayload } from "jwt-decode"


export interface CustomJwtPayload extends JwtPayload {
    UserInfo: {
        name: string
        email: string
        roles: number[]
    }
}

export interface Client {
    name: string
    email: string
    phone: string
    cpfCnpj: string
    address: string
    district: string
    city: string
    notes?: string
    id?: string
}
