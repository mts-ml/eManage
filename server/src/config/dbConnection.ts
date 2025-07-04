import mongoose from "mongoose"


export async function connectDB() {
    try {
        await mongoose.connect(process.env.DATABASE_URI!)
    } catch (error) {
        console.log(error)        
        process.exit(1)
    }
}
