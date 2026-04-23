import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const run = async () => {
    await mongoose.connect(process.env.MONGO_URI);
    const collections = await mongoose.connection.db.collections();
    for (let collection of collections) {
        const count = await collection.countDocuments();
        console.log(`Collection ${collection.collectionName}: ${count} documents`);
    }
    process.exit(0);
};
run();
