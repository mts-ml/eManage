import mongoose, { Schema } from "mongoose"

import { UserProps } from "../types/types.js"


const userSchema = new Schema<UserProps>({
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
    },
    roles: {
        User: {
            type: Number,
            default: 1010
        },
        Editor: Number,
        Admin: Number
    },
    refreshToken: String
})

export const User = mongoose.model<UserProps>("User", userSchema)
