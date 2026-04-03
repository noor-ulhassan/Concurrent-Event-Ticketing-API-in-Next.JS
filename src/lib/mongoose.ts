import mongoose from "mongoose";

type ConnectionObject = {
    isConnected?: number;
}
const connection: ConnectionObject = {};
export async function connectDB() {
    if (connection.isConnected) {
        console.log('Already connected to MongoDB');
        return;
    }
    try {
        const db = await mongoose.connect(process.env.MONGO_URI!)
        connection.isConnected = db.connections[0].readyState;
        console.log("Connected to MongoDB");
    } catch (error) {
        console.log("Error in connecting to MongoDB", error);
    }
}