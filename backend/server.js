import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import documentRoutes from './routes/documentRoutes.js';

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
// IMPORTANT: Increase payload limit because Base64 document strings are large
app.use(express.json({ limit: '50mb' })); 

// Routes
app.use('/api/documents', documentRoutes);

// Start the server
app.listen(PORT, () => {
    console.log(`Server running in Zero-Knowledge mode on http://localhost:${PORT}`);
});