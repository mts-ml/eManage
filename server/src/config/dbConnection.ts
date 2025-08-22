import mongoose from "mongoose"

import { logSuccess, logError } from "../utils/logger.js"


export async function connectDB() {
    try {
        await mongoose.connect(process.env.DATABASE_URI!)
        logSuccess("Database", "Connected to MongoDB")
    } catch (error) {
        logError("Database", error)
        process.exit(1)
    }
}
