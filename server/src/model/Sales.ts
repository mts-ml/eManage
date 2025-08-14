import mongoose from "mongoose"

import { SalePayload, PaymentStatus } from "../types/types.js"

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

const saleSchema = new mongoose.Schema({    
    saleNumber: {
        type: Number,
        required: true,
        unique: true
    },
    date: {
        type: String,
        required: true
    },
    clientId: {
        type: String,
        required: true
    },
    clientName: {
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
}, {
  timestamps: true
});

export const Sale = mongoose.model<SalePayload>("Sale", saleSchema)
