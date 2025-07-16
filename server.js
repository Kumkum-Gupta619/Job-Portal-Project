// imports
//const express = require("express")
//packages imports
import express from "express";

import dotenv from 'dotenv';
import colors from 'colors';
import cors from "cors";
import morgan from "morgan";


//files imports
import connectDB from './config/db.js';

//routes imports
import testRoutes from "./routes/testRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import errorMiddleware from "./middlewares/errorMiddleware.js";
import jobsRoutes from "./routes/jobsRoutes.js";

import userRoutes from "./routes/userRoutes.js";





// Dot ENV config
dotenv.config()

// monogDb connection
connectDB()


// rest object 
const app = express();

//mieddleware

app.use(express.json());
app.use(cors());
app.use(morgan('dev'));

// routes

// thi all files are in routes folder
app.use('/api/v1/test', testRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/user', userRoutes);
app.use('/api/v1/job', jobsRoutes);

// validation middleware
app.use(errorMiddleware);
//port
const PORT = process.env.PORT || 8080;

app.get('/', (req, res) => {
    res.send("<h1>Welcome to Job Portal API</h1>");
});
//listen  
app.listen(PORT, () => {
    console.log(`Node server running in ${process.env.DEV_MODE} Mode on port no ${PORT}`.bgCyan.white
    );
});