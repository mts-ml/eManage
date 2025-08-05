import mongoose, { Schema } from "mongoose"

import { ProductProps } from "../types/types.js"


const productsSchema = new Schema<ProductProps>({
    name: {
        type: String,
        required: true,
        trim: true,
        uppercase: true,
        unique: true
    },
    description: {
        type: String,
        required: true
    },
    salePrice: {
        type: Number,
        required: true
    },
    purchasePrice: {
        type: Number,
        required: true
    },
    stock: {
        type: Number,
        required: true
    },
    group: {
        type: String,
        required: true,
        enum: ['Temperos', 'Vegetais', 'Frutas', 'Outros']
    }
})


export const Product = mongoose.model<ProductProps>("Product", productsSchema)
