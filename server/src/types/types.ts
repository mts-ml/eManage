import { JwtPayload } from "jsonwebtoken"


export interface RegisterProps {
    name: string
    email: string
    password: string
}

export interface UserProps {
    name: string
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


export interface ProductProps {
    name: string
    description: string
    salePrice: number
    purchasePrice: number
    stock: number
}
export type ProductErrors = Partial<Record<keyof ProductProps, string>>

export interface Item {
    productId: string
    productName: string
    quantity: number
    price: number
}

export interface SalePayload {
    clientId: string
    clientName: string
    saleNumber: number
    date: string
    items: Item[]
    total: number
    paid?: boolean
    status: "Em aberto" | "Pago"
    paymentDate?: string | null
    bank?: string
}
export type SaleErrors = Partial<Record<keyof SalePayload | string, string[]>>

export interface PurchasePayload {
    clientId: string
    clientName: string
    purchaseNumber: number
    date: string
    items: Item[]
    total: number
    paid?: boolean
    status: "Em aberto" | "Pago"
    paymentDate?: string | null
    bank?: string
}
export type PurchaseErrors = Partial<Record<keyof PurchasePayload | string, string[]>>

export type CommonTransactionPayload = Omit<SalePayload, "saleNumber"> & Omit<PurchasePayload, "purchaseNumber">
