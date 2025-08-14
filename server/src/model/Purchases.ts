import mongoose from "mongoose"

import { PurchasePayload } from "../types/types.js"


const itemSchema = new mongoose.Schema({
    productId: {
        type: String,
        required: true
    },
    productName: {
        type: String,
        required: true
    },
    quantity: {
        type: Number,
        required: true
    },
    price: {
        type: Number,
        required: true
    }
})

// Schema para pagamentos individuais
const paymentSchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  paymentDate: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const purchaseSchema = new mongoose.Schema({
    purchaseNumber: {
        type: Number,
        required: true,
        unique: true
    },
    invoiceNumber: {
        type: String,
        required: true,
        trim: true
    },
    date: {
        type: String,
        required: true
    },
    supplierId: {
        type: String,
        required: true
    },
    supplierName: {
        type: String,
        required: true
    },
    items: [itemSchema],
    total: {
        type: Number,
        required: true
    },
    // Campos para controle de pagamento
    totalPaid: {
        type: Number,
        default: 0,
        min: 0
    },
    remainingAmount: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ["Pendente", "Parcialmente pago", "Pago"],
        default: "Pendente"
    },
    firstPaymentDate: {
        type: String,
        default: null
    },
    finalPaymentDate: {
        type: String,
        default: null
    },
    bank: {
        type: String,
        default: ""
    },
    observations: {
        type: String,
        default: ""
    },
    payments: [paymentSchema]
})


export const Purchase = mongoose.model<PurchasePayload>("Purchase", purchaseSchema)
