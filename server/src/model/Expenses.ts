import mongoose, { Schema } from "mongoose"

import { ExpenseProps } from "../types/types.js"


const expenseSchema = new Schema<ExpenseProps>({
    name: {
        type: String,
        required: true,
        uppercase: true,
        trim: true
    },
    value: {
        type: Number,
        required: true
    },
    dueDate: String,
    description: {
        type: String
    },
    status: {
        type: String,
        enum: ["Em aberto", "Pago"],
        default: "Em aberto"
    },
    bank: {
        type: String,
        default: ""
    }
})

export const Expense = mongoose.model<ExpenseProps>("Expense", expenseSchema)
