import mongoose, { Schema } from "mongoose"
import { RegisterProps } from "../types/types.js"


const userSchema = new Schema<RegisterProps>({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    }    
})

export const User = mongoose.model<RegisterProps>("User", userSchema)
