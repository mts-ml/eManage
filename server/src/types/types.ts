import { JwtPayload } from "jsonwebtoken"

// Enum para status de pagamento
export enum PaymentStatus {
    PENDING = "Pendente",
    PARTIALLY_PAID = "Parcialmente pago",
    PAID = "Pago"
}

// Interface para registro de cada pagamento individual
export interface PaymentRecord {
    _id?: string
    amount: number
    paymentDate: string
    createdAt?: Date
}

// Interface para parcelas
export interface Installment {
    id: string
    installmentNumber: number
    dueDate: string
    amount: number
    status: "Pendente" | "Pago"
    paymentDate?: string | null
    bank?: string
    notes?: string
}

export interface RegisterProps {
    name: string
    email: string
    password: string
    [key: string]: unknown
}


export interface UserProps {
    name: string
    email: string
    password: string
    refreshToken?: string
    roles: Roles
    [key: string]: unknown
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
    [key: string]: unknown
}
export type ClientErrors = Partial<Record<keyof ClientProps, string[]>>


export interface SupplierProps {
    name: string
    email: string
    phone: string
    cpfCnpj: string
    address: string
    district: string
    city: string
    notes?: string
    [key: string]: unknown
}
export type SupplierErrors = Partial<Record<keyof SupplierProps, string[]>>


export interface ProductProps {
    name: string
    description: string
    salePrice: number
    purchasePrice: number
    stock: number
    group: string
    [key: string]: unknown
}
export type ProductErrors = Partial<Record<keyof ProductProps, string>>


export interface Item {
    productId: string
    productName: string
    quantity: number
    price: number
}


export interface SalePayload {
    saleNumber: number
    clientId: string
    clientName: string
    date: string
    items: Item[]
    total: number
    status: PaymentStatus
    totalPaid: number
    remainingAmount: number;
    firstPaymentDate: string | null
    finalPaymentDate: string | null
    bank: string
    observations: string
    payments: PaymentRecord[]
}
export type SaleErrors = Partial<Record<keyof SalePayload | string, string[]>>


export interface PurchasePayload {
    supplierId: string
    supplierName: string
    purchaseNumber: number
    invoiceNumber: string
    date: string
    items: Item[]
    total: number
    totalPaid: number
    remainingAmount: number
    status: PaymentStatus
    firstPaymentDate: string | null
    finalPaymentDate: string | null
    bank: string
    observations: string
    payments: PaymentRecord[]
}
export type PurchaseErrors = Partial<Record<keyof PurchasePayload | string, string[]>>


export type CommonTransactionPayload = Omit<SalePayload, "saleNumber"> & Omit<PurchasePayload, "purchaseNumber">


export interface TransactionUpdatePayload {
    status?: PaymentStatus
    totalPaid?: number
    remainingAmount?: number
    firstPaymentDate?: string | null
    finalPaymentDate?: string | null
    bank?: string
    observations?: string
    payments?: PaymentRecord[]
}


export interface ExpenseProps {
    name: string
    value: number
    description?: string
    dueDate?: string | null
    status: "Pendente" | "Pago"
    bank?: string
    expenseNumber: string
    [key: string]: unknown
}
export type ExpenseErrors = Partial<Record<keyof ExpenseProps, string>>

// Interface para requisição de pagamento
export interface PaymentRequest {
    amount: number
    paymentDate: string
    bank?: string
    notes?: string
    paymentType: "Entrada" | "Parcela" | "Pagamento parcial"
    installmentId?: string
}

// Interface para criação de parcelas
export interface CreateInstallmentsRequest {
    numberOfInstallments: number
    firstDueDate: string
    installmentAmount?: number
}
