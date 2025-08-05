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
export type ClientErrors = Partial<Record<keyof Client, string>>


export interface Supplier {
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
export type SupplierFromBackend = Supplier & { _id: string }
export type SupplierErrors = Partial<Record<keyof Supplier, string>>



export interface Product {
    id?: string
    name: string
    description: string
    salePrice: string
    purchasePrice: string
    stock: string
    group: string
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
    sale: ItemPayload & { _id: string, saleNumber: number, status: "Em aberto" | "Pago" }
    updatedProducts: Product[]
}


export interface PurchaseResponse {
    purchase: ItemPayload & { _id: string, purchaseNumber: number, status: "Em aberto" | "Pago" }
    updatedProducts: Product[]
}


export interface Receivable extends ItemPayload {
    _id: string
    saleNumber: number
    status: "Em aberto" | "Pago"
    paymentDate: string | null
    bank: string
}

export interface Expense {
  id?: string
  name: string
  value: string
  dueDate?: string
  description?: string
  status?: "Em aberto" | "Pago"
  bank?: string
}
export type ExpenseFromBackend = Expense & { _id: string }
export type ExpenseErrors = Partial<Record<keyof Expense, string>>
