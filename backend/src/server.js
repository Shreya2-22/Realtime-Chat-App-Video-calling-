import express from 'express';
import "dotenv/config";
import authRoutes from './routes/auth.route.js'
import { connectDB } from './lib/db.js';
import cookieParser from 'cookie-parser';

const app=express()
const PORT= process.env.PORT;
app.use(cookieParser()); // Middleware to parse cookies

app.use(express.json()); // Middleware to parse JSON bodies
app.use("/api/auth", authRoutes);


app.listen(PORT, ()=>{
    console.log(`Server is running on port ${PORT}`);
    connectDB();
})