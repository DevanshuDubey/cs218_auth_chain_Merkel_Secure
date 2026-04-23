import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        await mongoose.connection.db.dropDatabase();
        console.log("MongoDB database successfully dropped!");
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};
run();
