import mongoose from "mongoose"

type ConnectionObject = {
    isConnected?:number
}

const connection : ConnectionObject = {}   

async function connectDB():Promise<void> {
    if(connection.isConnected){
        console.log("Already connected to database")
        return;
    }
    try {
        const db = await mongoose.connect(process.env.MONGODB_URI || '')
        connection.isConnected = db.connections[0].readyState

        console.log("MongoDb connected successfully!")
    } catch (error) {
        console.log("Error creating database", error)
        process.exit(1) 
    }
}

export default connectDB