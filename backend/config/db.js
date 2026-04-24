import mongoose from 'mongoose';

const connectDB = async () => {
    try {
        const uri = process.env.MONGO_URI;
        if (!uri) {
            throw new Error("MONGO_URI is not defined in the .env file! Please add your MongoDB Atlas connection string.");
        }
        await mongoose.connect(uri);
        console.log('MongoDB connected successfully');

        
        // Clear all data from collections to start fresh without dropping the DB itself
        const collections = await mongoose.connection.db.collections();
        for (let collection of collections) {
            await collection.deleteMany({});
        }
        console.log('Database collections cleared successfully - starting fresh!');
        
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
};

export default connectDB;
