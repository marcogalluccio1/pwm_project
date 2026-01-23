// backend/database/db.js
import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB connesso: ${conn.connection.host}`);
  } catch (error) {
    console.error("Errore di connessione a MongoDB:", error);
    process.exit(1);
  }
};

export default connectDB;
