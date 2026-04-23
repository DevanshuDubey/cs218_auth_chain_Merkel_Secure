import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const collections = await mongoose.connection.db.collections();
        for (let collection of collections) {
            await collection.deleteMany({});
            console.log(`Cleared collection: ${collection.collectionName}`);
        }
        console.log('Database cleared successfully');
        process.exit(0);
    } catch(e) {
        console.error(e);
        process.exit(1);
    }
};
run();
