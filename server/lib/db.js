import mongoose from "mongoose";

// Function to connect to the mongodb database
export const connectDB = async () => {
    try {
        mongoose.connection.on('connected', () => {
            console.log("Database is connected!");
        })

        await mongoose.connect(`${process.env.MONGODB_URI}/lumo`)
    } catch (error) {
        console.log(error)
    }
}