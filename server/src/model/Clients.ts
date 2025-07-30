import mongoose, { Schema } from "mongoose"

import { ClientProps } from "../types/types.js"


const clientSchema = new Schema<ClientProps>({
    name: {
        type: String,
        required: true,
        uppercase: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        unique: true
    },
    phone: {
        type: String,
        required: true
    },
    cpfCnpj: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    address: {
        type: String,
        required: true
    },
    district: {
        type: String,
        required: true
    },
    city: {
        type: String,
        required: true
    },
    notes: String
})

export const Client = mongoose.model<ClientProps>("Client", clientSchema)
