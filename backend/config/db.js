import mongoose from 'mongoose';

const connectDB = async () => {
    try {
        const uri = process.env.MONGO_URI;
        if (!uri) {
            throw new Error("MONGO_URI is not defined in the .env file! Please add your MongoDB Atlas connection string.");
        }
        await mongoose.connect(uri);
        console.log('MongoDB connected successfully');
        
        // Clear all data to start fresh
        await mongoose.connection.db.dropDatabase();
        console.log('Database dropped successfully - starting fresh!');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
};

export default connectDB;
