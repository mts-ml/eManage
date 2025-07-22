import mongoose from "mongoose"

import { SalePayload } from "../types/types.js"


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
    paid: {
        type: Boolean,
        default: false
    }
})


export const Sale = mongoose.model<SalePayload>("Sale", saleSchema)
