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

const purchaseSchema = new mongoose.Schema({
    purchaseNumber: {
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
    status: {
        type: String,
        enum: ["Em aberto", "Pago"],
        default: "Em aberto"
    },
    paymentDate: {
        type: Date,
        default: null
    },
    bank: {
        type: String,
        default: ""
    }
})


export const Purchase = mongoose.model<PurchasePayload>("Purchase", purchaseSchema)
