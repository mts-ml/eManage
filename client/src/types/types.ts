import type { JwtPayload } from "jwt-decode"


export interface CustomJwtPayload extends JwtPayload {
    UserInfo: {
        name: string
        email: string
        roles: number[]
    }
}

// Enum para status de pagamento
export const PaymentStatus = {
    PENDING: "Em aberto",
    PARTIALLY_PAID: "Parcialmente pago",
    PAID: "Pago"
} as const

export type PaymentStatus = typeof PaymentStatus[keyof typeof PaymentStatus]

// Interfaces para sistema de parcelas
export interface PaymentRecord {
    _id?: string;
    amount: number;
    paymentDate: string;
    createdAt?: string;
}

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
    invoiceNumber?: string
    // Novos campos para sistema de parcelas

    totalPaid?: number
    remainingAmount?: number
    status?: PaymentStatus
    paymentHistory?: PaymentRecord[] | null
    installments?: Installment[] | null
    paymentDate?: string | null
    bank?: string
}


export interface SaleResponse {
    sale: ItemPayload & { 
        _id: string, 
        saleNumber: number, 
        status: PaymentStatus,

        totalPaid: number,
        remainingAmount: number,
        paymentHistory: PaymentRecord[] | null,
        installments: Installment[] | null
    }
    updatedProducts: Product[]
}


export interface PurchaseResponse {
    purchase: ItemPayload & { _id: string, purchaseNumber: number, status: PaymentStatus }
    updatedProducts: Product[]
}


export interface Receivable extends ItemPayload {
    _id: string;
    saleNumber: string;
    clientName: string;
    date: string;
    total: number;
    status: PaymentStatus;
    totalPaid: number;
    remainingAmount: number;
    firstPaymentDate: string | null;
    finalPaymentDate: string | null;
    bank: string;
    observations: string;
    payments: PaymentRecord[];
}

export interface Payable {
    _id: string
    purchaseNumber: number
    invoiceNumber: string
    clientId: string
    clientName: string
    date: string
    items: Item[]
    total: number
    status: PaymentStatus
    paymentDate: string | null
    bank: string

    totalPaid: number
    remainingAmount: number
    paymentHistory: PaymentRecord[] | null
    installments: Installment[] | null
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

export interface UpdateReceivableRequest {
    status: PaymentStatus;
    totalPaid: number;
    remainingAmount: number;
    firstPaymentDate?: string | null;
    finalPaymentDate?: string | null;
    bank: string;
    observations: string;
    payments: PaymentRecord[];
}

export interface UpdatePayableRequest {
    status: PaymentStatus
    paymentDate: string | null
    bank: string
    invoiceNumber?: string
}

export interface ApiResponse<T> {
    data: T
    message?: string
    success: boolean
}

export interface DeleteResponse {
    message: string
    success: boolean
}

export interface AxiosErrorResponse {
    response?: {
        status?: number
        data?: {
            message?: string
        }
    }
}

export interface OverduePayment {
    _id: string
    type: 'receivable' | 'payable' | 'expense'
    description: string
    amount: number
    dueDate: string
    daysOverdue: number
    clientName?: string
    supplierName?: string
    invoiceNumber?: string
    saleNumber?: number
    purchaseNumber?: number
    status: PaymentStatus
    paymentDate: string | null
    bank: string
}

export interface OverduePaymentFilters {
    type?: 'receivable' | 'payable' | 'expense' | 'all'
    minDays?: number
    maxDays?: number
    minAmount?: number
    maxAmount?: number
    sortBy?: 'daysOverdue' | 'amount' | 'dueDate'
    sortOrder?: 'asc' | 'desc'
}

// Interfaces para requisições de parcelas
export interface PaymentRequest {
    amount: number
    paymentDate: string
    bank?: string
    notes?: string
    paymentType: "Entrada" | "Parcela" | "Pagamento parcial"
    installmentId?: string
}

export interface CreateInstallmentsRequest {
    numberOfInstallments: number
    firstDueDate: string
    installmentAmount?: number
}
