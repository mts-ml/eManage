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
        type: String,
        required: true
    }
})

export const Expense = mongoose.model<ExpenseProps>("Expense", expenseSchema)
