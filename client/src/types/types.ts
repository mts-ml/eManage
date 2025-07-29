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

export interface Product {
    id?: string
    name: string
    description: string
    salePrice: string
    purchasePrice: string
    stock: string
}
export type ProductFromBackend = Product & { _id: string }

export interface Item {
    productId: string
    productName: string
    quantity: number
    price: number
}

export interface ItemPayload {
    clientId: string
    clientName: string
    date: string
    items: Item[]
    total: number
}

export interface SaleResponse {
    sale: ItemPayload & { _id: string, saleNumber: number }
    updatedProducts: Product[]
}

export interface PurchaseResponse {
    purchase: ItemPayload & { _id: string, purchaseNumber: number }
    updatedProducts: Product[]
}
